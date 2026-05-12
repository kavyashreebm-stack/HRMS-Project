import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from .. import database, schemas, models
from ..dependencies import get_current_user
from ..utils.file_handler import save_upload_file

router = APIRouter(prefix="/candidate", tags=["Candidate"])

# =========================
# 🛠️ HELPERS
# =========================

def is_empty(val):
    if val is None: return True
    if isinstance(val, str) and not val.strip(): return True
    if isinstance(val, list):
        if not val: return True
        return all(is_empty(v) for v in val)
    if isinstance(val, dict):
        if not val: return True
        boilerplate_keys = {'relation', 'date', 'place'}
        meaningful_keys = [k for k in val.keys() if k not in boilerplate_keys]
        if not meaningful_keys:
            return all(is_empty(v) for v in val.values())
        return all(is_empty(val.get(k)) for k in meaningful_keys)
    return False

def is_filled(val):
    return not is_empty(val)

def get_action(old_val, new_val):
    if is_empty(old_val) and is_filled(new_val):
        return "added"
    elif is_filled(old_val) and is_empty(new_val):
        return "removed"
    else:
        return "updated"

def json_eq(a, b):
    return json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)

def has_doc(profile, path_attr, declaration_key):
    if not profile: return False
    if getattr(profile, path_attr, None):
        return True
    if profile.declaration and isinstance(profile.declaration, dict):
        return bool(profile.declaration.get(declaration_key))
    return False

def calculate_profile_progress(profile):
    profile_pct = 0
    missing_sections = []
    
    if not profile:
        return 0, ["Personal Details", "Education", "Employment", "Bank Details", "Resume"]

    basic_missing = []
    if not is_filled(profile.name): basic_missing.append("Name")
    if not is_filled(profile.phone_number): basic_missing.append("Phone Number")
    if not is_filled(profile.designation): basic_missing.append("Designation")
    if not is_filled(profile.date_of_birth): basic_missing.append("Date of Birth")
    if not is_filled(profile.gender): basic_missing.append("Gender")
    if not is_filled(profile.marital_status): basic_missing.append("Marital Status")
    
    if basic_missing:
        if len(basic_missing) > 3: missing_sections.append("Basic Information")
        else: missing_sections.extend(basic_missing)
        
    if not is_filled(profile.correspondence_address) or not is_filled(profile.permanent_address):
        missing_sections.append("Address Details")
        
    if not is_filled(profile.aadhar) or not is_filled(profile.pan):
        missing_sections.append("Identity Numbers (Aadhar/PAN)")
        
    if not is_filled(profile.bank_account): missing_sections.append("Bank Details")
    
    if not is_filled(profile.education): missing_sections.append("Education")
    if not is_filled(profile.employment): missing_sections.append("Employment")
    if not is_filled(profile.family): missing_sections.append("Family Details")
    med = profile.medical or {}
    if not is_filled(med.get('bloodGroup')) or not is_filled(med.get('hasDisability')) or not is_filled(med.get('hasCondition')):
        missing_sections.append("Medical Details")
    
    if not is_filled(profile.reference_person): missing_sections.append("References")
    
    missing_docs = []
    if not has_doc(profile, 'photo_path', 'photo'): missing_docs.append("Photo")
    if not has_doc(profile, 'resume_path', 'resume'): missing_docs.append("Resume")
    if not has_doc(profile, 'aadhar_doc_path', 'aadhaar'): missing_docs.append("Aadhar Document")
    if not has_doc(profile, 'pan_doc_path', 'pan'): missing_docs.append("PAN Document")
    if not has_doc(profile, 'sslc_doc_path', 'sslc'): missing_docs.append("SSLC Marks Card")
    
    if missing_docs:
        missing_sections.append(f"Documents ({', '.join(missing_docs)})")

    key_fields = [
        'name', 'designation', 'phone_number', 'date_of_birth', 
        'marital_status', 'gender', 'correspondence_address',
        'permanent_address', 'aadhar', 'pan', 'bank_account', 
        'education', 'employment', 'family', 'medical', 'declaration',
        'photo_path', 'resume_path', 'aadhar_doc_path', 'pan_doc_path', 'sslc_doc_path'
    ]
    filled_count = sum(1 for field in key_fields if (getattr(profile, field, None) is not None and is_filled(getattr(profile, field))) or (field.endswith('_path') and has_doc(profile, field, field.replace('_path', ''))))
    profile_pct = int((filled_count / len(key_fields)) * 100)
    
    return profile_pct, missing_sections


# =========================
# 👤 FILE UPLOADS
# =========================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    folder: str = Form(...),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload a file to a specific folder (photos, resumes, documents).
    Returns the relative path to the saved file.
    """
    path = save_upload_file(file, folder)
    if not path:
        raise HTTPException(status_code=400, detail="File upload failed")
    
    return {"path": path}


# =========================
# 👤 PROFILE MANAGEMENT
# =========================

@router.put("/profile/{user_id}", response_model=schemas.CandidateProfileResponse)
def update_profile(
    user_id: uuid.UUID,
    profile: schemas.CandidateProfileUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update or Create candidate profile (all 7 sections)"""
    query = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == user_id
    )
    existing_profile = query.first()

    data = profile.dict(exclude_unset=True)
    print(f"[DEBUG update_profile] data keys: {list(data.keys())}")
    print(f"[DEBUG update_profile] name={data.get('name')!r}, email={data.get('email')!r}, dob={data.get('date_of_birth')!r}")

    if existing_profile:
        notifications_to_add = []
        
        # 🟢 Specific Check: Personal & Professional Details
        personal_fields = [
            ('name', 'Name'), ('phone_number', 'Phone Number'), 
            ('designation', 'Designation'), ('correspondence_address', 'Address'),
            ('email', 'Email'), ('date_of_birth', 'Date of Birth'),
            ('aadhar', 'Aadhar Number'), ('pan', 'PAN Number')
        ]
        
        any_personal_changed = False
        description = "updated"
        
        for field, label in personal_fields:
            if field in data and not json_eq(getattr(existing_profile, field), data.get(field)):
                any_personal_changed = True
                action = get_action(getattr(existing_profile, field), data.get(field))
                if action == "removed":
                    description = "removed"
                break
                
        if any_personal_changed:
            notifications_to_add.append(models.Notification(
                user_id=user_id,
                title="Personal Details",
                message=f"In Personal Details section you have updated your information" if description != "removed" else "In Personal Details section your details had been removed please fill the details",
                notification_type="success" if description != "removed" else "urgent"
            ))

        # 🟠 Specific Check: Education (Added/Updated/Removed)
        if 'education' in data:
            old_edu = existing_profile.education or []
            new_edu = data.get('education') or []
            if is_filled(old_edu) and is_empty(new_edu):
                notifications_to_add.append(models.Notification(
                    user_id=user_id,
                    title="Education",
                    message="In Education section your educational details had been removed please fill the details",
                    notification_type="urgent"
                ))
            elif not json_eq(old_edu, new_edu):
                action = "added" if is_empty(old_edu) else "updated"
                notifications_to_add.append(models.Notification(
                    user_id=user_id,
                    title="Education",
                    message=f"In Education section your educational information was successfully {action}",
                    notification_type="success"
                ))

        # 🔵 Specific Check: Declaration & Documents
        doc_fields = [
            ('photo_path', 'Photo'), 
            ('resume_path', 'Resume'), 
            ('aadhar_doc_path', 'Aadhar Document'), 
            ('pan_doc_path', 'PAN Document'), 
            ('sslc_doc_path', 'SSLC Marks Card'),
            ('declaration', 'Declaration Section')
        ]
        for field, label in doc_fields:
            if field in data and not json_eq(getattr(existing_profile, field), data.get(field)):
                action = get_action(getattr(existing_profile, field), data.get(field))
                op_desc = "added" if action != "removed" else "removed"
                notifications_to_add.append(models.Notification(
                    user_id=user_id,
                    title="Declaration/Documents",
                    message=f"In Declaration section you {op_desc} particular {label} information" if action != "removed" else f"In Declaration section your {label} had been removed please fill the details",
                    notification_type="success" if action != "removed" else "urgent"
                ))

        # 🟣 Granular Catch-all for other sections
        other_sections = [
            ("Employment", existing_profile.employment, data.get('employment'), "Your employment history details have been updated."),
            ("Family Details", existing_profile.family, data.get('family'), "Family member details successfully saved."),
            ("Medical Details", existing_profile.medical, data.get('medical'), "Medical history and blood group information updated."),
            ("Reference Details", existing_profile.reference_person, data.get('reference_person'), "Reference person contact information has been updated."),
            ("Emergency Contacts", existing_profile.emergency_contacts, data.get('emergency_contacts'), "Emergency contact details successfully updated."),
            ("Bank Details", existing_profile.bank_account, data.get('bank_account'), "Your bank account and financial details have been updated.")
        ]
        
        for sec_name, old_v, new_v, specific_msg in other_sections:
            if new_v is not None:
                has_change = False
                if isinstance(old_v, list) and isinstance(new_v, list):
                    if not json_eq(old_v, new_v): has_change = True
                elif isinstance(old_v, (dict, models.Notification)) or isinstance(new_v, dict): # Handle dicts/models
                    if not json_eq(old_v, new_v): has_change = True
                else:
                    if old_v != new_v: has_change = True
                
                if has_change:
                    action = get_action(old_v, new_v)
                    op_desc = "added" if action != "removed" else "removed"
                    notifications_to_add.append(models.Notification(
                        user_id=user_id,
                        title=sec_name,
                        message=f"In {sec_name} section you {op_desc} particular information" if action != "removed" else f"In {sec_name} section your details had been removed please fill the details",
                        notification_type="success" if action != "removed" else "urgent"
                    ))

        # Update existing record explicitly
        for key, value in data.items():
            setattr(existing_profile, key, value)
            flag_modified(existing_profile, key)
            
        pct, missing_sections = calculate_profile_progress(existing_profile)
        existing_profile.profile_percentage = pct
        existing_profile.missing_sections = missing_sections
            
        for note in notifications_to_add:
            db.add(note)

        db.commit()
        db.refresh(existing_profile)
        return existing_profile
    else:
        # Create new record
        new_profile = models.CandidateProfile(
            user_id=user_id,
            **data
        )
        
        pct, missing_sections = calculate_profile_progress(new_profile)
        new_profile.profile_percentage = pct
        new_profile.missing_sections = missing_sections
        
        db.add(new_profile)
        
        db.add(models.Notification(
            user_id=user_id,
            title="Profile Creation",
            message="Started your candidate profile.",
            notification_type="success"
        ))
        
        db.commit()
        db.refresh(new_profile)
        return new_profile


@router.get("/profile/{user_id}", response_model=schemas.CandidateProfileResponse)
def get_profile(
    user_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieve candidate profile by user ID"""
    profile = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


# =========================
# 📄 JOB APPLICATIONS
# =========================

@router.post("/apply", response_model=schemas.ApplicationResponse)
def apply_for_job(
    application: schemas.ApplicationCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit a new job application"""
    new_app = models.Application(
        user_id=current_user.id,
        **application.dict()
    )
    # Set initial percentage for 'Applied' status
    new_app.status_percentage = 0
    
    db.add(new_app)
    
    # Add application submission notification
    db.add(models.Notification(
        user_id=current_user.id,
        title="Application Submitted",
        message=f"You have applied for the {new_app.department.upper()} position please wait for further process",
        notification_type="success"
    ))
    
    db.commit()
    db.refresh(new_app)
    return new_app


@router.get("/applications", response_model=List[schemas.ApplicationResponse])
def get_my_applications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetch all applications for the logged-in candidate"""
    return db.query(models.Application).options(joinedload(models.Application.candidate_profile)).filter(
        models.Application.user_id == current_user.id
    ).order_by(models.Application.created_at.desc()).all()


@router.delete("/application/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a job application"""
    app = db.query(models.Application).filter(
        models.Application.id == application_id,
        models.Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(app)
    db.commit()
    return {"message": "Application deleted successfully"}


# =========================
# 🔔 DASHBOARD DATA & NOTIFICATIONS
# =========================

@router.post("/notifications/read-all")
def mark_notifications_read(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark all notifications as read for the current user"""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard_data(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetch stats, notifications, similar jobs, and progress for the dashboard"""
    
    # 1. Stats & Profile
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_user.id).first()
    apps = db.query(models.Application).filter(models.Application.user_id == current_user.id).all()
    
    stats = schemas.DashboardStats(
        name=profile.name if profile else current_user.email.split('@')[0],
        applications_applied=len(apps),
        interviews_scheduled=len([a for a in apps if "interview" in a.status.lower()]),
        offers_received=len([a for a in apps if "offer" in a.status.lower()])
    )

    # 2. Notifications
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(15).all()

    # 3. Similar Jobs
    # Logic: try matching by applied department, then by profile designation, then fallback to recent
    last_app = db.query(models.Application).filter(
        models.Application.user_id == current_user.id
    ).order_by(models.Application.created_at.desc()).first()
    
    applied_dept = last_app.department if last_app else None
    profile_designation = profile.designation if profile else None
    
    similar_jobs = []
    
    # Priority 1: Match by Department from last application
    if applied_dept:
        similar_jobs = db.query(models.Job).filter(
            models.Job.department.ilike(f"%{applied_dept}%")
        ).order_by(models.Job.posted_at.desc()).limit(4).all()
        
    # Priority 2: Match by Profile Designation if still empty
    if not similar_jobs and profile_designation:
        similar_jobs = db.query(models.Job).filter(
            (models.Job.title.ilike(f"%{profile_designation}%")) |
            (models.Job.department.ilike(f"%{profile_designation}%"))
        ).order_by(models.Job.posted_at.desc()).limit(4).all()
        
    # Priority 3: Fallback to most recent jobs if list is still empty
    if not similar_jobs:
        similar_jobs = db.query(models.Job).order_by(models.Job.posted_at.desc()).limit(4).all()

    # 4. Progress (Profile % and Application %)
    profile_pct = profile.profile_percentage if profile else 0
    missing_sections = profile.missing_sections if profile else ["Personal Details", "Education", "Employment", "Bank Details", "Resume"]

    # Inject Analysis/Success notifications
    if profile_pct < 100 and missing_sections:
        from datetime import datetime
        sections_str = ", ".join(missing_sections)
            
        analysis_note = {
            "id": 9999, # High ID for virtual note
            "title": "Profile Analysis",
            "message": f"Please fill out the missing details: {sections_str} to complete your profile.",
            "notification_type": "urgent",
            "is_read": False,
            "created_at": datetime.now()
        }
        notifications.insert(0, analysis_note)
    elif profile_pct == 100:
        from datetime import datetime
        success_note = {
            "id": 10000,
            "title": "Profile Complete",
            "message": "Congratulations! Your profile is 100% complete and ready for process.",
            "notification_type": "success",
            "is_read": False,
            "created_at": datetime.now()
        }
        notifications.insert(0, success_note)

    # Application %: Use the status_percentage of the most recent application
    app_pct = 0
    if last_app:
        app_pct = last_app.status_percentage

    return schemas.DashboardResponse(
        stats=stats,
        notifications=notifications,
        similar_jobs=similar_jobs,
        progress=schemas.ProgressInfo(
            profile_percentage=profile_pct,
            application_percentage=app_pct
        )
    )

@router.get("/options")
def get_options():
    return {
        "departments": [
            {"label": "CNC", "value": "cnc"},
            {"label": "VMC", "value": "vmc"},
            {"label": "TMC", "value": "tmc"},
            {"label": "Accounts", "value": "accounts"},
            {"label": "Data Analyst", "value": "data_analyst"},
            {"label": "Dispatch", "value": "dispatch"},
            {"label": "Purchase", "value": "purchase"},
            {"label": "Sales", "value": "sales"},
            {"label": "Quality", "value": "quality"},
            {"label": "Stores", "value": "stores"},
        ],
        "sources": [
            {"label": "Indeed", "value": "indeed"},
            {"label": "Hiring Agency", "value": "agency"},
            {"label": "Others", "value": "others"},
        ]
    }
import os
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional, Dict, Any
from datetime import datetime
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


def get_doc_path_for_type(db: Session, user_id, doc_type: str) -> Optional[str]:
    """Fetch the latest file_path for a given document type from the documents table."""
    doc = db.query(models.Document).filter(
        models.Document.user_id == user_id,
        models.Document.document_type == doc_type,
        models.Document.deleted_at == None
    ).order_by(models.Document.uploaded_at.desc()).first()
    return doc.file_path if doc else None


def inject_doc_paths(profile, db: Session) -> dict:
    """
    Convert a CandidateProfile ORM object to a dict and inject
    document paths from the documents table for frontend compatibility.
    """
    if profile is None:
        return None

    d = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}

    # Inject latest doc paths from documents table
    doc_type_map = {
        "photo_path": "photo",
        "resume_path": "resume",
        "aadhar_doc_path": "aadhar",
        "pan_doc_path": "pan",
        "sslc_doc_path": "sslc",
    }
    for path_attr, doc_type in doc_type_map.items():
        doc_val = get_doc_path_for_type(db, profile.user_id, doc_type)
        if doc_val:
            d[path_attr] = doc_val
        elif getattr(profile, path_attr, None):
            d[path_attr] = getattr(profile, path_attr)
        else:
            d[path_attr] = None

    return d


def has_doc(profile, db: Session, path_attr: str, doc_type: str) -> bool:
    """Check whether the candidate has a specific document (in DB or profile column)."""
    if not profile:
        return False
    if get_doc_path_for_type(db, profile.user_id, doc_type):
        return True
    if getattr(profile, path_attr, None):
        return True
    if profile.declaration and isinstance(profile.declaration, dict):
        return bool(profile.declaration.get(doc_type))
    return False


def calculate_profile_progress(profile, db: Session = None):
    profile_pct = 0
    missing_sections = []

    if not profile:
        return 0, ["Personal Details", "Education", "Employment", "Bank Details", "Resume"]

    basic_missing = []
    if not is_filled(profile.name): basic_missing.append("Name")
    if not is_filled(profile.phone_number): basic_missing.append("Phone Number")
    if not is_filled(getattr(profile, 'designation', None)): basic_missing.append("Designation")
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
    if isinstance(med, dict):
        if not is_filled(med.get('bloodGroup')) or not is_filled(med.get('hasDisability')) or not is_filled(med.get('hasCondition')):
            missing_sections.append("Medical Details")

    if not is_filled(profile.reference_person): missing_sections.append("References")

    # Check docs from documents table (if db is provided) OR from profile columns
    missing_docs = []
    if db:
        if not has_doc(profile, db, 'photo_path', 'photo'): missing_docs.append("Photo")
        if not has_doc(profile, db, 'resume_path', 'resume'): missing_docs.append("Resume")
        if not has_doc(profile, db, 'aadhar_doc_path', 'aadhar'): missing_docs.append("Aadhar Document")
        if not has_doc(profile, db, 'pan_doc_path', 'pan'): missing_docs.append("PAN Document")
        if not has_doc(profile, db, 'sslc_doc_path', 'sslc'): missing_docs.append("SSLC Marks Card")
    else:
        # Fallback: check profile columns only
        doc_checks = [
            ('photo_path', 'photo', 'Photo'),
            ('resume_path', 'resume', 'Resume'),
            ('aadhar_doc_path', 'aadhaar', 'Aadhar Document'),
            ('pan_doc_path', 'pan', 'PAN Document'),
            ('sslc_doc_path', 'sslc', 'SSLC Marks Card'),
        ]
        for path_attr, decl_key, label in doc_checks:
            if not getattr(profile, path_attr, None):
                if not (profile.declaration and isinstance(profile.declaration, dict) and profile.declaration.get(decl_key)):
                    missing_docs.append(label)

    if missing_docs:
        missing_sections.append(f"Documents ({', '.join(missing_docs)})")

    key_fields = [
        'name', 'designation', 'phone_number', 'date_of_birth',
        'marital_status', 'gender', 'correspondence_address',
        'permanent_address', 'aadhar', 'pan', 'bank_account',
        'education', 'employment', 'family', 'medical', 'declaration',
        'photo_path', 'resume_path', 'aadhar_doc_path', 'pan_doc_path', 'sslc_doc_path'
    ]
    filled_count = sum(
        1 for field in key_fields
        if (getattr(profile, field, None) is not None and is_filled(getattr(profile, field, None)))
        or (field.endswith('_path') and db and has_doc(profile, db, field, field.replace('_path', '')))
    )
    profile_pct = int((filled_count / len(key_fields)) * 100)

    return profile_pct, missing_sections


def build_application_response(app: models.Application) -> dict:
    """Build a dict for ApplicationResponse with computed department from job relationship."""
    dept_name = None
    if app.job and app.job.department_rel:
        dept_name = app.job.department_rel.name
    elif app.job:
        dept_name = app.job.title  # fallback to job title

    # Build candidate_profile dict
    candidate_profile_data = None
    if app.candidate_profile:
        cp = app.candidate_profile
        candidate_profile_data = {
            c.name: getattr(cp, c.name) for c in cp.__table__.columns
        }

    return {
        "id": app.id,
        "user_id": app.user_id,
        "job_id": app.job_id,
        "department": dept_name,
        "experience_type": app.experience_type if hasattr(app, 'experience_type') else None,
        "other_details": app.other_details if hasattr(app, 'other_details') else None,
        "status": app.status.value if hasattr(app.status, 'value') else str(app.status),
        "status_percentage": app.status_percentage,
        "created_at": app.created_at,
        "candidate_profile": candidate_profile_data,
    }


def build_job_response(job: models.Job) -> dict:
    """Build a dict for JobResponse with computed department name from relationship."""
    dept_name = None
    if job.department_rel:
        dept_name = job.department_rel.name
    status_val = job.status.value if hasattr(job.status, 'value') else str(job.status)
    return {
        "id": job.id,
        "title": job.title,
        "department": dept_name,
        "location": job.location,
        "experience_range": job.experience_range,
        "description": job.description,
        "tags": job.tags,
        "status": status_val,
    }


# =========================
# 👤 FILE UPLOADS
# =========================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    folder: str = Form(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload a file to a specific folder (photos, resumes, documents).
    Saves the file and writes a record to the documents table.
    Returns the relative path to the saved file.
    """
    path = save_upload_file(file, folder)
    if not path:
        raise HTTPException(status_code=400, detail="File upload failed")

    # Determine document_type from folder
    folder_to_doc_type = {
        "photos": "photo",
        "resumes": "resume",
        "documents": "aadhar",   # generic fallback
        "aadhar": "aadhar",
        "pan": "pan",
        "sslc": "sslc",
    }
    doc_type = folder_to_doc_type.get(folder.lower(), folder.lower())

    # Determine mime type from content type
    mime_type = file.content_type if file.content_type else None
    file_name = file.filename if file.filename else os.path.basename(path)

    # Write to documents table
    new_doc = models.Document(
        user_id=current_user.id,
        document_type=doc_type,
        file_name=file_name,
        file_path=path,
        mime_type=mime_type,
    )
    db.add(new_doc)
    db.commit()

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

    # Strip document path fields from data — those are managed via upload endpoint
    doc_path_fields = ['photo_path', 'resume_path', 'aadhar_doc_path', 'pan_doc_path', 'sslc_doc_path']
    # Only keep path fields if they carry an actual value (so front-end can still update them)
    for f in doc_path_fields:
        if f in data and not data[f]:
            del data[f]

    if existing_profile:
        notifications_to_add = []

        # 🟢 Personal & Professional Details check
        personal_fields = [
            ('name', 'Name'), ('phone_number', 'Phone Number'),
            ('designation', 'Designation'), ('correspondence_address', 'Address'),
            ('email', 'Email'), ('date_of_birth', 'Date of Birth'),
            ('aadhar', 'Aadhar Number'), ('pan', 'PAN Number')
        ]

        any_personal_changed = False
        description = "updated"

        for field, label in personal_fields:
            if field in data and not json_eq(getattr(existing_profile, field, None), data.get(field)):
                any_personal_changed = True
                action = get_action(getattr(existing_profile, field, None), data.get(field))
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

        # 🟠 Education check
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

        # 🔵 Declaration & Documents check
        doc_fields = [
            ('photo_path', 'Photo'),
            ('resume_path', 'Resume'),
            ('aadhar_doc_path', 'Aadhar Document'),
            ('pan_doc_path', 'PAN Document'),
            ('sslc_doc_path', 'SSLC Marks Card'),
            ('declaration', 'Declaration Section')
        ]
        for field, label in doc_fields:
            if field in data and not json_eq(getattr(existing_profile, field, None), data.get(field)):
                action = get_action(getattr(existing_profile, field, None), data.get(field))
                op_desc = "added" if action != "removed" else "removed"
                notifications_to_add.append(models.Notification(
                    user_id=user_id,
                    title="Declaration/Documents",
                    message=f"In Declaration section you {op_desc} particular {label} information" if action != "removed" else f"In Declaration section your {label} had been removed please fill the details",
                    notification_type="success" if action != "removed" else "urgent"
                ))

        # 🟣 Catch-all for other sections
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
                elif isinstance(old_v, dict) or isinstance(new_v, dict):
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

        # Apply updates
        for key, value in data.items():
            setattr(existing_profile, key, value)
            flag_modified(existing_profile, key)

        pct, missing_sections = calculate_profile_progress(existing_profile, db)
        existing_profile.profile_percentage = pct
        existing_profile.missing_sections = missing_sections

        for note in notifications_to_add:
            db.add(note)

        db.commit()
        db.refresh(existing_profile)

        # Build response with injected doc paths
        resp_data = inject_doc_paths(existing_profile, db)
        return schemas.CandidateProfileResponse(**resp_data)
    else:
        # Create new profile
        new_profile = models.CandidateProfile(
            user_id=user_id,
            **data
        )

        pct, missing_sections = calculate_profile_progress(new_profile, db)
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

        resp_data = inject_doc_paths(new_profile, db)
        return schemas.CandidateProfileResponse(**resp_data)


@router.get("/profile/{user_id}", response_model=schemas.CandidateProfileResponse)
def get_profile(
    user_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieve candidate profile by user ID (with injected document paths)."""
    profile = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    resp_data = inject_doc_paths(profile, db)
    return schemas.CandidateProfileResponse(**resp_data)


# =========================
# 📄 JOB APPLICATIONS
# =========================

@router.post("/apply")
def apply_for_job(
    application: schemas.ApplicationCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Submit a new job application.
    Frontend sends `department` string → backend resolves to a Job and stores job_id.
    """
    # Resolve department name → Department record
    dept = db.query(models.Department).filter(
        models.Department.name.ilike(application.department)
    ).first()

    if not dept:
        # Try partial match
        dept = db.query(models.Department).filter(
            models.Department.name.ilike(f"%{application.department}%")
        ).first()

    # Find an active job in this department
    job = None
    if dept:
        job = db.query(models.Job).filter(
            models.Job.department_id == dept.id,
            models.Job.status == models.JobStatus.OPEN
        ).order_by(models.Job.posted_at.desc()).first()

    if not job:
        # Fallback: find any open job matching department name in title
        job = db.query(models.Job).join(
            models.Department, models.Job.department_id == models.Department.id
        ).filter(
            models.Department.name.ilike(f"%{application.department}%"),
            models.Job.status == models.JobStatus.OPEN
        ).order_by(models.Job.posted_at.desc()).first()

    if not job:
        # If still no job found, try any open job as fallback
        job = db.query(models.Job).filter(
            models.Job.status == models.JobStatus.OPEN
        ).order_by(models.Job.posted_at.desc()).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail=f"No active job found for department '{application.department}'. Please contact HR."
        )

    # Check if candidate already applied for this job
    existing = db.query(models.Application).filter(
        models.Application.user_id == current_user.id,
        models.Application.job_id == job.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already applied to a job in this department."
        )

    # Create application
    new_app = models.Application(
        user_id=current_user.id,
        job_id=job.id,
        status=models.ApplicationStatus.Applied,
        status_percentage=10,
        experience_type=application.experience_type,
        other_details=application.other_details,
    )
    db.add(new_app)

    # Notification
    dept_name = dept.name if dept else application.department
    db.add(models.Notification(
        user_id=current_user.id,
        title="Application Submitted",
        message=f"You have applied for the {dept_name.upper()} department. Please wait for further process.",
        notification_type="success"
    ))

    db.commit()
    db.refresh(new_app)

    # Reload with relationships
    new_app = db.query(models.Application).options(
        joinedload(models.Application.job).joinedload(models.Job.department_rel),
        joinedload(models.Application.candidate_profile)
    ).filter(models.Application.id == new_app.id).first()

    return build_application_response(new_app)


@router.get("/applications")
def get_my_applications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetch all applications for the logged-in candidate."""
    apps = db.query(models.Application).options(
        joinedload(models.Application.job).joinedload(models.Job.department_rel),
        joinedload(models.Application.candidate_profile)
    ).filter(
        models.Application.user_id == current_user.id
    ).order_by(models.Application.created_at.desc()).all()

    return [build_application_response(a) for a in apps]


@router.delete("/application/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a job application."""
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
    """Mark all notifications as read for the current user."""
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
    """Fetch stats, notifications, similar jobs, and progress for the dashboard."""

    # 1. Profile & applications
    profile = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == current_user.id
    ).first()

    apps = db.query(models.Application).options(
        joinedload(models.Application.job).joinedload(models.Job.department_rel)
    ).filter(
        models.Application.user_id == current_user.id
    ).all()

    # Stats
    stats = schemas.DashboardStats(
        name=profile.name if profile else current_user.email.split('@')[0],
        applications_applied=len(apps),
        interviews_scheduled=len([a for a in apps if "interview" in str(a.status).lower()]),
        offers_received=len([a for a in apps if "offer" in str(a.status).lower()])
    )

    # 2. Notifications
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(15).all()

    # 3. Similar Jobs — match by department from most recent application
    last_app = apps[0] if apps else None
    applied_dept_id = None
    if last_app and last_app.job:
        applied_dept_id = last_app.job.department_id

    profile_designation = profile.designation if profile else None

    similar_jobs = []

    # Priority 1: Match by department of last application
    if applied_dept_id:
        similar_jobs = db.query(models.Job).options(
            joinedload(models.Job.department_rel)
        ).filter(
            models.Job.department_id == applied_dept_id,
            models.Job.status == models.JobStatus.OPEN
        ).order_by(models.Job.posted_at.desc()).limit(4).all()

    # Priority 2: Match by profile designation
    if not similar_jobs and profile_designation:
        similar_jobs = db.query(models.Job).options(
            joinedload(models.Job.department_rel)
        ).filter(
            models.Job.title.ilike(f"%{profile_designation}%"),
            models.Job.status == models.JobStatus.OPEN
        ).order_by(models.Job.posted_at.desc()).limit(4).all()

    # Priority 3: Recent open jobs
    if not similar_jobs:
        similar_jobs = db.query(models.Job).options(
            joinedload(models.Job.department_rel)
        ).filter(
            models.Job.status == models.JobStatus.OPEN
        ).order_by(models.Job.posted_at.desc()).limit(4).all()

    similar_jobs_data = [build_job_response(j) for j in similar_jobs]

    # 4. Progress
    profile_pct = profile.profile_percentage if profile else 0
    missing_sections = profile.missing_sections if profile else [
        "Personal Details", "Education", "Employment", "Bank Details", "Resume"
    ]

    # Inject profile analysis notifications
    if profile_pct < 100 and missing_sections:
        sections_str = ", ".join(missing_sections)
        analysis_note = models.Notification(
            id=9999,
            title="Profile Analysis",
            message=f"Please fill out the missing details: {sections_str} to complete your profile.",
            notification_type="urgent",
            is_read=False,
            created_at=datetime.now()
        )
        notifications.insert(0, analysis_note)
    elif profile_pct == 100:
        success_note = models.Notification(
            id=10000,
            title="Profile Complete",
            message="Congratulations! Your profile is 100% complete and ready for process.",
            notification_type="success",
            is_read=False,
            created_at=datetime.now()
        )
        notifications.insert(0, success_note)

    # Application progress %
    app_pct = 0
    if last_app:
        app_pct = last_app.status_percentage

    return schemas.DashboardResponse(
        stats=stats,
        notifications=notifications,
        similar_jobs=similar_jobs_data,
        progress=schemas.ProgressInfo(
            profile_percentage=profile_pct,
            application_percentage=app_pct
        )
    )


@router.get("/options")
def get_options(db: Session = Depends(database.get_db)):
    """Return department options from the database (with static fallback)."""
    depts = db.query(models.Department).filter(
        models.Department.is_active == True
    ).order_by(models.Department.name).all()

    if depts:
        dept_list = [{"label": d.name, "value": d.name.lower().replace(" ", "_")} for d in depts]
    else:
        # Static fallback
        dept_list = [
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
        ]

    return {
        "departments": dept_list,
        "sources": [
            {"label": "Indeed", "value": "indeed"},
            {"label": "Hiring Agency", "value": "agency"},
            {"label": "Others", "value": "others"},
        ]
    }
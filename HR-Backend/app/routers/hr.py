from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from .. import database, models, schemas
from ..dependencies import get_current_hr_user

router = APIRouter(prefix="/hr", tags=["HR"])


def build_application_response(app: models.Application) -> dict:
    """Build ApplicationResponse dict with computed department from job relationship."""
    dept_name = None
    if app.job and app.job.department_rel:
        dept_name = app.job.department_rel.name
    elif app.job:
        dept_name = app.job.title

    status_val = app.status.value if hasattr(app.status, 'value') else str(app.status)

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
        "experience_type": app.experience_type,
        "other_details": app.other_details,
        "status": status_val,
        "status_percentage": app.status_percentage,
        "created_at": app.created_at,
        "candidate_profile": candidate_profile_data,
    }


def build_job_response(job: models.Job) -> dict:
    """Build JobResponse dict with computed department name."""
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


# =============================================
# 📊 HR DASHBOARD
# =============================================

@router.get("/dashboard/stats", response_model=schemas.HRDashboardStats)
def get_hr_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Fetch counts for HR dashboard cards."""
    total_apps = db.query(models.Application).count()
    total_candidates = db.query(models.CandidateProfile).count()
    pending_review = db.query(models.Application).filter(
        models.Application.status == models.ApplicationStatus.Interview
    ).count()
    onboarded = db.query(models.Application).filter(
        models.Application.status == models.ApplicationStatus.Onboarding
    ).count()

    return {
        "total_applications": total_apps,
        "total_candidates": total_candidates,
        "pending_review": pending_review,
        "onboarded": onboarded
    }


@router.get("/dashboard/jobs-overview", response_model=List[schemas.HRJobOverview])
def get_hr_jobs_overview(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Aggregate application counts per department (via Job → Department join)."""
    results = db.query(
        models.Department.name,
        func.count(models.Application.id).label("applicant_count")
    ).join(
        models.Job, models.Job.department_id == models.Department.id
    ).join(
        models.Application, models.Application.job_id == models.Job.id
    ).group_by(models.Department.name).all()

    return [{"department": r[0], "applicant_count": r[1]} for r in results]


# =============================================
# 📄 APPLICATIONS (HR)
# =============================================

@router.get("/applications")
def list_all_applications(
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Fetch all job applications with search and status filters."""
    query = db.query(models.Application).options(
        joinedload(models.Application.job).joinedload(models.Job.department_rel),
        joinedload(models.Application.candidate_profile)
    ).outerjoin(
        models.CandidateProfile,
        models.Application.user_id == models.CandidateProfile.user_id
    ).outerjoin(
        models.Job, models.Application.job_id == models.Job.id
    ).outerjoin(
        models.Department, models.Job.department_id == models.Department.id
    )

    if status:
        # Match by enum value string
        query = query.filter(models.Application.status == status)

    if search:
        query = query.filter(
            (models.CandidateProfile.name.ilike(f"%{search}%")) |
            (models.Department.name.ilike(f"%{search}%")) |
            (models.Job.title.ilike(f"%{search}%"))
        )

    query = query.order_by(models.Application.created_at.desc())

    if limit:
        query = query.limit(limit)

    apps = query.all()
    return [build_application_response(a) for a in apps]


@router.put("/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    status_update: schemas.ApplicationStatusUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Update the status of a specific application and log the change to history."""
    application = db.query(models.Application).options(
        joinedload(models.Application.job).joinedload(models.Job.department_rel)
    ).filter(models.Application.id == app_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = application.status

    # Validate new status matches enum
    valid_statuses = {s.value: s for s in models.ApplicationStatus}
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status_update.status}'. Valid values: {list(valid_statuses.keys())}"
        )

    new_status_enum = valid_statuses[status_update.status]
    application.status = new_status_enum

    # Update progress percentage based on status
    status_percentage_map = {
        "Applied": 10,
        "Application Reviewed": 30,
        "Interview Scheduled": 50,
        "On Hold": 60,
        "Offered": 80,
        "Onboarding": 100
    }
    application.status_percentage = status_percentage_map.get(
        status_update.status, application.status_percentage
    )

    # Log to ApplicationStatusHistory
    history_entry = models.ApplicationStatusHistory(
        application_id=application.id,
        old_status=old_status,
        new_status=new_status_enum,
        changed_by=current_user.id,
        remarks=status_update.remarks
    )
    db.add(history_entry)

    db.commit()
    db.refresh(application)

    # Notification for the candidate
    dept_name = ""
    if application.job and application.job.department_rel:
        dept_name = application.job.department_rel.name
    elif application.job:
        dept_name = application.job.title

    notif_type = "success" if status_update.status in [
        "Offered", "Onboarding", "Interview Scheduled"
    ] else "default"

    new_notification = models.Notification(
        user_id=application.user_id,
        title="Application Status Update",
        message=f"Your application for {dept_name} has been updated to '{status_update.status}'.",
        notification_type=notif_type
    )
    db.add(new_notification)
    db.commit()

    return build_application_response(application)


# =============================================
# 👥 CANDIDATES (HR)
# =============================================

@router.get("/candidates")
def list_candidates(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """List all candidate profiles."""
    candidates = db.query(models.CandidateProfile).all()
    return [
        {c.name: getattr(cp, c.name) for c in cp.__table__.columns}
        for cp in candidates
    ]


@router.get("/candidates/{user_id}")
def get_candidate(
    user_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Get a single candidate profile by user_id."""
    candidate = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == user_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {c.name: getattr(candidate, c.name) for c in candidate.__table__.columns}


# =============================================
# 💼 JOB POSTINGS (HR)
# =============================================

@router.post("/jobs")
def create_job(
    job_in: schemas.JobCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Post a new available job. Resolves department name → department_id."""
    # Resolve department name to department_id
    dept = db.query(models.Department).filter(
        models.Department.name.ilike(job_in.department)
    ).first()

    if not dept:
        # Try partial match
        dept = db.query(models.Department).filter(
            models.Department.name.ilike(f"%{job_in.department}%")
        ).first()

    if not dept:
        # Auto-create the department if it doesn't exist
        dept = models.Department(name=job_in.department)
        db.add(dept)
        db.commit()
        db.refresh(dept)

    # Map status string to enum
    status_map = {
        "OPEN": models.JobStatus.OPEN,
        "CLOSED": models.JobStatus.CLOSED,
        "ON_HOLD": models.JobStatus.ON_HOLD,
    }
    job_status = status_map.get(job_in.status.upper() if job_in.status else "OPEN", models.JobStatus.OPEN)

    new_job = models.Job(
        title=job_in.title,
        department_id=dept.id,
        location=job_in.location,
        experience_range=job_in.experience_range,
        description=job_in.description,
        tags=job_in.tags,
        status=job_status,
        created_by=current_user.id
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Reload with relationship
    new_job = db.query(models.Job).options(
        joinedload(models.Job.department_rel)
    ).filter(models.Job.id == new_job.id).first()

    return build_job_response(new_job)


@router.get("/jobs")
def list_jobs(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """List all available jobs with department names."""
    jobs = db.query(models.Job).options(
        joinedload(models.Job.department_rel)
    ).order_by(models.Job.posted_at.desc()).all()

    return [build_job_response(j) for j in jobs]


@router.put("/jobs/{job_id}")
def update_job(
    job_id: int,
    job_in: schemas.JobCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Update a job posting."""
    job = db.query(models.Job).options(
        joinedload(models.Job.department_rel)
    ).filter(models.Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Resolve department
    dept = db.query(models.Department).filter(
        models.Department.name.ilike(job_in.department)
    ).first()
    if not dept:
        dept = db.query(models.Department).filter(
            models.Department.name.ilike(f"%{job_in.department}%")
        ).first()
    if not dept:
        dept = models.Department(name=job_in.department)
        db.add(dept)
        db.commit()
        db.refresh(dept)

    status_map = {
        "OPEN": models.JobStatus.OPEN,
        "CLOSED": models.JobStatus.CLOSED,
        "ON_HOLD": models.JobStatus.ON_HOLD,
    }
    job_status = status_map.get(
        job_in.status.upper() if job_in.status else "OPEN",
        models.JobStatus.OPEN
    )

    job.title = job_in.title
    job.department_id = dept.id
    job.location = job_in.location
    job.experience_range = job_in.experience_range
    job.description = job_in.description
    job.tags = job_in.tags
    job.status = job_status

    db.commit()
    db.refresh(job)

    job = db.query(models.Job).options(
        joinedload(models.Job.department_rel)
    ).filter(models.Job.id == job.id).first()

    return build_job_response(job)


@router.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Remove a job posting."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}


# =============================================
# 📂 DEPARTMENTS (HR)
# =============================================

@router.get("/departments", response_model=List[schemas.DepartmentResponse])
def list_departments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """List all departments."""
    return db.query(models.Department).filter(
        models.Department.is_active == True
    ).order_by(models.Department.name).all()

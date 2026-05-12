from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from .. import database, models, schemas
from ..dependencies import get_current_hr_user

router = APIRouter(prefix="/hr", tags=["HR"])


# ✅ GET /hr/dashboard/stats — (HR only)
@router.get("/dashboard/stats", response_model=schemas.HRDashboardStats)
def get_hr_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Fetch counts for dashboard cards"""
    total_apps = db.query(models.Application).count()
    total_candidates = db.query(models.CandidateProfile).count()
    # "Pending Review" is described as candidates after interview
    pending_review = db.query(models.Application).filter(
        models.Application.status == "Interview Scheduled"
    ).count()
    onboarded = db.query(models.Application).filter(
        models.Application.status == "Onboarding"
    ).count()

    return {
        "total_applications": total_apps,
        "total_candidates": total_candidates,
        "pending_review": pending_review,
        "onboarded": onboarded
    }


# ✅ GET /hr/dashboard/jobs-overview — (HR only)
@router.get("/dashboard/jobs-overview", response_model=List[schemas.HRJobOverview])
def get_hr_jobs_overview(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Aggregate application counts per department/role"""
    results = db.query(
        models.Application.department,
        func.count(models.Application.id).label("applicant_count")
    ).group_by(models.Application.department).all()

    return [{"department": r[0], "applicant_count": r[1]} for r in results]


# ✅ GET /hr/applications — List all applications with filtering (HR only)
@router.get("/applications", response_model=List[schemas.ApplicationResponse])
def list_all_applications(
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Fetch all job applications with search and status filters"""
    query = db.query(models.Application).options(joinedload(models.Application.candidate_profile)).outerjoin(models.CandidateProfile, models.Application.user_id == models.CandidateProfile.user_id)
    
    if status:
        query = query.filter(models.Application.status == status)
    
    if search:
        query = query.filter(
            (models.CandidateProfile.name.ilike(f"%{search}%")) |
            (models.Application.department.ilike(f"%{search}%"))
        )
    
    query = query.order_by(models.Application.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    return query.all()


# ✅ PUT /hr/applications/{app_id}/status — Update status (HR only)
@router.put("/applications/{app_id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    app_id: int,
    status_update: schemas.ApplicationStatusUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Update the status of a specific application"""
    application = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = status_update.status
    
    # Update progress percentage based on status
    status_map = {
        "Applied": 10,
        "Application Reviewed": 30,
        "Interview Scheduled": 50,
        "On Hold": 60,
        "Offered": 80,
        "Onboarding": 100
    }
    application.status_percentage = status_map.get(status_update.status, application.status_percentage)

    db.commit()
    db.refresh(application)

    # 🔔 Create a notification for the candidate
    new_notification = models.Notification(
        user_id=application.user_id,
        title=f"Status Update",
        message=f"Your application for {application.department} has been updated to '{application.status}'.",
        notification_type="success" if application.status in ["Offered", "Onboarding", "Interview Scheduled"] else "default"
    )
    db.add(new_notification)
    db.commit()

    return application


# ✅ GET /hr/candidates — List all candidate profiles (HR only)
@router.get("/candidates")
def list_candidates(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    return db.query(models.CandidateProfile).all()


# ✅ GET /hr/candidates/{user_id} — Get a single candidate (HR only)
@router.get("/candidates/{user_id}")
def get_candidate(
    user_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    candidate = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == user_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


# =========================
# 💼 JOB POSTINGS (HR only)
# =========================

@router.post("/jobs", response_model=schemas.JobResponse)
def create_job(
    job_in: schemas.JobCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Post a new available job"""
    new_job = models.Job(**job_in.dict())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@router.get("/jobs", response_model=List[schemas.JobResponse])
def list_jobs(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """List all available jobs"""
    return db.query(models.Job).order_by(models.Job.posted_at.desc()).all()


@router.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_hr_user)
):
    """Remove a job posting"""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}

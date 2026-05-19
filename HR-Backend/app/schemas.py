from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
import uuid
from datetime import datetime

# =========================
# 👤 USER AUTH SCHEMAS
# =========================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "CANDIDATE"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: uuid.UUID
    role: str
    is_profile_created: bool


# =========================
# 👤 NESTED DATA SCHEMAS
# =========================

class EducationEntry(BaseModel):
    degree: str
    institute: str
    from_date: str = Field(alias="from")
    to_date: str = Field(alias="to")
    specialization: str
    backlogs: Optional[str] = "No"

    class Config:
        populate_by_name = True


class EmploymentEntry(BaseModel):
    organization: str
    designation: str
    from_date: str = Field(alias="from")
    to_date: str = Field(alias="to")
    summary: Optional[str] = None
    experience: Optional[str] = None
    current: bool = False

    class Config:
        populate_by_name = True


class ReferencePerson(BaseModel):
    name: str
    designation: str
    contact: str


class FamilyEntry(BaseModel):
    relation: str
    name: str
    occupation: str
    dob: str


class MedicalDetails(BaseModel):
    bloodGroup: str
    hasDisability: str
    disabilityYears: Optional[str] = None
    hasCondition: str
    conditionYears: Optional[str] = None


class DeclarationDetails(BaseModel):
    date: Optional[str] = None
    place: Optional[str] = None
    agreed: Optional[bool] = None
    signature: Optional[str] = None
    aadhaar: Optional[Dict] = None
    pan: Optional[Dict] = None
    sslc: Optional[Dict] = None


class EmergencyContact(BaseModel):
    name: str
    relationship: str
    contact: str


# =========================
# 👤 CANDIDATE PROFILE
# =========================

class CandidateProfileBase(BaseModel):
    is_profile_created: bool = False
    
    # 1️⃣ Personal Details (matching Frontend mapFrontendToBackend)
    name: Optional[str] = None
    designation: Optional[str] = None
    phone_number: Optional[str] = None
    mobile2: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    marital_status: Optional[str] = None
    gender: Optional[str] = None
    correspondence_address: Optional[str] = None
    permanent_address: Optional[str] = None
    aadhar: Optional[str] = None
    pan: Optional[str] = None
    passport: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    ifsc: Optional[str] = None
    uan: Optional[str] = None
    esic: Optional[str] = None
    languages: Optional[List[str]] = None
    custom_language: Optional[str] = None

    # 2️⃣ Multi-entry Sections
    education: Optional[List[EducationEntry]] = None
    employment: Optional[List[EmploymentEntry]] = None
    emergency_contacts: Optional[List[EmergencyContact]] = None
    reference_person: Optional[ReferencePerson] = None
    reference_source: Optional[str] = None
    family: Optional[List[FamilyEntry]] = None
    medical: Optional[MedicalDetails] = None
    declaration: Optional[DeclarationDetails] = None

    # 💾 Document Paths
    photo_path: Optional[str] = None
    resume_path: Optional[str] = None
    aadhar_doc_path: Optional[str] = None
    pan_doc_path: Optional[str] = None
    sslc_doc_path: Optional[str] = None

    # Cached
    profile_percentage: Optional[int] = 0
    missing_sections: Optional[List[str]] = None
    technical_qualifications: Optional[List[Dict]] = None


class CandidateProfileUpdate(CandidateProfileBase):
    pass


class CandidateProfileResponse(CandidateProfileBase):
    id: int
    user_id: uuid.UUID

    class Config:
        from_attributes = True


# =========================
# 📄 APPLICATION (Section 3)
# =========================

class ApplicationCreate(BaseModel):
    department: str
    experience_type: str
    other_details: Optional[Dict] = None


class ApplicationResponse(ApplicationCreate):
    id: int
    user_id: uuid.UUID
    status: str
    status_percentage: int
    created_at: datetime
    candidate_profile: Optional[CandidateProfileResponse] = None

    class Config:
        from_attributes = True


# =========================
# 🔔 NOTIFICATIONS & DASHBOARD
# =========================

class NotificationResponse(BaseModel):
    id: int
    title: Optional[str] = None
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    name: Optional[str] = None
    applications_applied: int
    interviews_scheduled: int
    offers_received: int


class ProgressInfo(BaseModel):
    profile_percentage: int
    application_percentage: int


class JobCreate(BaseModel):
    title: str
    department: str
    location: str
    experience_range: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class JobResponse(BaseModel):
    id: int
    title: str
    department: str
    location: str
    experience_range: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    stats: DashboardStats
    notifications: List[NotificationResponse]
    similar_jobs: List[JobResponse]
    progress: ProgressInfo

# HR Schemas
class HRDashboardStats(BaseModel):
    total_applications: int
    total_candidates: int
    pending_review: int
    onboarded: int

class HRJobOverview(BaseModel):
    department: str
    applicant_count: int

class ApplicationStatusUpdate(BaseModel):
    status: str
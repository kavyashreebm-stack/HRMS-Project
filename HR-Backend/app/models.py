from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .database import Base
from sqlalchemy.orm import relationship

# 👤 User Table
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="CANDIDATE")  # CANDIDATE or HR
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# 👤 Candidate Profile Table (7 Sections)
class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    is_profile_created = Column(Boolean, default=False)
    profile_percentage = Column(Integer, default=0)
    missing_sections = Column(JSON, nullable=True, default=list)

    # 1️⃣ Personal Details
    name = Column(String, nullable=True)                  # Name (Capital Letters)
    designation = Column(String, nullable=True)           # Designation Applied For
    phone_number = Column(String, nullable=True)          # Mobile No (Primary)
    mobile2 = Column(String, nullable=True)               # Mobile No (Alternate)
    email = Column(String, nullable=True)                 # Email ID
    date_of_birth = Column(String, nullable=True)         # Date of Birth dd-mm-yyyy
    marital_status = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    correspondence_address = Column(String, nullable=True)
    permanent_address = Column(String, nullable=True)     # Permanent Address (as per Aadhar)
    aadhar = Column(String, nullable=True)                # Aadhar Card No
    pan = Column(String, nullable=True)                   # PAN Card No
    passport = Column(String, nullable=True)              # Passport No
    bank_account = Column(String, nullable=True)          # Bank Account No
    bank_name = Column(String, nullable=True)             # Bank Name
    ifsc = Column(String, nullable=True)                  # IFSC Code
    uan = Column(String, nullable=True)                   # UAN No
    esic = Column(String, nullable=True)                  # ESIC No

    # Languages
    languages = Column(JSON, nullable=True)               # ["English", "Kannada"]
    custom_language = Column(String, nullable=True)       # Specific language if "Not Listed" is chosen

    # 2️⃣ Education, Employment, emergency, etc. (JSON blobs to match React state)
    education = Column(JSON, nullable=True)               # [{ degree, institute, from, to, specialization }]
    employment = Column(JSON, nullable=True)              # [{ organization, from, to, designation, current }]
    emergency_contacts = Column(JSON, nullable=True)      # [{ name, relationship, contact }]
    reference_person = Column(JSON, nullable=True)        # { name, designation, contact }
    reference_source = Column(String, nullable=True)      # Indeed, Hiring Agency, etc.
    family = Column(JSON, nullable=True)                  # [{ relation, name, occupation, dob }]
    medical = Column(JSON, nullable=True)                 # { bloodGroup, hasDisability, disabilityYears }
    declaration = Column(JSON, nullable=True)             # { date, place }

    # 💾 Document Paths
    photo_path = Column(String, nullable=True)
    resume_path = Column(String, nullable=True)
    aadhar_doc_path = Column(String, nullable=True)
    pan_doc_path = Column(String, nullable=True)
    sslc_doc_path = Column(String, nullable=True)
    technical_qualifications = Column(JSON, nullable=True)

    applications = relationship(
        "Application", 
        back_populates="candidate_profile",
        primaryjoin="CandidateProfile.user_id == foreign(Application.user_id)"
    )

# 📄 Application Table (Section 3)
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Structural Application Data
    department = Column(String, nullable=False)           # Department Applying For
    experience_type = Column(String, nullable=False)      # Fresher or Experienced?

    # Additional application-specific snapshots
    other_details = Column(JSON, nullable=True)           # source, referral, etc.
    
    status = Column(String, default="Applied")            # Applied, Reviewed, Interview, etc.
    status_percentage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    candidate_profile = relationship(
        "CandidateProfile", 
        back_populates="applications",
        primaryjoin="foreign(Application.user_id) == CandidateProfile.user_id"
    )


# 🔔 Notifications Table
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, nullable=True)
    message = Column(String, nullable=False)
    notification_type = Column(String, default="default")  # success, urgent, default
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# 💼 Jobs Table
class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    location = Column(String, default="Remote")
    description = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)  # Store skills/keywords like ["React", "Python"]
    posted_at = Column(DateTime(timezone=True), server_default=func.now())
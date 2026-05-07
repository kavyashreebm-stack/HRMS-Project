from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import database, schemas, models, auth

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ✅ Register API
@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):

    # Check if user already exists
    email_norm = user.email.strip().lower()
    existing_user = db.query(models.User).filter(models.User.email == email_norm).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = auth.get_password_hash(user.password)

    # Create user
    new_user = models.User(
        email=email_norm,
        password_hash=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ✅ Login API
@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):

    # Find user
    email_norm = user.email.strip().lower()
    user_in_db = db.query(models.User).filter(models.User.email == email_norm).first()
    
    # Validate
    if not user_in_db or not auth.verify_password(user.password, user_in_db.password_hash):
        raise HTTPException(status_code=403, detail="Invalid credentials")

    # Check if profile is fully created (for candidates)
    is_profile_created = False
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == user_in_db.id).first()
    if profile:
        is_profile_created = profile.is_profile_created

    # Create token
    access_token = auth.create_access_token(
        data={"user_id": str(user_in_db.id), "role": user_in_db.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_in_db.id,
        "role": user_in_db.role,
        "is_profile_created": is_profile_created
    }
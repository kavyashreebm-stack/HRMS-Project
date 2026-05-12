from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .database import engine, SessionLocal
from . import models, auth
from sqlalchemy.orm import Session

# Import routers
from .routers import auth_router, candidate, hr

app = FastAPI(title="HR Onboarding API", version="1.0.0")

# Create all DB tables and seed HR on startup
@app.on_event("startup")
def startup_populate_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        hr_email = "hrautocratengineers@gmail.com"
        hr_pass = "Hradmin@123"
        existing_hr = db.query(models.User).filter(models.User.email == hr_email).first()
        if not existing_hr:
            print(f"Seeding HR User: {hr_email}")
            hashed_pw = auth.get_password_hash(hr_pass)
            new_hr = models.User(
                email=hr_email,
                password_hash=hashed_pw,
                role="HR"
            )
            db.add(new_hr)
            db.commit()
    finally:
        db.close()

# ✅ CORS — allows React frontend to talk to FastAPI
origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://production.d3u94tnbl4bl76.amplifyapp.com",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register all routers
app.include_router(auth_router.router)
app.include_router(candidate.router)
app.include_router(hr.router)

# ✅ Serve static files (Uploaded Resumes/Photos) with CORS support
if not os.path.exists("uploads"):
    os.makedirs("uploads")

from starlette.middleware.cors import CORSMiddleware as StarletteCORSMiddleware
static_app = StaticFiles(directory="uploads")
app.mount("/uploads", StarletteCORSMiddleware(static_app, allow_origins=["*"]), name="uploads")



@app.get("/")
def root():
    return {"message": "HR Backend is running ✅"}
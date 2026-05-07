from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .database import engine
from . import models

# Import routers
from .routers import auth_router, candidate, hr

app = FastAPI(title="HR Onboarding API", version="1.0.0")

# Create all DB tables on startup
models.Base.metadata.create_all(bind=engine)

# ✅ CORS — allows React frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Explicitly add CORS headers to all responses (including static files)
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

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
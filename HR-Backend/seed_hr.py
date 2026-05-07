import os
import sys
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add project root to sys.path to allow importing the 'app' module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import models, auth, database

def seed_hr():
    load_dotenv()
    
    # Use the shared engine and ensure tables exist
    print("Ensuring tables exist...")
    database.Base.metadata.create_all(bind=database.engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=database.engine)
    db = SessionLocal()

    try:
        # 1. HR User
        hr_email = "hrautocratengineers@gmail.com"
        hr_password = "Hradmin@123"
        hr_role = "HR"

        existing_hr = db.query(models.User).filter(models.User.email == hr_email).first()
        if not existing_hr:
            print(f"Creating HR User {hr_email}...")
            hashed_pw = auth.get_password_hash(hr_password)
            new_hr = models.User(email=hr_email, password_hash=hashed_pw, role=hr_role, is_active=True)
            db.add(new_hr)
            db.commit()
            print("HR User created successfully.")
        else:
            print("HR User already exists.")

        # 2. Sample Jobs
        print("Checking for existing jobs...")
        if db.query(models.Job).count() == 0:
            print("Seeding sample jobs...")
            sample_jobs = [
                models.Job(title="Senior Frontend Developer", department="Software Development", location="Bangalore"),
                models.Job(title="React Engineer", department="Software Development", location="Remote"),
                models.Job(title="Backend Developer (Python)", department="Software Development", location="Hyderabad"),
                models.Job(title="HR Manager", department="Human Resources", location="Mumbai"),
                models.Job(title="Recruitment Specialist", department="Human Resources", location="Remote"),
                models.Job(title="Sales Executive", department="Sales", location="Delhi"),
                models.Job(title="Marketing Manager", department="Marketing", location="Pune"),
                models.Job(title="UI/UX Designer", department="Design", location="Remote"),
                models.Job(title="Product Manager", department="Product", location="Bangalore"),
            ]
            db.bulk_save_objects(sample_jobs)
            db.commit()
            print(f"Seeded {len(sample_jobs)} jobs.")
        else:
            print("Jobs already exist in database.")

    except Exception as e:
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_hr()

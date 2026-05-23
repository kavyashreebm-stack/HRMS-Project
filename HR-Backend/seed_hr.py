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
            new_hr = models.User(
                email=hr_email, 
                password_hash=hashed_pw, 
                role=models.UserRole.HR, 
                is_active=True
            )
            db.add(new_hr)
            db.commit()
            print("HR User created successfully.")
        else:
            print("HR User already exists.")

        # 2. Seed Departments
        print("Checking for existing departments...")
        depts_to_seed = [
            "CNC", "VMC", "TMC", "Accounts", "Data Analyst", 
            "Dispatch", "Purchase", "Sales", "Quality", "Stores",
            "Software Development", "Human Resources", "Design", 
            "Product", "Marketing"
        ]
        
        dept_map = {}
        for dname in depts_to_seed:
            dept = db.query(models.Department).filter(models.Department.name == dname).first()
            if not dept:
                print(f"Creating department: {dname}")
                dept = models.Department(name=dname)
                db.add(dept)
                db.commit()
                db.refresh(dept)
            dept_map[dname] = dept.id
        print("Departments seeded successfully.")

        # 3. Sample Jobs
        print("Checking for existing jobs...")
        if db.query(models.Job).count() == 0:
            print("Seeding sample jobs...")
            sample_jobs = [
                models.Job(title="Senior Frontend Developer", department_id=dept_map.get("Software Development"), location="Bangalore", experience_range="5+ years", description="React frontend dev role"),
                models.Job(title="React Engineer", department_id=dept_map.get("Software Development"), location="Remote", experience_range="2-4 years", description="React development"),
                models.Job(title="Backend Developer (Python)", department_id=dept_map.get("Software Development"), location="Hyderabad", experience_range="3+ years", description="FastAPI/Django development"),
                models.Job(title="HR Manager", department_id=dept_map.get("Human Resources"), location="Mumbai", experience_range="5+ years", description="HR management role"),
                models.Job(title="Recruitment Specialist", department_id=dept_map.get("Human Resources"), location="Remote", experience_range="1-3 years", description="Technical sourcing"),
                models.Job(title="Sales Executive", department_id=dept_map.get("Sales"), location="Delhi", experience_range="1-2 years", description="B2B sales executive"),
                models.Job(title="CNC Operator", department_id=dept_map.get("CNC"), location="Pune", experience_range="2-5 years", description="Precision CNC operations"),
                models.Job(title="Quality Inspector", department_id=dept_map.get("Quality"), location="Bangalore", experience_range="2+ years", description="Inspect mechanical components"),
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

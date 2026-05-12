import sys
import os

# Add HR-Backend to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), "HR-Backend"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database URL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:Kavya1234@hr-project-db.cy9qyk0csqn4.ap-southeast-2.rds.amazonaws.com:5432/hr_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def reset_candidate_data():
    db = SessionLocal()
    try:
        print("Cleaning candidate data...")
        
        db.execute(text("DELETE FROM notifications;"))
        db.execute(text("DELETE FROM applications;"))
        db.execute(text("DELETE FROM candidate_profiles;"))
        db.execute(text("DELETE FROM users WHERE role = 'candidate';"))
        
        db.commit()
        print("Done: Candidate data successfully wiped from the database.")
    except Exception as e:
        db.rollback()
        print(f"Error wiping database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_candidate_data()

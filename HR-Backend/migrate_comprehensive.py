import os
import sys
from sqlalchemy import text
sys.path.append(os.path.dirname(__file__))
from app.database import engine

def apply_migration():
    try:
        with engine.connect() as connection:
            print("Applying schema migrations...")
            
            # Application table droppings
            # SQLite does not support multiple drop columns in a single ALTER TABLE statement, but PostgreSQL does.
            # Using PostgreSQL dialect since it was set via dialect UUID.
            
            columns_to_drop = [
                'name', 'current_address', 'permanent_address', 'mobile_no',
                'date_of_birth', 'email_id', 'marital_status',
                'education_snapshot', 'employment_snapshot', 'technical_skills',
                'photo_path', 'resume_path'
            ]
            
            for col in columns_to_drop:
                try:
                    connection.execute(text(f"ALTER TABLE applications DROP COLUMN IF EXISTS {col};"))
                    print(f"Dropped column {col} from applications.")
                except Exception as e:
                    print(f"Skipping {col}: {str(e)}")

            # CandidateProfile new columns
            new_columns = [
                "ADD COLUMN IF NOT EXISTS profile_percentage INTEGER DEFAULT 0",
                "ADD COLUMN IF NOT EXISTS missing_sections JSON",
                "ADD COLUMN IF NOT EXISTS technical_qualifications JSON"
            ]

            for col in new_columns:
                try:
                    connection.execute(text(f"ALTER TABLE candidate_profiles {col};"))
                    print(f"Executed on candidate_profiles: {col}")
                except Exception as e:
                    print(f"Skipping candidate_profiles {col}: {str(e)}")

            connection.commit()
            print("Migration successful")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    apply_migration()

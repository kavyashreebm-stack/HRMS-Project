import os
import sys
from dotenv import load_dotenv

# Add project root to sys.path to allow importing the 'app' module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import database, models

def reset_database():
    load_dotenv()
    
    print("Dropping all existing database tables...")
    try:
        models.Base.metadata.drop_all(bind=database.engine)
        print("Successfully dropped all tables.")
    except Exception as e:
        print(f"Warning / Error dropping tables: {e}")
        
    print("Creating all tables based on new models...")
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("Successfully created all tables.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    reset_database()

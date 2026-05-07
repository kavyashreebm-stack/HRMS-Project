import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

def save_upload_file(upload_file: UploadFile, folder: str) -> str:
    """
    Saves an uploaded file to a specific folder in the uploads directory.
    Returns the relative path to the saved file.
    """
    if not upload_file:
        return None
        
    # Ensure the target directory exists
    target_dir = os.path.join(UPLOAD_DIR, folder)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir, exist_ok=True)
    
    # Generate a unique filename to avoid collisions
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(target_dir, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(upload_file.file.read())
        
    # Return the relative path for database storage
    return f"{folder}/{unique_filename}"

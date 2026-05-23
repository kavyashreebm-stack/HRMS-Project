import os
import zipfile

def create_backend_zip():
    source_dir = 'HR-Backend'
    output_filename = 'backend_deploy.zip'
    
    # Exclude these heavy or cache directories completely
    exclude_dirs = {'venv', '__pycache__', '.pytest_cache', '.git', '.idea'}

    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to skip excluded directories entirely
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file.endswith('.pyc'):
                    continue
                    
                file_path = os.path.join(root, file)
                # Calculate path inside zip (relative to HR-Backend)
                arcname = os.path.relpath(file_path, source_dir)
                # CRITICAL: Force forward slashes for Linux (AWS EB) compatibility
                arcname = arcname.replace(os.sep, '/')
                
                zipf.write(file_path, arcname)
                
    print(f"Successfully created {output_filename} with Linux-compatible paths!")

if __name__ == '__main__':
    create_backend_zip()

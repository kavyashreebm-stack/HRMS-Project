import zipfile
import os

# Get the directory where this script is located
base_dir = os.path.dirname(os.path.abspath(__file__))

files_to_zip = [
    ('app', 'app'),
    ('requirements.txt', 'requirements.txt'),
    ('Procfile', 'Procfile'),
    ('application.py', 'application.py'),
    ('.platform', '.platform')
]

zip_output = os.path.join(base_dir, '..', 'backend_aws.zip')

with zipfile.ZipFile(zip_output, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for src, arcname in files_to_zip:
        src_path = os.path.join(base_dir, src)
        if not os.path.exists(src_path):
            print(f"Skipping {src} (not found)")
            continue
            
        if os.path.isdir(src_path):
            for root, dirs, files in os.walk(src_path):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, base_dir).replace('\\', '/')
                    zipf.write(full_path, rel_path)
        else:
            zipf.write(src_path, arcname)

print(f"Successfully created {zip_output}!")

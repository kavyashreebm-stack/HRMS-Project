import zipfile
import os

folder_to_zip = 'dist'
zip_name = 'frontend_build.zip'

with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(folder_to_zip):
        for file in files:
            full_path = os.path.join(root, file)
            # arcname should be relative to the folder_to_zip, 
            # but AWS Amplify expects the contents of 'dist' at the root of the zip.
            arcname = os.path.relpath(full_path, folder_to_zip)
            zipf.write(full_path, arcname)

print(f"Successfully created {zip_name}!")

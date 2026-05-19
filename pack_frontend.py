import shutil
import os

if os.path.exists('dist'):
    shutil.make_archive('frontend_build', 'zip', 'dist')
    print("Successfully created frontend_build.zip!")
else:
    print("Error: 'dist' folder not found. Make sure to run 'npm run build' first.")

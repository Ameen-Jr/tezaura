import os
import shutil
import zipfile
import sys
import tkinter as tk
from tkinter import filedialog, messagebox

def update_software():
    # 1. Setup UI (Hidden window)
    root = tk.Tk()
    root.withdraw() 
    
    # 2. Ask user for the Update Zip
    messagebox.showinfo("ClassFlow Updater", "Please select the Update Package (.zip) sent by the developer.")
    
    zip_path = filedialog.askopenfilename(
        title="Select Update Package",
        filetypes=[("Zip Files", "*.zip")]
    )
    
    if not zip_path:
        return # User cancelled

    # 3. Define Paths (ADJUSTED FOR YOUR FOLDER STRUCTURE)
    # We assume updater.py, main.py, and classflow.db are all in the SAME folder.
    current_dir = os.getcwd()
    db_file = os.path.join(current_dir, "classflow.db")
    
    # 4. Safety Check: Protect the Database
    if os.path.exists(db_file):
        # Create a backup just in case
        shutil.copy(db_file, os.path.join(current_dir, "classflow.db.backup"))
    
    try:
        # 5. Extract and Overwrite
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.namelist():
                # CRITICAL: Skip extracting 'classflow.db' if it's in the zip
                # This prevents overwriting the user's data
                if "classflow.db" not in member:
                    zip_ref.extract(member, current_dir)
        
        messagebox.showinfo("Success", "Update Applied Successfully!\n\nYour database is safe.\nPlease restart ClassFlow.")
        
    except Exception as e:
        messagebox.showerror("Error", f"Update Failed:\n{str(e)}")
        # Restore DB if something went wrong
        if not os.path.exists(db_file) and os.path.exists("classflow.db.backup"):
             shutil.move("classflow.db.backup", db_file)

if __name__ == "__main__":
    update_software()
import os
import shutil
import zipfile
import sys
import json
import tkinter as tk
from tkinter import filedialog, messagebox

DB_FILE = "classflow.db"
VERSION_FILE = "version.json"  # Sits next to main.py, ships in every zip


def get_installed_version():
    """Read version from local version.json if it exists."""
    if os.path.exists(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r") as f:
                return json.load(f).get("version", "0.0.0")
        except:
            pass
    return "0.0.0"


def get_zip_version(zip_path):
    """Read version from version.json inside the zip."""
    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            if VERSION_FILE in zf.namelist():
                data = json.loads(zf.read(VERSION_FILE).decode('utf-8'))
                return data.get("version", "unknown")
    except:
        pass
    return "unknown"


def version_tuple(v):
    """Convert '1.2.3' to (1, 2, 3) for comparison."""
    try:
        return tuple(int(x) for x in str(v).split("."))
    except:
        return (0, 0, 0)


def update_software():
    root = tk.Tk()
    root.withdraw()

    installed = get_installed_version()

    messagebox.showinfo(
        "Tezaura Updater",
        f"Installed version: {installed}\n\nPlease select the Update Package (.zip) sent by the developer."
    )

    zip_path = filedialog.askopenfilename(
        title="Select Tezaura Update Package",
        filetypes=[("Zip Files", "*.zip")]
    )

    if not zip_path:
        return

    # --- Version check ---
    zip_version = get_zip_version(zip_path)

    if zip_version == "unknown":
        proceed = messagebox.askyesno(
            "Version Unknown",
            "This zip does not contain version information.\n\n"
            "It may be an old or unofficial package.\n\n"
            "Proceed anyway?"
        )
        if not proceed:
            return
    elif version_tuple(zip_version) < version_tuple(installed):
        proceed = messagebox.askyesno(
            "⚠️ Downgrade Warning",
            f"The update package version ({zip_version}) is OLDER than your installed version ({installed}).\n\n"
            f"Installing it will downgrade the app.\n\n"
            f"Are you absolutely sure you want to continue?"
        )
        if not proceed:
            return
    elif version_tuple(zip_version) == version_tuple(installed):
        proceed = messagebox.askyesno(
            "Same Version",
            f"The update package is the same version as installed ({installed}).\n\n"
            f"Continue to reinstall?"
        )
        if not proceed:
            return
    else:
        # Normal upgrade — confirm
        proceed = messagebox.askyesno(
            "Confirm Update",
            f"Update from version {installed} → {zip_version}?\n\n"
            f"Your student data will not be affected."
        )
        if not proceed:
            return

    # --- Backup database before anything ---
    current_dir = os.getcwd()
    db_path = os.path.join(current_dir, DB_FILE)
    backup_path = os.path.join(current_dir, f"{DB_FILE}.pre_update_backup")

    if os.path.exists(db_path):
        shutil.copy(db_path, backup_path)
        print(f"Database backed up to: {backup_path}")

    try:
        # --- Extract zip, skip database file ---
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.namelist():
                if DB_FILE in member:
                    continue  # Never overwrite student data
                zip_ref.extract(member, current_dir)

        # --- Run migration script if present ---
        migrate_path = os.path.join(current_dir, "migrate.py")
        if os.path.exists(migrate_path):
            print("Running database migration...")
            import importlib.util
            spec = importlib.util.spec_from_file_location("migrate", migrate_path)
            migrate_mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(migrate_mod)
            success = migrate_mod.run_migrations()
            if not success:
                messagebox.showwarning(
                    "Migration Warning",
                    "The update was extracted but the database migration reported an issue.\n"
                    "Please contact the developer if you experience problems."
                )
        else:
            messagebox.showwarning(
                "No Migration Script",
                "Update extracted but no migrate.py was found.\n"
                "Database schema may be out of date."
            )

        messagebox.showinfo(
            "✅ Update Complete",
            f"Tezaura updated to version {zip_version}.\n\n"
            f"Your student data is safe.\n\n"
            f"Please restart the app now."
        )

    except Exception as e:
        messagebox.showerror(
            "Update Failed",
            f"Error during update:\n{str(e)}\n\n"
            f"Your database backup is at:\n{backup_path}"
        )
        # Restore DB if extraction corrupted it somehow
        if os.path.exists(backup_path) and not os.path.exists(db_path):
            shutil.copy(backup_path, db_path)


if __name__ == "__main__":
    update_software()
import os
import sys
import shutil
import sqlite3
from datetime import datetime, date

SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = 'tezaura-drive-key.json'

# Frozen-aware DB path (same logic as main.py)
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(BASE_DIR, "classflow.db")
BACKUP_RETENTION_DAYS = 90


def get_setting(key):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM system_settings WHERE key=?", (key,))
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else None
    except:
        return None


def set_setting(key, value):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO system_settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """, (key, value))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Settings write error: {e}")


def get_drive_service():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds, cache_discovery=False)


def delete_old_backups(service, folder_id):
    """Delete backup files in the Drive folder older than BACKUP_RETENTION_DAYS."""
    try:
        cutoff = datetime.utcnow()
        query = f"'{folder_id}' in parents and name contains 'Tezaura_Backup' and trashed=false"
        results = service.files().list(
            q=query,
            fields="files(id, name, createdTime)",
            orderBy="createdTime asc"
        ).execute()

        files = results.get('files', [])
        deleted_count = 0

        for f in files:
            created_str = f.get('createdTime', '')
            if not created_str:
                continue
            try:
                created = datetime.strptime(created_str[:10], "%Y-%m-%d")
                age_days = (cutoff - created).days
                if age_days > BACKUP_RETENTION_DAYS:
                    service.files().delete(fileId=f['id']).execute()
                    deleted_count += 1
                    print(f"Deleted old backup: {f['name']} ({age_days} days old)")
            except Exception as e:
                print(f"Could not delete {f['name']}: {e}")

        return deleted_count
    except Exception as e:
        print(f"Cleanup error: {e}")
        return 0


def upload_backup_to_drive():
    from googleapiclient.http import MediaFileUpload

    folder_id = get_setting('drive_folder_id')
    if not folder_id:
        return {"success": False, "message": "No Google Drive folder configured."}

    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        return {"success": False, "message": f"Service account key file '{SERVICE_ACCOUNT_FILE}' not found next to main.py."}

    temp_path = None
    try:
        service = get_drive_service()

        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        backup_name = f"Tezaura_Backup_{timestamp}.db"
        temp_path = f"temp_{backup_name}"
        shutil.copy(DB_PATH, temp_path)

        file_metadata = {'name': backup_name, 'parents': [folder_id]}
        media = MediaFileUpload(temp_path, mimetype='application/x-sqlite3', resumable=False)
        uploaded = service.files().create(
            body=file_metadata, media_body=media, fields='id,name'
        ).execute()

        # Run cleanup after successful upload
        deleted = delete_old_backups(service, folder_id)

        set_setting('last_drive_backup', datetime.now().strftime("%Y-%m-%d %H:%M"))

        msg = f"Uploaded: {backup_name}"
        if deleted > 0:
            msg += f" | Removed {deleted} backup(s) older than {BACKUP_RETENTION_DAYS} days"

        return {"success": True, "message": msg}

    except Exception as e:
        return {"success": False, "message": str(e)}

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass


def check_and_run_weekly():
    """Called on app startup. Runs backup only if 7+ days since last."""
    folder_id = get_setting('drive_folder_id')
    if not folder_id:
        return  # Drive not configured, skip silently

    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        return  # Key file missing, skip silently

    last_str = get_setting('last_drive_backup')
    if last_str:
        try:
            last_date = datetime.strptime(last_str[:10], "%Y-%m-%d").date()
            days_since = (date.today() - last_date).days
            if days_since < 7:
                print(f"Drive backup: {days_since} days since last backup, skipping.")
                return
        except:
            pass  # Bad date format, proceed with backup

    print("Drive backup: running weekly backup...")
    result = upload_backup_to_drive()
    print(f"Drive backup result: {result['message']}")
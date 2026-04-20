import os
import sys
import shutil
import sqlite3
from datetime import datetime, date

SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Frozen-aware paths (same logic as main.py)
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(BASE_DIR, "classflow.db")
CLIENT_SECRET_FILE = os.path.join(BASE_DIR, 'client_secret.json')
TOKEN_FILE = os.path.join(BASE_DIR, 'token.json')
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


def get_credentials():
    """Load saved OAuth token or run the browser auth flow."""
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    creds = None
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        except Exception:
            creds = None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            # Auto-refresh silently
            creds.refresh(Request())
            with open(TOKEN_FILE, 'w') as f:
                f.write(creds.to_json())
        elif os.path.exists(CLIENT_SECRET_FILE):
            # First-time auth: opens system browser
            from google_auth_oauthlib.flow import InstalledAppFlow
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=0, open_browser=True)
            with open(TOKEN_FILE, 'w') as f:
                f.write(creds.to_json())
        else:
            return None

    return creds


def authorize():
    """Trigger the OAuth2 flow. Returns result dict."""
    try:
        if not os.path.exists(CLIENT_SECRET_FILE):
            return {"success": False, "message": "client_secret.json not found next to the app."}
        creds = get_credentials()
        if creds and creds.valid:
            return {"success": True, "message": "Authorized successfully! token.json saved."}
        return {"success": False, "message": "Authorization cancelled or failed."}
    except Exception as e:
        return {"success": False, "message": str(e)}


def get_drive_service():
    from googleapiclient.discovery import build
    creds = get_credentials()
    if not creds or not creds.valid:
        raise Exception("Not authorized. Click 'Authorize with Google' first.")
    return build('drive', 'v3', credentials=creds, cache_discovery=False)


def delete_old_backups(service, folder_id):
    """Delete Drive backups older than BACKUP_RETENTION_DAYS."""
    try:
        cutoff = datetime.utcnow()
        query = f"'{folder_id}' in parents and name contains 'Tezaura_Backup' and trashed=false"
        results = service.files().list(
            q=query, fields="files(id, name, createdTime)", orderBy="createdTime asc"
        ).execute()
        deleted = 0
        for f in results.get('files', []):
            try:
                created = datetime.strptime(f.get('createdTime', '')[:10], "%Y-%m-%d")
                if (cutoff - created).days > BACKUP_RETENTION_DAYS:
                    service.files().delete(fileId=f['id']).execute()
                    deleted += 1
            except Exception:
                pass
        return deleted
    except Exception:
        return 0


def upload_backup_to_drive():
    import zipfile
    from googleapiclient.http import MediaFileUpload

    folder_id = get_setting('drive_folder_id')
    if not folder_id:
        return {"success": False, "message": "No Google Drive folder configured."}

    if not os.path.exists(TOKEN_FILE) and not os.path.exists(CLIENT_SECRET_FILE):
        return {"success": False, "message": "Not authorized. Place client_secret.json next to the app and click 'Authorize with Google'."}

    temp_path = None
    try:
        service = get_drive_service()

        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        backup_name = f"Tezaura_Backup_{timestamp}.zip"
        temp_path = os.path.join(BASE_DIR, f"temp_{backup_name}")

        with zipfile.ZipFile(temp_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(DB_PATH, "classflow.db")
            photos_dir = os.path.join(BASE_DIR, "uploaded_photos")
            if os.path.exists(photos_dir):
                for root, dirs, files in os.walk(photos_dir):
                    for file in files:
                        filepath = os.path.join(root, file)
                        arcname = os.path.relpath(filepath, BASE_DIR).replace("\\", "/")
                        zf.write(filepath, arcname)

        file_metadata = {'name': backup_name, 'parents': [folder_id]}
        media = MediaFileUpload(temp_path, mimetype='application/zip', resumable=False)
        service.files().create(body=file_metadata, media_body=media, fields='id,name').execute()

        deleted = delete_old_backups(service, folder_id)
        set_setting('last_drive_backup', datetime.now().strftime("%Y-%m-%d %H:%M"))

        msg = f"Uploaded: {backup_name}"
        if deleted > 0:
            msg += f" | Removed {deleted} old backup(s)"
        return {"success": True, "message": msg}

    except Exception as e:
        return {"success": False, "message": str(e)}

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass



def check_and_run_weekly():
    """Called on app startup. Runs backup only if 7+ days since last and already authorized."""
    folder_id = get_setting('drive_folder_id')
    if not folder_id:
        return
    if not os.path.exists(TOKEN_FILE):
        return  # Not authorized yet — skip silently

    last_str = get_setting('last_drive_backup')
    if last_str:
        try:
            last_date = datetime.strptime(last_str[:10], "%Y-%m-%d").date()
            if (date.today() - last_date).days < 7:
                return
        except Exception:
            pass

    upload_backup_to_drive()
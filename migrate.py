"""
Tezaura Migration Script
Run automatically by updater.py after each update.
Add new migrations at the bottom. Never remove old ones.
Each migration is versioned and runs only once.
"""
import sqlite3
import os

DB_FILE = 'classflow.db'
CURRENT_APP_VERSION = "1.0.0"  # Bump this with every release


def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def get_applied_version():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM system_settings WHERE key='app_version'")
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else "0.0.0"
    except:
        return "0.0.0"


def set_version(version):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO system_settings (key, value) VALUES ('app_version', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    """, (version,))
    conn.commit()
    conn.close()


def add_column_if_missing(cursor, table, column, definition):
    """Safe ALTER TABLE — does nothing if column already exists."""
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"  + Added column: {table}.{column}")
    except sqlite3.OperationalError:
        pass  # Column already exists


def run_migrations():
    if not os.path.exists(DB_FILE):
        print("❌ Database not found. Run the app first to create it.")
        return False

    current = get_applied_version()
    print(f"Database version: {current} → Target: {CURRENT_APP_VERSION}")

    conn = get_db()
    cursor = conn.cursor()

    # ----------------------------------------------------------------
    # v1.0.0 — baseline schema (all columns that exist in the app now)
    # ----------------------------------------------------------------
    print("\n[v1.0.0] Ensuring baseline schema...")

    # Students table
    add_column_if_missing(cursor, "students", "gender", "TEXT DEFAULT 'Male'")
    add_column_if_missing(cursor, "students", "division", "TEXT DEFAULT ''")
    add_column_if_missing(cursor, "students", "school_name", "TEXT")
    add_column_if_missing(cursor, "students", "sslc_number", "TEXT DEFAULT NULL")
    add_column_if_missing(cursor, "students", "is_active", "INTEGER DEFAULT 1")
    add_column_if_missing(cursor, "students", "admission_date", "TEXT")
    add_column_if_missing(cursor, "students", "activities", "TEXT DEFAULT NULL")

    # Attendance table
    add_column_if_missing(cursor, "attendance", "session", "TEXT DEFAULT 'Day'")

    # Exams table
    add_column_if_missing(cursor, "exams", "division", "TEXT DEFAULT ''")

    # Alumni table
    add_column_if_missing(cursor, "alumni", "division", "TEXT")
    add_column_if_missing(cursor, "alumni", "school_name", "TEXT")
    add_column_if_missing(cursor, "alumni", "gender", "TEXT DEFAULT 'Male'")

    # Ensure all core tables exist (safe — IF NOT EXISTS)
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS discontinued_students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_student_id INTEGER,
            admission_number TEXT,
            name TEXT,
            class_standard TEXT,
            division TEXT,
            date_left DATE,
            reason TEXT
        );
        CREATE TABLE IF NOT EXISTS alumni (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admission_number TEXT UNIQUE,
            name TEXT,
            last_class TEXT,
            division TEXT,
            school_name TEXT,
            year_graduated TEXT,
            phone TEXT,
            address TEXT,
            photo_path TEXT
        );
        CREATE TABLE IF NOT EXISTS exam_subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            subject_name TEXT NOT NULL,
            max_marks REAL NOT NULL,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (exam_id) REFERENCES exams(id)
        );
        CREATE TABLE IF NOT EXISTS sslc_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admission_number TEXT UNIQUE,
            lang_i TEXT, lang_ii TEXT, english TEXT, hindi TEXT, maths TEXT,
            physics TEXT, chemistry TEXT, biology TEXT, social TEXT, it TEXT,
            FOREIGN KEY (admission_number) REFERENCES students (admission_number)
        );
        CREATE TABLE IF NOT EXISTS library_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            book_name TEXT,
            book_id TEXT,
            issue_date DATE,
            return_date DATE,
            FOREIGN KEY(student_id) REFERENCES students(id)
        );
    """)

    # Default settings
    cursor.execute("INSERT OR IGNORE INTO system_settings (key, value) VALUES ('academic_year', '2025-26')")

    # ----------------------------------------------------------------
    # v1.0.0 includes Drive backup support at launch — no extra migration needed.
    # drive_folder_id and last_drive_backup are written at runtime.
    # ----------------------------------------------------------------

    # ----------------------------------------------------------------
    # ADD FUTURE MIGRATIONS BELOW THIS LINE
    # Example pattern:
    #
    # print("[v1.2.0] Add student_notes column...")
    # add_column_if_missing(cursor, "students", "notes", "TEXT")
    # ----------------------------------------------------------------

    conn.commit()
    conn.close()

    set_version(CURRENT_APP_VERSION)
    print(f"\n✅ Migration complete. Version set to {CURRENT_APP_VERSION}")
    return True


if __name__ == "__main__":
    run_migrations()
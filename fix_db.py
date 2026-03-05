import sqlite3

def fix_database():
    print("🔧 Checking Database Structure...")
    conn = sqlite3.connect("classflow.db")
    cursor = conn.cursor()

    # 1. Add 'session' to attendance table (For Night Shift)
    try:
        cursor.execute("ALTER TABLE attendance ADD COLUMN session TEXT DEFAULT 'Day'")
        print("✅ Added 'session' column.")
    except sqlite3.OperationalError:
        print("ℹ️ 'session' column already exists.")

    # 2. Add 'school_name' to students table (For Admission Page)
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN school_name TEXT")
        print("✅ Added 'school_name' column.")
    except sqlite3.OperationalError:
        print("ℹ️ 'school_name' column already exists.")

    conn.commit()
    conn.close()
    print("🚀 Database Ready!")

if __name__ == "__main__":
    fix_database()
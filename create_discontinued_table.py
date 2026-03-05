import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

try:
    # 1. Create the Archive Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS discontinued_students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_student_id INTEGER,
        admission_number TEXT,
        name TEXT,
        class_standard TEXT,
        division TEXT,
        date_left TEXT,
        reason TEXT,
        FOREIGN KEY(original_student_id) REFERENCES students(id)
    )
    """)
    print("✅ Discontinued Students table created!")

    # 2. Ensure the main students table has an 'is_active' column
    # (We used it in queries before, but let's make sure it defaults to 1)
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN is_active INTEGER DEFAULT 1")
        print("✅ Added 'is_active' column to students.")
    except sqlite3.OperationalError:
        print("ℹ️ 'is_active' column already exists.")

except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
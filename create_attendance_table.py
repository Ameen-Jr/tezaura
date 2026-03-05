import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

try:
    # We store: Student ID, Date, and Status ('Present', 'Absent', 'Late')
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        date TEXT,
        status TEXT,
        FOREIGN KEY(student_id) REFERENCES students(id)
    )
    """)
    print("✅ Attendance table created successfully!")
except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

print("🔧 Resetting Attendance System...")

try:
    # 1. Delete the old table completely
    cursor.execute("DROP TABLE IF EXISTS attendance")
    print("🗑️ Old attendance table deleted.")

    # 2. Re-create it with the exact correct columns
    cursor.execute("""
    CREATE TABLE attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        date TEXT,
        status TEXT, -- 'Present' or 'Absent'
        FOREIGN KEY(student_id) REFERENCES students(id)
    )
    """)
    print("✅ Attendance table rebuilt successfully!")

except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
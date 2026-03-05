import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

print("🔧 Resetting Exam Tables...")

try:
    # 1. Drop the existing broken tables
    cursor.execute("DROP TABLE IF EXISTS marks")
    cursor.execute("DROP TABLE IF EXISTS exams")
    print("🗑️ Old broken tables deleted.")

    # 2. Re-create 'exams' table
    cursor.execute("""
    CREATE TABLE exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        date TEXT,
        class_standard TEXT,
        subject TEXT,
        max_marks REAL
    )
    """)

    # 3. Re-create 'marks' table WITH exam_id
    cursor.execute("""
    CREATE TABLE marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER,       -- This was missing before!
        student_id INTEGER,
        marks_obtained REAL,
        FOREIGN KEY(exam_id) REFERENCES exams(id),
        FOREIGN KEY(student_id) REFERENCES students(id)
    )
    """)
    print("✅ Exam tables rebuilt successfully!")

except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
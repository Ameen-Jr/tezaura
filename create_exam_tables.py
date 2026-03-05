import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

try:
    # 1. Table to store the Exam Definitions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,           -- e.g. "Unit Test 1"
        date TEXT,           -- e.g. "2025-05-20"
        class_standard TEXT, -- e.g. "10"
        subject TEXT,        -- e.g. "Mathematics"
        max_marks REAL       -- e.g. 50 or 100
    )
    """)

    # 2. Table to store the Student Marks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER,
        student_id INTEGER,
        marks_obtained REAL,
        FOREIGN KEY(exam_id) REFERENCES exams(id),
        FOREIGN KEY(student_id) REFERENCES students(id)
    )
    """)
    print("✅ Exam and Marks tables created successfully!")

except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
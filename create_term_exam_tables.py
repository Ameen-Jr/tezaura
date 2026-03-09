import sqlite3

conn = sqlite3.connect("classflow.db")
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS exam_subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER NOT NULL,
        subject_name TEXT NOT NULL,
        max_marks REAL NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (exam_id) REFERENCES exams(id)
    )
""")

conn.commit()
conn.close()
print("✅ exam_subjects table created successfully.")
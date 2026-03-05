import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

try:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS library_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        book_name TEXT,
        book_id TEXT,       -- The unique library number (Accession No)
        issue_date TEXT,
        return_date TEXT DEFAULT NULL, -- NULL means "Not Returned Yet"
        FOREIGN KEY(student_id) REFERENCES students(id)
    )
    """)
    print("✅ Library table created successfully!")

except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
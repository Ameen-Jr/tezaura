import sqlite3

# Connect to (or create) the database file
connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

# --- TABLE 1: STUDENTS ---
students_table = """
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_number TEXT UNIQUE,
    name TEXT NOT NULL,
    class_standard TEXT NOT NULL,
    address TEXT,
    school_name TEXT,
    dob DATE,
    father_name TEXT,
    father_occupation TEXT,
    father_phone TEXT,
    mother_name TEXT,
    mother_occupation TEXT,
    mother_phone TEXT,
    whatsapp_number TEXT,
    bus_stop TEXT,
    panchayat TEXT,
    remarks TEXT,
    photo_path TEXT,
    is_active BOOLEAN DEFAULT 1
);
"""

# --- TABLE 2: FEES ---
fees_table = """
CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    month_year TEXT,
    amount REAL,
    date_paid DATE,
    FOREIGN KEY (student_id) REFERENCES students (id)
);
"""

# --- TABLE 3: MARKS ---
marks_table = """
CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    exam_name TEXT,
    subject TEXT,
    marks_obtained REAL,
    total_marks REAL,
    FOREIGN KEY (student_id) REFERENCES students (id)
);
"""

# --- TABLE 4: ATTENDANCE ---
attendance_table = """
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    date DATE,
    status TEXT,
    FOREIGN KEY (student_id) REFERENCES students (id)
);
"""

# Execute the creation commands
cursor.execute(students_table)
cursor.execute(fees_table)
cursor.execute(marks_table)
cursor.execute(attendance_table)

connection.commit()
connection.close()

print("Success: Database 'classflow.db' created inside 'classFlow' folder.")
import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

# --- TABLE 1: STUDENTS ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_number TEXT UNIQUE,
    name TEXT NOT NULL,
    class_standard TEXT NOT NULL,
    division TEXT DEFAULT '',
    gender TEXT DEFAULT 'Male',
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
    sslc_number TEXT,
    photo_path TEXT,
    is_active BOOLEAN DEFAULT 1,
    admission_date DATE
)
""")

# --- TABLE 2: FEES ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    month_year TEXT,
    amount REAL,
    date_paid DATE,
    FOREIGN KEY (student_id) REFERENCES students (id)
)
""")

# --- TABLE 3: MARKS ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER,
    student_id INTEGER,
    marks_obtained REAL,
    FOREIGN KEY (exam_id) REFERENCES exams (id),
    FOREIGN KEY (student_id) REFERENCES students (id)
)
""")

# --- TABLE 4: ATTENDANCE ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    date DATE,
    status TEXT,
    session TEXT DEFAULT 'Day',
    FOREIGN KEY (student_id) REFERENCES students (id)
)
""")

# --- TABLE 5: EXAMS ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    date DATE,
    class_standard TEXT,
    division TEXT DEFAULT '',
    subject TEXT,
    max_marks REAL
)
""")

# --- TABLE 6: EXAM SUBJECTS ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS exam_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER,
    subject_name TEXT,
    max_marks REAL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams (id)
)
""")

# --- TABLE 7: LIBRARY RECORDS ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS library_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    book_name TEXT,
    book_id TEXT,
    issue_date DATE,
    return_date DATE,
    FOREIGN KEY (student_id) REFERENCES students (id)
)
""")

# --- TABLE 8: DISCONTINUED STUDENTS ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS discontinued_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_student_id INTEGER,
    admission_number TEXT,
    name TEXT,
    class_standard TEXT,
    division TEXT,
    date_left DATE,
    reason TEXT
)
""")

# --- TABLE 9: ALUMNI ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS alumni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_number TEXT UNIQUE,
    name TEXT,
    last_class TEXT,
    year_graduated TEXT,
    phone TEXT,
    address TEXT,
    photo_path TEXT
)
""")

# --- TABLE 10: SYSTEM SETTINGS ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
)
""")

# --- DEFAULT SETTINGS ---
cursor.execute("""
INSERT OR IGNORE INTO system_settings (key, value) 
VALUES ('academic_year', '2025-26')
""")

# --- TABLE 11: SSLC RESULTS ---
cursor.execute("""
CREATE TABLE IF NOT EXISTS sslc_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_number TEXT UNIQUE,
    lang_i TEXT,
    lang_ii TEXT,
    english TEXT,
    hindi TEXT,
    maths TEXT,
    physics TEXT,
    chemistry TEXT,
    biology TEXT,
    social TEXT,
    it TEXT,
    FOREIGN KEY (admission_number) REFERENCES students (admission_number)
)
""")

connection.commit()
connection.close()

print("✅ Database 'classflow.db' created with full schema.")
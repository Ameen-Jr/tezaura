import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

print("🔧 Updating Database for Admission History...")

try:
    # Add the new column 'admission_date'
    cursor.execute("ALTER TABLE students ADD COLUMN admission_date TEXT")
    print("✅ Added 'admission_date' column.")
except sqlite3.OperationalError:
    print("ℹ️ Column 'admission_date' already exists.")

# Optional: Set a default date for existing students so the column isn't empty
cursor.execute("UPDATE students SET admission_date = '2024-01-01' WHERE admission_date IS NULL")

connection.commit()
connection.close()
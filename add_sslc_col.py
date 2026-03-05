import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

try:
    cursor.execute("ALTER TABLE students ADD COLUMN sslc_number TEXT DEFAULT NULL")
    print("✅ SSLC Column added successfully!")
except sqlite3.OperationalError:
    print("ℹ️ Column already exists.")

connection.commit()
connection.close()
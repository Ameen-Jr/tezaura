import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

try:
    cursor.execute("ALTER TABLE students ADD COLUMN gender TEXT DEFAULT 'Male'")
    cursor.execute("ALTER TABLE students ADD COLUMN division TEXT DEFAULT ''")
    print("✅ Gender and Division columns added successfully!")
except sqlite3.OperationalError:
    print("ℹ️ Columns likely already exist.")

connection.commit()
connection.close()
import sqlite3

conn = sqlite3.connect("classflow.db")
cursor = conn.cursor()

cursor.execute("ALTER TABLE exams ADD COLUMN division TEXT DEFAULT ''")

conn.commit()
conn.close()
print("✅ division column added to exams table.")
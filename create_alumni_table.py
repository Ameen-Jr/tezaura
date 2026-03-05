import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

try:
    # The Alumni table mirrors the Student table but adds 'year_graduated'
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alumni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_number TEXT UNIQUE,
        name TEXT,
        last_class TEXT,       -- e.g. "10"
        year_graduated TEXT,   -- e.g. "2025"
        phone TEXT,
        address TEXT,
        photo_path TEXT
    )
    """)
    print("✅ Alumni table created successfully!")

except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
import sqlite3
conn = sqlite3.connect("classflow.db")
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE alumni ADD COLUMN division TEXT")
    print("✅ Added division column")
except:
    print("⚠️ division column already exists")
try:
    cursor.execute("ALTER TABLE alumni ADD COLUMN school_name TEXT")
    print("✅ Added school_name column")
except:
    print("⚠️ school_name column already exists")
conn.commit()
conn.close()
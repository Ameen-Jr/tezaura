import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

print("🔧 Setting up System Settings...")

try:
    # 1. Create table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)
    
    # 2. Set default Academic Year (if not exists)
    # We default to '2025-26' because the current date is Dec 2025.
    cursor.execute("SELECT value FROM system_settings WHERE key='academic_year'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO system_settings (key, value) VALUES ('academic_year', '2025-26')")
        print("✅ Set initial Academic Year to 2025-26")
    else:
        print("ℹ️ Academic Year is already set.")

except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
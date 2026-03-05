import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

print("🔧 Updating Academic Year...")

try:
    # This command forces the year to be 2025-26, regardless of what it was before
    cursor.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('academic_year', '2025-26')")
    print("✅ Academic Year successfully set to: 2025-26")

except Exception as e:
    print(f"❌ Error: {e}")

connection.commit()
connection.close()
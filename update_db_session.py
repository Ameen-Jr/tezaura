import sqlite3

connection = sqlite3.connect('classflow.db')
cursor = connection.cursor()

print("🔧 Updating Database for Night Shifts...")

try:
    # Add 'session' column, defaulting to 'Day'
    cursor.execute("ALTER TABLE attendance ADD COLUMN session TEXT DEFAULT 'Day'")
    print("✅ Added 'session' column successfully.")
except Exception as e:
    print(f"ℹ️ Note: {e}")

connection.commit()
connection.close()
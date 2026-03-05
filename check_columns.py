import sqlite3

# Connect to your database
conn = sqlite3.connect('classflow.db')
cursor = conn.cursor()

# Get column names for 'fees' table
print("--- FEES TABLE COLUMNS ---")
try:
    cursor.execute("PRAGMA table_info(fees)")
    columns = cursor.fetchall()
    for col in columns:
        print(col[1]) # Print column name
except:
    print("Table 'fees' not found!")

conn.close()
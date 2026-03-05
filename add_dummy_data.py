import sqlite3
import random

def add_test_data():
    conn = sqlite3.connect('classflow.db')
    cursor = conn.cursor()

    # 1. Find an existing student
    cursor.execute("SELECT admission_number, class_standard, division FROM students LIMIT 1")
    student = cursor.fetchone()

    if not student:
        print("❌ No students found! Please add a student in the app first.")
        return

    adm_no, cls, div = student
    print(f"✅ Found Student: ID {adm_no} (Class {cls} {div})")

    # 2. Insert Dummy Fees for this student (April to March)
    months = [
        ("2025-04-10", 5000), ("2025-05-12", 4500), 
        ("2025-06-15", 4500), ("2025-07-20", 5000),
        ("2025-08-10", 5500), ("2025-09-05", 6000),
        ("2025-10-12", 5000), ("2025-11-15", 5500),
        ("2025-12-20", 7000)
    ]

    print("--- Inserting Data ---")
    for date_paid, amount in months:
        # Check if record exists to avoid duplicates
        cursor.execute("SELECT id FROM fees WHERE student_id = ? AND date_paid = ?", (adm_no, date_paid))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO fees (student_id, amount, date_paid, month_year) 
                VALUES (?, ?, ?, ?)
            """, (adm_no, amount, date_paid, "Monthly Fee"))
            print(f"   Added fee: ₹{amount} on {date_paid}")
        else:
            print(f"   Skipped (already exists): {date_paid}")

    conn.commit()
    conn.close()
    print("\n✅ Success! Data added. Now REFRESH your dashboard.")

if __name__ == "__main__":
    add_test_data()
import sqlite3

def create_sslc_table():
    print("🔧 Creating SSLC Results Table...")
    conn = sqlite3.connect("classflow.db")
    cursor = conn.cursor()

    # Create table with columns for all 10 subjects
    sql = """
    CREATE TABLE IF NOT EXISTS sslc_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_number TEXT UNIQUE,
        lang_i TEXT,
        lang_ii TEXT,
        english TEXT,
        hindi TEXT,
        maths TEXT,
        physics TEXT,
        chemistry TEXT,
        biology TEXT,
        social TEXT,
        it TEXT
    )
    """
    try:
        cursor.execute(sql)
        print("✅ SSLC Table Created Successfully.")
    except Exception as e:
        print(f"❌ Error: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_sslc_table()
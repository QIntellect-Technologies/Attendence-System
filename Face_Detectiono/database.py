import sqlite3
import numpy as np
import io

# ==========================================
# SQLITE HELPER FOR ARRAY STORAGE
# SQLite doesn't have a native array type, 
# so we store the numpy arrays as bytes
# ==========================================
def adapt_array(arr):
    out = io.BytesIO()
    np.save(out, arr)
    out.seek(0)
    return sqlite3.Binary(out.read())

def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)

# Register the adapters
sqlite3.register_adapter(np.ndarray, adapt_array)
sqlite3.register_converter("ARRAY", convert_array)

def init_db(db_path="attendance.db"):
    """Creates the employees table if it does not exist."""
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
    cursor = conn.cursor()
    
    # Store the 512-dim embedding as a binary blob (ARRAY type via adapter)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            emp_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT,
            embedding ARRAY NOT NULL,
            status TEXT DEFAULT 'active'
        )
    ''')
    
    # Optional table to log attendances
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(emp_id) REFERENCES employees(emp_id)
        )
    ''')
    conn.commit()
    conn.close()
    print("Database initialized successfully.")
    
def insert_employee(emp_id, name, department, embedding, db_path="attendance.db"):
    conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
    cursor = conn.cursor()
    # Use REPLACE to handle updates (e.g. re-enrollment replaces old vector)
    cursor.execute('''
        INSERT OR REPLACE INTO employees (emp_id, name, department, embedding, status)
        VALUES (?, ?, ?, ?, 'active')
    ''', (emp_id, name, department, embedding))
    conn.commit()
    conn.close()
    print(f"[{name}] inserted/updated in database successfully.")

def get_all_active_employees(db_path="attendance.db"):
    """Returns a list of tuples: (emp_id, name, embedding_array)"""
    conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
    cursor = conn.cursor()
    cursor.execute("SELECT emp_id, name, embedding FROM employees WHERE status='active'")
    results = cursor.fetchall()
    conn.close()
    return results

def log_attendance(emp_id, db_path="attendance.db"):
    """Logs the attendance event in the database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO attendance_logs (emp_id) VALUES (?)", (emp_id,))
    conn.commit()
    conn.close()

def delete_employee(emp_id, db_path="attendance.db"):
    """Soft deletes an employee by setting status to inactive."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE employees SET status='inactive' WHERE emp_id=?", (emp_id,))
    conn.commit()
    conn.close()
    print(f"[DATABASE] Employee {emp_id} marked as inactive.")


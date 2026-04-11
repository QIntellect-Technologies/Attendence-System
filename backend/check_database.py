import sqlite3
from datetime import datetime
import os

# Database Path
db_path = "attendance.db"  # agar alag folder mein hai to pura path likho

print("🔍 DATABASE CHECK TOOL\n")

# Check if database file exists
if not os.path.exists(db_path):
    print(f"❌ Database file '{db_path}' not found!")
    print("   Pehle enrollment karo taaki table ban jaye.")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# ====================== CREATE TABLE IF NOT EXISTS ======================
cursor.execute(
    """
    CREATE TABLE IF NOT EXISTS employees (
        emp_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        embedding ARRAY,
        status TEXT DEFAULT 'active',
        created_at TEXT,
        updated_at TEXT
    )
"""
)

print("✅ Table 'employees' checked/created successfully.\n")

# ====================== TOTAL COUNTS ======================
cursor.execute("SELECT COUNT(*) FROM employees")
total = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM employees WHERE status='active'")
active = cursor.fetchone()[0]

print(f"📊 Total Staff Registered     : {total}")
print(f"✅ Active Staff               : {active}")
print(f"⛔ Inactive Staff            : {total - active}\n")

# ====================== ALL EMPLOYEES DATA ======================
if total == 0:
    print("⚠️ No employees found in database yet.")
    print("   Pehle kisi employee ko enroll karo (video se).")
else:
    print("📋 ALL EMPLOYEES DETAILS:")
    print("=" * 90)
    print(
        f"{'Emp ID':<12} {'Name':<25} {'Department':<15} {'Status':<10} {'Created At':<20}"
    )
    print("=" * 90)

    cursor.execute(
        """
        SELECT emp_id, name, department, status, created_at 
        FROM employees 
        ORDER BY name
    """
    )

    rows = cursor.fetchall()

    for row in rows:
        emp_id, name, dept, status, created = row
        if created:
            try:
                created = datetime.fromisoformat(created).strftime("%Y-%m-%d %H:%M")
            except:
                created = created[:16] if created else "N/A"
        else:
            created = "N/A"

        print(f"{emp_id:<12} {name:<25} {dept:<15} {status:<10} {created}")

    print("=" * 90)
    print(f"Total Records: {len(rows)}")

# ====================== ATTENDANCE TABLE CHECK ======================
try:
    cursor.execute("SELECT COUNT(*) FROM Attendance")
    att_count = cursor.fetchone()[0]
    print(f"\n📅 Total Attendance Records : {att_count}")
except sqlite3.OperationalError:
    print("\n⚠️ Attendance table not created yet.")

conn.close()
print("\n✅ Database check completed successfully!")

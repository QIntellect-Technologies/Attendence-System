from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# ====================== INITIALIZE DB ======================
db = SQLAlchemy()


# ====================== MODELS ======================
class User(db.Model, UserMixin):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    cnic = db.Column(db.String(15), unique=True, nullable=True)
    phone = db.Column(db.String(20))
    department = db.Column(db.String(50))
    duty_start = db.Column(db.String(5), default="09:00")
    duty_end = db.Column(db.String(5), default="18:00")
    salary = db.Column(db.Float, default=50000.0)
    face_encoding = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    date_joined = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Attendance(db.Model):
    __tablename__ = "attendance"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    user_name = db.Column(db.String(100))
    date = db.Column(db.Date, nullable=False)
    check_in = db.Column(db.DateTime)
    check_out = db.Column(db.DateTime)
    total_hours = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default="ABSENT")
    marked_by = db.Column(db.String(20))
    remarks = db.Column(db.Text)

    __table_args__ = (db.UniqueConstraint("user_id", "date"),)


class LeaveRequest(db.Model):
    __tablename__ = "leave_request"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    staff_name = db.Column(db.String(100))
    department = db.Column(db.String(50), default="General")
    leave_type = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days_requested = db.Column(db.Integer)
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), default="Pending")
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_by = db.Column(db.String(100))


class Overtime(db.Model):
    __tablename__ = "overtime"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    hours = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), default="Pending")
    approved_by = db.Column(db.String(100))


class SalaryConfig(db.Model):
    __tablename__ = "salary_config"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=True
    )  # ← Important: nullable=True

    staff_name = db.Column(db.String(100), nullable=False)
    emp_id = db.Column(db.String(50), unique=True, nullable=False)
    designation = db.Column(db.String(100), nullable=True)

    basic_salary = db.Column(db.Float, nullable=False)
    allowances = db.Column(db.JSON, default=list)
    deductions = db.Column(db.JSON, default=list)

    overtime_rate = db.Column(db.Float, default=1.5)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "staffName": self.staff_name,
            "empId": self.emp_id,
            "designation": self.designation,
            "baseSalary": float(self.basic_salary),
            "allowances": self.allowances or [],
            "deductions": self.deductions or [],
            "approvedOTHours": 0,
        }


class StaffVerification(db.Model):
    __tablename__ = "staff_verification"
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.String(50), nullable=False)
    staff_name = db.Column(db.String(100), nullable=False)
    video_filename = db.Column(db.String(255), nullable=False)
    video_path = db.Column(db.String(255), nullable=False)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="Completed")


# ====================== DATABASE INITIALIZATION ======================
def init_db(app):
    """Initialize database and apply schema fixes"""
    db.init_app(app)

    with app.app_context():
        db.create_all()
        print("🔄 Checking database schema...")

        # ====================== SALARY CONFIG TABLE FIX ======================
        try:
            inspector = db.inspect(db.engine)
            salary_columns = [
                col["name"] for col in inspector.get_columns("salary_config")
            ]

            needs_recreate = (
                "staff_name" not in salary_columns
                or "emp_id" not in salary_columns
                or "allowances" not in salary_columns
            )

            # Extra check for user_id NOT NULL constraint (SQLite specific)
            if not needs_recreate:
                try:
                    result = db.engine.execute(
                        db.text("PRAGMA table_info(salary_config)")
                    ).fetchall()
                    for col in result:
                        if (
                            col[1] == "user_id" and col[3] == 1
                        ):  # col[3] == 1 means NOT NULL
                            needs_recreate = True
                            print(
                                "⚠️  user_id column is still NOT NULL. Table will be recreated..."
                            )
                            break
                except:
                    pass

            if needs_recreate:
                print("🔄 Recreating SalaryConfig table to fix user_id constraint...")
                with db.engine.connect() as conn:
                    conn.execute(db.text("DROP TABLE IF EXISTS salary_config"))
                db.create_all()
                print(
                    "✅ SalaryConfig table recreated successfully with nullable user_id!"
                )
            else:
                print("✅ SalaryConfig table is already up to date.")

        except Exception as e:
            print(f"⚠️ SalaryConfig migration warning: {e}")
            # Fallback recreate
            try:
                with db.engine.connect() as conn:
                    conn.execute(db.text("DROP TABLE IF EXISTS salary_config"))
                db.create_all()
                print("✅ SalaryConfig table recreated via fallback!")
            except Exception as fallback_e:
                print(f"❌ Fallback failed: {fallback_e}")

        # User table optional columns migration
        try:
            inspector = db.inspect(db.engine)
            user_columns = [col["name"] for col in inspector.get_columns("user")]

            if "cnic" not in user_columns:
                with db.engine.connect() as conn:
                    conn.execute(
                        db.text("ALTER TABLE user ADD COLUMN cnic VARCHAR(15)")
                    )
                print("✅ Added missing column: cnic")

            if "phone" not in user_columns:
                with db.engine.connect() as conn:
                    conn.execute(
                        db.text("ALTER TABLE user ADD COLUMN phone VARCHAR(20)")
                    )
                print("✅ Added missing column: phone")

            if "department" not in user_columns:
                with db.engine.connect() as conn:
                    conn.execute(
                        db.text("ALTER TABLE user ADD COLUMN department VARCHAR(50)")
                    )
                print("✅ Added missing column: department")

            if "is_active" not in user_columns:
                with db.engine.connect() as conn:
                    conn.execute(
                        db.text(
                            "ALTER TABLE user ADD COLUMN is_active BOOLEAN DEFAULT 1"
                        )
                    )
                print("✅ Added missing column: is_active")

        except Exception as e:
            print(f"User migration warning: {e}")

        print("✅ Database initialization completed successfully!")


import os

# ====================== ULTIMATE RESET FUNCTION (Fixed & Final) ======================
def ultimate_salary_reset(app):
    """Puri SalaryConfig table delete karke fresh create karta hai"""
    if not app:
        print("❌ App object missing!")
        return

    with app.app_context():
        print("🗑️  Ultimate SalaryConfig Reset Starting...")

        try:
            with db.engine.connect() as conn:
                conn.execute(db.text("PRAGMA foreign_keys = OFF"))
                conn.execute(db.text("DROP TABLE IF EXISTS salary_config"))
                conn.execute(db.text("PRAGMA foreign_keys = ON"))
            
            db.create_all()
            
            print("✅ SalaryConfig table completely recreated with correct schema!")
            print("   → user_id is now nullable=True")

            # Fixed Confirm Check
            with db.engine.connect() as conn:
                result = conn.execute(db.text("PRAGMA table_info(salary_config)")).fetchall()
                for col in result:
                    if col[1] == "user_id":
                        nullable_status = "YES (nullable)" if col[3] == 0 else "NO (NOT NULL)"
                        print(f"   user_id status → {nullable_status}")
                        break

        except Exception as e:
            print(f"❌ Ultimate reset failed: {e}")
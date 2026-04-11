import os
from flask import Flask
from models import db, ultimate_salary_reset  # ← ab yeh import hoga


def create_app_for_reset():
    app = Flask(__name__)
    basedir = os.path.abspath(os.path.dirname(__file__))

    # Exact same database path jo app.py mein hai
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"sqlite:///{os.path.join(basedir, 'instance', 'attendance.db')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    return app


if __name__ == "__main__":
    print("🚀 Starting ULTIMATE SalaryConfig Reset...")
    app = create_app_for_reset()
    ultimate_salary_reset(app)
    print("\n✅ Reset Completed Successfully!")
    print("Ab pura backend server band karke phir se start karo (python app.py)")

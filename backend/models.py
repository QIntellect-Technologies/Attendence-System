from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' or 'staff'
    cnic = db.Column(db.String(20))
    duty_start = db.Column(db.String(5))
    duty_end = db.Column(db.String(5))

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    in_time = db.Column(db.DateTime)
    out_time = db.Column(db.DateTime)
    hours_worked = db.Column(db.Float)
    status = db.Column(db.String(20), default="Present")
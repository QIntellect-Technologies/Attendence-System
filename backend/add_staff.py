# add_staff.py
from app import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    # Purana user delete kar do agar hai (duplicate na ho)
    old_user = User.query.filter_by(email="ali@staff.com").first()
    if old_user:
        db.session.delete(old_user)
        db.session.commit()
        print("Old user deleted (if existed).")

    # Naya staff user add karo
    new_staff = User(
        name="Ali Khan",
        email="ali@staff.com",
        password_hash=generate_password_hash("staff123", method='pbkdf2:sha256'),
        role="staff",
        cnic="35202-1234567-8",
        duty_start="09:00",
        duty_end="18:00"
    )
    db.session.add(new_staff)
    db.session.commit()

    print("New staff added successfully!")
    print("Email:", new_staff.email)
    print("Password:", "staff123")
    print("Role:", new_staff.role)
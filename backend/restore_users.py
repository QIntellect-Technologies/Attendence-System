import os
from app import app, db, User, generate_password_hash


def restore_employees_from_images():
    path = "known_faces"
    with app.app_context():
        # Check karein agar images folder maujood hai
        if not os.path.exists(path):
            print("Error: known_faces folder nahi mila!")
            return

        for filename in os.listdir(path):
            if filename.lower().endswith((".jpg", ".jpeg", ".png")):
                # Filename se employee ka naam nikalna
                emp_name = os.path.splitext(filename)[0].replace("_", " ")

                # Check karein agar employee pehle se database mein hai
                existing_user = User.query.filter_by(name=emp_name).first()

                if not existing_user:
                    # Naya employee data create karna (Default settings ke sath)
                    new_user = User(
                        name=emp_name,
                        email=f"{emp_name.replace(' ', '').lower()}@qintellect.com",
                        password_hash=generate_password_hash("staff123"),
                        role="Staff",
                        department="Engineering",
                        salary=50000.0,
                    )
                    db.session.add(new_user)
                    print(f"Restored: {emp_name}")

        db.session.commit()
        print("--- All Employees Restored to Database ---")


if __name__ == "__main__":
    restore_employees_from_images()

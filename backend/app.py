import cv2
import face_recognition
import numpy as np
import os
from datetime import datetime, timedelta
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import threading
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func
import base64
import time

app = Flask(__name__)

# --- CORS Setup ---
CORS(
    app,
    resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "supports_credentials": True,
        }
    },
)

# Database Setup
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///attendance.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="staff")
    duty_start = db.Column(db.String(10), default="09:00")
    duty_end = db.Column(db.String(10), default="18:00")
    salary = db.Column(db.Float, default=50000.0)
    department = db.Column(db.String(50), default="General")
    phone = db.Column(db.String(20), default="")


class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    check_in = db.Column(db.DateTime, nullable=True)
    check_out = db.Column(db.DateTime, nullable=True)
    total_hours = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default="ABSENT")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


# NEW: Leave Request Model (for staff apply + admin approve/reject)
class LeaveRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(50), default="General")
    leave_type = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days_requested = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), default="Pending")  # Pending, Approved, Rejected
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_by = db.Column(db.String(100), nullable=True)


# IMPORTANT: Sirf pehli baar chalana hai – phir comment kar dena
with app.app_context():
    db.create_all()
    print("All tables created including LeaveRequest!")


# Global States
last_detected_name = "Unknown"
last_detected_action = "none"
last_location = "Main Entrance"
last_pose = "None"
last_update_time = "--:--:--"
db_lock = threading.Lock()


def get_shift_category(start_time):
    try:
        hour = int(start_time.split(":")[0])
        if 5 <= hour < 12:
            return "Morning Shift"
        elif 12 <= hour < 18:
            return "Evening Shift"
        else:
            return "Night Shift"
    except:
        return "Morning Shift"


# --- Face Recognition Setup ---
known_face_encodings = []
known_face_names = []


def load_staff_faces():
    path = "known_faces"
    if not os.path.exists(path):
        os.makedirs(path)

    new_encodings = []
    new_names = []

    with app.app_context():
        for filename in os.listdir(path):
            if filename.lower().endswith((".jpg", ".jpeg", ".png")):
                try:
                    img_path = os.path.join(path, filename)
                    img = face_recognition.load_image_file(img_path)
                    enc = face_recognition.face_encodings(img)
                    if enc:
                        emp_name = os.path.splitext(filename)[0].replace("_", " ")
                        new_encodings.append(enc[0])
                        new_names.append(emp_name)

                        if not User.query.filter_by(name=emp_name).first():
                            db.session.add(
                                User(
                                    name=emp_name,
                                    email=f"{emp_name.replace(' ', '').lower()}@company.com",
                                    password_hash=generate_password_hash("staff123"),
                                    role="staff",
                                    phone="",
                                )
                            )
                except Exception as e:
                    print(f"Error loading face {filename}: {e}")
        db.session.commit()

    global known_face_encodings, known_face_names
    known_face_encodings = new_encodings
    known_face_names = new_names
    print(f"Loaded {len(known_face_names)} known faces.")


load_staff_faces()


# --- Camera Threading ---
CCTV_URL = "rtsp://admin:admin1122@192.168.0.199:554/Streaming/Channels/302"
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
    "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|stimeout;5000000"
)


class CameraStream:
    def __init__(self, url):
        self.stream = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
        self.url = url
        self.frame = None
        self.running = True
        self.lock = threading.Lock()

    def update(self):
        while self.running:
            success, frame = self.stream.read()
            if not success:
                print("Camera disconnected, reconnecting...")
                self.stream.release()
                time.sleep(2)
                self.stream = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)
                continue
            with self.lock:
                self.frame = frame

    def read(self):
        with self.lock:
            return self.frame is not None, self.frame

    def start(self):
        t = threading.Thread(target=self.update, daemon=True)
        t.start()
        return self


cctv = CameraStream(CCTV_URL).start()


# --- RECOGNITION LOGIC ---
def generate_frames():
    global last_detected_name, last_detected_action, last_location, last_pose, last_update_time
    process_this_frame = 0
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    while True:
        success, frame = cctv.read()
        if not success:
            time.sleep(0.1)
            continue

        process_this_frame += 1
        if process_this_frame % 3 == 0:
            scale_factor = 0.5
            small_frame = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor)

            gaussian_3 = cv2.GaussianBlur(small_frame, (0, 0), 2.0)
            small_frame = cv2.addWeighted(small_frame, 1.5, gaussian_3, -0.5, 0)
            lab = cv2.cvtColor(small_frame, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            l = clahe.apply(l)
            small_frame = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

            face_locs = face_recognition.face_locations(rgb_small_frame, model="hog")
            face_encs = face_recognition.face_encodings(rgb_small_frame, face_locs)

            found_in_frame = False
            for (top, right, bottom, left), face_enc in zip(face_locs, face_encs):
                matches = face_recognition.compare_faces(
                    known_face_encodings, face_enc, tolerance=0.45
                )
                name = "Unknown"

                if True in matches:
                    name = known_face_names[matches.index(True)]
                    found_in_frame = True
                    last_detected_name = name
                    last_location = "Main Entrance"
                    last_pose = "Standing"
                    last_update_time = datetime.now().strftime("%H:%M:%S")

                    with app.app_context():
                        with db_lock:
                            today = datetime.now().date()
                            now = datetime.now()
                            record = Attendance.query.filter_by(
                                user_name=name, date=today
                            ).first()

                            if record is None:
                                db.session.add(
                                    Attendance(
                                        user_name=name,
                                        date=today,
                                        check_in=now,
                                        status="PRESENT",
                                    )
                                )
                                last_detected_action = "checkin"
                            elif (
                                record.check_out is None
                                and now > record.check_in + timedelta(minutes=2)
                            ):
                                record.check_out = now
                                record.total_hours = (
                                    now - record.check_in
                                ).total_seconds() / 3600.0
                                record.status = "COMPLETED"
                                last_detected_action = "checkout"
                            db.session.commit()

                inv_scale = int(1 / scale_factor)
                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                cv2.rectangle(
                    frame,
                    (left * inv_scale, top * inv_scale),
                    (right * inv_scale, bottom * inv_scale),
                    color,
                    2,
                )
                cv2.putText(
                    frame,
                    name,
                    (left * inv_scale, top * inv_scale - 10),
                    cv2.FONT_HERSHEY_DUPLEX,
                    0.8,
                    (255, 255, 255),
                    1,
                )

            if not found_in_frame:
                last_detected_name = "Unknown"
                last_detected_action = "none"
                last_pose = "None"

        ret, buffer = cv2.imencode(".jpg", frame)
        if ret:
            yield (
                b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                + buffer.tobytes()
                + b"\r\n"
            )


# --- API Routes ---


@app.route("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "faces_loaded": len(known_face_names),
            "timestamp": datetime.now().isoformat(),
        }
    )


@app.route("/add_staff", methods=["POST", "OPTIONS"])
def add_staff():
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        name = data.get("name")
        if not name:
            return jsonify({"status": "error", "message": "Name is required"}), 400

        existing = User.query.filter_by(name=name).first()
        if existing:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Staff with this name already exists",
                    }
                ),
                409,
            )

        new_user = User(
            name=name,
            email=data.get("email", f"{name.replace(' ', '').lower()}@company.com"),
            password_hash=generate_password_hash(data.get("password", "staff123")),
            role=data.get("position", data.get("role", "staff")),
            department=data.get("department", "General"),
            duty_start=data.get("shiftStart", "09:00"),
            duty_end=data.get("shiftEnd", "18:00"),
            salary=float(data.get("salary") or 50000.0),
            phone=data.get("phone", ""),
        )
        db.session.add(new_user)
        db.session.commit()

        if data.get("image"):
            try:
                img_data = data["image"].split(",")[1]
                img_path = f"known_faces/{name.replace(' ', '_')}.jpg"
                with open(img_path, "wb") as f:
                    f.write(base64.b64decode(img_data))
                load_staff_faces()
            except Exception as img_err:
                print(f"Image save failed for {name}: {img_err}")

        return (
            jsonify({"status": "success", "message": "Staff added", "id": new_user.id}),
            201,
        )

    except Exception as e:
        db.session.rollback()
        print(f"Add staff error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/update_staff/<int:staff_id>", methods=["POST", "PUT", "OPTIONS"])
def update_staff(staff_id):
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        user = db.session.get(User, staff_id)
        if not user:
            return jsonify({"status": "error", "message": "Staff not found"}), 404

        user.name = data.get("name", user.name)
        user.email = data.get("email", user.email)
        user.role = data.get("role", user.role)
        user.department = data.get("department", user.department)
        user.duty_start = data.get(
            "duty_start", data.get("shiftStart", user.duty_start)
        )
        user.duty_end = data.get("duty_end", data.get("shiftEnd", user.duty_end))
        user.phone = data.get("phone", user.phone)

        if "password" in data and data["password"]:
            user.password_hash = generate_password_hash(data["password"])

        if "salary" in data:
            try:
                user.salary = float(data["salary"])
            except ValueError:
                print(f"Invalid salary for {staff_id}: {data.get('salary')}")

        db.session.commit()
        load_staff_faces()
        return jsonify({"status": "success", "message": "Staff updated"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Update staff error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/delete_staff/<int:staff_id>", methods=["DELETE", "OPTIONS"])
def delete_staff(staff_id):
    if request.method == "OPTIONS":
        return "", 200

    try:
        user = db.session.get(User, staff_id)
        if not user:
            return jsonify({"status": "error", "message": "Staff not found"}), 404

        img_path = f"known_faces/{user.name.replace(' ', '_')}.jpg"
        if os.path.exists(img_path):
            os.remove(img_path)

        db.session.delete(user)
        db.session.commit()

        load_staff_faces()
        return jsonify({"status": "success", "message": "Staff deleted"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Delete staff error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/get_staff_list")
def get_staff_list():
    try:
        users = User.query.all()
        result = []
        for u in users:
            present_count = Attendance.query.filter(
                Attendance.user_name == u.name,
                Attendance.status.in_(["PRESENT", "COMPLETED"]),
            ).count()
            result.append(
                {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "position": u.role,
                    "department": u.department,
                    "salary": u.salary,
                    "shift": get_shift_category(u.duty_start),
                    "shiftStart": u.duty_start,
                    "shiftEnd": u.duty_end,
                    "phone": u.phone or "",
                    "present_days": present_count,
                }
            )
        return jsonify(result)
    except Exception as e:
        print(f"Get staff list error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/get_staff_by_name")
def get_staff_by_name():
    try:
        name = request.args.get("name")
        if not name:
            return jsonify({"error": "Name parameter required"}), 400

        user = User.query.filter(func.lower(User.name) == func.lower(name)).first()
        if not user:
            return jsonify({"error": "Staff not found"}), 404

        return jsonify(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "position": user.role,
                "department": user.department,
                "salary": user.salary,
                "shiftStart": user.duty_start,
                "shiftEnd": user.duty_end,
                "shift": get_shift_category(user.duty_start),
                "phone": user.phone or "",
            }
        )
    except Exception as e:
        print(f"Get staff by name error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/get_attendance_by_name")
def get_attendance_by_name():
    try:
        name = request.args.get("name")
        if not name:
            return jsonify({"error": "Name parameter required"}), 400

        records = (
            Attendance.query.filter(
                func.lower(Attendance.user_name) == func.lower(name)
            )
            .order_by(Attendance.date.desc())
            .all()
        )
        result = []
        for r in records:
            result.append(
                {
                    "date": r.date.isoformat(),
                    "time": r.check_in.strftime("%H:%M:%S") if r.check_in else None,
                    "outTime": (
                        r.check_out.strftime("%H:%M:%S") if r.check_out else None
                    ),
                    "workDuration": (
                        f"{r.total_hours:.2f} hrs"
                        if r.total_hours > 0
                        else "In Progress"
                    ),
                    "status": r.status,
                }
            )
        return jsonify(result)
    except Exception as e:
        print(f"Get attendance by name error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/get_detected_name")
def get_detected_name():
    return jsonify(
        {
            "name": last_detected_name,
            "action": last_detected_action,
            "location": (
                last_location if last_detected_name != "Unknown" else "Scanning..."
            ),
            "pose": last_pose,
            "building": "Building A",
            "timestamp": last_update_time,
            "status": "ACTIVE" if last_detected_name != "Unknown" else "IDLE",
        }
    )


@app.route("/video_feed")
def video_feed():
    return Response(
        generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/get_attendance_today")
def get_attendance_today():
    try:
        today = datetime.now().date()
        records = Attendance.query.filter(Attendance.date == today).all()

        result = []
        for r in records:
            result.append(
                {
                    "id": r.id,
                    "name": r.user_name,
                    "time": r.check_in.strftime("%H:%M:%S") if r.check_in else None,
                    "outTime": (
                        r.check_out.strftime("%H:%M:%S") if r.check_out else None
                    ),
                    "workDuration": (
                        f"{r.total_hours:.2f} hrs"
                        if r.total_hours > 0
                        else "In Progress"
                    ),
                    "status": r.status,
                }
            )
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_attendance_today: {e}")
        return jsonify({"error": str(e)}), 500


# ────────────────────────────────────────────────
#          NEW LEAVE MANAGEMENT ENDPOINTS
# ────────────────────────────────────────────────


@app.route("/apply_leave", methods=["POST"])
def apply_leave():
    """
    Staff leave apply karne ke liye (LeaveRequest page se call hota hai)
    """
    try:
        data = request.get_json()
        required = ["staff_name", "leave_type", "start_date", "end_date", "reason"]
        if not all(k in data for k in required):
            return jsonify({"error": "Missing required fields"}), 400

        start = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        end = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        days = (end - start).days + 1

        new_leave = LeaveRequest(
            staff_name=data["staff_name"],
            department=data.get("department", "General"),
            leave_type=data["leave_type"],
            start_date=start,
            end_date=end,
            days_requested=days,
            reason=data["reason"],
            status="Pending",
        )
        db.session.add(new_leave)
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Leave request submitted successfully",
                    "request_id": new_leave.id,
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        print(f"Apply leave error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/get_pending_leaves")
def get_pending_leaves():
    """
    Admin Dashboard ke liye sirf pending leaves
    """
    try:
        pending = LeaveRequest.query.filter_by(status="Pending").all()
        result = []
        for req in pending:
            result.append(
                {
                    "name": req.staff_name,
                    "dept": req.department,
                    "type": req.leave_type,
                    "days": req.days_requested,
                    "start_date": (
                        req.start_date.isoformat() if req.start_date else None
                    ),
                    "end_date": req.end_date.isoformat() if req.end_date else None,
                    "reason": req.reason or "No reason provided",
                }
            )
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_pending_leaves: {e}")
        return jsonify([]), 500


@app.route("/update_leave_status", methods=["POST", "OPTIONS"])
def update_leave_status():
    """
    Leave Management page se approve/reject ke liye
    """
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        leave_id = data.get("id")
        new_status = data.get("status")  # "Approved" or "Rejected"

        if not leave_id or new_status not in ["Approved", "Rejected"]:
            return jsonify({"error": "Invalid request - need id and status"}), 400

        leave = LeaveRequest.query.get(leave_id)
        if not leave:
            return jsonify({"error": "Leave request not found"}), 404

        if leave.status != "Pending":
            return jsonify({"error": "Request already processed"}), 400

        leave.status = new_status
        leave.approved_by = "Admin"  # ya current logged-in admin
        db.session.commit()

        return jsonify(
            {"success": True, "message": f"Leave {new_status} for {leave.staff_name}"}
        )
    except Exception as e:
        db.session.rollback()
        print(f"Update leave error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/")
def index():
    return jsonify(
        {"status": "Attendance system running", "faces_loaded": len(known_face_names)}
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, threaded=True, debug=True, use_reloader=False)

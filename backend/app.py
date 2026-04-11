import os
from datetime import datetime
import threading
import time

# ====================== FINAL RECOMMENDED CCTV SETTINGS ======================
# Sub-stream (most stable for OpenCV)
# ====================== FINAL RECOMMENDED CCTV SETTINGS ======================
CCTV_URL = "rtsp://admin:admin1122@192.168.0.195:554/Streaming/Channels/302"

os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
    "rtsp_transport;tcp|"
    "rtsp_flags;+tcp|"
    "fflags;nobuffer|"
    "flags;low_delay|"
    "stimeout;50000000|"  # 50 seconds
    "timeout;50000000|"
    "max_delay;1000000|"
    "reorder_queue_size;0|"
    "buffer_size;2048000|"
    "probesize;10000000"
)

import cv2
import numpy as np
from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy import func

# ====================== NEW FACE ENGINE (InsightFace) ======================
from face_engine import FaceEngine

# ====================== IMPORT MODELS ======================
from models import (
    db,
    User,
    Attendance,
    LeaveRequest,
    Overtime,
    SalaryConfig,
    StaffVerification,
    init_db,
)

app = Flask(__name__)

# ====================== CORS (Improved) ======================
# ====================== CORS (Strong & Fixed) ======================
CORS(
    app,
    resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Content-Type",
                "Authorization",
                "Accept",
                "X-Requested-With",
            ],
            "supports_credentials": True,
            "max_age": 3600,
        }
    },
)

# ====================== FACE ENGINE INITIALIZATION ======================
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "instance", "attendance.db")
face_engine = FaceEngine(db_path=db_path)

# ====================== GLOBAL VARIABLES (Updated) ======================
last_detected_names = ["Unknown"]  # Ab list hoga (multiple faces ke liye)


# ====================== DATABASE SETUP (Improved - Step 2) ======================
basedir = os.path.abspath(os.path.dirname(__file__))

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"sqlite:///{os.path.join(basedir, 'instance', 'attendance.db')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = False  # Production mein False rakhna
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,  # SQLite ke liye helpful
    "pool_recycle": 300,
}

# ====================== VIDEO UPLOAD SETUP ======================
# ====================== VIDEO UPLOAD SETUP ======================
UPLOAD_FOLDER = os.path.join(basedir, "verification_videos")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max

ALLOWED_EXTENSIONS = {"webm", "mp4", "mov"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ====================== SHIFT HELPER ======================
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


# ====================== IMPROVED CAMERA STREAM FOR HIKVISION DVR ======================
# ====================== CAMERA STREAM (FIXED) ======================
class CameraStream:
    def __init__(self, url):
        self.url = url
        self.frame = None
        self.running = True
        self.lock = threading.Lock()
        self.last_success_time = time.time()
        self.cap = None
        self.reconnect_attempts = 0

    def update(self):
        print(f"[INFO] Starting RTSP stream: {self.url}")

        while self.running:
            try:
                if self.cap is not None:
                    self.cap.release()
                    self.cap = None

                self.reconnect_attempts += 1
                print(
                    f"[{datetime.now().strftime('%H:%M:%S')}] Attempt {self.reconnect_attempts}..."
                )

                # ✅ DO NOT set os.environ here — it's already set at top of file
                self.cap = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)

                if not self.cap.isOpened():
                    print(f"❌ Failed (Attempt {self.reconnect_attempts})")
                    print("   → Check: Same network, DVR online, correct credentials?")
                    print("   → Substream 302 ko H.264 (not H.265) set karo")
                    time.sleep(6)
                    continue

                # ✅ These 4 lines were MISSING in your 2nd code
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
                self.cap.set(cv2.CAP_PROP_FPS, 12)
                self.cap.set(
                    cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc("H", "2", "6", "4")
                )
                self.cap.set(cv2.CAP_PROP_CONVERT_RGB, 1)

                print(f"✅ Connected on attempt {self.reconnect_attempts}!")
                self.reconnect_attempts = 0
                self.last_success_time = time.time()

                while self.running:
                    ret, frame = self.cap.read()

                    if ret and frame is not None and frame.size > 0:
                        with self.lock:
                            self.frame = frame.copy()
                        self.last_success_time = time.time()
                    else:
                        if time.time() - self.last_success_time > 12:
                            print("⚠️ No frames for 12s → reconnecting...")
                            break
                        time.sleep(0.05)

            except Exception as e:
                print(f"[ERROR] Stream error: {e}")
                time.sleep(3)

            finally:
                if self.cap is not None:
                    self.cap.release()
                    self.cap = None
                time.sleep(2)

    def read(self):
        with self.lock:
            if self.frame is None:
                return False, np.full((480, 640, 3), 40, dtype=np.uint8)
            return True, self.frame.copy()

    def start(self):
        threading.Thread(target=self.update, daemon=True).start()
        return self


# Initialize Camera
cctv = CameraStream(CCTV_URL).start()
print("Camera thread started...")


# ====================== GENERATE FRAMES (Improved with user_id - Step 3) ======================
# ====================== NEW GENERATE FRAMES WITH INSIGHTFACE ======================
# ====================== GENERATE FRAMES FOR LIVE CCTV (STEP 3 - Final) ======================
def generate_frames():
    global last_detected_names
    frame_skip = 0

    print("[INFO] Live CCTV stream started with InsightFace buffalo_l...")

    while True:
        # Sirf ek baar frame read karo
        success, frame = cctv.read()

        if not success or frame is None or frame.size == 0:
            # Grey frame jab real video nahi aa raha
            gray_frame = np.full((480, 640, 3), 40, dtype=np.uint8)
            ret, buffer = cv2.imencode(
                ".jpg", gray_frame, [cv2.IMWRITE_JPEG_QUALITY, 60]
            )
        else:
            # Real frame aaya hai → face processing karo
            frame_skip += 1

            if frame_skip % 3 == 0:  # Performance ke liye har 3rd frame pe process karo
                try:
                    processed_frame, recognized_names = face_engine.process_frame(frame)
                    last_detected_names = recognized_names
                    frame = processed_frame
                except Exception as e:
                    print(f"[Face Error] {e}")
                    processed_frame = frame
            else:
                processed_frame = frame

            # JPEG mein convert karo
            ret, buffer = cv2.imencode(
                ".jpg", processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 70]
            )

        # Frame bhejo (grey ho ya real ho)
        if ret:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            )
        else:
            time.sleep(0.05)


# ====================== VIDEO VERIFICATION ROUTES (UPDATED) ======================


# ====================== SELF VERIFICATION ROUTE (For React Dashboard) ======================
# Yeh route React ke "Record Verification Video" aur "Upload Existing Video" dono ke liye kaam karega
# ====================== SELF VERIFICATION ROUTE (With Embedding) ======================
@app.route("/api/staff/self-verification", methods=["POST", "OPTIONS"])
def self_verification():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        if "video" not in request.files:
            return jsonify({"success": False, "error": "No video file provided"}), 400

        video_file = request.files["video"]
        staff_id = request.form.get("staffId")
        staff_name = request.form.get("staffName")

        if not staff_id or not staff_name:
            return (
                jsonify({"success": False, "error": "Staff ID and Name are required"}),
                400,
            )

        if video_file.filename == "" or not allowed_file(video_file.filename):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Invalid file type. Allowed: webm, mp4, mov",
                    }
                ),
                400,
            )

        # Save video
        safe_name = secure_filename(staff_name.replace(" ", "_").lower())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = video_file.filename.rsplit(".", 1)[1].lower()
        filename = f"{safe_name}_{staff_id}_{timestamp}.{ext}"

        full_filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        video_file.save(full_filepath)

        relative_path = f"verification_videos/{filename}"

        # Save verification record
        new_ver = StaffVerification(
            staff_id=staff_id,
            staff_name=staff_name,
            video_filename=filename,
            video_path=relative_path,
            status="uploaded",
        )
        db.session.add(new_ver)
        db.session.commit()

        print(f"✅ Video saved: {filename} for {staff_name}")

        # ====================== FACE EMBEDDING (Enrollment) ======================
        embedding_success = False
        try:
            print(f"🔄 Starting face embedding for {staff_name}...")
            face_engine.process_enrollment_video(
                video_path=full_filepath,
                emp_id=staff_id,
                name=staff_name,
                department="General",
            )
            embedding_success = True
            new_ver.status = "enrolled"
            print(f"🎉 Face embedding successful for {staff_name}")
        except Exception as enroll_err:
            print(f"⚠️ Face embedding failed: {enroll_err}")
            new_ver.status = (
                "uploaded"  # Video to save ho gaya, embedding fail hone par bhi
            )
            # Agar "no such table: employees" error hai to yeh message print hoga

        db.session.commit()

        # Success Response
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Verification successful! Video uploaded."
                    + (
                        " Face embedding completed."
                        if embedding_success
                        else " Face embedding skipped."
                    ),
                    "staff_name": staff_name,
                    "staff_id": staff_id,
                    "video_url": f"/verification_videos/{filename}",
                    "status": new_ver.status,
                    "embedding": embedding_success,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        print(f"❌ Self verification error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ====================== AUTO ENROLLMENT + VIDEO UPLOAD (FINAL CLEAN VERSION) ======================
@app.route("/api/staff/verify-video", methods=["POST", "OPTIONS"])
def verify_video():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    if "verificationVideo" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files["verificationVideo"]
    staff_id = request.form.get("staffId")
    staff_name = request.form.get("staffName")

    if not staff_id or not staff_name:
        return jsonify({"error": "Staff ID and Staff Name are required"}), 400

    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: mp4, webm, mov"}), 400

    try:
        # ====================== Save Video File ======================
        safe_name = secure_filename(staff_name.replace(" ", "_").lower())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_name}_{staff_id}_{timestamp}.mp4"

        full_filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(full_filepath)

        relative_path = f"verification_videos/{filename}"

        # Save record in database
        new_ver = StaffVerification(
            staff_id=staff_id,
            staff_name=staff_name,
            video_filename=filename,
            video_path=relative_path,
            status="uploaded",
        )
        db.session.add(new_ver)
        db.session.commit()

        print(
            f"✅ Video saved successfully: {filename} for {staff_name} (ID: {staff_id})"
        )

        # ====================== Auto Face Enrollment ======================
        enrollment_success = False
        try:
            print(f"🔄 Starting auto enrollment for {staff_name}...")
            face_engine.process_enrollment_video(
                video_path=full_filepath,
                emp_id=staff_id,
                name=staff_name,
                department="General",
            )
            new_ver.status = "enrolled"
            enrollment_success = True
            print(f"🎉 AUTO ENROLLMENT SUCCESS: {staff_name}")

        except Exception as enroll_err:
            print(f"⚠️ Enrollment failed but video saved: {enroll_err}")
            new_ver.status = "enrollment_failed"

        db.session.commit()

        # ====================== Final Response ======================
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Video uploaded successfully"
                    + (
                        " and face enrolled successfully."
                        if enrollment_success
                        else " (Face enrollment failed)"
                    ),
                    "staff_name": staff_name,
                    "staff_id": staff_id,
                    "video_url": f"/verification_videos/{filename}",
                    "status": new_ver.status,
                    "enrolled": enrollment_success,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        print(f"❌ Video upload error: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to process video",
                    "details": str(e),
                }
            ),
            500,
        )


# ====================== SERVE VERIFICATION VIDEOS (NEW ROUTE) ======================
@app.route("/verification_videos/<path:filename>")
def serve_verification_videos(filename):
    try:
        return send_from_directory(
            app.config["UPLOAD_FOLDER"], filename, as_attachment=False
        )
    except FileNotFoundError:
        print(f"❌ Video not found: {filename}")
        return jsonify({"error": "Video file not found"}), 404
    except Exception as e:
        print(f"❌ Error serving video: {e}")
        return jsonify({"error": "Failed to serve video"}), 500


# Video serving route for HR (Important)
# ====================== GET ALL VERIFICATIONS (HR Dashboard) ======================
@app.route("/api/staff/verifications")
def get_all_verifications():
    try:

        all_ver = StaffVerification.query.order_by(
            StaffVerification.recorded_at.desc()
        ).all()

        result = []
        for ver in all_ver:
            result.append(
                {
                    "id": ver.id,
                    "staff_id": ver.staff_id,
                    "staff_name": ver.staff_name,
                    "video_path": ver.video_path,
                    "recorded_at": ver.recorded_at.isoformat(),
                    "status": ver.status,
                }
            )

        print(f"✅ Returning {len(result)} verification video(s) to HR")
        return jsonify(result)

    except Exception as e:
        print(f"❌ Error in get_all_verifications: {e}")
        import traceback

        traceback.print_exc()
        return jsonify([]), 500


# ====================== DELETE VERIFICATION (NEW ROUTE) ======================
# ====================== DELETE VERIFICATION (Fixed CORS) ======================
@app.route(
    "/api/staff/verification/<int:verification_id>", methods=["DELETE", "OPTIONS"]
)
def delete_verification(verification_id):
    if request.method == "OPTIONS":
        # Preflight request ke liye direct 200 response
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add(
            "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
        )
        response.headers.add(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )
        return response, 200

    try:
        verification = StaffVerification.query.get(verification_id)

        if not verification:
            return jsonify({"error": "Verification record not found"}), 404

        # Delete video file from disk
        if verification.video_path:
            video_filename = os.path.basename(verification.video_path)
            full_file_path = os.path.join(app.config["UPLOAD_FOLDER"], video_filename)

            if os.path.exists(full_file_path):
                try:
                    os.remove(full_file_path)
                    print(f"🗑️ Video file deleted: {full_file_path}")
                except Exception as file_err:
                    print(f"⚠️ Could not delete file: {file_err}")

        # Delete from database
        db.session.delete(verification)
        db.session.commit()

        print(
            f"✅ Verification ID {verification_id} deleted for {verification.staff_name}"
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": f"Verification for {verification.staff_name} deleted successfully",
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete error for ID {verification_id}: {e}")
        return jsonify({"error": str(e)}), 500


# ====================== Baaki Pura Code Same ======================
# (Yahan se neeche sab kuch bilkul same hai jaise aapne diya tha)


@app.route("/api/staff/verification-status")
def get_verification_status():
    staff_id = request.args.get("staffId")
    if not staff_id:
        return jsonify({"error": "staffId required"}), 400

    try:
        latest = (
            StaffVerification.query.filter_by(staff_id=staff_id)
            .order_by(StaffVerification.recorded_at.desc())
            .first()
        )

        if latest:
            return jsonify(
                {
                    "staff_id": latest.staff_id,
                    "staff_name": latest.staff_name,
                    "video_url": f"/verification_videos/{latest.video_filename}",
                    "recorded_at": latest.recorded_at.isoformat(),
                    "status": latest.status,
                }
            )
        else:
            return jsonify({"status": "Not Verified Yet"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/mark_as_absent", methods=["POST"])
def mark_as_absent():
    try:
        data = request.get_json()
        name = data.get("name")

        if not name:
            return jsonify({"error": "Name required"}), 400

        today = datetime.now().date()

        # User find karo
        user = User.query.filter_by(name=name).first()
        if not user:
            return jsonify({"error": f"Staff '{name}' not found"}), 404

        # Ab user_id ke saath delete karo (better)
        record = Attendance.query.filter_by(user_id=user.id, date=today).first()

        if record:
            db.session.delete(record)
            db.session.commit()
            print(
                f"✅ Attendance record deleted for {name} (User ID: {user.id}) today."
            )
            message = f"{name} marked as absent and record has been reset successfully."
        else:
            print(f"⚠️ No attendance record found for {name} today.")
            message = f"No attendance record found for {name} today."

        return jsonify({"success": True, "message": message, "user_id": user.id})

    except Exception as e:
        db.session.rollback()
        print(f"❌ Mark as absent error for {name}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "engine": "InsightFace (buffalo_l)",
            "faces_in_db": (
                len(face_engine.known_embeddings)
                if hasattr(face_engine, "known_embeddings")
                else 0
            ),
            "last_detected": last_detected_names,
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
        email = data.get("email")
        password = data.get("password")

        if not name or not email:
            return (
                jsonify({"status": "error", "message": "Name and Email are required"}),
                400,
            )

        # Check if staff already exists (by email or name)
        existing = User.query.filter(
            (User.email == email) | (User.name == name)
        ).first()

        if existing:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Staff with this name or email already exists",
                    }
                ),
                409,
            )

        # Create new staff with ALL fields coming from HR form
        new_user = User(
            name=name.strip(),
            email=email.strip().lower(),
            password_hash=generate_password_hash(password or "staff123"),
            role=data.get("position", data.get("role", "staff")),  # Position → role
            department=data.get("department", "General"),
            phone=data.get("phone", ""),
            duty_start=data.get("shiftStart", "09:00"),
            duty_end=data.get("shiftEnd", "18:00"),
            salary=float(data.get("salary") or 50000.0),
        )

        db.session.add(new_user)
        db.session.commit()

        print(
            f"✅ New HR Staff Added: {name} | Email: {email} | Department: {new_user.department}"
        )

        # Optional: If you want to save a photo later, you can add it here

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Staff added successfully to database",
                    "id": new_user.id,
                    "name": new_user.name,
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        print(f"❌ Add staff error: {e}")
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
        # load_staff_faces()
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

        # load_staff_faces()
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
            # Improved: user_id se count karo (better relation)
            present_count = Attendance.query.filter(
                Attendance.user_id == u.id,  # ← Yeh line change hui
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
        print(f"❌ Get staff list error: {e}")
        import traceback

        traceback.print_exc()
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

        # User find karo taaki user_id bhi return kar sakein
        user = User.query.filter(func.lower(User.name) == func.lower(name)).first()
        if not user:
            return jsonify({"error": "Staff not found"}), 404

        records = (
            Attendance.query.filter_by(user_id=user.id)  # user_id se better query
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
                        if getattr(r, "total_hours", 0) > 0
                        else "In Progress"
                    ),
                    "status": r.status,
                    "user_id": user.id,
                }
            )

        return jsonify(result)

    except Exception as e:
        print(f"❌ Get attendance by name error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/get_detected_name")
def get_detected_name():
    detected = [name for name in last_detected_names if name != "Unknown"]

    return jsonify(
        {
            "names": last_detected_names,
            "detected_count": len(detected),
            "detected_names": detected,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "status": "ACTIVE" if detected else "IDLE",
            "location": "Main Entrance CCTV",
            "message": (
                f"{len(detected)} person(s) recognized"
                if detected
                else "Scanning faces..."
            ),
        }
    )


# ====================== AUTO MARK ATTENDANCE FROM CCTV ======================
@app.route("/mark_attendance", methods=["POST", "OPTIONS"])
def mark_attendance():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json()
        name = data.get("name")

        if not name:
            return jsonify({"error": "Name is required"}), 400

        today = datetime.now().date()

        # User find karo
        user = User.query.filter_by(name=name).first()
        if not user:
            return jsonify({"error": f"Staff '{name}' not found"}), 404

        # Check if already marked today
        existing = Attendance.query.filter_by(user_id=user.id, date=today).first()

        if existing:
            return (
                jsonify(
                    {
                        "success": True,
                        "message": f"Attendance already marked today for {name}",
                        "already_marked": True,
                    }
                ),
                200,
            )

        # Mark new attendance
        new_attendance = Attendance(
            user_id=user.id,
            user_name=name,
            date=today,
            check_in=datetime.now(),
            status="PRESENT",
            total_hours=0.0,  # Will be updated when checkout
        )

        db.session.add(new_attendance)
        db.session.commit()

        print(
            f"✅ [AUTO] Attendance marked for {name} via CCTV at {datetime.now().strftime('%H:%M:%S')}"
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": f"Attendance marked successfully for {name}",
                    "name": name,
                    "check_in": datetime.now().strftime("%H:%M:%S"),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        print(f"❌ Auto mark attendance error for {name}: {e}")
        return jsonify({"error": str(e)}), 500


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
            # Improved: user_id se User fetch karo (agar user_id hai to)
            if hasattr(r, "user_id") and r.user_id:
                user = User.query.get(r.user_id)
            else:
                user = User.query.filter_by(name=r.user_name).first()

            duty_start_str = user.duty_start if user and user.duty_start else "09:00"

            arrival_status = "On Time"
            if r.check_in:
                try:
                    duty_start_time = datetime.strptime(duty_start_str, "%H:%M").time()
                    duty_start_datetime = datetime.combine(today, duty_start_time)
                    diff_minutes = (
                        r.check_in - duty_start_datetime
                    ).total_seconds() / 60

                    if diff_minutes > 5:
                        late_min = round(diff_minutes)
                        arrival_status = f"Late by {late_min} min"
                    elif diff_minutes < -5:
                        early_min = round(abs(diff_minutes))
                        arrival_status = f"Early by {early_min} min"
                    else:
                        arrival_status = "On Time"
                except:
                    arrival_status = "On Time"

            result.append(
                {
                    "id": r.id,
                    "name": r.user_name,
                    "user_id": getattr(r, "user_id", None),  # Extra safety
                    "time": r.check_in.strftime("%H:%M") if r.check_in else None,
                    "outTime": r.check_out.strftime("%H:%M") if r.check_out else None,
                    "workDuration": (
                        f"{r.total_hours:.2f} hrs"
                        if r.total_hours and r.total_hours > 0
                        else "In Progress"
                    ),
                    "status": r.status,
                    "arrival_status": arrival_status,
                }
            )

        return jsonify(result)

    except Exception as e:
        print(f"❌ Error in get_attendance_today: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/apply_leave", methods=["POST"])
def apply_leave():
    try:
        data = request.get_json()
        required = ["staff_name", "leave_type", "start_date", "end_date", "reason"]
        if not all(k in data for k in required):
            return jsonify({"error": "Missing required fields"}), 400

        staff_name = data["staff_name"]

        # User find karo
        user = User.query.filter_by(name=staff_name).first()
        if not user:
            return jsonify({"error": f"Staff '{staff_name}' not found"}), 404

        start = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        end = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        days = (end - start).days + 1

        new_leave = LeaveRequest(
            user_id=user.id,  # ← Main Change
            staff_name=staff_name,  # Backward compatibility
            department=data.get("department", user.department or "General"),
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
                    "user_id": user.id,
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        print(f"❌ Apply leave error: {e}")
        return jsonify({"error": str(e)}), 500


# ====================== NEW ROUTE FOR STAFF TO SEE THEIR OWN LEAVES ======================
@app.route("/get_my_leaves")
def get_my_leaves():
    try:
        staff_name = request.args.get("name")
        if not staff_name:
            return jsonify({"error": "Staff name is required"}), 400

        # Staff ke saare leaves laao (Pending + Approved + Rejected)
        leaves = (
            LeaveRequest.query.filter_by(staff_name=staff_name)
            .order_by(LeaveRequest.id.desc())
            .all()
        )

        result = []
        for leave in leaves:
            result.append(
                {
                    "id": leave.id,
                    "staffName": leave.staff_name,
                    "type": leave.leave_type,
                    "startDate": (
                        leave.start_date.strftime("%Y-%m-%d")
                        if leave.start_date
                        else ""
                    ),
                    "endDate": (
                        leave.end_date.strftime("%Y-%m-%d") if leave.end_date else ""
                    ),
                    "reason": leave.reason or "",
                    "status": leave.status,
                    "submittedAt": (
                        leave.submitted_at.isoformat()
                        if hasattr(leave, "submitted_at") and leave.submitted_at
                        else ""
                    ),
                }
            )

        print(f"✅ get_my_leaves for '{staff_name}' → {len(result)} records returned")
        return jsonify(result)

    except Exception as e:
        print(f"❌ Error in get_my_leaves: {e}")
        import traceback

        traceback.print_exc()
        return jsonify([]), 500


@app.route("/get_pending_leaves")
def get_pending_leaves():
    try:
        pending = LeaveRequest.query.filter_by(status="Pending").all()
        result = []

        for req in pending:
            result.append(
                {
                    "id": req.id,
                    "user_id": getattr(req, "user_id", None),
                    "name": req.staff_name,
                    "dept": req.department,
                    "type": req.leave_type,
                    "days": req.days_requested,
                    "start_date": (
                        req.start_date.isoformat() if req.start_date else None
                    ),
                    "end_date": req.end_date.isoformat() if req.end_date else None,
                    "reason": req.reason or "No reason provided",
                    "status": req.status,
                }
            )

        return jsonify(result)

    except Exception as e:
        print(f"❌ Error in get_pending_leaves: {e}")
        return jsonify([]), 500


@app.route("/update_leave_status", methods=["POST", "OPTIONS"])
def update_leave_status():
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        leave_id = data.get("id")
        new_status = data.get("status")

        if not leave_id or new_status not in ["Approved", "Rejected"]:
            return jsonify({"error": "Invalid request - need id and status"}), 400

        leave = LeaveRequest.query.get(leave_id)
        if not leave:
            return jsonify({"error": "Leave request not found"}), 404

        if leave.status != "Pending":
            return jsonify({"error": "Request already processed"}), 400

        leave.status = new_status
        leave.approved_by = (
            "Admin"  # Ya phir current user ka naam daal sakte ho baad mein
        )
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": f"Leave {new_status} for {leave.staff_name}",
                "leave_id": leave.id,
            }
        )

    except Exception as e:
        db.session.rollback()
        print(f"❌ Update leave error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/")
def index():
    return jsonify(
        {
            "status": "Attendance system running successfully",
            "engine": "InsightFace buffalo_l",
            "faces_loaded": (
                len(face_engine.known_embeddings)
                if hasattr(face_engine, "known_embeddings")
                else 0
            ),
            "message": "Ready for CCTV face recognition",
        }
    )

    # ====================== SALARY CONFIGURATION ROUTES ======================


# ====================== SALARY CONFIGURATION ROUTES (FIXED) ======================


# ====================== SALARY CONFIGURATION ROUTES (FIXED) ======================
# ====================== SALARY CONFIGURATION ROUTES (UPDATED) ======================


@app.route("/get_salary_structures", methods=["GET", "OPTIONS"])
def get_salary_structures():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    try:
        structures = SalaryConfig.query.all()
        return jsonify([s.to_dict() for s in structures])
    except Exception as e:
        print(f"❌ Get salary structures error: {e}")
        return jsonify([]), 500


@app.route("/add_salary_structure", methods=["POST", "OPTIONS"])
def add_salary_structure():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json()

        new_structure = SalaryConfig(
            staff_name=data.get("staffName"),
            emp_id=data.get("empId"),
            designation=data.get("designation"),
            basic_salary=float(data.get("baseSalary", 0)),
            allowances=data.get("allowances", []),
            deductions=data.get("deductions", []),
        )

        db.session.add(new_structure)
        db.session.commit()

        print(f"✅ Salary Structure Added: {data.get('staffName')}")
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Added successfully",
                    "id": new_structure.id,
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        print(f"❌ Add salary error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/update_salary_structure", methods=["POST", "OPTIONS"])
def update_salary_structure():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json()
        structure = SalaryConfig.query.get(data.get("id"))

        if not structure:
            return jsonify({"success": False, "error": "Structure not found"}), 404

        structure.staff_name = data.get("staffName", structure.staff_name)
        structure.emp_id = data.get("empId", structure.emp_id)
        structure.designation = data.get("designation", structure.designation)
        structure.basic_salary = float(data.get("baseSalary", structure.basic_salary))
        structure.allowances = data.get("allowances", structure.allowances)
        structure.deductions = data.get("deductions", structure.deductions)

        db.session.commit()
        return jsonify({"success": True, "message": "Updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Update salary error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/delete_salary_structure/<int:id>", methods=["DELETE", "OPTIONS"])
def delete_salary_structure(id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        structure = SalaryConfig.query.get(id)
        if not structure:
            return jsonify({"success": False, "error": "Not found"}), 404

        db.session.delete(structure)
        db.session.commit()
        return jsonify({"success": True, "message": "Deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete salary error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

        import os


# ====================== ULTIMATE RESET (SQLite ke liye sabse powerful) ======================
def ultimate_salary_reset(app):
    """Puri table delete karke fresh create karta hai with correct nullable"""
    if not app:
        print("❌ App missing!")
        return

    with app.app_context():
        print("🗑️  Ultimate SalaryConfig Reset Starting...")

        # Database file path nikaalo
        db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
        db_file = None
        if db_uri.startswith("sqlite:///"):
            db_file = db_uri.replace("sqlite:///", "")
            if not os.path.isabs(db_file):
                db_file = os.path.join(os.getcwd(), db_file)

        with db.engine.connect() as conn:
            conn.execute(db.text("PRAGMA foreign_keys = OFF"))
            conn.execute(db.text("DROP TABLE IF EXISTS salary_config"))
            conn.execute(db.text("PRAGMA foreign_keys = ON"))

        db.create_all()

        print("✅ SalaryConfig table completely recreated!")
        print("   user_id ab nullable=True hai (confirmed)")

        # Confirm check
        try:
            result = conn.execute(
                db.text("PRAGMA table_info(salary_config)")
            ).fetchall()
            for col in result:
                if col[1] == "user_id":
                    print(f"   user_id Nullable = {'YES' if col[3] == 0 else 'NO'}")
        except:
            pass

        # ====================== PAYROLL MANAGEMENT ROUTE (Fixed for SalaryConfig) ======================


@app.route("/api/payroll/summary", methods=["GET", "OPTIONS"])
def get_payroll_summary():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        # SalaryConfig table se data lao (naya correct way)
        salary_configs = SalaryConfig.query.order_by(SalaryConfig.staff_name).all()

        result = []
        for config in salary_configs:
            # Simple calculation (baad mein attendance aur OT se dynamic bana sakte ho)
            base_salary = float(config.basic_salary)
            deductions = sum(
                item.get("amount", 0) for item in (config.deductions or [])
            )
            allowances = sum(
                item.get("amount", 0) for item in (config.allowances or [])
            )

            net_salary = base_salary + allowances - deductions

            result.append(
                {
                    "id": config.id,
                    "employee": config.staff_name,
                    "emp_id": config.emp_id,
                    "department": config.designation or "General",
                    "base_salary": base_salary,
                    "present": "0/22",  # Baad mein real attendance se update kar sakte ho
                    "ot_hours": 0,
                    "ot_pay": 0,
                    "deductions": round(deductions, 0),
                    "net_salary": round(net_salary, 0),
                }
            )

        print(f"✅ Payroll summary: {len(result)} records returned from SalaryConfig")
        return jsonify(result)

    except Exception as e:
        print(f"❌ Payroll summary error: {e}")
        import traceback

        traceback.print_exc()
        return jsonify([]), 500


if __name__ == "__main__":
    with app.app_context():
        if not os.path.exists(os.path.join(basedir, "instance")):
            os.makedirs(os.path.join(basedir, "instance"))

        # ====================== DATABASE INITIALIZATION ======================
        print("🔄 Initializing Database...")
        try:
            init_db(app)
            print("✅ All database tables created/updated successfully!")

            user_count = User.query.count()
            print(f"📊 Database Status: {user_count} users found.")
        except Exception as db_error:
            print(f"❌ Database initialization error: {db_error}")

        # ====================== LOAD KNOWN FACES FROM DATABASE ======================
        print("🧠 Loading known faces from database using FaceEngine...")
        # FaceEngine already __init__ mein load kar leta hai, isliye extra load nahi karna

    print("\n" + "=" * 80)
    print("🚀 ATTENDANCE SYSTEM STARTED SUCCESSFULLY WITH INSIGHTFACE!")
    print("📍 Server Running on: http://0.0.0.0:5000")
    print("📹 Live CCTV Feed     : http://127.0.0.1:5000/video_feed")
    print("📡 Detected Status    : http://127.0.0.1:5000/get_detected_name")
    print("❤️  Health Check      : http://127.0.0.1:5000/health")
    print("=" * 80)

    app.run(host="0.0.0.0", port=5000, threaded=True, debug=False, use_reloader=False)

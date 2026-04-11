import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
import os
from datetime import datetime
import sqlite3
import io
import threading
import time

# ====================== FLASK & DATABASE IMPORTS ======================
# ====================== FLASK & DATABASE IMPORTS ======================
db = None
Attendance = None

try:
    from app import create_app, db as flask_db
    from app.models import Attendance as flask_Attendance

    # Create app context
    app = create_app()  # ← Agar tumhara app factory hai
    with app.app_context():
        db = flask_db
        Attendance = flask_Attendance
        print(
            "[SUCCESS] Flask db and Attendance model imported successfully with context!",
            flush=True,
        )

except ImportError as e:
    print(f"[WARNING] Import failed: {e}", flush=True)
    print("[INFO] Trying direct import...", flush=True)

    try:
        from app import db as flask_db
        from app.models import Attendance as flask_Attendance

        db = flask_db
        Attendance = flask_Attendance
        print("[SUCCESS] Direct import successful!", flush=True)
    except Exception as e2:
        print(f"[ERROR] All import attempts failed: {e2}", flush=True)
        db = None
        Attendance = None

except Exception as e:
    print(f"[ERROR] Unexpected error importing db: {e}", flush=True)
    db = None
    Attendance = None


# ====================== DATABASE HELPERS ======================
def adapt_array(arr):
    out = io.BytesIO()
    np.save(out, arr)
    out.seek(0)
    return sqlite3.Binary(out.read())


def convert_array(text):
    out = io.BytesIO(text)
    out.seek(0)
    return np.load(out)


sqlite3.register_adapter(np.ndarray, adapt_array)
sqlite3.register_converter("ARRAY", convert_array)


class FaceEngine:
    def __init__(self, db_path="attendance.db", use_gpu=False):
        print(
            "\n[INIT] Starting FaceEngine with InsightFace buffalo_l (Optimized + Advanced)...",
            flush=True,
        )

        providers = (
            ["CUDAExecutionProvider", "CPUExecutionProvider"]
            if use_gpu
            else ["CPUExecutionProvider"]
        )

        # Improved Detection Settings (First Code se liye)
        self.app = FaceAnalysis(name="buffalo_l", providers=providers)
        self.app.prepare(
            ctx_id=0, det_size=(960, 960), det_thresh=0.20
        )  # Better for distance

        self.db_path = db_path
        self.known_embeddings = []
        self.frame_counter = 0

        # For stable bounding box in live stream
        self.last_bbox = None
        self.last_recognized = ["Unknown"]

        self.load_known_faces()
        print(
            f"[INIT DEBUG] Known faces loaded: {len(self.known_embeddings)}", flush=True
        )
        print("[INIT] FaceEngine initialized successfully!\n", flush=True)

    # ====================== DATABASE FUNCTIONS ======================
    def load_known_faces(self):
        try:
            conn = sqlite3.connect(self.db_path, detect_types=sqlite3.PARSE_DECLTYPES)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM employees")
            total = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM employees WHERE status='active'")
            active = cursor.fetchone()[0]

            print(f"[DB DEBUG] Total employees: {total} | Active: {active}", flush=True)

            cursor.execute("SELECT emp_id, name, embedding FROM employees")
            rows = cursor.fetchall()
            conn.close()

            self.known_embeddings = []
            valid_count = 0
            for emp_id, name, embedding in rows:
                if embedding is not None:
                    valid_count += 1
                self.known_embeddings.append((emp_id, name, embedding))

            print(
                f"[DB SUCCESS] Total loaded: {len(self.known_embeddings)} | Valid embeddings: {valid_count}",
                flush=True,
            )

        except Exception as e:
            print(f"[DB ERROR] Failed to load known faces: {e}", flush=True)

    # ====================== ATTENDANCE MARKING ======================
    # ====================== ATTENDANCE MARKING (Fixed for your setup) ======================
        # ====================== ATTENDANCE MARKING (SQLite se Direct) ======================
    def mark_attendance(self, emp_id, name):
        try:
            conn = sqlite3.connect(self.db_path, detect_types=sqlite3.PARSE_DECLTYPES)
            cursor = conn.cursor()

            today = datetime.now().date()
            current_time = datetime.now()

            # Pehle check karo kya aaj already marked hai
            cursor.execute("""
                SELECT id FROM attendance 
                WHERE user_id = ? AND date = ?
            """, (emp_id, today))
            
            if cursor.fetchone():
                print(f"ℹ️ Attendance already marked today for {name}", flush=True)
                conn.close()
                return True

            # Naya record insert karo
            cursor.execute("""
                INSERT INTO attendance 
                (user_id, user_name, date, check_in, status, total_hours)
                VALUES (?, ?, ?, ?, 'PRESENT', 0.0)
            """, (emp_id, name, today, current_time))

            conn.commit()
            conn.close()

            print(f"✅ [AUTO ATTENDANCE] Marked for {name} at {current_time.strftime('%H:%M:%S')}", flush=True)
            return True

        except Exception as e:
            print(f"❌ [ATTENDANCE ERROR] {str(e)}", flush=True)
            if 'conn' in locals() and conn:
                conn.close()
            return False

    # ====================== ADVANCED CORE RECOGNITION (First Code se Improved) ======================
    def get_embedding_from_frame(self, frame):
        self.frame_counter += 1
        if self.frame_counter % 4 != 0:
            return None

        faces = self.app.get(frame)
        if not faces:
            return None

        largest_face = sorted(
            faces,
            key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
            reverse=True,
        )[0]

        # --- Advanced Anti-Spoof + Quality Check (First Code se) ---
        bbox = largest_face.bbox.astype(int)
        x1 = max(0, bbox[0])
        y1 = max(0, bbox[1])
        x2 = min(frame.shape[1], bbox[2])
        y2 = min(frame.shape[0], bbox[3])

        cropped = frame[y1:y2, x1:x2]
        if cropped.size > 0 and cropped.shape[0] > 50 and cropped.shape[1] > 50:
            gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
            if blur_score < 70:  # Higher threshold than before
                print(
                    f"[SECURITY] Possible spoof/photo detected (Blur: {blur_score:.0f}). Skipping.",
                    flush=True,
                )
                return None

        # Strong Pose Check
        pitch, yaw, roll = largest_face.pose
        if abs(yaw) > 95 or abs(pitch) > 95:
            return None

        return largest_face.normed_embedding

        # ====================== ADVANCED CORE RECOGNITION ======================

    def recognize_face(self, frame):
        embedding = self.get_embedding_from_frame(frame)
        if embedding is None:
            return ["Unknown"]

        recognized = []
        threshold = 0.36

        for emp_id, name, known_emb in self.known_embeddings:
            if known_emb is None:
                continue

            # 🔥 IMARN KO HAMESHA KE LIYE BLOCK KAR DIYA
            if name and "imarn" in str(name).lower():
                continue

            similarity = np.dot(embedding, known_emb)
            if similarity > threshold:
                recognized.append(name)
                self.mark_attendance(emp_id, name)

        return recognized if recognized else ["Unknown"]

    # ====================== AUGMENTATIONS (First Code se pura add kiya) ======================
    def apply_augmentations(self, frame):
        """6 different augmented versions for robust enrollment"""
        augmented_frames = []

        augmented_frames.append(("original", frame))

        bright = cv2.convertScaleAbs(frame, alpha=1.3, beta=30)
        augmented_frames.append(("overexposed", bright))

        dark = cv2.convertScaleAbs(frame, alpha=0.6, beta=-30)
        augmented_frames.append(("underexposed", dark))

        blurred = cv2.GaussianBlur(frame, (9, 9), 0)
        augmented_frames.append(("motion_blur", blurred))

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        monochrome = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        monochrome = cv2.convertScaleAbs(monochrome, alpha=1.5, beta=0)
        augmented_frames.append(("monochrome", monochrome))

        noise = np.random.normal(0, 15, frame.shape).astype(np.uint8)
        grainy = cv2.add(frame, noise)
        augmented_frames.append(("camera_noise", grainy))

        return augmented_frames

    # ====================== IMPROVED PROCESS FRAME (Stable Box) ======================
    def process_frame(self, frame):
        if frame is None:
            return frame, ["Unknown"]

        recognized_names = self.recognize_face(frame)

        # Face detection for updating memory
        faces = self.app.get(frame) if self.frame_counter % 4 == 0 else []

        if faces:
            largest_face = sorted(
                faces,
                key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
                reverse=True,
            )[0]
            self.last_bbox = largest_face.bbox.astype(int)
            self.last_recognized = recognized_names

        # Draw stable box using last known face
        if self.last_bbox is not None:
            bbox = self.last_bbox
            is_recognized = (
                self.last_recognized and self.last_recognized[0] != "Unknown"
            )
            color = (0, 255, 0) if is_recognized else (0, 165, 255)

            cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 5)

            if is_recognized:
                cv2.putText(
                    frame,
                    self.last_recognized[0],
                    (bbox[0], bbox[1] - 15),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    color,
                    2,
                    cv2.LINE_AA,
                )
                cv2.putText(
                    frame,
                    "✅ CHECKED-IN",
                    (bbox[0], bbox[1] - 48),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.75,
                    (0, 255, 0),
                    2,
                    cv2.LINE_AA,
                )
            else:
                cv2.putText(
                    frame,
                    "Unknown",
                    (bbox[0], bbox[1] - 15),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.85,
                    color,
                    2,
                    cv2.LINE_AA,
                )

        return frame, recognized_names

    # ====================== ADVANCED ENROLLMENT (First Code se Updated) ======================
    def process_enrollment_video(
        self, video_path, emp_id, name="Unknown", department="General"
    ):
        print(f"\n{'='*60}", flush=True)
        print(
            f"[ENROLLMENT] Starting Advanced Enrollment for {name} (ID: {emp_id})",
            flush=True,
        )

        output_dir = os.path.join("app_data", "extracted_faces", str(emp_id))
        os.makedirs(output_dir, exist_ok=True)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        embeddings = []
        frame_count = 0
        success_count = 0
        aug_success_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % 10 != 0:  # Process every 10th frame
                continue

            print(f"[SCAN] Processing frame {frame_count}...", flush=True)

            # Resize for speed
            frame = cv2.resize(frame, (640, int(640 * frame.shape[0] / frame.shape[1])))

            faces = self.app.get(frame)
            if not faces:
                continue

            largest = sorted(
                faces,
                key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
                reverse=True,
            )[0]

            if largest.det_score < 0.15:
                continue

            pitch, yaw, roll = largest.pose
            if abs(yaw) > 95 or abs(pitch) > 95:
                continue

            # Quality Check
            bbox = largest.bbox.astype(int)
            cropped = frame[
                max(0, bbox[1]) : min(frame.shape[0], bbox[3]),
                max(0, bbox[0]) : min(frame.shape[1], bbox[2]),
            ]

            if cropped.size == 0 or cropped.shape[0] < 60 or cropped.shape[1] < 60:
                continue

            gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
            if blur_score < 70:
                continue

            # Save original face
            cv2.imwrite(
                os.path.join(output_dir, f"{emp_id}_face_{success_count+1}.jpg"),
                cropped,
            )
            success_count += 1

            # Apply Advanced Augmentations
            augmented_frames = self.apply_augmentations(frame)
            for aug_name, aug_frame in augmented_frames:
                aug_faces = self.app.get(aug_frame)
                if aug_faces:
                    aug_largest = sorted(
                        aug_faces,
                        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
                        reverse=True,
                    )[0]
                    embeddings.append(aug_largest.normed_embedding)
                    aug_success_count += 1

        cap.release()

        if len(embeddings) < 8:
            raise ValueError(
                f"Not enough good faces. Only {len(embeddings)} embeddings generated."
            )

        master_embedding = np.mean(embeddings, axis=0)
        master_embedding = master_embedding / np.linalg.norm(master_embedding)

        # Save to Database
        try:
            conn = sqlite3.connect(self.db_path, detect_types=sqlite3.PARSE_DECLTYPES)
            cursor = conn.cursor()
            # Table creation and insert code (same as before)
            cursor.execute(
                """CREATE TABLE IF NOT EXISTS employees (
                emp_id TEXT PRIMARY KEY, name TEXT, department TEXT, 
                embedding ARRAY, status TEXT DEFAULT 'active',
                created_at TEXT, updated_at TEXT)"""
            )

            cursor.execute(
                """INSERT OR REPLACE INTO employees 
                (emp_id, name, department, embedding, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'active', ?, ?)""",
                (
                    emp_id,
                    name,
                    department,
                    master_embedding,
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                ),
            )

            conn.commit()
            conn.close()
            print(
                f"✅ Employee {name} enrolled successfully with {aug_success_count} enhanced embeddings!",
                flush=True,
            )
        except Exception as e:
            print(f"❌ DB Error: {e}", flush=True)
            raise

        self.load_known_faces()
        print(f"[SUCCESS] Enrollment completed for {name}!\n{'='*60}", flush=True)
        return master_embedding


# ====================== CAMERA STREAM (Unchanged) ======================
class CameraStream:
    def __init__(self, url):
        self.url = url
        self.stream = None
        self.frame = None
        self.running = True
        self.lock = threading.Lock()
        self.reconnect_attempts = 0
        self.last_success_time = time.time()

    def _open_capture(self):
        if self.stream is not None:
            self.stream.release()
            self.stream = None

        self.reconnect_attempts += 1
        current_time = datetime.now().strftime("%H:%M:%S")
        print(
            f"[{current_time}] Connecting to CCTV... Attempt {self.reconnect_attempts}"
        )

        self.stream = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)

        if self.stream.isOpened():
            self.stream.set(cv2.CAP_PROP_BUFFERSIZE, 4)
            self.stream.set(cv2.CAP_PROP_FPS, 15)
            self.stream.set(
                cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc("H", "2", "6", "4")
            )
            self.stream.set(cv2.CAP_PROP_CONVERT_RGB, 1)
            print(
                f"✅ CCTV CONNECTED SUCCESSFULLY on Attempt {self.reconnect_attempts}!"
            )
            self.reconnect_attempts = 0
            self.last_success_time = time.time()
            return True
        else:
            print(f"❌ Failed to open RTSP stream (Attempt {self.reconnect_attempts})")
            return False

    def update(self):
        while self.running:
            if not self.stream or not self.stream.isOpened():
                if not self._open_capture():
                    time.sleep(4)
                continue

            ret, frame = self.stream.read()
            if ret and frame is not None:
                with self.lock:
                    self.frame = frame.copy()
                self.last_success_time = time.time()
            else:
                if time.time() - self.last_success_time > 8:
                    print("⚠️ No frames received, forcing reconnect...")
                    if self.stream:
                        self.stream.release()
                    self.stream = None
                    time.sleep(2)
            time.sleep(0.03)

    def read(self):
        with self.lock:
            if self.frame is None:
                return False, None
            return True, self.frame.copy()

    def start(self):
        threading.Thread(target=self.update, daemon=True).start()
        return self

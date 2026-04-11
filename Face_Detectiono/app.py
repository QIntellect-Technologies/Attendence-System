import os
import time
import cv2
import numpy as np
import faiss
from flask import Flask, request, jsonify, render_template_string, Response


from werkzeug.utils import secure_filename
from database import init_db, insert_employee, get_all_active_employees, log_attendance, delete_employee
from face_engine import FaceEngine, calculate_similarity

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize systems
init_db()
print("\n[HTTP API] Booting up Face Recognition Engine on GPU...", flush=True)
# Switched from CPU to GPU rendering!
engine = FaceEngine(use_gpu=True)
SIMILARITY_THRESHOLD = 0.38  # Lowered from 0.45 to support slightly distorted distant faces

# ==========================================
# 1. HTML DASHBOARD UI WITH LOGS PREVIEW
# ==========================================
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Enterprise Dash</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
</head>
<body class="bg-slate-100 min-h-screen text-slate-800">
    <nav class="bg-slate-900 text-white shadow-xl p-4 flex justify-between items-center border-b-4 border-blue-600">
        <div class="flex items-center space-x-3">
            <i class="fa-solid fa-fingerprint text-3xl text-blue-400"></i>
            <div>
                <h1 class="text-xl font-bold tracking-widest uppercase">QINTELLECT</h1>
                <p class="text-xs text-slate-400 tracking-wider">ENTERPRISE FACE TRACKING</p>
            </div>
        </div>
        <div class="flex items-center">
            <div class="animate-pulse bg-green-500 h-3 w-3 rounded-full mr-2"></div>
            <span class="text-sm font-semibold tracking-wide text-green-400">SYS_ONLINE</span>
        </div>
    </nav>
    <div class="p-6 max-w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 flex flex-col h-[calc(100vh-8rem)]">
            <div class="bg-black rounded-t-xl px-4 py-3 border border-slate-800 flex justify-between items-center text-slate-300">
                  <h3 class="font-mono text-sm tracking-widest"><i class="fa-solid fa-satellite-dish mr-2 text-blue-500"></i>LIVE_FEED</h3>
                  <span class="text-xs bg-red-900/50 text-red-500 border border-red-800 px-2 py-1 rounded font-bold"><i class="fa-solid fa-circle text-[8px] align-middle mr-1"></i>REC</span>
              </div>
              <div class="bg-[#050505] flex-1 border-x border-b border-slate-800 rounded-b-xl overflow-hidden relative shadow-2xl flex items-center justify-center p-2">
                  <img src="/video_feed" alt="Camera Signal Dropped" class="w-full h-full object-contain rounded-lg">
              </div>
              
        </div>
        <div class="lg:col-span-4 space-y-6 flex flex-col h-[calc(100vh-8rem)]">
            <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div class="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 class="font-bold text-slate-700 tracking-wide"><i class="fa-solid fa-users mr-2 text-indigo-600"></i>IDENTITY DATABASE</h3>
                    <span id="staff_count" class="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold shadow-sm">0 VOLUMES</span>
                </div>
                <div class="p-0 overflow-y-auto flex-1 bg-slate-50/50">
                    <table class="w-full text-left text-sm whitespace-nowrap">
                        <tbody id="staff_list" class="divide-y divide-slate-100 text-slate-600"></tbody>
                    </table>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-none">
                <div class="bg-slate-50 px-5 py-4 border-b border-slate-200">
                    <h3 class="font-bold text-slate-700 tracking-wide"><i class="fa-solid fa-shield-halved mr-2 text-blue-600"></i>NEW AUTHORIZATION</h3>
                </div>
                <div class="p-5">
                    <form id="enrollForm" enctype="multipart/form-data" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div><input type="text" name="emp_id" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-400" placeholder="UID-001" required></div>
                            <div><input type="text" name="department" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-400" placeholder="Dept Code" required></div>
                        </div>
                        <div><input type="text" name="name" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-400" placeholder="Full Legal Name" required></div>
                        <div><input type="file" name="video" accept="video/*" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 border border-slate-100 rounded bg-slate-50 outline-none" required></div>
                        <button type="submit" class="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-lg text-sm tracking-wide shadow-md"><i class="fa-solid fa-microchip mr-2"></i>ENCODE VECTORS</button>
                    </form>
                    <div id="status" class="mt-4 text-[13px] font-semibold text-center hidden"></div>
                </div>
            </div>
        </div>
    </div>
    <script>
        async function fetchStaff() {
            const r = await fetch('/get_staff_list');
            const d = await r.json();
            const l = document.getElementById('staff_list');
            document.getElementById('staff_count').innerText = d.length + " ACTIVE";
            l.innerHTML = '';
            d.forEach(e => {
                let r = document.createElement('tr');
                r.className = "hover:bg-blue-50 transition-colors group";
                r.innerHTML = `
                    <td class="px-5 py-4 font-mono text-xs font-bold text-blue-600 border-r w-1">${e.emp_id}</td>
                    <td class="px-5 py-4"><div class="font-bold text-slate-800">${e.name}</div><div class="text-[10px] text-slate-500 uppercase tracking-widest">${e.department}</div></td>
                    <td class="px-5 py-4 text-right"><button onclick="deleteStaff('${e.emp_id}')" class="text-slate-300 hover:text-red-500"><i class="fa-solid fa-trash-can"></i></button></td>`;
                l.appendChild(r);
            });
        }
        async function deleteStaff(id) {
            if(confirm(`WARNING: Erase user ${id}?`)){
                await fetch(`/api/delete/${id}`, {method:'DELETE'});
                fetchStaff();
            }
        }
        
        fetchStaff();

        document.getElementById('enrollForm').onsubmit = async (e) => {
            e.preventDefault();
            const s = document.getElementById('status');
            s.className = "mt-4 text-[13px] font-bold text-center text-blue-600 animate-pulse";
            s.innerText = "Encoding Face Vectors...";
            const fd = new FormData(e.target);
            try {
                const r = await fetch('/api/enroll', {method:'POST', body:fd});
                const res = await r.json();
                s.className = "mt-4 text-[13px] font-bold text-center " + (r.ok ? "text-green-600" : "text-red-600");
                s.innerText = r.ok ? "VERIFIED." : "ERROR: " + res.error;
                if(r.ok){ e.target.reset(); fetchStaff(); setTimeout(()=>s.className="hidden", 4000); }
            } catch(x){ s.className="mt-4 text-[13px] font-bold text-center text-red-600"; s.innerText = "Timeout Error"; }
        };
    </script>
</body>
</html>
"""

# ==========================================
# 2. ROUTES & API
# ==========================================
@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/get_staff_list', methods=['GET'])
def get_staff_list():
    """Returns json of all active employees (excluding the heavy embedding array)"""
    records = get_all_active_employees()
    staff = []
    # records format from DB module is currently: (emp_id, name, embedding)
    for (emp_id, name, embedding) in records:
        # Note: We aren't doing a custom JOIN here, just pulling what db provides.
        # We'll just hardcode 'General' since DB doesn't select department in our helper
        staff.append({"emp_id": emp_id, "name": name, "department": "Registered"})
    return jsonify(staff)

@app.route('/api/delete/<emp_id>', methods=['DELETE'])
def api_delete_employee(emp_id):
    print(f"\n[HTTP DELETE] Request to delete employee: {emp_id}", flush=True)
    try:
        delete_employee(emp_id)
        return jsonify({"message": f"Successfully deleted employee {emp_id}."}), 200
    except Exception as e:
        print(f"\n[HTTP DELETE] ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/enroll', methods=['POST'])
def enroll():
    print("\n[HTTP POST] Incoming enrollment request...", flush=True)
    try:
        emp_id = request.form.get('emp_id')
        name = request.form.get('name')
        department = request.form.get('department')
        video_file = request.files.get('video')
        
        if not all([emp_id, name, department, video_file]):
            print("[HTTP POST] ERROR: Missing form data", flush=True)
            return jsonify({"error": "Missing form data"}), 400

        print(f"[HTTP POST] Payload received: {name} ({emp_id}) - {department}")
        filename = secure_filename(video_file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        video_file.save(filepath)
        print(f"[HTTP POST] Video safely saved to disk at: {filepath}", flush=True)

        # Process the video to extract the unified facial embedding
        # PASSING EMP_ID to create the folder logs properly
        master_embedding = engine.process_enrollment_video(filepath, emp_id)
        
        print(f"\n[DATABASE] Connecting... Requesting insertion of ID:{emp_id}, Name:{name}", flush=True)
        insert_employee(emp_id, name, department, master_embedding)

        print(f"[CLEANUP] Video processing complete. Removing heavy file: {filepath}", flush=True)
        os.remove(filepath)
        
        print("\n[SUCCESS] Entire system updated. User is instantly recognizable.", flush=True)
        return jsonify({"message": f"Successfully enrolled {name}! Check 'app_data/extracted_faces/{emp_id}/' to see the augmented frames."}), 200

    except Exception as e:
        print(f"\n[HTTP POST] CRITICAL ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ==========================================
# 3. HIGH-SPEED CAMERA STREAM FEED (MULTITHREADED)
# ==========================================
import threading

class FastRTSP:
    """Runs a background daemon thread to constantly clear the RTSP buffer so we always get the absolute newest frame instantly without latency."""
    def __init__(self, src):
        self.stream = cv2.VideoCapture(src, cv2.CAP_FFMPEG)
        self.stream.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.grabbed, self.frame = self.stream.read()
        self.stopped = False
        
        # Start the background thread
        self.thread = threading.Thread(target=self.update, args=(), daemon=True)
        self.thread.start()

    def update(self):
        while not self.stopped:
            if not self.grabbed:
                self.stop()
            else:
                self.grabbed, self.frame = self.stream.read()

    def read(self):
        return self.grabbed, self.frame

    def stop(self):
        self.stopped = True
        self.stream.release()

def generate_camera_frames():
    RTSP_URL = "rtsp://admin:admin1122@192.168.0.189:554/Streaming/Channels/301"
    print(f"\n[CAMERA] Booting Multithreaded High-Speed Stream: {RTSP_URL}", flush=True)
    
    cap = FastRTSP(RTSP_URL)
    
    if not cap.grabbed:
        print("[CAMERA] ERROR: Could not connect to RTSP. Check credentials and retry.", flush=True)
        return

    print("[CAMERA] Locked into Hikvision Stream at real-time speeds.", flush=True)

    # ==========================================
    # ENTERPRISE: FAISS Vector Database Initialization
    # ==========================================
    loop_count = 0
    db_records = get_all_active_employees()
    
    # Pre-allocate FAISS Index (L2 distance or Inner Product for Cosine)
    dimension = 512
    index = faiss.IndexFlatIP(dimension)
    
    faiss_id_to_record = {}
    if len(db_records) > 0:
        embeddings = np.array([r[2] for r in db_records]).astype('float32')
        # Normalize for Inner Product (Cosine Similarity)
        faiss.normalize_L2(embeddings)
        index.add(embeddings)
        for i, (db_emp_id, db_name, _) in enumerate(db_records):
            faiss_id_to_record[i] = (db_emp_id, db_name)

    # PRODUCTION: Dictionary to prevent logging attendance 30 times a second (Cooldown system)
    attendance_cooldown = {}
    COOLDOWN_SECONDS = 300 # Wait 5 minutes before re-logging the same employee
    
    # ENTERPRISE TRACKING (Kalman / EMA Filter for smooth boxes)
    smoothed_boxes = []

    fps_start_time = time.time()
    fps_counter = 0
    current_fps = 0

    while True:
        success, frame = cap.read()
        if not success or frame is None:
            continue

        loop_count += 1
        fps_counter += 1
        if time.time() - fps_start_time > 1.0:
            current_fps = fps_counter
            fps_counter = 0
            fps_start_time = time.time()

        # Database auto-sync every ~10 seconds using fast memory mapping
        if loop_count % 300 == 0:
            new_records = get_all_active_employees()
            if len(new_records) != len(db_records):
                db_records = new_records
                index.reset()
                if len(db_records) > 0:
                    embeddings = np.array([r[2] for r in db_records]).astype('float32')
                    faiss.normalize_L2(embeddings)
                    index.add(embeddings)
                    faiss_id_to_record = {i: (rec[0], rec[1]) for i, rec in enumerate(db_records)}

        frame = cv2.resize(frame, (960, 540))

        # We will process 1 frame out of 3 for inference to keep web UI snappy
        if loop_count % 3 == 0:
            faces = engine.app.get(frame)
            drawn_info = []

            for face in faces:
                bbox = face.bbox.astype(int)
                
                best_match_name = "Unknown"
                best_match_id = None
                
                if index.ntotal > 0:
                    live_embedding = face.normed_embedding.astype('float32').reshape(1, -1)
                    faiss.normalize_L2(live_embedding)
                    
                    # Search FAISS vector DB instantly (K=1 nearest neighbor)
                    distances, indices = index.search(live_embedding, 1)
                    score = distances[0][0] # Inner product = cosine similarity
                    
                    # To map inner product to our old format if needed, but 0.38 works identically if normed
                    if score > SIMILARITY_THRESHOLD:
                        idx = indices[0][0]
                        emp_id, db_name = faiss_id_to_record[idx]
                        best_match_name = f"{db_name} ({score:.2f})"
                        best_match_id = emp_id

                # PRODUCTION: Log the attendance to the database if it's strictly a matched person
                if best_match_name != "Unknown" and best_match_id is not None:
                    current_time = time.time()
                    last_logged_time = attendance_cooldown.get(best_match_id, 0)
                    if current_time - last_logged_time > COOLDOWN_SECONDS:
                        log_attendance(best_match_id)
                        attendance_cooldown[best_match_id] = current_time
                        print(f"\n[ATTENDANCE LOGGED] Marked {best_match_name} present at {time.ctime(current_time)}")

                drawn_info.append((bbox, best_match_name))

            # EMA Box Smoothing Algorithm (Anti-Jitter)
            if len(smoothed_boxes) != len(drawn_info):
                smoothed_boxes = drawn_info
            else:
                new_smoothed = []
                for (old_box, _), (new_box, new_name) in zip(smoothed_boxes, drawn_info):
                    # Blend the boxes: 60% new box, 40% old box for glass-like UX
                    blended_box = (new_box * 0.6 + old_box * 0.4).astype(int)
                    new_smoothed.append((blended_box, new_name))
                smoothed_boxes = new_smoothed

        # Draw the Enterprise UI Overlay
        try:
            for (bbox, best_match_name) in smoothed_boxes:
                color = (0, 255, 0) if "Unknown" not in best_match_name else (0, 0, 255)
                x1, y1, x2, y2 = bbox
                
                # Pro UI: Corner brackets instead of full boxes
                thickness = 2
                length = 20
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 1)
                # Top Left
                cv2.line(frame, (x1, y1), (x1 + length, y1), color, thickness)
                cv2.line(frame, (x1, y1), (x1, y1 + length), color, thickness)
                # Bottom Right
                cv2.line(frame, (x2, y2), (x2 - length, y2), color, thickness)
                cv2.line(frame, (x2, y2), (x2, y2 - length), color, thickness)
                
                # Pro UI: Background for text
                (txt_w, txt_h), _ = cv2.getTextSize(best_match_name, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                cv2.rectangle(frame, (x1, y1 - 25), (x1 + txt_w, y1), color, -1)
                text_color = (0,0,0) if color == (0,255,0) else (255,255,255)
                cv2.putText(frame, best_match_name, (x1, y1 - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2)
        except NameError:
            pass # Handle startup

        # Pro UI: HUD Overlay
        cv2.putText(frame, f"LIVE FPS: {current_fps}", (20, 30), cv2.FONT_HERSHEY_DUPLEX, 0.7, (255, 255, 0), 2)
        cv2.putText(frame, f"VECTOR DB: {index.ntotal} Faces", (20, 60), cv2.FONT_HERSHEY_DUPLEX, 0.7, (255, 255, 0), 2)

        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if hasattr(buffer, 'tobytes'):
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_camera_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("\n" + "="*60, flush=True)
    print("🚀 PRODUCTION SERVER ACTIVE (Waitress WSGI)")
    print("Open your browser and copy/paste: http://127.0.0.1:5000", flush=True)
    print("="*60 + "\n", flush=True)
    try:
        from waitress import serve
        serve(app, host='0.0.0.0', port=5000, threads=6)
    except ImportError:
        print("[WARNING] Waitress WSGI not found! Falling back to Flask dev server.", flush=True)
        print("Install Waitress for production: pip install waitress", flush=True)
        app.run(host='0.0.0.0', port=5000, debug=False)

import cv2
import time
import os
from database import init_db, insert_employee, get_all_active_employees
from face_engine import FaceEngine, calculate_similarity

# Constants
SIMILARITY_THRESHOLD = 0.45 

def enroll_new_staff(emp_id, name, department, video_path, engine):
    """Admin function: Process a video and save the employee to the DB."""
    try:
        master_embedding = engine.process_enrollment_video(video_path)
        insert_employee(emp_id, name, department, master_embedding)
        print(f"=== Enrollment Complete for {name} ===")
    except Exception as e:
        print(f"Enrollment failed: {e}")

def run_live_attendance_camera(engine):
    """Simulates the top-mounted camera running 24/7."""
    
    # 1. Load the database of known employees into memory for quick checking
    db_records = get_all_active_employees()
    if not db_records:
        print("No active employees in database! Please enroll someone first.")
        return

    print(f"Loaded {len(db_records)} active employees from the database.")
    
    # 2. Open Webcam (0 is usually the built-in laptop cam, you can replace with an RTSP link)
    cap = cv2.VideoCapture(0)
    
    print("Starting Live Attendance Camera...")
    print("Press 'q' at any time to exit.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Optional: You can resize the frame to make it process faster on CPU
        # frame = cv2.resize(frame, (640, 480))
        
        # 3. Detect faces in the current frame
        faces = engine.app.get(frame)
        
        for face in faces:
            # Get bounding box for drawing (x1, y1, x2, y2)
            bbox = face.bbox.astype(int)
            x1, y1, x2, y2 = bbox
            
            # The exact embedding of whoever is currently in the frame
            live_embedding = face.normed_embedding
            
            # 4. Compare against the database
            best_match_name = "Unknown"
            best_score = -1.0
            
            for (db_emp_id, db_name, db_embedding) in db_records:
                score = calculate_similarity(live_embedding, db_embedding)
                if score > best_score:
                    best_score = score
                    if score > SIMILARITY_THRESHOLD:
                        best_match_name = f"{db_name} ({score:.2f})"
                        # TODO: Here you would log attendance if they haven't been seen recently
            
            # 5. Draw the bounding box and name on screen (Visual Feedback)
            color = (0, 255, 0) if best_match_name != "Unknown" else (0, 0, 255) # Green for match, Red for unknown
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, best_match_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
        cv2.imshow("Attendance Feed", frame)
        
        # Prevent CPU pegging by waiting 1ms per frame, exit if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    print("Initializing Database...")
    init_db()
    
    print("\nBooting up Face Recognition Engine (CPU)...")
    engine = FaceEngine(use_gpu=False)
    
    # Let's create a quick way to record a temporary video using the webcam for enrollment.
    def record_dummy_video(filename="dummy_enrollment.avi", duration=5):
        print(f"Creating a sample {duration}-second enrollment video for testing: PLEASE LOOK AT THE CAMERA.")
        time.sleep(2) # Give the user time to get ready
        
        cap = cv2.VideoCapture(0)
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(filename, fourcc, 10.0, (int(cap.get(3)), int(cap.get(4))))
        
        start_time = time.time()
        while(int(time.time() - start_time) < duration):
            ret, frame = cap.read()
            if ret:
                out.write(frame)
                cv2.imshow('Recording Enrollment...', frame)
                cv2.waitKey(1)
            else:
                break
        
        cap.release()
        out.release()
        cv2.destroyAllWindows()
        print("Recording saved!\n")

    # ==========================================
    # DEMO SCRIPT
    # ==========================================
    print("\n--- ATTENDANCE SYSTEM DEMO ---")
    action = input("Type 'enroll' to record a new employee, or 'live' to test the camera: ")
    
    if action.strip().lower() == 'enroll':
        emp_id = input("Enter Employee ID (e.g. E001): ")
        name = input("Enter Employee Name: ")
        
        temp_video_path = f"enrollment_{emp_id}.avi"
        record_dummy_video(temp_video_path, duration=5)
        
        # Enroll the person into the DB
        enroll_new_staff(emp_id, name, "IT", temp_video_path, engine)
        
        # Clean up the large video file - we don't need it because we saved the embedding!
        try:
            os.remove(temp_video_path)
            print("Deleted enrollment video; only 512-byte embedding retained in SQLite.")
        except Exception as e:
            pass

    elif action.strip().lower() == 'live':
        print("\nStarting live inference engine...")
        run_live_attendance_camera(engine)

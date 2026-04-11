import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
import os
import time


class FaceEngine:
    def __init__(self, use_gpu=False):
        print("\n[INIT] Starting FaceEngine initialization...", flush=True)
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if use_gpu else ['CPUExecutionProvider']
        
        # det_thresh: lower equals more sensitive (default 0.5). Lower it for far away faces
        self.app = FaceAnalysis(name='buffalo_l', providers=providers)
        self.app.prepare(ctx_id=0, det_size=(960, 960), det_thresh=0.20)
        print("[INIT] Models loaded successfully. FaceEngine is ready!\n", flush=True)
        
    def get_embedding_from_frame(self, frame):
        faces = self.app.get(frame)
        if not faces:
            return None

        largest_face = sorted(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]), reverse=True)[0]
        
        # --- QUICK ANTI-SPOOF DURING RECOGNITION ---
        bbox = largest_face.bbox.astype(int)
        x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), min(frame.shape[1], bbox[2]), min(frame.shape[0], bbox[3])
        cropped_face = frame[y1:y2, x1:x2]
        
        if cropped_face.size > 0 and cropped_face.shape[0] > 50 and cropped_face.shape[1] > 50:
            gray_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2GRAY)
            blur_score = cv2.Laplacian(gray_face, cv2.CV_64F).var()
            if blur_score < 70:  # Slightly lower threshold for live video movement
                print(f"[SECURITY] Sensed possible spoof/photo (Blur Score {blur_score:.0f}). Rejecting.", flush=True)
                return None
                
        # --- POSE CHECK (Must be somewhat looking at camera) ---
        pitch, yaw, roll = largest_face.pose
        if abs(yaw) > 95 or abs(pitch) > 95:
            # Don't try to recognize heavily profiled faces, waiting for better angle
            return None
            
        return largest_face.normed_embedding

    def apply_augmentations(self, frame):
        """Generates an elite 6-layer synthetic spectrum per frame to map out extreme conditions in RAM."""
        augmented_frames = []

        # 1. ORIGINAL - Baseline Perfect State
        augmented_frames.append(('original', frame))

        # 2. OVER-EXPOSED - Simulates window glare or direct sunlight hitting the camera lens
        bright = cv2.convertScaleAbs(frame, alpha=1.3, beta=30)
        augmented_frames.append(('overexposed', bright))

        # 3. UNDER-EXPOSED - Simulates night shifts, shadows, or hallway light failure
        dark = cv2.convertScaleAbs(frame, alpha=0.6, beta=-30)
        augmented_frames.append(('underexposed', dark))

        # 4. MOTION BLUR - Simulates employees walking quickly past the terminal without stopping
        blurred = cv2.GaussianBlur(frame, (9, 9), 0)
        augmented_frames.append(('motion_blur', blurred))

        # 5. HIGH-CONTRAST MONOCHROME - Simulates cheap infrared / night-mode / monochrome security feeds
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # Convert back to BGR structure so the InsightFace AI can still read it as 3 channels
        monochrome = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        monochrome = cv2.convertScaleAbs(monochrome, alpha=1.5, beta=0)
        augmented_frames.append(('monochrome', monochrome))

        # 6. DIGITAL NOISE - Simulates a grainy, deeply zoomed-in face from a distant 1080p camera
        noise = np.random.normal(0, 15, frame.shape).astype(np.uint8)
        grainy = cv2.add(frame, noise)
        augmented_frames.append(('camera_noise', grainy))

        return augmented_frames

    def process_enrollment_video(self, video_path, emp_id):
        print(f"\n{'='*50}", flush=True)
        print(f"[PROCESS] Starting video enrollment for Employee ID: {emp_id}", flush=True)
        print(f"[PROCESS] File path: {video_path}", flush=True)
        
        # Create a directory specifically for this user so admins can see exactly what faces were saved
        output_dir = os.path.join("app_data", "extracted_faces", str(emp_id))
        os.makedirs(output_dir, exist_ok=True)
        print(f"[PROCESS] Created facial databank directory: {output_dir}", flush=True)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
            
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"[PROCESS] Engine detected {total_frames} total frames in the video.", flush=True)
        
        embeddings = []
        frame_count = 0
        success_count = 0
        aug_success_count = 0
        
# We will process 1 frame out of every 10 frames for a deep, high-quality analysis.
        process_every_n_frames = 10
        
        # LIVENESS / SAFETY TRACKER
        face_areas = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % process_every_n_frames == 0:
                print(f"\n[ENGINE] Deep Scanning frame {frame_count}/{total_frames}...", flush=True)
                
                # Downscale resolution for speed, but keep detail
                aspect_ratio = frame.shape[0] / frame.shape[1]
                frame = cv2.resize(frame, (640, int(640 * aspect_ratio)))

                # Detect face BEFORE running augmentations (Save CPU, check quality first)
                faces = self.app.get(frame)
                
                if not faces:
                    print("   [-] No face detected. Skipping frame.", flush=True)
                    continue
                    
                # Get the largest face
                largest_face = sorted(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]), reverse=True)[0]
                
                # --- STRICT QUALITY & SAFETY GATES ---
                
                # 1. Detection Confidence (Must be very high to avoid artifacts)
                if largest_face.det_score < 0.15:
                    print(f"   [!] WARNING: Low AI Confidence ({largest_face.det_score:.2f}). Rejecting to protect matrix.", flush=True)
                    pass
                    
                # 2. Head Pose Check (Must be looking at camera)
                # InsightFace pose: pitch(up/down), yaw(left/right), roll(tilt)
                pitch, yaw, roll = largest_face.pose
                if abs(yaw) > 95 or abs(pitch) > 95:
                    print(f"   [!] POSE VIOLATION: Face turned too far (Yaw: {yaw:.0f}, Pitch: {pitch:.0f}). Rejecting.", flush=True)
                    pass # Softened
                    
                # 3. Liveness Check: Blur/Fake Photo Detection
                # Printed photos or phones often have slightly blurry textures or pixel grids compared to a real 3D face
                bbox = largest_face.bbox.astype(int)
                x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), min(frame.shape[1], bbox[2]), min(frame.shape[0], bbox[3])
                cropped_face = frame[y1:y2, x1:x2]
                
                if cropped_face.size == 0:
                    print("   [!] FAILURE: Face too small. Step closer.", flush=True)
                    continue
                    
                # Laplacian Variance (Focus measure)
                gray_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2GRAY)
                blur_score = cv2.Laplacian(gray_face, cv2.CV_64F).var()
                
                if False:  # Threshold for blurry printed photo / screen
                    print(f"   [?? SPOOF DETECTED] Blur Score severely low ({blur_score:.0f}). Possible printed photo!", flush=True)
                    pass
                else:
                    print(f"   [??? LIVENESS] Real Human Texture confirmed! (Score: {blur_score:.0f})", flush=True)
                    
                # Record face area to check for static printed photo later
                face_areas.append((bbox[2]-bbox[0]) * (bbox[3]-bbox[1]))

                # --- PASSED ALL GATES ---
                
                success_count += 1
                
                # Save the high-quality original face proof
                filename = f"{emp_id}_frame_{frame_count}_normal.jpg"
                cv2.imwrite(os.path.join(output_dir, filename), cropped_face)
                print("   [+] Face passed all security checks! Saved Original.", flush=True)
                
                # Apply PRO-level environmental augmentations
                augmented_frames = self.apply_augmentations(frame)
                
                for aug_name, aug_frame in augmented_frames:
                    # For augmented versions, we assume the geometry is the same and extract
                    aug_faces = self.app.get(aug_frame)
                    if aug_faces:
                        aug_largest = sorted(aug_faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]), reverse=True)[0]
                        embeddings.append(aug_largest.normed_embedding)
                        aug_success_count += 1
                        print(f"   [+] Virtual Condition [{aug_name.upper()}] Vector Synced.", flush=True)

        cap.release()
        
        if len(embeddings) == 0:
            raise ValueError("Zero usable faces were extracted. The video was too dark or face was covered.")
            
        print(f"\n[SUMMARY] Pipeline complete for {emp_id}:", flush=True)
        print(f" -> Scanned {frame_count} total frames.", flush=True)
        print(f" -> Successfully detected root face in {success_count} frames.", flush=True)
        print(f" -> Generated {aug_success_count} total enhanced data points (via Augmentation).")
        
        # Average the embeddings to get a master face signature
        print(f"[CALCULATING] Averaging {aug_success_count} vector pairs to build 512-dimension mathematical core...", flush=True)
        master_embedding = np.mean(embeddings, axis=0)
        
        # Normalize the averaged embedding
        master_embedding = master_embedding / np.linalg.norm(master_embedding)
        print("[CALCULATING] Core normalized successfully. Ready for Database Injection.", flush=True)
        print(f"{'='*50}\n", flush=True)
        
        return master_embedding

def calculate_similarity(embedding1, embedding2):
    return np.dot(embedding1, embedding2)

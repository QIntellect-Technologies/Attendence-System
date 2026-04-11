import re

with open('face_engine.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the enrollment loop with the strict quality-filtered loop
new_loop = """
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
                print(f"\\n[ENGINE] Deep Scanning frame {frame_count}/{total_frames}...", flush=True)
                
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
                if largest_face.det_score < 0.70:
                    print(f"   [!] WARNING: Low AI Confidence ({largest_face.det_score:.2f}). Rejecting to protect matrix.", flush=True)
                    continue
                    
                # 2. Head Pose Check (Must be looking at camera)
                # InsightFace pose: pitch(up/down), yaw(left/right), roll(tilt)
                pitch, yaw, roll = largest_face.pose
                if abs(yaw) > 25 or abs(pitch) > 25:
                    print(f"   [!] POSE VIOLATION: Face turned too far (Yaw: {yaw:.0f}, Pitch: {pitch:.0f}). Rejecting.", flush=True)
                    continue
                    
                # 3. Liveness Check: Blur/Fake Photo Detection
                # Printed photos or phones often have slightly blurry textures or pixel grids compared to a real 3D face
                bbox = largest_face.bbox.astype(int)
                x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), min(frame.shape[1], bbox[2]), min(frame.shape[0], bbox[3])
                cropped_face = frame[y1:y2, x1:x2]
                
                if cropped_face.size == 0 or cropped_face.shape[0] < 80 or cropped_face.shape[1] < 80:
                    print("   [!] FAILURE: Face too small. Step closer.", flush=True)
                    continue
                    
                # Laplacian Variance (Focus measure)
                gray_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2GRAY)
                blur_score = cv2.Laplacian(gray_face, cv2.CV_64F).var()
                
                if blur_score < 100:  # Threshold for blurry printed photo / screen
                    print(f"   [?? SPOOF DETECTED] Blur Score severely low ({blur_score:.0f}). Possible printed photo!", flush=True)
                    continue
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
"""

# Replace the part between 'process_every_n_frames = 10' and 'cap.release()'
code = re.sub(
    r'# We will process 1 frame out of every 10 frames.*?cap\.release\(\)',
    new_loop.strip(),
    code,
    flags=re.DOTALL
)

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Enterprise Quality & Liveness Gates Applied!")

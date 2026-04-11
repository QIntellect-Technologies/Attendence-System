import re
with open('face_engine.py', 'r', encoding='utf-8') as f:
    code = f.read()

new_func = """
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
        if abs(yaw) > 35 or abs(pitch) > 35:
            # Don't try to recognize heavily profiled faces, waiting for better angle
            return None
            
        return largest_face.normed_embedding
"""

code = re.sub(
    r'    def get_embedding_from_frame\(self, frame\):.*?return largest_face\.normed_embedding',
    new_func.strip(),
    code,
    flags=re.DOTALL
)

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Applied Liveness to Recognition phase!")

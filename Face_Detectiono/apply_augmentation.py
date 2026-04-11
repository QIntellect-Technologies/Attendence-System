import code
import re

with open('face_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

new_aug_func = '''    def apply_augmentations(self, frame):
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

        return augmented_frames'''

# Replace the old apply_augmentations function
text = re.sub(r'    def apply_augmentations.*?return augmented_frames', new_aug_func, text, flags=re.DOTALL)

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('Elite Data Data Augmentations Installed!')

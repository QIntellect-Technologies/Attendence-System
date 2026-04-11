import re

with open('face_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

# I will comment out the strict rejection lines directly using regex
text = re.sub(r'if abs\(yaw\) > 35 or abs\(pitch\) > 35:(.*?)\n\s*continue', r'if abs(yaw) > 95 or abs(pitch) > 95:\1\n                    pass # Softened', text, flags=re.DOTALL)
text = re.sub(r'if blur_score < 40:(.*?)\n\s*continue', r'if blur_score < 5:\1\n                    pass # Softened', text, flags=re.DOTALL)
text = re.sub(r'if largest_face\.det_score < 0\.55:(.*?)\n\s*continue', r'if largest_face.det_score < 0.35:\1\n                    pass # Softened', text, flags=re.DOTALL)

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Gates disabled.")

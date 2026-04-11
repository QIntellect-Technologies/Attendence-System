import re

with open('face_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure we bypass ANY size or blur restriction because veils completely break standard laplacian blur detection (fabric doesn't look like skin)
text = re.sub(r'if blur_score < 5:(.*?)pass # Softened', r'if False:\1pass', text, flags=re.DOTALL)
text = re.sub(r'if cropped_face\.size == 0 or cropped_face\.shape\[0\] < 20 or cropped_face\.shape\[1\] < 20:(.*?)continue', r'if cropped_face.size == 0:\1continue', text, flags=re.DOTALL)
text = re.sub(r'if largest_face\.det_score < 0\.35:(.*?)pass # Softened', r'if largest_face.det_score < 0.15:\1pass', text, flags=re.DOTALL)

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Veil support implemented!")

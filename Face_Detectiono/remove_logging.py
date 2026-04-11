import re

print('Reverting to simple print statements and removing logging...')

# --- APP.PY ---
with open('app.py', 'r', encoding='utf-8') as f:
    app_code = f.read()

# Remove logging setup
app_code = re.sub(r'import logging\nfrom flask import Flask', 'from flask import Flask', app_code)
app_code = re.sub(r'# Setup Professional Logging.*?logger = logging\.getLogger\(\'QIntellectApp\'\)\n', '', app_code, flags=re.DOTALL)

# Replace logger.x() with print()
app_code = re.sub(r'logger\.info\((.*?)\)', r'print(\1, flush=True)', app_code)
app_code = re.sub(r'logger\.warning\((.*?)\)', r'print("[WARNING] " + \1, flush=True)', app_code)
app_code = re.sub(r'logger\.error\((.*?)\)', r'print("[ERROR] " + \1, flush=True)', app_code)
app_code = re.sub(r'logger\.debug\((.*?)\)', r'print("[DEBUG] " + \1, flush=True)', app_code)

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(app_code)

# --- FACE_ENGINE.PY ---
with open('face_engine.py', 'r', encoding='utf-8') as f:
    fe_code = f.read()

fe_code = re.sub(r'import logging\n\nlogger = logging\.getLogger\(\'QIntellectApp\.FaceEngine\'\)\n', '', fe_code)

fe_code = re.sub(r'logger\.info\((.*?)\)', r'print(\1, flush=True)', fe_code)
fe_code = re.sub(r'logger\.warning\((.*?)\)', r'print("[WARNING] " + \1, flush=True)', fe_code)
fe_code = re.sub(r'logger\.error\((.*?)\)', r'print("[ERROR] " + \1, flush=True)', fe_code)
fe_code = re.sub(r'logger\.debug\((.*?)\)', r'print("[DEBUG] " + \1, flush=True)', fe_code)

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(fe_code)

print('Done!')

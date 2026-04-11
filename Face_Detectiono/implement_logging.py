import re
import os

print('Applying logging to app.py...')
with open('app.py', 'r', encoding='utf-8') as f:
    app_code = f.read()

log_setup = '''import os
import time
import cv2
import numpy as np
import faiss
import logging
from flask import Flask, request, jsonify, render_template_string, Response

# Setup Professional Logging
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | [%(filename)s:%(lineno)d] | %(message)s',
    handlers=[
        logging.FileHandler('logs/system.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('QIntellectApp')
'''

app_code = re.sub(r'import os.*?from flask import Flask, request, jsonify, render_template_string, Response', log_setup, app_code, flags=re.DOTALL)

# Regular expression to replace all prints with logger.info, preserving the inner content
app_code = re.sub(r'print\(\"(.*?)\"\)', r'logger.info("\1")', app_code)
app_code = re.sub(r'print\(f\"(.*?)\"\)', r'logger.info(f"\1")', app_code)
app_code = re.sub(r'print\(\'(.*?)\'\)', r"logger.info('\1')", app_code)
app_code = re.sub(r'print\(f\'(.*?)\'\)', r"logger.info(f'\1')", app_code)
# Handle multi-line string prints roughly by converting the prefix
app_code = app_code.replace('print(', 'logger.info(')

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(app_code)

print('Applying logging to face_engine.py...')
with open('face_engine.py', 'r', encoding='utf-8') as f:
    fe_code = f.read()

log_setup_fe = '''import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
import os
import time
import logging

logger = logging.getLogger('QIntellectApp.FaceEngine')
'''

fe_code = re.sub(r'import cv2.*?import time', log_setup_fe, fe_code, flags=re.DOTALL)

fe_code = re.sub(r'print\(\"(.*?)\"\)', r'logger.info("\1")', fe_code)
fe_code = re.sub(r'print\(f\"(.*?)\"\)', r'logger.info(f"\1")', fe_code)
fe_code = re.sub(r'print\(\'(.*?)\'\)', r"logger.info('\1')", fe_code)
fe_code = re.sub(r'print\(f\'(.*?)\'\)', r"logger.info(f'\1')", fe_code)
fe_code = fe_code.replace('print(', 'logger.info(')

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(fe_code)

import shutil
if os.path.exists('implement_logging.py'):
    pass
print('Done!')

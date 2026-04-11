with open('face_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

import re
# Fix the raw newline inside the f-string that causes SyntaxError
text = text.replace('print(f"\\n[ENGINE]', 'print(f"\\\\n[ENGINE]')
# In case it actually was a real newline character, let's fix it this way:
text = re.sub(r'print\(f"\n\[ENGINE\]', 'print(f"\\\\n[ENGINE]', text)

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(text)

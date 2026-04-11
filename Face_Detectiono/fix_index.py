with open('face_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the bug where changing "continue" to "pass # Softened" made it try to access sorted(faces)[0] even when faces was empty!
text = text.replace('                    pass # Softened\n                    \n                # Get the largest face', '                    continue\n                    \n                # Get the largest face')

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("IndexError fixed!")

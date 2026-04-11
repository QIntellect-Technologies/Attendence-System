import code
with open('face_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('Saved! (Original, flush=True)")', 'Saved! (Original)", flush=True)')
text = text.replace('aug_name.upper(, flush=True)', 'aug_name.upper()')
text = text.replace('via Augmentation, flush=True', 'via Augmentation')

with open('face_engine.py', 'w', encoding='utf-8') as f:
    f.write(text)

with open('app.py', 'r', encoding='utf-8') as f:
    app_text = f.read()
    
app_text = app_text.replace('{str(e, flush=True)}', '{str(e)}')
app_text = app_text.replace('{emp_id}, flush=True', '{emp_id}')
app_text = app_text.replace('Waitress WSGI, flush=True', 'Waitress WSGI')
app_text = app_text.replace('time.ctime(current_time, flush=True)', 'time.ctime(current_time)')

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(app_text)
print('Fixed!')

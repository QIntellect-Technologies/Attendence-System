import code
with open('app.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('?? PRODUCTION SERVER ACTIVE', '[======] PRODUCTION SERVER ACTIVE')
text = text.replace("logging.FileHandler('logs/system.log')", "logging.FileHandler('logs/system.log', encoding='utf-8')")

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed!')

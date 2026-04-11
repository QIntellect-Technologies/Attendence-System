with open('app.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('192.168.0.189:554/Streaming/Channels/101', '192.168.0.189:554/Streaming/Channels/301')

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Switched to Camera 3!")

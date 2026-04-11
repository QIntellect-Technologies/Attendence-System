with open('app.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('192.168.0.199:554/Streaming/Channels/301', '192.168.0.189:554/Streaming/Channels/101')

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(text)

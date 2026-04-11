import cv2

# Test connecting to Hikvision Camera 3
RTSP_URL = "rtsp://admin:admin1122@192.168.0.199:554/Streaming/Channels/301"

print(f"Attempting to connect to: {RTSP_URL}")
cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)

if not cap.isOpened():
    print('Failed to open RTSP stream. Check if your password is "admin".')
    print('Typical logins: admin/admin, admin/12345, admin/password')
else:
    print('Successfully connected! Press "q" to exit video window.')
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Dropped frame!")
            break
        
        # Resize to fit on screen just in case it's 4k
        frame_resized = cv2.resize(frame, (800, 600))
        cv2.imshow("Test Camera 3 Stream", frame_resized)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()

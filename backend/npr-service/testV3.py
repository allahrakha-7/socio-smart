import cv2
import pytesseract
import re
import time
import serial
import urllib.request
import json

# ================= Tesseract =================
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ================= Backend Configuration =================
BACKEND_URL = 'http://localhost:5000/api/gate/verify'

def verify_plate_backend(plate_number):
    try:
        data = json.dumps({'plate_number': plate_number}).encode('utf-8')
        req = urllib.request.Request(
            BACKEND_URL, 
            data=data, 
            headers={'Content-Type': 'application/json'}, 
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data.get('authorized', False)
    except Exception as e:
        print(f"Backend communication error ({BACKEND_URL}):", e)
        return False


# ================= Serial =================
serial_port = serial.Serial('COM7', 9600, timeout=1)

# ================= Variables =================
MIN_WIDTH = 100
MIN_HEIGHT = 40

last_detected_number = ""

ready_to_scan = True
wait_start = 0
wait_time = 5

# ================= Camera =================
cap = cv2.VideoCapture(0)
cap.set(3, 640)
cap.set(4, 480)


# ================= OCR FUNCTION =================
def detect_plate():
    success, img = cap.read()

    if not success:
        return None, img

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5),0)
    edges = cv2.Canny(blur,100,200)

    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    for c in contours:
        approx = cv2.approxPolyDP(c,0.02*cv2.arcLength(c,True),True)

        if len(approx) == 4:
            x,y,w,h = cv2.boundingRect(approx)

            if w >= MIN_WIDTH and h >= MIN_HEIGHT:

                ratio = w/h

                if 2 < ratio < 5:

                    cv2.rectangle(img,(x,y),(x+w,y+h),(0,255,0),2)

                    roi = img[y:y+h, x:x+w]

                    gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                    gray_roi = cv2.resize(
                        gray_roi,
                        None,
                        fx=2,
                        fy=2,
                        interpolation=cv2.INTER_CUBIC
                    )

                    _, gray_roi = cv2.threshold(
                        gray_roi,
                        120,
                        255,
                        cv2.THRESH_BINARY
                    )

                    config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789'
                    text = pytesseract.image_to_string(
                        gray_roi,
                        config=config
                    ).strip()

                    text = re.sub(r'[^0-9]', '', text)

                    return text, img

    return None, img


# ================= SERIAL FUNCTION =================
def send_serial(data):
    serial_port.write(f"{data}\n".encode())
    print("Sent:", data)


# ================= MAIN LOOP =================
while True:

    number, frame = detect_plate()

    current_time = time.time()

    if ready_to_scan:

        if number:
            print("Detected:", number)

            is_authorized = verify_plate_backend(number)
            if is_authorized:
                print("MATCH FOUND - AUTHORIZED")
                send_serial(1)
            else:
                print("NO MATCH - DENIED")
                send_serial(0)

            ready_to_scan = False
            wait_start = current_time

    else:
        remaining = wait_time - (current_time - wait_start)

        cv2.putText(
            frame,
            f"Waiting: {int(remaining)}s",
            (50,50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0,0,255),
            2
        )

        if remaining <= 0:
            ready_to_scan = True
            print("Rescan Ready")

    cv2.imshow("Result", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break


cap.release()
cv2.destroyAllWindows()
serial_port.close()
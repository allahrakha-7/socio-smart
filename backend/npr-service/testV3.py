import cv2
import pytesseract
import re
import time
import serial
import firebase_admin
from firebase_admin import credentials, db
import os

# ================= Tesseract =================
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ================= Configuration =================
BACKEND_URL = "https://sociosmart-backend.onrender.com"  # Production Render API URL (change to 'http://localhost:5000' for local testing)

# ================= Firebase =================
firebase_enabled = False

try:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    cert_path = os.path.join(script_dir, "car-scaning-firebase-adminsdk-fbsvc-54503e6285.json")
    if os.path.exists(cert_path):
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://car-scaning-default-rtdb.firebaseio.com/'
        })
        firebase_enabled = True
        print("[Firebase] Admin SDK initialized successfully.")
    else:
        print("[Firebase] WARNING: Credentials file not found. Running in local/REST fallback mode.")
except Exception as e:
    print("[Firebase] Failed to initialize Admin SDK (falling back to REST/Local mode):", e)

# Firebase path:
# cars/
#    car1 : 5897
#    car2 : 123
#    car3 : 2024

def get_firebase_numbers():
    global firebase_enabled
    if not firebase_enabled:
        # Fallback to direct REST API read if admin sdk credentials failed/expired
        try:
            import urllib.request
            import json
            with urllib.request.urlopen("https://car-scaning-default-rtdb.firebaseio.com/cars.json", timeout=3) as r:
                data = json.loads(r.read().decode('utf-8'))
                numbers = set()
                if data:
                    if isinstance(data, dict):
                        for key, value in data.items():
                            clean_num = re.sub(r'[^A-Z0-9]', '', str(value).upper())
                            numbers.add(clean_num)
                    elif isinstance(data, list):
                        for value in data:
                            if value is not None:
                                clean_num = re.sub(r'[^A-Z0-9]', '', str(value).upper())
                                numbers.add(clean_num)
                return numbers
        except Exception:
            return set()
    try:
        ref = db.reference("cars")
        data = ref.get()
        numbers = set()
        if data:
            for key, value in data.items():
                # Clean Firebase numbers to be alphanumeric
                clean_num = re.sub(r'[^A-Z0-9]', '', str(value).upper())
                numbers.add(clean_num)
        return numbers
    except Exception as e:
        err_msg = str(e)
        if "invalid_grant" in err_msg or "account not found" in err_msg or "auth" in err_msg.lower():
            print("[Firebase RTDB] WARNING: Firebase service account credentials invalid or expired. Fallback database enabled.")
            firebase_enabled = False
        else:
            print("Error fetching Firebase numbers:", e)
        return set()

# ================= Backend API Helper =================
def verify_plate_backend(plate_number):
    try:
        import json
        import urllib.request
        data = json.dumps({'plate_number': plate_number}).encode('utf-8')
        req = urllib.request.Request(
            f'{BACKEND_URL}/api/gate/verify', 
            data=data, 
            headers={'Content-Type': 'application/json'}, 
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data.get('authorized', False)
    except Exception as e:
        print("[NPR System] Warning: Backend API verify failed:", e)
        return False

def notify_scanning_backend(plate_number):
    try:
        import json
        import urllib.request
        data = json.dumps({'plate_number': plate_number}).encode('utf-8')
        req = urllib.request.Request(
            f'{BACKEND_URL}/api/gate/scanning', 
            data=data, 
            headers={'Content-Type': 'application/json'}, 
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=1.5) as response:
            return True
    except Exception as e:
        return False

# ================= Serial =================
try:
    serial_port = serial.Serial('COM7', 9600, timeout=1)
    print("[Serial] Connected successfully on COM7")
except Exception as e:
    print("[Serial] WARNING: COM7 port unavailable. Running in Simulation/Camera mode.")
    serial_port = None

# ================= Firebase Listener =================
def gate_command_listener(event):
    if event.data == "open":
        print("[Firebase Listener] Received OPEN command from cloud!")
        send_serial(1)
        try:
            db.reference("gateControl/command").set("closed")
        except Exception as ex:
            print("Failed to reset gate command:", ex)

if firebase_enabled:
    try:
        db.reference("gateControl/command").listen(gate_command_listener)
        print("[Firebase RTDB] Listening for gateControl/command updates.")
    except Exception as le:
        print("[Firebase RTDB] Streaming listener failed, falling back to camera scanning only:", le)
else:
    print("[Firebase RTDB] Streaming listener disabled (running in fallback database mode).")

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

    if not success or img is None:
        import numpy as np
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(
            img,
            "No Camera Detected (Press 'i' to simulate scan)",
            (50, 240),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 0, 255),
            2
        )
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

                    config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                    text = pytesseract.image_to_string(
                        gray_roi,
                        config=config
                    ).strip()

                    text = re.sub(r'[^A-Z0-9]', '', text.upper())

                    return text, img

    return None, img


# ================= SERIAL FUNCTION =================
def send_serial(data):
    if serial_port:
        try:
            serial_port.write(f"{data}\n".encode())
            print("Sent to Arduino:", data)
        except Exception as e:
            print("Serial write error:", e)
    else:
        print("[Simulation Mode] Actuated gate control command:", data)


# ================= MAIN LOOP =================
simulated_number = None

while True:

    # Firebase se latest numbers fetch
    stored_numbers = get_firebase_numbers()

    number, frame = detect_plate()

    if simulated_number:
        number = simulated_number
        simulated_number = None

    current_time = time.time()

    if ready_to_scan:

        if number:
            print("Detected:", number)
            print("Firebase Numbers:", stored_numbers)

            # Inform the dashboard that we are scanning/analyzing this number
            notify_scanning_backend(number)

            # Try backend verification first to allow socket triggers & notification flows
            authorized = verify_plate_backend(number)

            if authorized:
                print("MATCH FOUND via Backend API")
                send_serial(1)
            else:
                # Fallback to direct Firebase local comparison after normalizing
                clean_detected = re.sub(r'[^A-Z0-9]', '', number.upper())
                detected_digits = re.sub(r'[^0-9]', '', clean_detected)

                local_match = False
                for stored in stored_numbers:
                    clean_stored = re.sub(r'[^A-Z0-9]', '', str(stored).upper())
                    stored_digits = re.sub(r'[^0-9]', '', clean_stored)

                    if clean_detected == clean_stored:
                        local_match = True
                        break
                    if detected_digits and stored_digits and detected_digits == stored_digits:
                        local_match = True
                        break

                if local_match:
                    print("MATCH FOUND via Local Firebase Sync")
                    send_serial(1)
                else:
                    print("NO MATCH - UNRECOGNIZED")
                    send_serial(0)
                    if firebase_enabled:
                        try:
                            db.reference("unrecognized").set(number)
                            print("Synced unrecognized plate to Firebase")
                        except Exception as fe:
                            print("Firebase upload failed:", fe)

            ready_to_scan = False
            wait_start = current_time

    else:
        remaining = wait_time - (current_time - wait_start)

        if frame is not None:
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

    if frame is not None:
        cv2.imshow("Result", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('i'):
        print("\n--- NPR CAMERA SIMULATION MODE ---")
        try:
            sim_input = input("Enter plate number to simulate scan (e.g. ABJ 1638): ").strip().upper()
            if sim_input:
                simulated_number = sim_input
        except Exception as e:
            print("Simulation input error:", e)


cap.release()
cv2.destroyAllWindows()
if serial_port:
    serial_port.close()
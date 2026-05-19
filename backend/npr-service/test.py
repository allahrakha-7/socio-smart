import cv2
import pytesseract
import re
import time
import serial

# ================= Tesseract Path =================
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ================= Serial =================
serial_port = serial.Serial('COM7', 9600, timeout=1)

# ================= STORED NUMBERS (FAST LOOKUP SET) =================
stored_numbers = {
    "5897",
    "123",
    "2024",
    "8497",
    "24",
    "8326",
    "8774",
    "587",
    "5700"

}

# ================= VARIABLES =================
success_flag = False
MIN_WIDTH = 100
MIN_HEIGHT = 40

flag2 = False
active_detection = False

serial_result = 0
start_time = None

last_detected_number = ""

# ================= CAMERA =================
cap = cv2.VideoCapture(0)
cap.set(3, 640)
cap.set(4, 480)

# ================= OCR FUNCTION =================
def detect_plate():
    success, img = cap.read()
    if not success:
        print("Camera error")
        return None, img

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 100, 200)

    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    for c in contours:
        approx = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)

        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)

            if w >= MIN_WIDTH and h >= MIN_HEIGHT:

                ratio = w / h

                if 2 < ratio < 5:

                    cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)

                    roi = img[y:y + h, x:x + w]

                    # ================= OCR =================
                    gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

                    gray_roi = cv2.resize(gray_roi, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

                    _, gray_roi = cv2.threshold(gray_roi, 120, 255, cv2.THRESH_BINARY)

                    config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789'

                    text = pytesseract.image_to_string(gray_roi, config=config).strip()

                    # keep only numbers
                    text = re.sub(r'[^0-9]', '', text)

                    return text, img

    return None, img

# ================= SERIAL SEND =================
def send_serial(data):
    serial_port.write(f"{data}\n".encode())
    print("Sent:", data)

# ================= MAIN LOOP =================
while True:
    success, frame = cap.read()

    if not success:
        print("Camera not detected")
        break

    if active_detection:

        elapsed = time.time() - start_time
        remaining = max(0, int(10 - elapsed))

        number, frame = detect_plate()

        result_text = ""
        color = (0, 0, 255)

        if number:
            last_detected_number = number
            print("Detected Number:", last_detected_number)

            if flag2:

                if number in stored_numbers:
                    result_text = "SUCCESS"
                    color = (0, 255, 0)
                    serial_result = 1
                else:
                    result_text = "UNSUCCESS"
                    color = (0, 0, 255)
                    serial_result = 0

                flag2 = False

            cv2.putText(frame, result_text, (50, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

        else:
            print("No Plate")

        cv2.putText(frame, f"Time Left: {remaining}s",
                    (450, 50), cv2.FONT_HERSHEY_SIMPLEX,
                    1, (255, 255, 255), 2)

        # ================= FINAL RESULT =================
        if remaining == 0:

            print("\n========= FINAL RESULT =========")
            print("Detected Number:", last_detected_number)

            if serial_result == 1:
                print("Result: MATCH FOUND")
                send_serial(1)
            else:
                print("Result: NO MATCH")
                send_serial(0)

            print("================================\n")

            active_detection = False
            serial_result = 0

    else:
        number, frame = detect_plate()

    cv2.imshow("Result", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord('q'):
        break

    elif key == ord('s'):
        active_detection = True
        flag2 = True
        start_time = time.time()
        print("Detection Started")

cap.release()
cv2.destroyAllWindows()
serial_port.close()
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO


# --------------------------------------------------
# Configuration
# --------------------------------------------------

# Resolved from this file, so the server works no matter which directory it's started from.
# models/best.pt is a copy of runs/detect/okra-health-gpu/weights/best.pt.
MODEL_PATH = Path(__file__).resolve().parent / "models" / "best.pt"

CONFIDENCE_THRESHOLD = 0.50


# --------------------------------------------------
# Load model
# --------------------------------------------------

print(f"Loading model: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))

print("YOLO model loaded successfully.")


# --------------------------------------------------
# FastAPI
# --------------------------------------------------

app = FastAPI(
    title="Okradesu Crop Health AI",
    version="1.0.0"
)


# Allow React Native / development clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Okradesu Crop Health AI",
        "model": "YOLO11n"
    }


# --------------------------------------------------
# Crop health prediction
# --------------------------------------------------

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    # Read uploaded image
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        image = Image.open(
            __import__("io").BytesIO(image_bytes)
        ).convert("RGB")
    except (UnidentifiedImageError, OSError) as e:
        print(f"/predict: could not decode upload "
              f"(filename={file.filename!r}, content_type={file.content_type!r}, "
              f"bytes={len(image_bytes)}): {e}")
        raise HTTPException(status_code=400, detail="Uploaded file is not a readable image.")

    # Run YOLO
    results = model.predict(
        source=image,
        conf=CONFIDENCE_THRESHOLD,
        imgsz=416,
        device=0,
        verbose=False
    )

    result = results[0]

    detections = []

    for box in result.boxes:

        class_id = int(box.cls[0])
        confidence = float(box.conf[0])

        class_name = model.names[class_id]

        x1, y1, x2, y2 = box.xyxy[0].tolist()

        detections.append({
            "class_id": class_id,
            "class_name": class_name,
            "confidence": round(confidence, 3),
            "bbox": {
                "x1": round(x1, 1),
                "y1": round(y1, 1),
                "x2": round(x2, 1),
                "y2": round(y2, 1)
            }
        })

    # --------------------------------------------------
    # Aggregate detections
    # --------------------------------------------------

    disease_classes = {
        "Class 1 - Cercospora leaf spot",
        "Class 2- Downy Mildew",
        "Class 4 - Leaf Curly Virus"
    }

    healthy_class = "Class 3 - Healthy"

    disease_detections = [
        d for d in detections
        if d["class_name"] in disease_classes
    ]

    healthy_detections = [
        d for d in detections
        if d["class_name"] == healthy_class
    ]

    # Find strongest disease signal
    strongest_disease = None

    if disease_detections:
        strongest_disease = max(
            disease_detections,
            key=lambda x: x["confidence"]
        )

    # --------------------------------------------------
    # Final visual status
    # --------------------------------------------------

    if strongest_disease:

        visual_status = "disease_detected"

        visual_result = strongest_disease["class_name"]

        visual_confidence = strongest_disease["confidence"]

    elif healthy_detections:

        strongest_healthy = max(
            healthy_detections,
            key=lambda x: x["confidence"]
        )

        visual_status = "healthy"

        visual_result = "Healthy"

        visual_confidence = strongest_healthy["confidence"]

    else:

        visual_status = "uncertain"

        visual_result = "No clear detection"

        visual_confidence = 0.0

    return {
        "success": True,

        "visual_status": visual_status,

        "visual_result": visual_result,

        "confidence": visual_confidence,

        "confidence_threshold": CONFIDENCE_THRESHOLD,

        "detections": detections,

        "detection_count": len(detections)
    }
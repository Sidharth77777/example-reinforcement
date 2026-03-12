import sys
sys.modules['pyaudio'] = None

from fastapi import FastAPI, Query, UploadFile, File, Request, HTTPException, Header, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import cv2
import numpy as np
from edge_impulse_linux.image import ImageImpulseRunner
import config
from datetime import datetime
import uuid
import cloudinary.uploader

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "model/hospital-project-linux-x86_64-v17.eim"
TEMP_DIR = "temp"

os.makedirs(TEMP_DIR, exist_ok=True)

runner = None
model_info = None

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Load Edge Impulse model
@app.on_event("startup")
def load_model():
    global runner, model_info
    runner = ImageImpulseRunner(MODEL_PATH)
    model_info = runner.init()

    print("Model loaded successfully")
    print("MODEL INFO:")
    print(model_info)


@app.get("/")
def home():
    return {"message": "AI Hospital API Running"}


# ---------------------------
# AI PREDICTION (No temp file)
# ---------------------------
@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        return {"error": "Image too large"}

    np_arr = np.frombuffer(contents, np.uint8)

    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        return {"error": "Invalid image"}

    # OpenCV loads BGR → convert to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Extract features using the SAME pipeline as Edge Impulse Studio !!!!!!!!IMPORTANT!!!!!!!!
    features, cropped = runner.get_features_from_image_auto_studio_settings(img)
    # !!!!!!!!IMPORTANT!!!!!!!!

    # Run inference
    result = runner.classify(features)

    # Save debug image (what the model actually sees)
    # cv2.imwrite("debug.jpg", cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR))

    classification = result["result"]["classification"]

    highest_label = max(classification, key=classification.get)
    highest_value = classification[highest_label]

    above_threshold = {
        label: value
        for label, value in classification.items()
        if value > 0.5 and value != highest_value
    }

    return {
        "top_prediction": {
            "label": highest_label,
            "confidence": highest_value
        },
        "others_above_0.5": above_threshold
    }
    
# ---------------------------
# USER FEEDBACK (stores image)
# ---------------------------
@app.post("/feedback")
async def save_feedback(
    file: UploadFile = File(...),
    predicted_label: str = Form(...),
    corrected_label: str = Form(...)
):

    allowed_labels = ["biomedical", "food", "paper", "plastic"]

    if corrected_label not in allowed_labels:
        return {"error": "Invalid corrected label"}

    filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(TEMP_DIR, filename)

    # Save image locally
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    # Upload to Cloudinary
    upload_result = cloudinary.uploader.upload(temp_path)

    image_url = upload_result["secure_url"]

    # Remove temp file
    os.remove(temp_path)

    # Store metadata in Supabase
    data = {
        "image_url": image_url,
        "predicted_label": predicted_label,
        "corrected_label": corrected_label,
        "created_at": datetime.utcnow().isoformat()
    }

    config.supabase.table(config.SUPABASE_TABLE).insert(data).execute()

    return {
        "message": "Feedback saved successfully",
        "image_url": image_url,
        "corrected_label": corrected_label
    }


# ---------------------------
# PAGINATED FEEDBACK FETCH
# ---------------------------
@app.get("/feedbacks")
def get_all_feedbacks(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    admin_user: str = Header(...),
    admin_key: str = Header(...)
):

    if admin_user not in config.ADMIN_ACCESS_USERS:
        raise HTTPException(status_code=403, detail="User not allowed")

    if admin_key != config.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid secret key")

    try:
        start = (page - 1) * limit
        end = start + limit - 1

        response = (
            config.supabase
            .table(config.SUPABASE_TABLE)
            .select("*", count="exact")
            .range(start, end)
            .execute()
        )

        total = response.count

        return {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit,
            "data": response.data
        }

    except Exception as e:
        return {"error": str(e)}
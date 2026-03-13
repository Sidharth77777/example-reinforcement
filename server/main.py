import sys
import types
sys.modules["pyaudio"] = types.ModuleType("pyaudio")

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
from rembg import remove, new_session

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
os.chmod(MODEL_PATH, 0o755)

TEMP_DIR = "temp"

os.makedirs(TEMP_DIR, exist_ok=True)

runner = None
model_info = None

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

rembg_session = new_session(model_path="model/u2netp.onnx")

# Load Edge Impulse model
@app.on_event("startup")
def load_model():
    global runner, model_info
    os.chmod(MODEL_PATH, 0o755)
    
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

    # BGR → RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # -------- BACKGROUND REMOVAL --------
    bg_removed = remove(img, session=rembg_session)

    if bg_removed.shape[2] == 4:
        alpha = bg_removed[:, :, 3]
        rgb = bg_removed[:, :, :3]

        mask = alpha > 0
        result_img = np.zeros_like(rgb)
        result_img[mask] = rgb[mask]
    else:
        result_img = bg_removed
    # ------------------------------------

    # Debug image
    #cv2.imwrite("debug_bg_removed.jpg", cv2.cvtColor(result_img, cv2.COLOR_RGB2BGR))

    # Extract features using Edge Impulse pipeline
    features, cropped = runner.get_features_from_image_auto_studio_settings(result_img)

    # Run inference
    result = runner.classify(features)

    classification = result["result"]["classification"]

    highest_label = max(classification, key=classification.get)
    highest_value = classification[highest_label]

    # ---------- PAPER vs PLASTIC FIX ----------
    paper_score = classification.get("paper", 0)
    plastic_score = classification.get("plastic", 0)

    if abs(paper_score - plastic_score) < 0.2:

        gray = cv2.cvtColor(result_img, cv2.COLOR_RGB2GRAY)

        bright_pixels = np.sum(gray > 220) / gray.size

        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        texture_score = np.var(laplacian)

        if highest_label == "paper" and bright_pixels > 0.05:
            highest_label = "plastic"

        elif highest_label == "plastic" and texture_score > 120:
            highest_label = "paper"
    # -----------------------------------------

    # Sort predictions
    sorted_predictions = sorted(
        classification.items(),
        key=lambda x: x[1],
        reverse=True
    )

    top1_label, top1_conf = sorted_predictions[0]
    top2_label, top2_conf = sorted_predictions[1]

    # ---------- UNCERTAIN CASE ----------
    if top1_conf < 0.7 or (top1_conf - top2_conf) < 0.15:
        return {
            "message": f"Model uncertain. It may be either {top1_label} or {top2_label}.",
            "top_prediction": {
                "label": top1_label,
                "confidence": top1_conf
            },
            "second_prediction": {
                "label": top2_label,
                "confidence": top2_conf
            }
        }

    # ---------- NORMAL CASE ----------
    above_threshold = {
        label: value
        for label, value in classification.items()
        if value > 0.7 and label != top1_label
    }

    return {
        "top_prediction": {
            "label": top1_label,
            "confidence": top1_conf
        },
        "others_above_0.7": above_threshold
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
import sys
import threading
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

MODEL_PATH = "model/hospital-project-linux-x86_64-v21.eim"
# os.chmod(MODEL_PATH, 0o755)

TEMP_DIR = "temp"

os.makedirs(TEMP_DIR, exist_ok=True)

runner = None
model_info = None

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

rembg_session = None

# Load Edge Impulse model
@app.on_event("startup")
def load_model():
    def _load():
        global runner, model_info, rembg_session
        rembg_session = new_session(model_path="model/u2netp.onnx")
        os.chmod(MODEL_PATH, 0o755)
        runner = ImageImpulseRunner(MODEL_PATH)
        model_info = runner.init()
        print("✅ Model loaded successfully")

    threading.Thread(target=_load, daemon=True).start()

@app.get("/")
def home():
    return {"message": "AI Hospital API Running"}


# ---------------------------
# AI PREDICTION (No temp file)
# ---------------------------
@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    if runner is None or rembg_session is None:
        raise HTTPException(status_code=503, detail="Model still loading, please retry in a moment")

    contents = await file.read()

    # if len(contents) > MAX_FILE_SIZE:
    #     return {"error": "File too large. Maximum size is 5MB."}

    np_arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        return {"error": "Invalid or unreadable image"}

    # BGR → RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # -------- BACKGROUND REMOVAL --------
    bg_removed = remove(img, session=rembg_session)

    if bg_removed.shape[2] == 4:
        alpha = bg_removed[:, :, 3]
        rgb   = bg_removed[:, :, :3]
        mask  = alpha > 0
        result_img = np.zeros_like(rgb)
        result_img[mask] = rgb[mask]
    else:
        result_img = bg_removed
    # ------------------------------------

    # -------- EARLY EXIT: blank image after bg removal --------
    if result_img.max() == 0:
        return {"error": "No foreground object detected after background removal"}
    # ----------------------------------------------------------

    # Extract features and run inference
    features, _ = runner.get_features_from_image_auto_studio_settings(result_img)
    result = runner.classify(features)
    classification: dict = result["result"]["classification"]

    # ==========================================
    # PAPER vs PLASTIC HEURISTIC CORRECTION
    # ==========================================
    paper_score   = classification.get("paper",   0.0)
    plastic_score = classification.get("plastic",  0.0)

    # Only apply when the model is genuinely confused
    if abs(paper_score - plastic_score) < 0.2:

        gray = cv2.cvtColor(result_img, cv2.COLOR_RGB2GRAY)
        total_pixels = gray.size

        # --- Signal extraction ---
        bright_pixels  = np.sum(gray > 220) / total_pixels          # reflective highlight ratio
        laplacian      = cv2.Laplacian(gray, cv2.CV_64F)
        texture_score  = float(np.var(laplacian))                    # surface roughness
        edges          = cv2.Canny(gray, 100, 200)
        edge_density   = np.sum(edges > 0) / total_pixels            # wrinkle/fold density

        hsv             = cv2.cvtColor(result_img, cv2.COLOR_RGB2HSV)
        avg_saturation  = float(np.mean(hsv[:, :, 1] / 255.0))

        # --- Score-based nudge (replaces brittle elif chain) ---
        # Positive = evidence for PLASTIC, negative = evidence for PAPER

        plastic_signal = 0.0

        # Reflection → plastic
        if bright_pixels > 0.06:
            plastic_signal += min(0.12, bright_pixels * 1.8)

        # Low texture → plastic (smooth surface)
        if texture_score < 100:
            plastic_signal += min(0.08, (100 - texture_score) / 800)

        # High texture or many edges → paper
        if texture_score > 110:
            plastic_signal -= min(0.10, (texture_score - 110) / 600)
        if edge_density > 0.08:
            plastic_signal -= min(0.08, (edge_density - 0.08) * 3.0)

        # Saturation → colored plastic bag/wrapper
        if avg_saturation > 0.35 and plastic_score > 0.2:
            plastic_signal += min(0.08, (avg_saturation - 0.35) * 0.6)

        # Transparent bag: very flat, very few edges, slight brightness
        if texture_score < 40 and edge_density < 0.02 and bright_pixels > 0.04:
            plastic_signal += 0.07

        # Apply nudge only if signal is meaningful
        NUDGE_THRESHOLD = 0.03
        baseline = max(paper_score, plastic_score)

        if plastic_signal > NUDGE_THRESHOLD:
            classification["plastic"] = baseline + plastic_signal
        elif plastic_signal < -NUDGE_THRESHOLD:
            classification["paper"] = baseline + abs(plastic_signal)
    # ==========================================

    # -------- MIXED WASTE OVERRIDE --------
    # If scores are broadly spread across 3+ categories,
    # consider the item mixed waste.
    scores_above_0_3 = sum(v > 0.3 for v in classification.values())
    mixed_score      = classification.get("mixed waste", 0.0)

    if scores_above_0_3 >= 3 and mixed_score > 0.1:
        # Boost mixed waste so it surfaces correctly in uncertain cases
        current_max = max(classification.values())
        classification["mixed waste"] = max(mixed_score, current_max * 0.9)
    # --------------------------------------

    # Sort all predictions
    sorted_predictions = sorted(
        classification.items(),
        key=lambda x: x[1],
        reverse=True
    )

    top1_label, top1_conf = sorted_predictions[0]
    top2_label, top2_conf = sorted_predictions[1]

    # -------- UNCERTAIN CASE --------
    CONFIDENCE_THRESHOLD = 0.70
    MARGIN_THRESHOLD     = 0.15

    if top1_conf < CONFIDENCE_THRESHOLD or (top1_conf - top2_conf) < MARGIN_THRESHOLD:
        return {
            "status": "uncertain",
            "message": f"Model uncertain — likely {top1_label} or {top2_label}.",
            "top_prediction": {
                "label":      top1_label,
                "confidence": round(top1_conf, 4)
            },
            "second_prediction": {
                "label":      top2_label,
                "confidence": round(top2_conf, 4)
            },
            "all_scores": {
                k: round(v, 4) for k, v in sorted_predictions
            }
        }
    # --------------------------------

    # -------- CONFIDENT CASE --------
    others_above_threshold = {
        label: round(value, 4)
        for label, value in classification.items()
        if value > CONFIDENCE_THRESHOLD and label != top1_label
    }

    return {
        "status": "ok",
        "top_prediction": {
            "label":      top1_label,
            "confidence": round(top1_conf, 4)
        },
        "others_above_0.7": others_above_threshold,
        "all_scores": {
            k: round(v, 4) for k, v in sorted_predictions
        }
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

    allowed_labels = ["biomedical", "food", "paper", "plastic", "mixed waste"]

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
import json
import logging
import uuid
import base64
import os
from datetime import datetime
from typing import Optional, List

import numpy as np
import cv2
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(
    title="SkyRecon Inference Service",
    description="Real YOLOv8 inference service for drone debris detection",
    version="0.2.0"
)

logger = logging.getLogger(__name__)

# Global model instance
model = None

@app.on_event("startup")
async def startup_event():
    """Load custom YOLOv8 model on startup"""
    global model
    model_path = os.environ.get('YOLO_MODEL_PATH', 'best.pt')
    try:
        model = YOLO(model_path)
        logger.info(f"Custom YOLOv8 model loaded from {model_path}")
        logger.info(f"Model classes: {model.names}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")

class InferenceRequest(BaseModel):
    """Inference request model for URL-based frames"""
    frame_url: str
    drone_id: Optional[str] = None
    flight_id: Optional[str] = None

class Base64InferenceRequest(BaseModel):
    """Inference request model for base64-encoded frames"""
    frame: str
    drone_id: Optional[str] = None
    flight_id: Optional[str] = None
    lat: Optional[float] = 33.614
    lng: Optional[float] = 73.055

from hazard_scorer import HazardScorer

def process_frame(frame, drone_id=None, flight_id=None, lat=33.614, lng=73.055):
    """Run YOLOv8 inference on a frame using custom classes, with a mock fallback."""
    use_real_ai = os.environ.get('USE_REAL_AI', 'True').lower() in ('true', '1', 'yes')
    
    # ---------------------------------------------------------
    # FALLBACK: Return fake detections if AI is turned off
    # ---------------------------------------------------------
    if not use_real_ai:
        # Generate a fake bounding box in the center of the frame
        h, w = frame.shape[:2]
        cx, cy = w // 2, h // 2
        
        # Fake a Metal piece with 85% confidence
        risk_data = HazardScorer.calculate_risk("Metal", 0.85, [cx-50, cy-50, cx+50, cy+50])
        return [{
            "class": "Metal",
            "confidence": 0.85,
            "bbox": [cx-50, cy-50, cx+50, cy+50],
            "hazard_score": risk_data['risk_score'] / 100.0,
            "severity": risk_data['severity_label'],
            "location": {"lat": lat, "lng": lng},
        }]
    
    # ---------------------------------------------------------
    # REAL INFERENCE: Run the actual YOLOv8 model
    # ---------------------------------------------------------
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    # Run inference. Forced to CPU to bypass RTX 5050 Ada Lovelace architecture mismatch in default PyTorch binary.
    results = model(frame, verbose=False, device='cpu')[0]
    
    detections = []
    class_map = results.names
    
    # Map ALL 80 COCO classes (from yolov8n.pt) to our custom debris classes
    # This won't affect best.pt since it natively outputs Metal, Plastic, etc.
    coco_to_debris_map = {
        "person": "Organic", "bicycle": "Metal", "car": "Metal", "motorcycle": "Metal",
        "airplane": "Metal", "bus": "Metal", "train": "Metal", "truck": "Metal",
        "boat": "Plastic", "traffic light": "Metal", "fire hydrant": "Metal",
        "stop sign": "Metal", "parking meter": "Metal", "bench": "Metal",
        "bird": "Organic", "cat": "Organic", "dog": "Organic", "horse": "Organic",
        "sheep": "Organic", "cow": "Organic", "elephant": "Organic", "bear": "Organic",
        "zebra": "Organic", "giraffe": "Organic", "backpack": "Plastic",
        "umbrella": "Plastic", "handbag": "Plastic", "tie": "Other",
        "suitcase": "Plastic", "frisbee": "Plastic", "skis": "Plastic",
        "snowboard": "Plastic", "sports ball": "Plastic", "kite": "Plastic",
        "baseball bat": "Metal", "baseball glove": "Other", "skateboard": "Plastic",
        "surfboard": "Plastic", "tennis racket": "Metal", "bottle": "Plastic",
        "wine glass": "Plastic", "cup": "Plastic", "fork": "Metal", "knife": "Metal",
        "spoon": "Metal", "bowl": "Plastic", "banana": "Organic", "apple": "Organic",
        "sandwich": "Organic", "orange": "Organic", "broccoli": "Organic",
        "carrot": "Organic", "hot dog": "Organic", "pizza": "Organic",
        "donut": "Organic", "cake": "Organic", "chair": "Metal", "couch": "Other",
        "potted plant": "Organic", "bed": "Other", "dining table": "Metal",
        "toilet": "Plastic", "tv": "Metal", "laptop": "Metal", "mouse": "Plastic",
        "remote": "Plastic", "keyboard": "Plastic", "cell phone": "Metal",
        "microwave": "Metal", "oven": "Metal", "toaster": "Metal", "sink": "Metal",
        "refrigerator": "Metal", "book": "Organic", "clock": "Metal", "vase": "Plastic",
        "scissors": "Metal", "teddy bear": "Organic", "hair drier": "Plastic",
        "toothbrush": "Plastic"
    }
    
    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        label_id = int(box.cls[0])
        label = class_map.get(label_id, f"Unknown({label_id})")
        
        # Apply mapping if it's a known COCO class
        if label in coco_to_debris_map:
            label = coco_to_debris_map[label]
            
        confidence = float(box.conf[0])
        
        # Use robust HazardScorer
        risk_data = HazardScorer.calculate_risk(label, confidence, [x1, y1, x2, y2])
        
        detections.append({
            "class": label,
            "confidence": confidence,
            "bbox": [x1, y1, x2, y2],
            "hazard_score": risk_data['risk_score'] / 100.0,
            "severity": risk_data['severity_label'],
            "location": {"lat": lat, "lng": lng}, # Real location
        })
    
    return detections

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if model else "unhealthy",
        "service": "inference-service",
        "version": "0.2.0"
    }

@app.post("/infer-base64")
async def infer_base64(request: Base64InferenceRequest):
    """Submit base64-encoded frame for real-time inference"""
    try:
        # Decode base64 frame
        img_bytes = base64.b64decode(request.frame)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        detections = process_frame(frame, request.drone_id, request.flight_id, request.lat, request.lng)
        
        return {
            "status": "success",
            "job_id": str(uuid.uuid4()),
            "detections": detections,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Request

@app.post("/reload-model")
async def reload_model(request: Request):
    """Reload model from a new path (Module 4)"""
    global model
    try:
        data = await request.json()
        new_path = data.get('model_path')
        if not new_path:
            raise HTTPException(status_code=400, detail="model_path is required")
        
        # Check if it's an absolute path within the container or relative to /app
        full_path = new_path
        if not os.path.isabs(full_path):
            full_path = os.path.join('/app', new_path)
            
        model = YOLO(full_path)
        logger.info(f"Model reloaded from {full_path}")
        return {
            "status": "success", 
            "model": new_path,
            "classes": list(model.names.values())
        }
    except Exception as e:
        logger.error(f"Failed to reload model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

import cv2
import torch
import torch.nn as nn
from torchvision import models, transforms
from torchvision.ops import nms
from ultralytics import YOLO
from PIL import Image
import json

class SkyreconInference:
    def __init__(self, detector_path, classifier_path, class_names):
        self.detector = YOLO(detector_path)
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        
        # Load Classifier
        self.classifier = models.mobilenet_v2()
        num_ftrs = self.classifier.classifier[1].in_features
        self.classifier.classifier[1] = nn.Linear(num_ftrs, len(class_names))
        self.classifier.load_state_dict(torch.load(classifier_path, map_location=self.device))
        self.classifier.to(self.device).eval()
        
        self.class_names = class_names
        self.preprocess = transforms.Compose([
            transforms.Resize(224),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    def predict(self, frame, use_detector_labels=True):
        # Stage 1: Detection with stricter NMS
        results = self.detector(frame, verbose=False, conf=0.5, iou=0.3)[0]
        
        inference_results = []
        
        for box in results.boxes:
            # Crop
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            crop = frame[y1:y2, x1:x2]
            
            if crop.size == 0: continue
            
            if use_detector_labels:
                # Use YOLO class ID
                cls_id = int(box.cls[0])
                # Ensure we don't index out of bounds if model has more classes
                if cls_id < len(self.class_names):
                    label = self.class_names[cls_id]
                else:
                    label = "Other"
            else:
                # Stage 2: Refined Classification (MobileNet)
                crop_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
                input_tensor = self.preprocess(crop_pil).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    outputs = self.classifier(input_tensor)
                    _, preds = torch.max(outputs, 1)
                    label = self.class_names[preds[0]]
            
            # Assign base hazard score (Example logic)
            hazard_score = 0
            if label == "Organic": hazard_score = 0.9
            elif label == "Metal": hazard_score = 0.7
            elif label == "Plastic": hazard_score = 0.5
            else: hazard_score = 0.2
            
            inference_results.append({
                "bbox": [x1, y1, x2, y2],
                "class": label,
                "hazard_score": hazard_score,
                "confidence": float(box.conf[0])
            })
        
        # Apply NMS to remove duplicate/overlapping detections
        inference_results = self._apply_nms(inference_results, iou_threshold=0.3)
        
        return inference_results
    
    def _apply_nms(self, detections, iou_threshold=0.5):
        """Apply Non-Maximum Suppression to remove overlapping detections."""
        if not detections:
            return detections
        
        # Sort by confidence (descending)
        detections = sorted(detections, key=lambda x: x["confidence"], reverse=True)
        
        # Convert to tensors
        boxes = torch.tensor([d["bbox"] for d in detections], dtype=torch.float32)
        scores = torch.tensor([d["confidence"] for d in detections], dtype=torch.float32)
        
        # Apply NMS
        keep_indices = nms(boxes, scores, iou_threshold=iou_threshold)
        
        # Filter detections - keep only the highest confidence ones
        filtered_detections = [detections[i] for i in keep_indices.tolist()]
        
        return filtered_detections

if __name__ == "__main__":
    # Placeholder for test
    print("Inference core logic loaded.")

import os
import sys
import cv2
import torch
import numpy as np

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ai.inference_core import SkyreconInference

def calculate_iou(box1, box2):
    """Calculate Intersection over Union (IoU) of two bounding boxes."""
    x1, y1, x2, y2 = box1
    x3, y3, x4, y4 = box2
    
    x_inter1 = max(x1, x3)
    y_inter1 = max(y1, y3)
    x_inter2 = min(x2, x4)
    y_inter2 = min(y2, y4)
    
    width_inter = max(0, x_inter2 - x_inter1)
    height_inter = max(0, y_inter2 - y_inter1)
    
    area_inter = width_inter * height_inter
    area_box1 = (x2 - x1) * (y2 - y1)
    area_box2 = (x4 - x3) * (y4 - y3)
    
    area_union = area_box1 + area_box2 - area_inter
    if area_union == 0:
        return 0
    return area_inter / area_union

def evaluate():
    # Configuration
    val_images_path = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\data\yolo_foda\images\val"
    val_labels_path = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\data\yolo_foda\labels\val"
    detector_path = "yolov8n.pt" # Using base model as per inference_server/consumers.py logic
    classifier_path = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\ai\classifier.pth"
    classes = ["Metal", "Organic", "Other", "Plastic"]
    iou_threshold = 0.5

    # Initialize Engine
    print("Initializing inference engine...")
    engine = SkyreconInference(
        detector_path=detector_path,
        classifier_path=classifier_path,
        class_names=classes
    )

    tp = 0
    fp = 0
    fn = 0

    image_files = [f for f in os.listdir(val_images_path) if f.endswith('.jpg')]
    print(f"Evaluating {len(image_files)} images...")

    for i, img_name in enumerate(image_files):
        img_path = os.path.join(val_images_path, img_name)
        label_path = os.path.join(val_labels_path, img_name.replace('.jpg', '.txt'))
        
        if not os.path.exists(label_path):
            continue

        # Load Ground Truth
        # YOLO format: class x_center y_center width height (normalized)
        frame = cv2.imread(img_path)
        h, w, _ = frame.shape
        gt_boxes = []
        with open(label_path, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if not parts: continue
                # We currently only have 1 class in YOLO 'trash' (nc: 1)
                # But our classifier refines it. For detection evaluation, we look at all boxes.
                xc, yc, bw, bh = map(float, parts[1:])
                x1 = int((xc - bw/2) * w)
                y1 = int((yc - bh/2) * h)
                x2 = int((xc + bw/2) * w)
                y2 = int((yc + bh/2) * h)
                gt_boxes.append([x1, y1, x2, y2])

        # Run Predictions
        predictions = engine.predict(frame)
        pred_boxes = [p['bbox'] for p in predictions]

        # Match Predictions to Ground Truth
        matched_gt = set()
        for p_box in pred_boxes:
            found_match = False
            for idx, gt_box in enumerate(gt_boxes):
                if idx in matched_gt: continue
                if calculate_iou(p_box, gt_box) >= iou_threshold:
                    tp += 1
                    matched_gt.add(idx)
                    found_match = True
                    break
            if not found_match:
                fp += 1
        
        fn += (len(gt_boxes) - len(matched_gt))

        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{len(image_files)} images...")
            # Break early for a quick sample if needed, but we'll try full or 500 for now
            if i + 1 >= 500: 
                print("Stopping at 500 images for a quick representative sample.")
                break

    # Calculate Metrics
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    print("\n--- Evaluation Results (Sample of 500 images) ---")
    print(f"True Positives:  {tp}")
    print(f"False Positives: {fp}")
    print(f"False Negatives: {fn}")
    print(f"Precision:       {precision:.4f}")
    print(f"Recall:          {recall:.4f}")
    print(f"F1 Score:        {f1:.4f}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    evaluate()

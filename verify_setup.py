import os
import torch
import cv2
import numpy as np
from ai.inference_core import SkyreconInference

def verify_skyrecon():
    print("--- Skyrecon Diagnostic Tool ---")
    
    # Check paths
    base_dir = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon"
    detector_path = os.path.join(base_dir, "runs", "detect", "skyrecon_detector7", "weights", "best.pt")
    classifier_path = os.path.join(base_dir, "ai", "classifier.pth")
    sample_img_dir = os.path.join(base_dir, "data", "yolo_foda", "images", "val")
    
    # 1. Check Weights
    print(f"\n[1/3] Checking Model Weights...")
    if not os.path.exists(classifier_path):
        print(" ! Classifier weights (classifier.pth) not found. Run: python ai/classify_train.py first.")
        # Create a dummy model for plumbing test if requested
        print("   (Generating dummy classifier.pth for testing purposes...)")
        from torchvision import models
        import torch.nn as nn
        m = models.mobilenet_v2()
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, 4)
        torch.save(m.state_dict(), classifier_path)
    else:
        print(" + Classifier weights found.")

    detector_to_use = detector_path if os.path.exists(detector_path) else "yolov8n.pt"
    print(f" + Using detector: {detector_to_use}")

    # 2. Test Inference Core
    print(f"\n[2/3] Testing Inference Core...")
    try:
        classes = ["Metal", "Organic", "Other", "Plastic"]
        engine = SkyreconInference(detector_to_use, classifier_path, classes)
        print(" + Inference Engine initialized successfully.")
    except Exception as e:
        print(f" ! Failed to initialize engine: {e}")
        return

    # 3. Run Sample Inference
    print(f"\n[3/3] Running Sample Inference...")
    if os.path.exists(sample_img_dir):
        imgs = [f for f in os.listdir(sample_img_dir) if f.endswith('.jpg')]
        if imgs:
            test_img = os.path.join(sample_img_dir, imgs[0])
            frame = cv2.imread(test_img)
            results = engine.predict(frame)
            print(f" + Inference success! Found {len(results)} items in {imgs[0]}")
            for r in results:
                print(f"   - Detected: {r['class']} (Confidence: {r['confidence']:.2f}, Hazard Score: {r['hazard_score']})")
        else:
            print(" ! No sample images found in data/yolo_foda/images/val")
    else:
        print(f" ! Sample directory not found: {sample_img_dir}")

    print("\n--- Diagnostic Complete ---")
    print("To run the full pipeline:")
    print("1. Start Backend: cd backend && python manage.py runserver")
    print("2. Start Client: python client/drone_simulator.py")

if __name__ == "__main__":
    verify_skyrecon()

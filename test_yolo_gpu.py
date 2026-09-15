from ultralytics import YOLO
import torch
import os

# Fix for OMP: Error #15 on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def test_gpu():
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if not torch.cuda.is_available():
        print("GPU is not available. Exiting.")
        return

    print(f"Using GPU: {torch.cuda.get_device_name(0)}")
    
    # Load a tiny model for testing
    try:
        model = YOLO("yolov8n.pt")
        print("Model loaded successfully. Starting a dummy training step...")
        
        # Run a tiny training step
        # Using a very small dataset if possible, or just checking if it can move to device
        model.to('cuda')
        print("Model moved to CUDA successfully.")
        
        # Test a simple inference
        import numpy as np
        dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
        results = model.predict(dummy_img, device='cuda')
        print("Inference on GPU successful!")
        
    except Exception as e:
        print(f"GPU Test failed: {e}")

if __name__ == "__main__":
    test_gpu()

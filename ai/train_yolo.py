from ultralytics import YOLO
import os

# Fix for OMP: Error #15 on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def train_yolo():
    # Load a pretrained model
    model = YOLO("yolov8n.pt")  # Nano for speed/simulation
    
    # Path to the data config
    data_path = os.path.abspath("data/debris_detector.yaml")
    
    # Train the model
    results = model.train(
        data=data_path,
        epochs=10,  # Keeping it low for initial test
        imgsz=640,
        batch=8,     # Reduced from 16 to avoid OOM
        workers=2,   # Reduced from 8 to save RAM
        name="skyrecon_detector",
        augment=True  # Enable default augmentations
    )
    
if __name__ == "__main__":
    train_yolo()

import os
import torch
from torchvision import datasets, models, transforms
from ultralytics import YOLO
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

def evaluate_models():
    # YOLO Evaluation
    print("--- YOLOv8 Evaluation ---")
    yolo_model_path = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\runs\detect\skyrecon_detector7\weights\best.pt"
    data_path = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\data\debris_detector.yaml"

    if os.path.exists(yolo_model_path):
        model = YOLO(yolo_model_path)
        metrics = model.val(data=data_path, split='val', workers=0)
        print("YOLO Metrics:")
        print(f"mAP50-95: {metrics.box.map}")
        print(f"mAP50: {metrics.box.map50}")
    else:
        print(f"YOLO model not found at {yolo_model_path}")

    print("\n--- MobileNet Evaluation ---")
    # MobileNet Evaluation
    CLASSIFIER_PATH = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\ai\classifier.pth"
    DATA_DIR = r"C:\Users\qibra\OneDrive\Desktop\Skyrecon_Classifier_Data"

    if os.path.exists(CLASSIFIER_PATH) and os.path.exists(DATA_DIR):
        data_transforms = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        image_datasets = datasets.ImageFolder(DATA_DIR, data_transforms)
        image_datasets.class_to_idx = {
            'Metal': 0,
            'Plastic': 1,
            'Organic': 2,
            'Other': 3
        }
        image_datasets.classes = ['Metal', 'Plastic', 'Organic', 'Other']
        dataloaders = torch.utils.data.DataLoader(image_datasets, batch_size=32, shuffle=False, num_workers=0)
        
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        mobilenet = models.mobilenet_v2(pretrained=False)
        num_ftrs = mobilenet.classifier[1].in_features
        mobilenet.classifier[1] = torch.nn.Linear(num_ftrs, len(image_datasets.classes))
        mobilenet.load_state_dict(torch.load(CLASSIFIER_PATH, map_location=device))
        mobilenet = mobilenet.to(device)
        mobilenet.eval()
        
        all_preds = []
        all_labels = []
        
        print("Evaluating MobileNet on dataset...")
        with torch.no_grad():
            for inputs, labels in dataloaders:
                inputs = inputs.to(device)
                labels = labels.to(device)
                outputs = mobilenet(inputs)
                _, preds = torch.max(outputs, 1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
                
        print("\nMobileNet Classification Report:")
        print(classification_report(all_labels, all_preds, target_names=image_datasets.classes))
        
    else:
        print("MobileNet model or dataset not found.")

if __name__ == '__main__':
    evaluate_models()

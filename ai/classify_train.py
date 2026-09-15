import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
import os

# Paths
DATA_DIR = r"C:\Users\qibra\OneDrive\Desktop\Skyrecon_Classifier_Data"
MODEL_SAVE_PATH = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\ai\classifier.pth"

def train_classifier():
    # Data Augmentation & Normalization
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    # Load dataset
    image_datasets = datasets.ImageFolder(DATA_DIR, data_transforms['train'])
    
    # Force class indices to match YOLO (0: Metal, 1: Plastic, 2: Organic, 3: Other)
    # This prevents alphabetical sorting (Metal, Organic, Other, Plastic) from breaking alignment
    image_datasets.class_to_idx = {
        'Metal': 0,
        'Plastic': 1,
        'Organic': 2,
        'Other': 3
    }
    image_datasets.classes = ['Metal', 'Plastic', 'Organic', 'Other']
    
    dataloaders = torch.utils.data.DataLoader(image_datasets, batch_size=32, shuffle=True, num_workers=0)
    
    dataset_size = len(image_datasets)
    class_names = image_datasets.classes
    print(f"Classes: {class_names}")

    # Load Pretrained MobileNetV2
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    model = models.mobilenet_v2(pretrained=True)
    
    # Freeze feature layers
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace the classifier head
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, len(class_names))
    
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

    # Train for 5 epochs
    print("Starting training...")
    for epoch in range(5):
        model.train()
        running_loss = 0.0
        
        for inputs, labels in dataloaders:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            
        epoch_loss = running_loss / dataset_size
        print(f"Epoch {epoch} Loss: {epoch_loss:.4f}")

    # Save
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train_classifier()

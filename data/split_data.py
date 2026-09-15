import os
import random
import shutil

# Paths
INPUT_DIR = r"C:\Users\qibra\OneDrive\Desktop\Skyrecon_YOLO_Data"
FINAL_DIR = r"C:\Users\qibra\.gemini\antigravity\scratch\Skyrecon\data\yolo_foda"

def split_dataset(split_ratio=0.8):
    images_dir = os.path.join(INPUT_DIR, "images")
    labels_dir = os.path.join(INPUT_DIR, "labels")
    
    images = [f for f in os.listdir(images_dir) if f.endswith(".jpg")]
    random.shuffle(images)
    
    split_idx = int(len(images) * split_ratio)
    train_imgs = images[:split_idx]
    val_imgs = images[split_idx:]
    
    for split, img_list in [("train", train_imgs), ("val", val_imgs)]:
        dest_img_path = os.path.join(FINAL_DIR, "images", split)
        dest_lab_path = os.path.join(FINAL_DIR, "labels", split)
        os.makedirs(dest_img_path, exist_ok=True)
        os.makedirs(dest_lab_path, exist_ok=True)
        
        for img in img_list:
            # Copy image
            shutil.copy(os.path.join(images_dir, img), os.path.join(dest_img_path, img))
            # Copy label
            label = img.replace(".jpg", ".txt")
            if os.path.exists(os.path.join(labels_dir, label)):
                shutil.copy(os.path.join(labels_dir, label), os.path.join(dest_lab_path, label))

if __name__ == "__main__":
    split_dataset()
    print(f"Dataset split complete in {FINAL_DIR}")

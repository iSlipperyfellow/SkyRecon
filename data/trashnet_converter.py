import os
import shutil
from tqdm import tqdm

# Paths
INPUT_DIR = r"C:\Users\qibra\OneDrive\Desktop\TrashNet\dataset-resized"
OUTPUT_DIR = r"C:\Users\qibra\OneDrive\Desktop\Skyrecon_Classifier_Data"

# Mapping logic
# Organic: High wildlife risk
# Plastic: Risk of ingestion
# Metal: Structural damage risk
# Other: Glass, etc.
MAPPING = {
    "cardboard": "Organic",
    "paper": "Organic",
    "plastic": "Plastic",
    "metal": "Metal",
    "glass": "Other",
    "trash": "Other"
}

def process_trashnet():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for target in set(MAPPING.values()):
        os.makedirs(os.path.join(OUTPUT_DIR, target), exist_ok=True)
    
    print("Reorganizing TrashNet...")
    for folder in os.listdir(INPUT_DIR):
        src_path = os.path.join(INPUT_DIR, folder)
        if not os.path.isdir(src_path) or folder not in MAPPING:
            continue
            
        target_folder = MAPPING[folder]
        dest_path = os.path.join(OUTPUT_DIR, target_folder)
        
        images = [f for f in os.listdir(src_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        for img in tqdm(images, desc=f"Processing {folder} -> {target_folder}"):
            shutil.copy(os.path.join(src_path, img), os.path.join(dest_path, f"trashnet_{folder}_{img}"))

if __name__ == "__main__":
    process_trashnet()
    print(f"Done! Classifier data ready in {OUTPUT_DIR}")

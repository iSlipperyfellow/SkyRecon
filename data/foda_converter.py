import os
import xml.etree.ElementTree as ET
from tqdm import tqdm
import shutil

# Paths
INPUT_DIR = r"C:\Users\qibra\OneDrive\Desktop\FOD-A\FODPascalVOCFormat-V.2.1\VOC2007"
OUTPUT_DIR = r"C:\Users\qibra\OneDrive\Desktop\Skyrecon_YOLO_Data" # Intermediate for YOLO
DEST_IMAGES = os.path.join(OUTPUT_DIR, "images")
DEST_LABELS = os.path.join(OUTPUT_DIR, "labels")

def convert_bbox(size, box):
    dw = 1. / size[0]
    dh = 1. / size[1]
    x = (box[0] + box[1]) / 2.0
    y = (box[2] + box[3]) / 2.0
    w = box[1] - box[0]
    h = box[3] - box[2]
    return (x * dw, y * dh, w * dw, h * dh)

# Mapping FOD-A classes to materials
CLASS_MAPPING = {
    # Metal
    'AdjustableClamp': 0, 'AdjustableWrench': 0, 'BoltNutSet': 0, 'BoltWasher': 0, 
    'Bolt': 0, 'ClampPart': 0, 'Cutter': 0, 'FuelCap': 0, 'Hammer': 0, 'MetalPart': 0, 
    'MetalSheet': 0, 'Nail': 0, 'Nut': 0, 'Pliers': 0, 'Screwdriver': 0, 'Screw': 0, 
    'SodaCan': 0, 'Washer': 0, 'Wire': 0, 'Wrench': 0, 'Battery': 0,
    # Plastic
    'Hose': 1, 'Label': 1, 'LuggagePart': 1, 'LuggageTag': 1, 
    'PlasticPart': 1, 'Tape': 1, 'Pen': 1,
    # Organic
    'Rock': 2, 'Wood': 2,
    # Other
    'PaintChip': 3
}

def process_foda():
    os.makedirs(DEST_IMAGES, exist_ok=True)
    os.makedirs(DEST_LABELS, exist_ok=True)
    
    ann_dir = os.path.join(INPUT_DIR, "Annotations")
    img_dir = os.path.join(INPUT_DIR, "JPEGImages")
    
    xml_files = [f for f in os.listdir(ann_dir) if f.endswith(".xml")]
    
    print(f"Converting {len(xml_files)} files...")
    
    for xml_file in tqdm(xml_files):
        tree = ET.parse(os.path.join(ann_dir, xml_file))
        root = tree.getroot()
        
        size = root.find("size")
        if size is None: continue
        w = int(size.find("width").text or 0)
        h = int(size.find("height").text or 0)
        if w == 0 or h == 0: continue
        
        file_id = xml_file.replace(".xml", "")
        label_file = os.path.join(DEST_LABELS, f"{file_id}.txt")
        
        with open(label_file, "w") as f:
            for obj in root.iter("object"):
                name_elem = obj.find("name")
                if name_elem is None: continue
                name = name_elem.text
                cls_id = CLASS_MAPPING.get(name, 3) # Default to 'Other'
                
                xmlbox = obj.find("bndbox")
                if xmlbox is None: continue
                b = (float(xmlbox.find("xmin").text or 0), float(xmlbox.find("xmax").text or 0), 
                     float(xmlbox.find("ymin").text or 0), float(xmlbox.find("ymax").text or 0))
                bb = convert_bbox((w, h), b)
                f.write(f"{cls_id} {' '.join([f'{a:.6f}' for a in bb])}\n")
        
        # Copy image
        src_img = os.path.join(img_dir, f"{file_id}.jpg")
        if os.path.exists(src_img):
            shutil.copy(src_img, DEST_IMAGES)

if __name__ == "__main__":
    process_foda()
    print(f"Done! Dataset ready in {OUTPUT_DIR}")

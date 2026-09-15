import asyncio
import websockets
import json
import cv2
import base64
import numpy as np
import os
import requests

async def run_simulator():
    uri = "ws://127.0.0.1:8000/ws/inference/"
    
    # Switch the inference server to use the custom FOD model
    print("[VISION] Requesting custom YOLO model (best.pt) for FOD objects...")
    try:
        requests.post("http://127.0.0.1:8001/reload-model", json={"model_path": "best.pt"}, timeout=3)
    except Exception as e:
        print(f"[VISION] Warning: Could not switch YOLO model: {e}")
    
    # Path to sample images captured during conversion
    sample_dir = r"D:\Skyrecon_Final\Skyrecon\data\yolo_foda\images\val"
    
    if not os.path.exists(sample_dir):
        print(f"Sample directory not found: {sample_dir}")
        return

    sample_images = [os.path.join(sample_dir, f) for f in os.listdir(sample_dir) if f.endswith('.jpg')]
    
    if not sample_images:
        print("No sample images found in validator set.")
        return

    async with websockets.connect(uri, open_timeout=20, ping_interval=None, ping_timeout=None) as websocket:
        print(f"Connected to {uri}")
        
        while True:
            for img_path in sample_images:
                frame = cv2.imread(img_path)
                if frame is None: continue
                
                # Resize to match frontend expected resolution (1280x720)
                frame = cv2.resize(frame, (1280, 720))
                
                # Encode to base64
                _, buffer = cv2.imencode('.jpg', frame)
                frame_b64 = base64.b64encode(buffer).decode('utf-8')
                
                # Send to backend
                await websocket.send(json.dumps({
                    'frame': frame_b64
                }))
                
                # Receive results, ignoring broadcasts
                while True:
                    response = await websocket.recv()
                    results = json.loads(response)
                    if 'detections' in results:
                        break
                
                if 'detections' in results:
                    detections = results['detections']
                    print(f"Processed {os.path.basename(img_path)}: {len(detections)} items found.")
                    
                    # Draw detections
                    for det in detections:
                        x1, y1, x2, y2 = det['bbox']
                        label = f"{det['class']} ({det['hazard_score']:.2f})"
                        
                        # Draw bounding box
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        
                        # Draw label with background for better readability
                        font = cv2.FONT_HERSHEY_SIMPLEX
                        font_scale = 0.6
                        thickness = 1
                        
                        # Get text size to create background rectangle
                        text_size = cv2.getTextSize(label, font, font_scale, thickness)[0]
                        text_x = max(0, x1)
                        text_y = max(text_size[1] + 5, y1 - 5)
                        
                        # Draw black background for text
                        cv2.rectangle(frame, 
                                    (text_x - 2, text_y - text_size[1] - 4),
                                    (text_x + text_size[0] + 2, text_y + 2),
                                    (0, 0, 0), -1)
                        
                        # Draw text in green
                        cv2.putText(frame, label, (text_x, text_y), font, font_scale, (0, 255, 0), thickness)
                    
                    cv2.imshow('Skyrecon Drone View', frame)
                    if cv2.waitKey(100) & 0xFF == ord('q'):
                        cv2.destroyAllWindows()
                        return
                else:
                    print(f"Error from server: {results.get('message')}")
                    await asyncio.sleep(1)

    cv2.destroyAllWindows()

if __name__ == "__main__":
    try:
        asyncio.run(run_simulator())
    except Exception as e:
        print(f"Simulator error: {e}")

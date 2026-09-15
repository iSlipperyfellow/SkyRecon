import json
import base64
import cv2
import numpy as np
from channels.generic.websocket import AsyncWebsocketConsumer
import sys
import os

# Add AI path to sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from ai.inference_core import SkyreconInference

class InferenceConsumer(AsyncWebsocketConsumer):
    # Singleton-like initialization for models to avoid reloading per request
    inference_engine = None

    async def connect(self):
        await self.accept()
        # Join the live feed group to broadcast to dashboard
        await self.channel_layer.group_add("live_feed", self.channel_name)
        
        if InferenceConsumer.inference_engine is None:
            # Paths to weights
            detector_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../runs/detect/skyrecon_detector7/weights/best.pt'))
            classifier_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ai/classifier.pth'))
            
            if not os.path.exists(detector_path):
                detector_path = "yolov8n.pt"
            
            classes = ["Metal", "Plastic", "Organic", "Other"] 
            
            try:
                InferenceConsumer.inference_engine = SkyreconInference(
                    detector_path=detector_path,
                    classifier_path=classifier_path,
                    class_names=classes
                )
            except Exception as e:
                print(f"Error loading inference engine: {e}")

    async def disconnect(self, close_code):
        # Leave the live feed group
        await self.channel_layer.group_discard("live_feed", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        frame_b64 = data.get('frame')
        
        if not frame_b64:
            return

        # Decode image
        img_bytes = base64.b64decode(frame_b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if InferenceConsumer.inference_engine:
            results = InferenceConsumer.inference_engine.predict(frame)
            
            # Send back to the source (simulator)
            await self.send(text_data=json.dumps({
                'status': 'success',
                'detections': results
            }))

            # BROADCAST to the 'live_feed' group (dashboard)
            await self.channel_layer.group_send(
                "live_feed",
                {
                    "type": "broadcast_frame",
                    "frame": frame_b64,
                    "detections": results
                }
            )
        else:
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': 'Inference engine not initialized'
            }))

    async def broadcast_frame(self, event):
        """Handler for the live_feed group messages"""
        # Only send to clients who are NOT the simulator (if we want to distinguish)
        # But for now, we'll send to all in the group
        await self.send(text_data=json.dumps({
            'type': 'live_update',
            'frame': event['frame'],
            'detections': event['detections']
        }))

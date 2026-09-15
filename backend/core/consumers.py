"""
Django Channels WebSocket consumers for real-time communication
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class TelemetryConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for drone telemetry updates"""
    
    async def connect(self):
        """Handle new WebSocket connection"""
        # Add connection to telemetry group
        await self.channel_layer.group_add("telemetry", self.channel_name)
        await self.accept()
        logger.info("Telemetry consumer connected")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnect"""
        await self.channel_layer.group_discard("telemetry", self.channel_name)
        logger.info("Telemetry consumer disconnected")
    
    async def receive(self, text_data):
        """Handle incoming message (e.g., subscribe to specific drone)"""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            drone_id = data.get('drone_id')
            
            if action == 'subscribe':
                # Subscribe to drone-specific channel
                drone_channel = f"drone_{drone_id}"
                await self.channel_layer.group_add(drone_channel, self.channel_name)
                
                await self.send(text_data=json.dumps({
                    'type': 'subscription_confirmed',
                    'drone_id': drone_id,
                }))
            
            elif action == 'unsubscribe':
                drone_channel = f"drone_{drone_id}"
                await self.channel_layer.group_discard(drone_channel, self.channel_name)
                
                await self.send(text_data=json.dumps({
                    'type': 'unsubscription_confirmed',
                    'drone_id': drone_id,
                }))
                
            elif action == 'telemetry':
                # Simulator telemetry push
                await self.channel_layer.group_send(
                    'telemetry',
                    {
                        'type': 'telemetry_update',
                        'data': data.get('data', {}),
                    }
                )
                
            elif action == 'command':
                import datetime
                # Direct websocket command proxy
                cmd = data.get('command')
                await self.channel_layer.group_send(
                    'telemetry',
                    {
                        'type': 'drone_command',
                        'command': cmd,
                        'timestamp': datetime.datetime.now().isoformat()
                    }
                )
        
        except json.JSONDecodeError:
            logger.warning("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error in telemetry consumer: {e}")
    
    async def telemetry_update(self, event):
        """Handle telemetry update from channel layer"""
        await self.send(text_data=json.dumps({
            'type': 'telemetry_update',
            'data': event['data'],
        }))
    
    async def drone_command(self, event):
        """Handle drone command broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'drone_command',
            'command': event['command'],
            'timestamp': event['timestamp'],
        }))


class DetectionConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for detection events"""
    
    async def connect(self):
        """Handle new WebSocket connection"""
        self.user = self.scope["user"]
        
        # Check authentication
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Add user to detections group
        await self.channel_layer.group_add("detections", self.channel_name)
        await self.accept()
        logger.info(f"Detection consumer connected: {self.user.username}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnect"""
        await self.channel_layer.group_discard("detections", self.channel_name)
        logger.info(f"Detection consumer disconnected: {self.user.username}")
    
    async def receive(self, text_data):
        """Handle incoming message"""
        try:
            data = json.loads(text_data)
            # Could add filtering by hazard level, label, etc here
            logger.debug(f"Detection consumer received: {data}")
        except json.JSONDecodeError:
            logger.warning("Invalid JSON received")
    
    async def detection_created(self, event):
        """Handle new detection event"""
        # Apply role-based filtering
        if self.user.role in ['ADMIN', 'OPERATOR', 'ANALYST']:
            await self.send(text_data=json.dumps({
                'type': 'detection.created',
                'data': event['detection'],
            }))
    
    async def hazard_alert(self, event):
        """Handle high-risk hazard alert"""
        if self.user.role in ['ADMIN', 'OPERATOR']:
            await self.send(text_data=json.dumps({
                'type': 'hazard_alert',
                'data': event['hazard'],
            }))

class InferenceConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for drone inference proxying"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Class-level cache to throttle DB writes for the same object
        if not hasattr(self.__class__, 'last_saved_cache'):
            self.__class__.last_saved_cache = {}

    async def connect(self):
        """Handle new WebSocket connection"""
        # For simplicity and simulator ease, we allow non-authenticated connections for now
        # but in production, we would check self.scope["user"]
        await self.accept()
        # Add this connection to the live feed broadcast group
        await self.channel_layer.group_add("live_feed", self.channel_name)
        logger.info("Inference proxy connected and added to live_feed group")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnect"""
        # Remove from live feed group
        await self.channel_layer.group_discard("live_feed", self.channel_name)
        logger.info("Inference proxy disconnected and removed from live_feed group")

    async def receive(self, text_data):
        """Handle incoming frame and proxy to inference service"""
        import aiohttp
        import os
        
        try:
            data = json.loads(text_data)
            frame_b64 = data.get('frame')
            drone_id = data.get('drone_id')
            flight_id = data.get('flight_id')
            lat = data.get('lat', 33.614)
            lng = data.get('lng', 73.055)
            
            if not frame_b64:
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': 'No frame provided'
                }))
                return

            inference_url = os.environ.get('YOLO_INFERENCE_URL', 'http://inference-mock:8001')
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{inference_url}/infer-base64", json={
                    'frame': frame_b64,
                    'drone_id': drone_id,
                    'flight_id': flight_id,
                    'lat': lat,
                    'lng': lng
                }) as resp:
                    if resp.status == 200:
                        results = await resp.json()
                        await self.send(text_data=json.dumps(results))
                        
                        payload = {
                            "type": "live_update",
                            "frame": frame_b64,
                            "detections": results.get("detections", []),
                            "timestamp": results.get("timestamp", "")
                        }
                        
                        await self.channel_layer.group_send(
                            "live_feed",
                            {
                                "type": "live_update",
                                "payload": payload
                            }
                        )
                        
                        # Throttle and permanently save to the database
                        detections_list = results.get("detections", [])
                        if detections_list:
                            await self.save_detections_to_db(detections_list, drone_id)
                    else:
                        try:
                            error_text = await resp.text()
                        except:
                            error_text = "Unknown error"
                        await self.send(text_data=json.dumps({
                            'status': 'error',
                            'message': f'Inference service error: {error_text}'
                        }))
        
        except Exception as e:
            logger.error(f"Error in inference proxy: {e}")
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': str(e)
            }))
    async def live_update(self, event):
        """Receive broadcast from group and forward to frontend"""
        await self.send(text_data=json.dumps(event.get('payload', {})))

    @database_sync_to_async
    def save_detections_to_db(self, detections, drone_id):
        from core.models import Detection, Drone, Hazard
        from django.contrib.gis.geos import Point
        import time
        
        try:
            import uuid
            try:
                # Check if drone_id is a valid UUID
                uuid.UUID(str(drone_id))
                drone = Drone.objects.get(id=drone_id)
            except ValueError:
                drone = Drone.objects.get(identifier=drone_id)
        except Exception:
            drone = Drone.objects.first()
            
        if not drone:
            return  # Safety fallback to prevent integrity errors
            
        current_time = time.time()
        for det in detections:
            lat = det['location']['lat']
            lng = det['location']['lng']
            label = det['class']
            
            # Create a spatial cache key rounded to ~10 meters (0.0001 degrees)
            loc_key = f"{label}_{round(lat, 4)}_{round(lng, 4)}"
            
            # Throttle: Only save if we haven't saved this exact class at this exact location in the last 15 seconds
            if current_time - self.__class__.last_saved_cache.get(loc_key, 0) > 15.0:
                self.__class__.last_saved_cache[loc_key] = current_time
                
                from django.utils import timezone
                # Save to database permanently
                detection = Detection.objects.create(
                    drone=drone,
                    label=label,
                    confidence=det['confidence'],
                    hazard_score=det['hazard_score'],
                    geometry=Point(lng, lat),
                    timestamp=timezone.now()
                )
                # Save corresponding hazard
                Hazard.objects.create(
                    detection=detection,
                    score=det['hazard_score'],
                    level=det['severity'].lower(),
                    reasoning=f"Auto-detected {label} with confidence {det['confidence']}"
                )

"""
MQTT adapter for receiving drone telemetry and frame notifications
"""

import json
import logging
import threading
from datetime import datetime

import paho.mqtt.client as mqtt
from django.conf import settings
from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.gis.geos import Point
from django.utils import timezone

from core.models import Drone, Telemetry

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()


class MQTTConnector:
    """MQTT client for drone telemetry ingestion"""
    
    def __init__(self):
        self.broker_host = settings.MQTT_BROKER_HOST
        self.broker_port = settings.MQTT_BROKER_PORT
        self.keepalive = settings.MQTT_BROKER_KEEPALIVE
        import uuid
        self.client = mqtt.Client(client_id=f"skyrecon_backend_{uuid.uuid4().hex[:6]}")
        self.connected = False
        
        # Set callbacks
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
    
    def on_connect(self, client, userdata, flags, rc):
        """Handle MQTT connection"""
        if rc == 0:
            logger.info("MQTT connected successfully")
            self.connected = True
            
            # Subscribe to telemetry topics
            self.client.subscribe("skyrecon/drone/+/telemetry", qos=1)
            self.client.subscribe("skyrecon/drone/+/frame", qos=1)
        else:
            logger.error(f"MQTT connection failed with code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """Handle MQTT disconnection"""
        if rc != 0:
            logger.warning(f"Unexpected MQTT disconnection with code {rc}")
        else:
            logger.info("MQTT disconnected")
        self.connected = False
    
    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT message"""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode('utf-8'))
            
            if 'telemetry' in topic:
                self._handle_telemetry(topic, payload)
            elif 'frame' in topic:
                self._handle_frame(topic, payload)
        
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in MQTT message: {msg.payload}")
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    def _handle_telemetry(self, topic, payload):
        """Process telemetry message"""
        # Topic: skyrecon/drone/{drone_id}/telemetry
        parts = topic.split('/')
        drone_id = parts[2] if len(parts) > 2 else None
        
        if not drone_id:
            logger.warning(f"Invalid telemetry topic: {topic}")
            return
        
        try:
            # Find drone by identifier or ID
            try:
                drone = Drone.objects.get(id=drone_id)
            except:
                drone = Drone.objects.get(identifier=drone_id)
            
            # Extract coordinates
            lat = payload.get('lat')
            lng = payload.get('lng')
            timestamp_str = payload.get('timestamp', timezone.now().isoformat())
            
            if not lat or not lng:
                logger.warning(f"Missing coordinates in telemetry: {payload}")
                return
            
            # Parse timestamp
            try:
                timestamp = timezone.datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except:
                timestamp = timezone.now()
            
            # Create telemetry record
            location = Point(lng, lat)
            telemetry = Telemetry.objects.create(
                drone=drone,
                timestamp=timestamp,
                location=location,
                altitude=payload.get('altitude'),
                velocity=payload.get('velocity'),
                heading=payload.get('heading'),
                battery=payload.get('battery'),
                raw=payload,
            )
            
            # Update drone last_seen
            drone.last_seen = timezone.now()
            drone.save(update_fields=['last_seen'])
            
            # Broadcast via WebSocket
            async_to_sync(channel_layer.group_send)(
                'telemetry',
                {
                    'type': 'telemetry_update',
                    'data': {
                        'drone_id': str(drone.id),
                        'timestamp': timestamp.isoformat(),
                        'location': {'lat': lat, 'lng': lng},
                        'altitude': payload.get('altitude'),
                        'velocity': payload.get('velocity'),
                        'battery': payload.get('battery'),
                    }
                }
            )
            
            logger.debug(f"Telemetry stored for {drone.identifier}")
        
        except Drone.DoesNotExist:
            logger.warning(f"Drone not found: {drone_id}")
        except Exception as e:
            logger.error(f"Error storing telemetry: {e}")
    
    def _handle_frame(self, topic, payload):
        """Process frame notification"""
        # Topic: skyrecon/drone/{drone_id}/frame
        # Payload: {"frame_url": "...", "timestamp": "..."}
        
        parts = topic.split('/')
        drone_id = parts[2] if len(parts) > 2 else None
        
        if not drone_id:
            logger.warning(f"Invalid frame topic: {topic}")
            return
        
        frame_url = payload.get('frame_url')
        if not frame_url:
            logger.warning(f"Missing frame_url in payload: {payload}")
            return
        
        logger.debug(f"Frame notification received for {drone_id}: {frame_url}")
        # In production, would submit to inference service here
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.broker_host, self.broker_port, self.keepalive)
            self.client.loop_start()
            logger.info(f"MQTT connector starting: {self.broker_host}:{self.broker_port}")
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("MQTT connector stopped")


# Singleton instance
_mqtt_connector = None


def get_mqtt_connector():
    """Get singleton MQTT connector"""
    global _mqtt_connector
    if _mqtt_connector is None:
        _mqtt_connector = MQTTConnector()
    return _mqtt_connector

"""
Routing configuration for Channels WebSocket
"""

from django.urls import re_path
"""
Routing configuration for Channels WebSocket
"""

from django.urls import re_path

from core import consumers

websocket_urlpatterns = [
    re_path(r'ws/telemetry/$', consumers.TelemetryConsumer.as_asgi()),
    re_path(r'ws/detections/$', consumers.DetectionConsumer.as_asgi()),
    re_path(r'ws/inference/$', consumers.InferenceConsumer.as_asgi()),
]

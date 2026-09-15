"""
ASGI config for inference_server project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from inference_server.consumers import InferenceConsumer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "inference_server.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter([
        path("ws/inference/", InferenceConsumer.as_asgi()),
    ]),
})

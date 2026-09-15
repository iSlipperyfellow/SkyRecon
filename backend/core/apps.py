"""
Django app configuration
"""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        """Initialize app on startup"""
        # Start MQTT connector
        import logging

        logger = logging.getLogger(__name__)

        try:
            from core.mqtt_connector import get_mqtt_connector

            mqtt = get_mqtt_connector()
            mqtt.connect()
            logger.info("MQTT connector initialized")
        except Exception as e:
            logger.error(f"Failed to initialize MQTT connector: {e}")

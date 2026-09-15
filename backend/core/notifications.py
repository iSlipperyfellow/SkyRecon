import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_critical_hazard_alert(detection, hazard_score):
    """
    Sends an email alert when a critical hazard is detected.
    """
    subject = f"🚨 CRITICAL HAZARD DETECTED: {detection.label.upper()}"
    message = (
        f"A critical hazard has been detected on the runway.\n\n"
        f"Material: {detection.label}\n"
        f"Confidence: {detection.confidence:.2%}\n"
        f"Risk Score: {hazard_score:.2f}\n"
        f"Drone: {detection.drone.identifier}\n"
        f"Mission: {detection.flight.mission_name}\n\n"
        f"Please check the SkyRecon Dashboard immediately for details."
    )

    recipient_list = [settings.ADMIN_EMAIL] if hasattr(settings, "ADMIN_EMAIL") else []

    if not recipient_list:
        logger.warning("No recipient list configured for critical hazard alerts.")
        return False

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            fail_silently=False,
        )
        logger.info(f"Critical alert email sent for detection {detection.id}")
        return True
    except Exception as e:
        logger.error(f"Failed to send critical alert email: {e}")
        return False

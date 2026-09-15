"""
Hazard scoring logic and evaluation
"""

from django.conf import settings
from core.notifications import send_critical_hazard_alert


def calculate_hazard_score(detection, runway=None):
    """
    Calculate hazard score for a detection using rule-based logic.
    
    Score = confidence * material_weight * runway_proximity_multiplier
    
    Args:
        detection: Detection model instance
        runway: Optional Runway instance for proximity calculation
        
    Returns:
        dict: {
            'score': float (0.0-1.0),
            'level': 'LOW'|'MEDIUM'|'HIGH',
            'reasoning': dict with breakdown
        }
    """
    
    # Get material weight
    material_weights = settings.HAZARD_MATERIAL_WEIGHTS
    material_weight = material_weights.get(detection.label.lower(), 0.6)
    
    # Base score from confidence and material type
    base_score = detection.confidence * material_weight
    
    # Apply runway proximity multiplier if runway provided
    runway_multiplier = 1.0
    if runway and detection.geometry:
        try:
            # Check if detection is near runway (within 100m)
            distance_m = detection.geometry.distance(runway.geometry)
            if distance_m < 100:
                runway_multiplier = settings.HAZARD_RUNWAY_PROXIMITY_MULTIPLIER
        except Exception:
            pass
    
    final_score = min(base_score * runway_multiplier, 1.0)
    
    # Determine level
    if final_score < settings.HAZARD_LOW_THRESHOLD:
        level = 'LOW'
    elif final_score < settings.HAZARD_MEDIUM_THRESHOLD:
        level = 'MEDIUM'
    else:
        level = 'HIGH'
        # Trigger email alert for high-risk hazards (Module 7)
        send_critical_hazard_alert(detection, final_score)
    
    return {
        'score': final_score,
        'level': level,
        'reasoning': {
            'confidence': detection.confidence,
            'material': detection.label,
            'material_weight': material_weight,
            'runway_multiplier': runway_multiplier,
            'base_score': base_score,
        }
    }

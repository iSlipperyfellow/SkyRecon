import math

class HazardScorer:
    """
    Evaluates debris detections and assigns a risk severity score.
    """
    
    # Base risk weights for different material types (0.0 to 1.0)
    MATERIAL_RISK = {
        'Metal': 1.0,     # Highest risk (FOD damage to engines/tires)
        'Plastic': 0.6,   # Medium risk (Ingestion hazard but softer)
        'Organic': 0.8,   # High risk (Wildlife attractant, leading to bird strikes)
        'Other': 0.4      # Lower baseline risk for unknown items
    }

    # Thresholds for object size (area in pixels, assuming 640x640 frame for now)
    # In a real scenario, this would be calibrated to actual physical dimensions using drone altitude
    SIZE_THRESHOLDS = {
        'small': 1000,    
        'medium': 5000,   
    }

    @classmethod
    def calculate_risk(cls, det_class: str, confidence: float, bbox: list) -> dict:
        """
        Calculate the risk severity of a detected object.
        
        Args:
            det_class (str): The predicted class of the object ('Metal', 'Plastic', 'Organic', 'Other')
            confidence (float): The AI model's confidence in the prediction (0.0 to 1.0)
            bbox (list): Bounding box coordinates [x1, y1, x2, y2]
            
        Returns:
            dict: Containing the 'severity_label' (Low, Medium, Critical) and the numerical 'risk_score' (0-100)
        """
        # 1. Material Risk Base
        base_risk = cls.MATERIAL_RISK.get(det_class, 0.5)

        # 2. Size Multiplier
        # Calculate bounding box area
        x1, y1, x2, y2 = bbox
        area = max(0, x2 - x1) * max(0, y2 - y1)
        
        size_multiplier = 1.0
        if area > cls.SIZE_THRESHOLDS['medium']:
            size_multiplier = 1.5  # Large objects are inherently more dangerous
        elif area < cls.SIZE_THRESHOLDS['small']:
            size_multiplier = 0.7  # Very small objects pose slightly less immediate catastrophic risk
            
        # 3. Confidence Factor
        # Lower confidence detections should slightly decrease the *actionable* risk score 
        # to prevent panic on false positives, but not ignore them completely.
        # We use a dampening factor so a 50% confident detection doesn't halve the risk.
        confidence_factor = 0.5 + (confidence * 0.5)

        # Calculate final raw score
        raw_score = base_risk * size_multiplier * confidence_factor
        
        # Normalize to a 0-100 scale
        # Max theoretical raw score is ~ 1.0 * 1.5 * 1.0 = 1.5
        normalized_score = min(100, int((raw_score / 1.5) * 100))
        
        # Determine Severity Label
        if normalized_score >= 75:
            severity = 'Critical'
        elif normalized_score >= 40:
            severity = 'Medium'
        else:
            severity = 'Low'
            
        return {
            'risk_score': normalized_score,
            'severity_label': severity,
            'details': {
                'area': area,
                'material_base': base_risk
            }
        }

if __name__ == "__main__":
    # Test cases
    print("Testing Hazard Scorer...")
    
    # Large Metal object, high confidence
    res1 = HazardScorer.calculate_risk('Metal', 0.95, [0, 0, 100, 100])
    print(f"Large Metal (conf: 0.95): {res1}")
    
    # Small Plastic object, low confidence
    res2 = HazardScorer.calculate_risk('Plastic', 0.60, [10, 10, 30, 30])
    print(f"Small Plastic (conf: 0.60): {res2}")
    
    # Huge Organic object (wildlife hazard)
    res3 = HazardScorer.calculate_risk('Organic', 0.88, [0, 0, 200, 200])
    print(f"Huge Organic (conf: 0.88): {res3}")

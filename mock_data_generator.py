import json
import random
from datetime import datetime, timedelta
import os

from ai.hazard_scorer import HazardScorer

class MockDataGenerator:
    """
    Generates synthetic historical detection logs for dashboard populating.
    """
    
    CLASSES = ['Metal', 'Plastic', 'Organic', 'Other']
    
    def __init__(self, output_dir="data"):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def generate_logs(self, days=30, detections_per_day=(0, 15), output_file="historical_detections.json"):
        """
        Generates json log file spanning a certain number of days.
        """
        now = datetime.now()
        logs = []
        
        # Start from X days ago
        start_date = now - timedelta(days=days)
        
        id_counter = 1
        for day_offset in range(days):
            current_date = start_date + timedelta(days=day_offset)
            
            # Random number of detections for this day
            num_detections = random.randint(*detections_per_day)
            
            for _ in range(num_detections):
                # Randomize time within the day (e.g., between 6 AM and 6 PM for daylight operations)
                hour = random.randint(6, 18)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                
                det_time = current_date.replace(hour=hour, minute=minute, second=second)
                
                # Randomize attributes
                det_class = random.choices(self.CLASSES, weights=[0.2, 0.4, 0.3, 0.1])[0]
                confidence = round(random.uniform(0.5, 0.99), 2)
                
                # Random bbox location (assuming 1920x1080 resolution)
                x1 = random.randint(0, 1800)
                y1 = random.randint(0, 900)
                width = random.randint(20, 300)
                height = random.randint(20, 300)
                bbox = [x1, y1, x1 + width, y1 + height]
                
                # Use our HazardScorer to get realistic risk metadata based on the random dimensions and class
                risk_data = HazardScorer.calculate_risk(det_class, confidence, bbox)
                
                log_entry = {
                    "id": id_counter,
                    "timestamp": det_time.isoformat(),
                    "class": det_class,
                    "confidence": confidence,
                    "bbox": bbox,
                    "risk_score": risk_data['risk_score'],
                    "severity": risk_data['severity_label'],
                    "lat": round(random.uniform(34.0, 34.05), 5), # mock latitude
                    "lng": round(random.uniform(-118.4, -118.35), 5) # mock longitude
                }
                
                logs.append(log_entry)
                id_counter += 1
                
        # Sort logs chronologically
        logs.sort(key=lambda x: x['timestamp'])
        
        filepath = os.path.join(self.output_dir, output_file)
        with open(filepath, 'w') as f:
            json.dump(logs, f, indent=4)
            
        print(f"Generated {len(logs)} synthetic historical logs spanning {days} days.")
        return filepath

if __name__ == "__main__":
    print("Running Mock Data Generator...")
    generator = MockDataGenerator()
    # Generate 60 days of historical data
    filepath = generator.generate_logs(days=60, detections_per_day=(2, 25))
    print(f"Data saved to: {os.path.abspath(filepath)}")

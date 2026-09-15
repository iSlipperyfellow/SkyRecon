"""
Inference client for YOLOv8 service
"""

import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class InferenceClient:
    """Client for YOLOv8 inference service"""
    
    def __init__(self, base_url=None):
        self.base_url = base_url or settings.YOLO_INFERENCE_URL
        self.timeout = settings.INFERENCE_TIMEOUT
    
    def submit_frame(self, frame_url, drone_id=None, flight_id=None):
        """
        Submit a frame for inference.
        
        Args:
            frame_url: URL to frame image
            drone_id: Optional drone identifier
            flight_id: Optional flight identifier
            
        Returns:
            dict: Response from inference service with job_id
        """
        try:
            payload = {
                'frame_url': frame_url,
                'drone_id': str(drone_id) if drone_id else None,
                'flight_id': str(flight_id) if flight_id else None,
            }
            
            response = requests.post(
                f'{self.base_url}/infer',
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Inference submission failed: {e}")
            raise
    
    def get_results(self, job_id):
        """
        Get inference results for a job.
        
        Args:
            job_id: Job identifier from submit_frame
            
        Returns:
            dict: Detections and metadata
        """
        try:
            response = requests.get(
                f'{self.base_url}/results/{job_id}',
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch inference results: {e}")
            raise


# Singleton instance
_inference_client = None


def get_inference_client():
    """Get singleton inference client"""
    global _inference_client
    if _inference_client is None:
        _inference_client = InferenceClient()
    return _inference_client

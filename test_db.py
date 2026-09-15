from core.consumers import InferenceConsumer
import asyncio

async def test():
    await InferenceConsumer().save_detections_to_db([{'class': 'Metal', 'confidence': 0.85, 'hazard_score': 0.7, 'severity': 'high', 'location': {'lat': 33.614, 'lng': 73.055}}], 'SKY-ALPHA-01')
    print('Saved')

asyncio.run(test())

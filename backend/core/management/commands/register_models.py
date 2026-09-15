
from django.core.management.base import BaseCommand
from core.models import AIModel
import os

class Command(BaseCommand):
    help = 'Register existing .pt models in the database'

    def handle(self, *args, **options):
        models_to_register = [
            {
                'name': 'SkyRecon Detector v7',
                'version': '7.0.0',
                'framework': 'YOLO',
                'status': 'READY',
                'accuracy': 94.2,
                'file_path': '/app/runs/detect/skyrecon_detector7/weights/best.pt',
            },
            {
                'name': 'Base YOLOv8n',
                'version': '8.0.0',
                'framework': 'YOLO',
                'status': 'READY',
                'accuracy': 89.5,
                'file_path': '/app/yolov8n.pt',
            },
            {
                'name': 'SkyRecon v2.6',
                'version': '2.6.0',
                'framework': 'YOLO',
                'status': 'DEPLOYED',
                'accuracy': 91.8,
                'is_active': True,
                'file_path': '/app/yolo26n.pt',
            }
        ]

        for m_data in models_to_register:
            model, created = AIModel.objects.get_or_create(
                name=m_data['name'],
                version=m_data['version'],
                defaults=m_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Registered model: {model.name}"))
            else:
                self.stdout.write(f"Model already exists: {model.name}")

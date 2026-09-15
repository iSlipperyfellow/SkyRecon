import os

from django.conf import settings
from django.core.management.base import BaseCommand

from core.models import AIModel


class Command(BaseCommand):
    help = "Syncs actual .pt models from the backend directory into the database."

    def handle(self, *args, **options):
        # Clear existing models (to remove the mock data)
        self.stdout.write("Clearing existing AI models from database...")
        AIModel.objects.all().delete()

        # Look for .pt and .onnx models in the backend project root
        backend_dir = settings.BASE_DIR
        model_files = [
            f for f in os.listdir(backend_dir) if f.endswith((".pt", ".onnx"))
        ]

        if not model_files:
            self.stdout.write(
                self.style.WARNING(f"No model files found in {backend_dir}")
            )
            return

        for file_name in model_files:
            name = file_name.replace(".pt", "").replace(".onnx", "")

            # Simple version heuristic based on filename
            version = "1.0.0"
            if "26" in name:
                version = "2.6.0"
            elif "8" in name:
                version = "8.0.0"

            model = AIModel.objects.create(
                name=name,
                version=version,
                framework="YOLO",
                status="READY",
                accuracy=85.0,
            )

            # We assign the name directly since it's just in the root dir
            # In a real app we'd upload it to a media directory.
            model.file_path.name = file_name
            model.save()

            self.stdout.write(
                self.style.SUCCESS(f"Successfully imported {file_name} as {name}")
            )

        self.stdout.write(self.style.SUCCESS("Model sync complete."))


from django.core.management.base import BaseCommand, CommandError

from core.models import Detection, Flight, Hazard
from report_generator import ReportGenerator


class Command(BaseCommand):
    help = "Generates a runway inspection report for a specific flight"

    def add_arguments(self, parser):
        parser.add_argument("flight_id", type=int, help="ID of the flight to report on")
        parser.add_argument(
            "--format",
            type=str,
            choices=["md", "csv"],
            default="md",
            help="Output format (md or csv)",
        )

    def handle(self, *args, **options):
        flight_id = options["flight_id"]
        fmt = options["format"]

        try:
            flight = Flight.objects.get(pk=flight_id)
        except Flight.DoesNotExist:
            raise CommandError(f'Flight "{flight_id}" does not exist')

        # Gather detections with hazard data
        detections = []
        detection_objs = Detection.objects.filter(flight=flight)

        for det in detection_objs:
            try:
                hazard = Hazard.objects.get(detection=det)
                detections.append(
                    {
                        "class": det.label,
                        "confidence": det.confidence,
                        "risk_score": hazard.score * 100,  # Back to 0-100 for report
                        "severity": hazard.level.capitalize(),  # HIGH -> Critical/Medium/Low mapping needed or just use level
                        "bbox": [
                            0,
                            0,
                            0,
                            0,
                        ],  # BBox not currently stored in DB Detection model based on quick look, placeholder
                    }
                )
            except Hazard.DoesNotExist:
                continue

        if not detections:
            self.stdout.write(
                self.style.WARNING(f"No detections found for flight {flight_id}")
            )
            return

        generator = ReportGenerator(output_dir="reports")

        if fmt == "csv":
            path = generator.generate_csv_report(detections)
        else:
            path = generator.generate_markdown_report(
                detections, inspector_name=f"Flight {flight.mission_name}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully generated {fmt.upper()} report at: {path}"
            )
        )

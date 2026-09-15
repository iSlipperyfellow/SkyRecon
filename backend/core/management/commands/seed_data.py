"""
Management command to seed initial data
"""

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import LineString, Point, Polygon
from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Detection, Drone, Flight, Hazard, Runway

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with initial data for development"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # Create users
        self._create_users()

        # Create runway
        self._create_runway()

        # Create drones
        self._create_drones()

        # Create sample flight and detection
        self._create_sample_data()

        self.stdout.write(self.style.SUCCESS("Database seeding completed!"))

    def _create_users(self):
        """Create sample users"""
        users_data = [
            {
                "username": "admin",
                "email": "admin@skyrecon.local",
                "password": "admin123",
                "role": "ADMIN",
                "first_name": "Admin",
                "last_name": "User",
            },
            {
                "username": "operator",
                "email": "operator@skyrecon.local",
                "password": "operator123",
                "role": "OPERATOR",
                "first_name": "Operator",
                "last_name": "User",
            },
            {
                "username": "analyst",
                "email": "analyst@skyrecon.local",
                "password": "analyst123",
                "role": "ANALYST",
                "first_name": "Analyst",
                "last_name": "User",
            },
        ]

        for user_data in users_data:
            password = user_data.pop("password")
            user, created = User.objects.get_or_create(
                username=user_data["username"], defaults=user_data
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f"  ✓ Created user: {user.username}")
            else:
                self.stdout.write(f"  • User already exists: {user.username}")

    def _create_runway(self):
        """Create sample runway"""
        # ORD (Chicago O'Hare) - Runway 09R/27L coordinates (approximate)
        runway_coords = [
            (73.0500, 33.6100),
            (73.0600, 33.6150),
            (73.0600, 33.6200),
            (73.0500, 33.6150),
            (73.0500, 33.6100),
        ]

        geometry = Polygon(runway_coords)
        centerline = LineString([(73.0500, 33.6125), (73.0600, 33.6175)])

        runway, created = Runway.objects.get_or_create(
            airport_code="ORD",
            name="Runway 09R/27L",
            defaults={
                "geometry": geometry,
                "centerline": centerline,
                "length_m": 3000,
                "width_m": 61,
                "active": True,
            },
        )

        if created:
            self.stdout.write(f"  ✓ Created runway: {runway.name}")
        else:
            self.stdout.write(f"  • Runway already exists: {runway.name}")

    def _create_drones(self):
        """Create sample drones"""
        drones_data = [
            {
                "identifier": "Drone-001",
                "model": "DJI Matrice 300 RTK",
                "max_payload": 2.7,
                "home_location": Point(73.0550, 33.6125),
                "status": "ACTIVE",
            },
            {
                "identifier": "Drone-002",
                "model": "DJI Matrice 300 RTK",
                "max_payload": 2.7,
                "home_location": Point(73.0560, 33.6130),
                "status": "INACTIVE",
            },
            {
                "identifier": "Drone-003",
                "model": "DJI Phantom 4 Pro",
                "max_payload": 1.3,
                "home_location": Point(73.0540, 33.6120),
                "status": "ACTIVE",
            },
        ]

        for drone_data in drones_data:
            drone, created = Drone.objects.get_or_create(
                identifier=drone_data["identifier"], defaults=drone_data
            )

            if created:
                self.stdout.write(f"  ✓ Created drone: {drone.identifier}")
            else:
                self.stdout.write(f"  • Drone already exists: {drone.identifier}")

    def _create_sample_data(self):
        """Create sample flight and detections"""
        drone = Drone.objects.filter(status="ACTIVE").first()
        if not drone:
            return

        # Create flight
        path = LineString(
            [
                (73.0550, 33.6125),
                (73.0560, 33.6130),
                (73.0570, 33.6135),
                (73.0580, 33.6140),
            ]
        )

        flight, created = Flight.objects.get_or_create(
            mission_name="Demo Mission 001",
            drone=drone,
            defaults={
                "status": "COMPLETED",
                "path": path,
                "altitude_m": 50,
                "start_time": timezone.now() - timezone.timedelta(hours=1),
                "end_time": timezone.now(),
            },
        )

        if created:
            self.stdout.write(f"  ✓ Created flight: {flight.mission_name}")
        else:
            self.stdout.write(f"  • Flight already exists: {flight.mission_name}")

        # Create sample detections
        detections_data = [
            {
                "label": "metal",
                "confidence": 0.92,
                "geometry": Point(73.0555, 33.6127),
                "image_url": "https://example.com/detection1.jpg",
            },
            {
                "label": "plastic",
                "confidence": 0.85,
                "geometry": Point(73.0565, 33.6132),
                "image_url": "https://example.com/detection2.jpg",
            },
        ]

        for det_data in detections_data:
            try:
                detection, created = Detection.objects.get_or_create(
                    flight=flight,
                    drone=drone,
                    geometry=det_data["geometry"],
                    label=det_data["label"],
                    defaults={
                        "timestamp": flight.end_time or flight.start_time,
                        "confidence": det_data["confidence"],
                        "image_url": det_data["image_url"],
                        "bbox": [100, 100, 150, 150],
                    },
                )

                if created:
                    self.stdout.write(f"  ✓ Created detection: {detection.label}")

                    # Create hazard for detection
                    from core.hazard_scoring import calculate_hazard_score

                    hazard_data = calculate_hazard_score(detection)
                    _hazard, _ = Hazard.objects.get_or_create(
                        detection=detection,
                        defaults={
                            "score": hazard_data["score"],
                            "level": hazard_data["level"],
                            "reasoning": hazard_data["reasoning"],
                        },
                    )
                    detection.hazard_score = hazard_data["score"]
                    detection.save()
                else:
                    self.stdout.write(
                        f"  • Detection already exists: {detection.label}"
                    )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to create detection: {e}"))
                import traceback

                self.stdout.write(self.style.ERROR(traceback.format_exc()))

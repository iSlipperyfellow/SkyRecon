"""
Test configuration and fixtures
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import LineString, Point, Polygon
from rest_framework.test import APIClient

from core.models import Detection, Drone, Flight, Hazard, Runway

@pytest.fixture
def api_client():
    """API client fixture"""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create admin user"""
    User = get_user_model()
    user = User.objects.create_superuser(
        username="admin", email="admin@test.com", password="admin123"
    )
    user.role = "ADMIN"
    user.save()
    return user


@pytest.fixture
def operator_user(db):
    """Create operator user"""
    User = get_user_model()
    user = User.objects.create_user(
        username="operator", email="operator@test.com", password="operator123"
    )
    user.role = "OPERATOR"
    user.save()
    return user


@pytest.fixture
def drone(db):
    """Create sample drone"""
    return Drone.objects.create(
        identifier="Test-Drone-001",
        model="DJI Matrice 300",
        max_payload=2.7,
        home_location=Point(73.0550, 33.6125),
        status="ACTIVE",
    )


@pytest.fixture
def runway(db):
    """Create sample runway"""
    geometry = Polygon(
        [
            (73.0500, 33.6100),
            (73.0600, 33.6100),
            (73.0600, 33.6200),
            (73.0500, 33.6200),
            (73.0500, 33.6100),
        ]
    )

    return Runway.objects.create(
        name="Test Runway",
        airport_code="TEST",
        geometry=geometry,
        length_m=3000,
        width_m=61,
        active=True,
    )


@pytest.fixture
def flight(db, drone):
    """Create sample flight"""
    from django.utils import timezone
    now = timezone.now()
    path = LineString(
        [
            (73.0550, 33.6125),
            (73.0560, 33.6130),
            (73.0570, 33.6135),
        ]
    )

    return Flight.objects.create(
        drone=drone,
        mission_name="Test Mission",
        start_time=now,
        end_time=now,
        path=path,
        status="COMPLETED",
        altitude_m=50,
    )


@pytest.fixture
def detection(db, drone, flight):
    """Create sample detection"""
    from django.utils import timezone
    return Detection.objects.create(
        drone=drone,
        flight=flight,
        timestamp=flight.end_time or flight.start_time or timezone.now(),
        geometry=Point(73.0555, 33.6127),
        label="metal",
        confidence=0.92,
        image_url="https://example.com/detection.jpg",
        bbox=[100, 100, 150, 150],
    )


@pytest.fixture
def hazard(db, detection):
    """Create sample hazard"""
    return Hazard.objects.create(detection=detection, score=0.86, level="HIGH")

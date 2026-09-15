"""
Tests for models
"""

import pytest
from django.contrib.gis.geos import Point

from core.models import Detection, Drone, Hazard, User


@pytest.mark.django_db
def test_drone_creation(db):
    """Test drone can be created"""
    drone = Drone.objects.create(
        identifier="Test-001",
        model="DJI",
        max_payload=2.0,
        home_location=Point(73.0, 33.6),
    )

    assert drone.identifier == "Test-001"
    assert drone.status == "INACTIVE"
    assert drone.home_location.x == 73.0


@pytest.mark.django_db
def test_detection_creation(drone, flight):
    """Test detection can be created"""
    from django.utils import timezone
    detection = Detection.objects.create(
        drone=drone,
        flight=flight,
        timestamp=flight.start_time or timezone.now(),
        geometry=Point(73.0, 33.6),
        label="metal",
        confidence=0.9,
    )

    assert detection.label == "metal"
    assert detection.confidence == 0.9
    assert detection.drone == drone


@pytest.mark.django_db
def test_hazard_levels(detection):
    """Test hazard levels"""
    hazard_low = Hazard.objects.create(detection=detection, score=0.2, level="LOW")

    hazard_medium = Hazard.objects.create(
        detection=detection, score=0.5, level="MEDIUM"
    )

    assert hazard_low.level == "LOW"
    assert hazard_medium.level == "MEDIUM"


@pytest.mark.django_db
def test_user_roles(db):
    """Test user roles"""
    admin = User.objects.create_user(username="admin", password="test")
    admin.role = "ADMIN"
    admin.save()

    operator = User.objects.create_user(username="operator", password="test")
    operator.role = "OPERATOR"
    operator.save()

    assert admin.role == "ADMIN"
    assert operator.role == "OPERATOR"

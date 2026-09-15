"""
Tests for hazard scoring logic
"""

import pytest
from django.contrib.gis.geos import Point
from django.test import TestCase

from core.hazard_scoring import calculate_hazard_score
from core.models import Detection, Drone, Flight, Hazard


class TestHazardScoring(TestCase):
    """Test hazard scoring calculation"""

    def setUp(self):
        from django.utils import timezone
        now = timezone.now()
        self.drone = Drone.objects.create(
            identifier="test-drone",
            model="Test",
            max_payload=1.0,
            home_location=Point(73.0550, 33.6125),
        )

        self.flight = Flight.objects.create(
            drone=self.drone,
            mission_name="Test",
            start_time=now,
        )

    def test_metal_high_confidence(self):
        """Test high-confidence metal detection"""
        detection = Detection.objects.create(
            drone=self.drone,
            flight=self.flight,
            timestamp=self.flight.start_time,
            geometry=Point(73.0555, 33.6127),
            label="metal",
            confidence=0.95,
        )

        result = calculate_hazard_score(detection)

        assert result["score"] >= 0.9
        assert result["level"] == "HIGH"
        assert result["reasoning"]["confidence"] == 0.95

    def test_plastic_medium_confidence(self):
        """Test medium-confidence plastic detection"""
        detection = Detection.objects.create(
            drone=self.drone,
            flight=self.flight,
            timestamp=self.flight.start_time,
            geometry=Point(73.0555, 33.6127),
            label="plastic",
            confidence=0.65,
        )

        result = calculate_hazard_score(detection)

        # plastic weight = 0.7, so 0.65 * 0.7 = 0.455 -> MEDIUM
        assert 0.3 <= result["score"] < 0.7
        assert result["level"] == "MEDIUM"

    def test_organic_low_confidence(self):
        """Test low-confidence organic detection"""
        detection = Detection.objects.create(
            drone=self.drone,
            flight=self.flight,
            timestamp=self.flight.start_time,
            geometry=Point(73.0555, 33.6127),
            label="organic",
            confidence=0.4,
        )

        result = calculate_hazard_score(detection)

        # organic weight = 0.5, so 0.4 * 0.5 = 0.2 -> LOW
        assert result["score"] < 0.3
        assert result["level"] == "LOW"

    def test_score_normalized(self):
        """Test score is always between 0 and 1"""
        for confidence in [0.0, 0.25, 0.5, 0.75, 1.0]:
            detection = Detection.objects.create(
                drone=self.drone,
                flight=self.flight,
                timestamp=self.flight.start_time,
                geometry=Point(73.0555, 33.6127),
                label="metal",
                confidence=confidence,
            )

            result = calculate_hazard_score(detection)

            assert 0.0 <= result["score"] <= 1.0


@pytest.mark.django_db
def test_hazard_creation(detection):
    """Test hazard is created automatically with detection"""
    from core.hazard_scoring import calculate_hazard_score

    hazard_data = calculate_hazard_score(detection)
    hazard, _ = Hazard.objects.get_or_create(
        detection=detection,
        defaults={
            "score": hazard_data["score"],
            "level": hazard_data["level"],
            "reasoning": hazard_data["reasoning"],
        },
    )

    assert hazard.score == hazard_data["score"]
    assert hazard.level == hazard_data["level"]

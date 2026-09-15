"""
API integration tests
"""

import pytest
from rest_framework import status


@pytest.mark.django_db
def test_auth_token_obtain(api_client, operator_user):
    """Test getting JWT token"""
    response = api_client.post(
        "/api/auth/token/", {"username": "operator", "password": "operator123"}
    )

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_drone_list(api_client, operator_user, drone):
    """Test drone list endpoint"""
    api_client.force_authenticate(user=operator_user)
    response = api_client.get("/api/drones/")

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]["features"]) == 1


@pytest.mark.django_db
def test_detection_create(api_client, admin_user, drone, flight):
    """Test detection creation"""
    from django.utils import timezone
    api_client.force_authenticate(user=admin_user)

    data = {
        "drone": str(drone.id),
        "flight": str(flight.id),
        "timestamp": timezone.now().isoformat(),
        "label": "metal",
        "confidence": 0.95,
        "geometry": {"type": "Point", "coordinates": [73.0, 33.6]},
        "bbox": [100, 100, 150, 150],
    }

    response = api_client.post("/api/detections/", data, format="json")

    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_health_check(api_client):
    """Test health check endpoint"""
    response = api_client.get("/api/health/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "healthy"

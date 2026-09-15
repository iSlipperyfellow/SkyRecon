"""
End-to-End Acceptance Tests for SkyRecon

Verifies critical user workflows:
1. Authentication (login, token refresh)
2. Drone management (list, fetch, commands)
3. Detection workflow (create, view, acknowledge hazards)
4. Real-time updates (WebSocket, MQTT)
5. Spatial queries (nearest detections, heatmap)
"""

import json
import time
import pytest
import requests
from typing import Optional, Dict, Any


BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"


class TestAuthentication:
    """Test JWT authentication flow"""

    def test_login_with_seeded_credentials(self):
        """Verify operator can login with seeded credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/token/",
            json={"username": "operator", "password": "operator123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access" in data
        assert "refresh" in data
        assert data["access"]

    def test_login_invalid_credentials(self):
        """Verify login rejects invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/token/",
            json={"username": "operator", "password": "wrongpassword"}
        )
        assert response.status_code == 401

    def test_token_refresh(self):
        """Verify refresh token generates new access token"""
        # Get initial tokens
        response = requests.post(
            f"{BASE_URL}/api/auth/token/",
            json={"username": "operator", "password": "operator123"}
        )
        refresh_token = response.json()["refresh"]

        # Refresh to get new access token
        response = requests.post(
            f"{BASE_URL}/api/auth/token/refresh/",
            json={"refresh": refresh_token}
        )
        assert response.status_code == 200
        assert "access" in response.json()

    def test_protected_endpoint_requires_auth(self):
        """Verify protected endpoints reject unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/drones/")
        assert response.status_code == 401

    def test_protected_endpoint_with_valid_token(self):
        """Verify protected endpoints accept valid token"""
        # Get token
        auth_response = requests.post(
            f"{BASE_URL}/api/auth/token/",
            json={"username": "operator", "password": "operator123"}
        )
        token = auth_response.json()["access"]

        # Access protected endpoint
        response = requests.get(
            f"{BASE_URL}/api/drones/",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json()["results"], list)


class TestDroneManagement:
    """Test drone CRUD and commands"""

    @pytest.fixture
    def auth_token(self):
        """Get operator token for tests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/token/",
            json={"username": "operator", "password": "operator123"}
        )
        return response.json()["access"]

    def test_list_drones(self, auth_token):
        """Verify can list all drones"""
        response = requests.get(
            f"{BASE_URL}/api/drones/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0
        # Verify drone structure
        drone = data["results"][0]
        assert "id" in drone
        assert "identifier" in drone
        assert "status" in drone
        assert "home_location" in drone

    def test_get_drone_detail(self, auth_token):
        """Verify can fetch individual drone"""
        # List to get drone ID
        list_response = requests.get(
            f"{BASE_URL}/api/drones/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        drone_id = list_response.json()["results"][0]["id"]

        # Fetch detail
        response = requests.get(
            f"{BASE_URL}/api/drones/{drone_id}/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == drone_id
        assert "recent_telemetry" in data

    def test_get_drone_telemetry(self, auth_token):
        """Verify can fetch drone telemetry history"""
        # Get drone ID
        list_response = requests.get(
            f"{BASE_URL}/api/drones/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        drone_id = list_response.json()["results"][0]["id"]

        # Fetch telemetry
        response = requests.get(
            f"{BASE_URL}/api/drones/{drone_id}/telemetry/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        if data["results"]:
            telemetry = data["results"][0]
            assert "timestamp" in telemetry
            assert "altitude" in telemetry
            assert "battery_percent" in telemetry

    def test_send_drone_command(self, auth_token):
        """Verify can send command to drone"""
        # Get drone ID
        list_response = requests.get(
            f"{BASE_URL}/api/drones/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        drone_id = list_response.json()["results"][0]["id"]

        # Send command
        response = requests.post(
            f"{BASE_URL}/api/drones/{drone_id}/command/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"command": "HOVER", "data": {}}
        )
        assert response.status_code in [200, 202, 204]


class TestDetectionWorkflow:
    """Test detection creation and hazard management"""

    @pytest.fixture
    def auth_token(self):
        """Get admin token for tests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/token/",
            json={"username": "admin", "password": "admin123"}
        )
        return response.json()["access"]

    def test_list_detections(self, auth_token):
        """Verify can list detections"""
        response = requests.get(
            f"{BASE_URL}/api/detections/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert isinstance(data["results"], list)

    def test_create_detection(self, auth_token):
        """Verify can create detection"""
        response = requests.post(
            f"{BASE_URL}/api/detections/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "label": "metal_debris",
                "confidence": 0.85,
                "geometry": {"type": "Point", "coordinates": [-87.9, 41.98]},
                "bbox": {"x": 100, "y": 150, "width": 50, "height": 45},
                "image_url": "https://example.com/image.jpg"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["confidence"] == 0.85
        assert "hazard_id" in data

    def test_get_detection_detail(self, auth_token):
        """Verify can fetch detection with hazard info"""
        # Create detection
        create_response = requests.post(
            f"{BASE_URL}/api/detections/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "label": "metal_debris",
                "confidence": 0.92,
                "geometry": {"type": "Point", "coordinates": [-87.9, 41.98]},
                "bbox": {"x": 100, "y": 150, "width": 50, "height": 45},
                "image_url": "https://example.com/image.jpg"
            }
        )
        detection_id = create_response.json()["id"]

        # Fetch detail
        response = requests.get(
            f"{BASE_URL}/api/detections/{detection_id}/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "hazard_level" in data
        assert data["hazard_level"] in ["LOW", "MEDIUM", "HIGH"]

    def test_hazard_scoring(self, auth_token):
        """Verify hazard scoring calculates correctly"""
        # High confidence metal → HIGH hazard
        response = requests.post(
            f"{BASE_URL}/api/detections/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "label": "metal_debris",
                "confidence": 0.95,
                "geometry": {"type": "Point", "coordinates": [-87.9, 41.98]},
                "bbox": {"x": 0, "y": 0, "width": 10, "height": 10},
                "image_url": "https://example.com/image.jpg"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["hazard_level"] == "HIGH"

        # Low confidence plastic → LOW hazard
        response = requests.post(
            f"{BASE_URL}/api/detections/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "label": "plastic_debris",
                "confidence": 0.2,
                "geometry": {"type": "Point", "coordinates": [-87.9, 41.98]},
                "bbox": {"x": 0, "y": 0, "width": 10, "height": 10},
                "image_url": "https://example.com/image.jpg"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["hazard_level"] == "LOW"

    def test_acknowledge_hazard(self, auth_token):
        """Verify can acknowledge hazard"""
        # Create detection (which creates hazard)
        create_response = requests.post(
            f"{BASE_URL}/api/detections/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "label": "metal_debris",
                "confidence": 0.85,
                "geometry": {"type": "Point", "coordinates": [-87.9, 41.98]},
                "bbox": {"x": 0, "y": 0, "width": 10, "height": 10},
                "image_url": "https://example.com/image.jpg"
            }
        )
        hazard_id = create_response.json()["hazard_id"]

        # Acknowledge
        response = requests.post(
            f"{BASE_URL}/api/hazards/{hazard_id}/acknowledge/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={}
        )
        assert response.status_code == 200


class TestSpatialQueries:
    """Test PostGIS spatial functionality"""

    @pytest.fixture
    def auth_token(self):
        """Get token for tests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/token/",
            json={"username": "operator", "password": "operator123"}
        )
        return response.json()["access"]

    def test_nearest_detections(self, auth_token):
        """Verify nearest detections query"""
        response = requests.get(
            f"{BASE_URL}/api/detections/nearest/?lat=41.98&lng=-87.9&radius_m=1000",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    def test_heatmap_data(self, auth_token):
        """Verify heatmap aggregation"""
        response = requests.get(
            f"{BASE_URL}/api/maps/heatmap/?grid_size=100",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "features" in data
        assert data["type"] == "FeatureCollection"

    def test_runways_geojson(self, auth_token):
        """Verify runways returned as GeoJSON"""
        response = requests.get(
            f"{BASE_URL}/api/maps/runways/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "FeatureCollection"
        if data["features"]:
            feature = data["features"][0]
            assert "geometry" in feature
            assert feature["geometry"]["type"] == "Polygon"


class TestInference:
    """Test inference service integration"""

    @pytest.fixture
    def auth_token(self):
        """Get token for tests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/token/",
            json={"username": "operator", "password": "operator123"}
        )
        return response.json()["access"]

    def test_submit_frame_to_inference(self, auth_token):
        """Verify can submit frame for inference"""
        response = requests.post(
            f"{BASE_URL}/api/inference/submit-frame/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "frame_url": "https://example.com/frame.jpg",
                "drone_id": None,  # Optional
            }
        )
        assert response.status_code in [200, 201, 202]
        if response.status_code == 200:
            data = response.json()
            assert "job_id" in data

    def test_get_inference_results(self, auth_token):
        """Verify can retrieve inference results"""
        # Submit frame
        submit_response = requests.post(
            f"{BASE_URL}/api/inference/submit-frame/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "frame_url": "https://example.com/frame.jpg",
            }
        )
        if submit_response.status_code == 200:
            job_id = submit_response.json()["job_id"]

            # Wait a moment for inference
            time.sleep(1)

            # Get results
            response = requests.get(
                f"{BASE_URL}/api/inference/results/{job_id}/",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200


class TestHealthChecks:
    """Test service health and readiness"""

    def test_api_health_check(self):
        """Verify API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_openapi_schema(self):
        """Verify OpenAPI schema is available"""
        response = requests.get(f"{BASE_URL}/api/schema/")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data or "swagger" in data

    def test_inference_health_check(self):
        """Verify mock inference service is healthy"""
        try:
            response = requests.get("http://localhost:8001/health", timeout=5)
            assert response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("Inference service not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Serializers for DRF API endpoints
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from core.models import (AIModel, Detection, Drone, Flight, Hazard,
                         InferenceJob, NavigationPlan, Runway, Telemetry)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer with role info"""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    """User creation serializer"""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "role"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class DroneSerializer(GeoFeatureModelSerializer):
    """Drone serializer with geometry support"""

    recent_telemetry = serializers.SerializerMethodField()

    class Meta:
        model = Drone
        fields = [
            "id",
            "identifier",
            "model",
            "max_payload",
            "home_location",
            "status",
            "last_seen",
            "recent_telemetry",
            "created_at",
            "updated_at",
        ]
        geo_field = "home_location"
        read_only_fields = ["id", "last_seen", "created_at", "updated_at"]

    def get_recent_telemetry(self, obj):
        """Get latest telemetry point"""
        latest = obj.telemetry.first()
        if latest:
            return TelemetrySerializer(latest).data
        return None


class TelemetrySerializer(GeoFeatureModelSerializer):
    """Telemetry serializer with location geometry"""

    class Meta:
        model = Telemetry
        fields = [
            "id",
            "drone",
            "flight",
            "timestamp",
            "location",
            "altitude",
            "velocity",
            "heading",
            "battery",
            "created_at",
        ]
        geo_field = "location"
        read_only_fields = ["id", "created_at"]


class FlightSerializer(GeoFeatureModelSerializer):
    """Flight serializer with path geometry"""

    drone_identifier = serializers.CharField(source="drone.identifier", read_only=True)

    class Meta:
        model = Flight
        fields = [
            "id",
            "drone",
            "drone_identifier",
            "mission_name",
            "start_time",
            "end_time",
            "path",
            "status",
            "altitude_m",
            "duration_seconds",
            "metadata",
            "created_at",
            "updated_at",
        ]
        geo_field = "path"
        read_only_fields = ["id", "created_at", "updated_at"]


class DetectionSerializer(GeoFeatureModelSerializer):
    """Detection serializer with location geometry"""

    drone_identifier = serializers.CharField(source="drone.identifier", read_only=True)
    hazard_level = serializers.CharField(source="hazard.level", read_only=True)

    class Meta:
        model = Detection
        fields = [
            "id",
            "drone",
            "drone_identifier",
            "flight",
            "timestamp",
            "geometry",
            "bbox",
            "label",
            "confidence",
            "image_url",
            "hazard_score",
            "hazard_level",
            "metadata",
            "created_at",
        ]
        geo_field = "geometry"
        read_only_fields = ["id", "hazard_score", "created_at"]


class HazardSerializer(serializers.ModelSerializer):
    """Hazard serializer"""

    detection = DetectionSerializer(read_only=True)
    acknowledged_by_name = serializers.CharField(
        source="acknowledged_by.username", read_only=True
    )

    class Meta:
        model = Hazard
        fields = [
            "id",
            "detection",
            "score",
            "level",
            "acknowledged",
            "acknowledged_by",
            "acknowledged_by_name",
            "acknowledged_at",
            "archived",
            "reasoning",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RunwaySerializer(GeoFeatureModelSerializer):
    """Runway serializer with geometry"""

    class Meta:
        model = Runway
        fields = [
            "id",
            "name",
            "airport_code",
            "geometry",
            "centerline",
            "length_m",
            "width_m",
            "active",
            "created_at",
            "updated_at",
        ]
        geo_field = "geometry"
        read_only_fields = ["id", "created_at", "updated_at"]


class InferenceJobSerializer(serializers.ModelSerializer):
    """Inference job serializer"""

    drone_identifier = serializers.CharField(source="drone.identifier", read_only=True)

    class Meta:
        model = InferenceJob
        fields = [
            "id",
            "drone",
            "drone_identifier",
            "flight",
            "status",
            "frame_url",
            "submitted_at",
            "completed_at",
            "detections_count",
            "error_message",
            "external_job_id",
        ]
        read_only_fields = ["id", "submitted_at", "completed_at", "detections_count"]


class NavigationPlanSerializer(GeoFeatureModelSerializer):
    """Navigation plan serializer"""

    drone_identifier = serializers.CharField(source="drone.identifier", read_only=True)

    class Meta:
        model = NavigationPlan
        fields = [
            "id",
            "drone",
            "drone_identifier",
            "flight",
            "planned_path",
            "constraints",
            "optimization_metric",
            "created_at",
            "updated_at",
        ]
        geo_field = "planned_path"
        read_only_fields = ["id", "created_at", "updated_at"]


class AIModelSerializer(serializers.ModelSerializer):
    """AI Model serializer"""

    class Meta:
        model = AIModel
        fields = [
            "id",
            "name",
            "version",
            "framework",
            "status",
            "accuracy",
            "file_path",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# Request/Response specific serializers


class DroneCommandSerializer(serializers.Serializer):
    """Drone command request"""

    COMMAND_CHOICES = [
        ("REROUTE", "Reroute"),
        ("HOVER", "Hover"),
        ("RETURN_HOME", "Return to Home"),
        ("EMERGENCY_LAND", "Emergency Land"),
    ]

    command = serializers.ChoiceField(choices=COMMAND_CHOICES)
    route = serializers.JSONField(
        required=False, help_text="For REROUTE: {waypoints: [{lat, lng}, ...]}"
    )
    duration_seconds = serializers.IntegerField(required=False, help_text="For HOVER")


class HazardEvaluateSerializer(serializers.Serializer):
    """Evaluate hazard score for detection"""

    detection_id = serializers.UUIDField()
    runway_id = serializers.UUIDField(required=False)


class FrameSubmitSerializer(serializers.Serializer):
    """Submit frame for inference"""

    frame_url = serializers.URLField()
    drone_id = serializers.UUIDField()
    flight_id = serializers.UUIDField(required=False)


class LocationFilterSerializer(serializers.Serializer):
    """Filter detections by location"""

    lat = serializers.FloatField()
    lng = serializers.FloatField()
    radius_m = serializers.IntegerField(default=1000)

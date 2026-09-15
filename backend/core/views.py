"""
Views and ViewSets for API endpoints
"""

import logging

import requests
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, views, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_gis.filters import InBBOXFilter

from core.hazard_scoring import calculate_hazard_score
from core.inference_client import get_inference_client
from core.models import (AIModel, Detection, Drone, Flight, Hazard,
                         InferenceJob, NavigationPlan, Runway, Telemetry, User)
from core.permissions import IsAnalyst
from core.serializers import (AIModelSerializer, DetectionSerializer,
                              DroneCommandSerializer, DroneSerializer,
                              FlightSerializer, FrameSubmitSerializer,
                              HazardEvaluateSerializer, HazardSerializer,
                              InferenceJobSerializer, NavigationPlanSerializer,
                              RunwaySerializer, TelemetrySerializer,
                              UserSerializer)

logger = logging.getLogger(__name__)


class HealthCheckView(views.APIView):
    """Simple health check endpoint"""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok", "timestamp": timezone.now()})


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """User management endpoints"""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class DroneViewSet(viewsets.ModelViewSet):
    """Drone management endpoints"""

    queryset = Drone.objects.all()
    serializer_class = DroneSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "model"]
    ordering = ["identifier"]

    @action(detail=True, methods=["get"])
    def telemetry(self, request, pk=None):
        """Get recent telemetry for drone"""
        drone = self.get_object()
        qs = Telemetry.objects.filter(drone=drone).order_by("-timestamp")[:100]
        serializer = TelemetrySerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def command(self, request, pk=None):
        """Send command to drone (reroute, hover, etc)"""
        drone = self.get_object()
        serializer = DroneCommandSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        command = serializer.validated_data["command"]

        # In production, this would send actual commands via MQTT or API
        logger.info(f"Command '{command}' sent to drone {drone.identifier}")

        # Broadcast to WebSocket clients
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"drone_{drone.id}",
            {
                "type": "drone_command",
                "command": command,
                "timestamp": timezone.now().isoformat(),
            },
        )

        return Response(
            {
                "status": "command_sent",
                "drone_id": str(drone.id),
                "command": command,
                "timestamp": timezone.now().isoformat(),
            }
        )


class FlightViewSet(viewsets.ModelViewSet):
    """Flight mission endpoints"""

    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "drone"]
    ordering = ["-start_time"]

    @action(detail=True, methods=["get"])
    def path(self, request, pk=None):
        """Get flight path as GeoJSON LineString"""
        flight = self.get_object()
        if not flight.path:
            return Response({"type": "LineString", "coordinates": []})

        coords = list(flight.path.coords)
        return Response(
            {
                "type": "LineString",
                "coordinates": coords,
            }
        )


class TelemetryViewSet(viewsets.ReadOnlyModelViewSet):
    """Telemetry data endpoints"""

    queryset = Telemetry.objects.all()
    serializer_class = TelemetrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [InBBOXFilter, DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["drone", "flight"]
    ordering = ["-timestamp"]
    bbox_filter_field = "location"


class DetectionViewSet(viewsets.ModelViewSet):
    """Detection endpoints"""

    queryset = Detection.objects.all()
    serializer_class = DetectionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [InBBOXFilter, DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["drone", "flight", "label", "confidence"]
    search_fields = ["label"]
    ordering = ["-timestamp"]
    bbox_filter_field = "geometry"

    def perform_create(self, serializer):
        """Create detection and calculate hazard score"""
        detection = serializer.save()

        # Calculate hazard score
        hazard_data = calculate_hazard_score(detection)
        _hazard, _ = Hazard.objects.get_or_create(
            detection=detection,
            defaults={
                "score": hazard_data["score"],
                "level": hazard_data["level"],
                "reasoning": hazard_data["reasoning"],
            },
        )

        # Update detection hazard score
        detection.hazard_score = hazard_data["score"]
        detection.save()

        # Broadcast to WebSocket clients
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "detections",
            {
                "type": "detection.created",
                "detection": {
                    "id": str(detection.id),
                    "label": detection.label,
                    "confidence": detection.confidence,
                    "location": {
                        "lat": detection.geometry.y,
                        "lng": detection.geometry.x,
                    },
                    "hazard_score": hazard_data["score"],
                    "hazard_level": hazard_data["level"],
                    "image_url": detection.image_url,
                },
            },
        )

    @action(detail=False, methods=["get"])
    def nearest(self, request):
        """Get nearest detections to a point"""
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius_m = int(request.query_params.get("radius_m", 1000))

        if not lat or not lng:
            return Response(
                {"error": "lat and lng parameters required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.gis.db.models.functions import Distance
        from django.contrib.gis.geos import Point

        point = Point(float(lng), float(lat))
        detections = (
            Detection.objects.annotate(distance=Distance("geometry", point))
            .filter(distance__lte=radius_m)
            .order_by("distance")[:20]
        )

        serializer = self.get_serializer(detections, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["delete"])
    def clear_all(self, request):
        """Delete all detections and associated hazards to clear the map."""
        try:
            # Delete hazards first if needed, though CASCADE usually handles it
            Hazard.objects.all().delete()
            Detection.objects.all().delete()
            return Response({"status": "cleared"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HazardViewSet(viewsets.ModelViewSet):
    """Hazard management endpoints"""

    queryset = Hazard.objects.all()
    serializer_class = HazardSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["level", "acknowledged"]
    ordering = ["-created_at"]

    def get_permissions(self):
        # Analysts and Admins can evaluate and acknowledge hazards
        # Operators/others can view
        if self.action in ["evaluate", "acknowledge"]:
            return [IsAnalyst()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"])
    def evaluate(self, request):
        """Evaluate hazard score for a detection"""
        serializer = HazardEvaluateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        detection = get_object_or_404(
            Detection, id=serializer.validated_data["detection_id"]
        )
        runway = None

        if "runway_id" in serializer.validated_data:
            runway = get_object_or_404(
                Runway, id=serializer.validated_data["runway_id"]
            )

        hazard_data = calculate_hazard_score(detection, runway)

        hazard, _ = Hazard.objects.update_or_create(
            detection=detection,
            defaults={
                "score": hazard_data["score"],
                "level": hazard_data["level"],
                "reasoning": hazard_data["reasoning"],
            },
        )

        return Response(HazardSerializer(hazard).data)

    @action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        """Mark hazard as acknowledged"""
        hazard = self.get_object()
        hazard.acknowledged = True
        hazard.acknowledged_by = request.user
        hazard.acknowledged_at = timezone.now()
        hazard.save()

        return Response(HazardSerializer(hazard).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive a single hazard alert"""
        hazard = self.get_object()
        hazard.archived = True
        hazard.save()
        return Response({"status": "archived"})

    @action(detail=False, methods=["post"])
    def archive_bulk(self, request):
        """Archive multiple hazard alerts"""
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"error": "No ids provided"}, status=status.HTTP_400_BAD_REQUEST
            )
        Hazard.objects.filter(id__in=ids).update(archived=True)
        return Response({"status": f"archived {len(ids)} alerts"})


class RunwayViewSet(viewsets.ReadOnlyModelViewSet):
    """Runway endpoints"""

    queryset = Runway.objects.filter(active=True)
    serializer_class = RunwaySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [InBBOXFilter, DjangoFilterBackend]
    filterset_fields = ["airport_code"]
    bbox_filter_field = "geometry"


class InferenceJobViewSet(viewsets.ViewSet):
    """Inference job endpoints"""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def submit_frame(self, request):
        """Submit frame for inference"""
        serializer = FrameSubmitSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        drone = get_object_or_404(Drone, id=serializer.validated_data["drone_id"])
        flight_id = serializer.validated_data.get("flight_id")

        # Create inference job
        job = InferenceJob.objects.create(
            drone=drone,
            flight_id=flight_id if flight_id else None,
            frame_url=serializer.validated_data["frame_url"],
            status="PENDING",
        )

        # Submit to inference service (async would be better)
        try:
            client = get_inference_client()
            result = client.submit_frame(
                job.frame_url,
                drone_id=str(drone.id),
                flight_id=str(flight_id) if flight_id else None,
            )
            job.external_job_id = result.get("job_id")
            job.status = "RUNNING"
        except Exception as e:
            logger.error(f"Failed to submit frame for inference: {e}")
            job.status = "FAILED"
            job.error_message = str(e)

        job.save()
        return Response(
            InferenceJobSerializer(job).data, status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=["get"])
    def results(self, request):
        """Get inference results"""
        job_id = request.query_params.get("job_id")

        if not job_id:
            return Response(
                {"error": "job_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        job = get_object_or_404(InferenceJob, id=job_id)

        # Fetch detections for this job
        detections = Detection.objects.filter(inference_job__id=job_id)

        return Response(
            {
                "job": InferenceJobSerializer(job).data,
                "detections": DetectionSerializer(detections, many=True).data,
            }
        )


class NavigationPlanViewSet(viewsets.ModelViewSet):
    """Navigation planning endpoints"""

    queryset = NavigationPlan.objects.all()
    serializer_class = NavigationPlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["drone", "optimization_metric"]


class MapsViewSet(viewsets.ViewSet):
    """Map and geospatial endpoints"""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def runways(self, request):
        """Get all active runways as GeoJSON"""
        runways = Runway.objects.filter(active=True)
        serializer = RunwaySerializer(runways, many=True)

        features = [
            {
                "type": "Feature",
                "geometry": item["geometry"],
                "properties": {k: v for k, v in item.items() if k != "geometry"},
            }
            for item in serializer.data
        ]

        return Response(
            {
                "type": "FeatureCollection",
                "features": features,
            }
        )

    @action(detail=False, methods=["get"])
    def heatmap(self, request):
        """Get aggregated detection heatmap"""
        from django.db.models import Count

        # Aggregate detections into grid cells (simple 0.01 degree grid ~1km)
        detections = Detection.objects.values("geometry").annotate(count=Count("id"))

        features = []
        for item in detections:
            if item["geometry"]:
                features.append(
                    {
                        "type": "Feature",
                        "geometry": item["geometry"].geojson,
                        "properties": {"count": item["count"]},
                    }
                )

        return Response(
            {
                "type": "FeatureCollection",
                "features": features,
            }
        )


class AnalyticsViewSet(viewsets.ViewSet):
    """Analytics and statistics endpoints (Module 8)"""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get summary statistics for dashboard"""
        from django.db.models import Count
        from django.db.models.functions import TruncDay

        # Detection distribution by label
        label_stats = (
            Detection.objects.values("label")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Hazard level distribution
        hazard_stats = (
            Hazard.objects.values("level")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Detection trend (last 7 days)
        seven_days_ago = timezone.now() - timezone.timedelta(days=7)
        trend_stats = (
            Detection.objects.filter(timestamp__gte=seven_days_ago)
            .annotate(day=TruncDay("timestamp"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        return Response(
            {
                "label_distribution": label_stats,
                "hazard_distribution": hazard_stats,
                "trend": trend_stats,
                "total_detections": Detection.objects.count(),
                "total_flights": Flight.objects.count(),
            }
        )


class SystemHealthView(views.APIView):
    """Detailed health metrics endpoint (Module 9)"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        import time

        import psutil

        # Simple infrastructure metrics
        cpu_usage = psutil.cpu_percent()
        memory_usage = psutil.virtual_memory().percent

        return Response(
            {
                "status": "healthy",
                "uptime": (
                    time.clock_gettime(time.CLOCK_BOOTTIME)
                    if hasattr(time, "CLOCK_BOOTTIME")
                    else "N/A"
                ),
                "infrastructure": {
                    "cpu_load": f"{cpu_usage}%",
                    "memory_usage": f"{memory_usage}%",
                    "disk_usage": f"{psutil.disk_usage('/').percent}%",
                },
                "services": {
                    "database": "connected",
                    "cache": "connected",
                    "mqtt": "active",
                },
                "timestamp": timezone.now(),
            }
        )


class AIModelViewSet(viewsets.ModelViewSet):
    """AI Model management endpoints"""

    queryset = AIModel.objects.all()
    serializer_class = AIModelSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive this model (make it inactive)"""
        model = self.get_object()
        model.is_active = False
        model.status = "ARCHIVED"
        model.save()
        return Response({"status": "archived", "model_id": str(model.id)})

    @action(detail=True, methods=["post"])
    def deploy(self, request, pk=None):
        """Deploy this model (make it active)"""
        model = self.get_object()

        # Deactivate all others
        AIModel.objects.all().update(is_active=False, status="READY")

        # Activate this one
        model.is_active = True
        model.status = "DEPLOYED"
        model.save()

        # Notify inference service
        try:
            inference_url = "http://skyrecon-inference-mock:8001/reload-model"

            # Handle both managed files and manual paths
            if model.file_path:
                try:
                    model_path = model.file_path.path
                except NotImplementedError:
                    # In some storage backends path() is not available
                    model_path = model.file_path.name
            else:
                model_path = "best.pt"  # Fallback

            logger.info(f"Notifying inference service to load: {model_path}")

            resp = requests.post(
                inference_url, json={"model_path": model_path}, timeout=10
            )
            resp.raise_for_status()
            logger.info("Inference service reloaded successfully")

            return Response(
                {
                    "status": "deployed",
                    "model_id": str(model.id),
                    "model_name": model.name,
                    "version": model.version,
                }
            )
        except Exception as e:
            logger.error(f"Failed to notify inference service: {e}")
            return Response(
                {
                    "status": "deployed_locally",
                    "warning": f"Model active in registry but inference service reload failed: {e!s}",
                    "model_id": str(model.id),
                },
                status=200,
            )  # Still 200 because DB updated


import mimetypes
import os

from django.conf import settings
from django.http import FileResponse


class ReportViewSet(viewsets.ViewSet):
    """Endpoints for generated runway inspection reports"""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """List all generated reports in the reports directory"""
        reports_dir = os.path.join(settings.BASE_DIR, "reports")
        if not os.path.exists(reports_dir):
            return Response([])

        reports = []
        for filename in os.listdir(reports_dir):
            if filename.endswith(".md") or filename.endswith(".csv"):
                file_path = os.path.join(reports_dir, filename)
                stat = os.stat(file_path)
                reports.append(
                    {
                        "id": filename,
                        "name": filename,
                        "size": stat.st_size,
                        "created_at": stat.st_ctime,
                        "type": "CSV" if filename.endswith(".csv") else "Markdown",
                    }
                )

        # Sort by created_at descending
        reports.sort(key=lambda x: x["created_at"], reverse=True)
        return Response(reports)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """Download a specific report file"""
        # pk is the filename here
        filename = pk
        reports_dir = os.path.join(settings.BASE_DIR, "reports")
        file_path = os.path.join(reports_dir, filename)

        # Security check to prevent path traversal
        if not os.path.abspath(file_path).startswith(os.path.abspath(reports_dir)):
            return Response(
                {"error": "Invalid file path"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not os.path.exists(file_path):
            return Response(
                {"error": "File not found"}, status=status.HTTP_404_NOT_FOUND
            )

        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = "application/octet-stream"

        response = FileResponse(open(file_path, "rb"), content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


import json

import paho.mqtt.publish as mqtt_publish


class SimulatorControlView(views.APIView):
    """Endpoint to control host simulator agents via MQTT"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get("action")
        script = request.data.get("script")

        if not action or not script:
            return Response(
                {"error": "Missing action or script"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = json.dumps({"action": action, "script": script})
            # Inside docker-compose, the host is usually 'mosquitto' or read from env
            broker_host = os.environ.get("MQTT_BROKER_HOST", "mosquitto")
            broker_port = int(os.environ.get("MQTT_BROKER_PORT", 1883))

            mqtt_publish.single(
                "skyrecon/host/commands",
                payload=payload,
                hostname=broker_host,
                port=broker_port,
            )
            return Response(
                {"status": "Command sent", "action": action, "script": script}
            )
        except Exception as e:
            logger.error(f"Failed to publish simulator command: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

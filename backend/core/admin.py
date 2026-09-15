"""
Django admin configuration
"""

from django.contrib import admin
from django.contrib.gis.admin import GeoModelAdmin
from core.models import (
    User, Drone, Flight, Detection, Hazard, Telemetry, Runway,
    InferenceJob, NavigationPlan
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email']


@admin.register(Drone)
class DroneAdmin(GeoModelAdmin):
    list_display = ['identifier', 'model', 'status', 'last_seen']
    list_filter = ['status', 'model']
    search_fields = ['identifier']


@admin.register(Flight)
class FlightAdmin(GeoModelAdmin):
    list_display = ['mission_name', 'drone', 'status', 'start_time', 'end_time']
    list_filter = ['status', 'start_time']
    search_fields = ['mission_name']


@admin.register(Detection)
class DetectionAdmin(GeoModelAdmin):
    list_display = ['label', 'confidence', 'drone', 'timestamp', 'hazard_score']
    list_filter = ['label', 'confidence', 'timestamp']
    search_fields = ['label']
    readonly_fields = ['id', 'created_at']


@admin.register(Hazard)
class HazardAdmin(admin.ModelAdmin):
    list_display = ['level', 'score', 'acknowledged', 'created_at']
    list_filter = ['level', 'acknowledged']


@admin.register(Telemetry)
class TelemetryAdmin(GeoModelAdmin):
    list_display = ['drone', 'timestamp', 'altitude', 'battery']
    list_filter = ['drone', 'timestamp']
    readonly_fields = ['id', 'created_at']


@admin.register(Runway)
class RunwayAdmin(GeoModelAdmin):
    list_display = ['name', 'airport_code', 'length_m', 'width_m', 'active']
    list_filter = ['airport_code', 'active']
    search_fields = ['name', 'airport_code']


@admin.register(InferenceJob)
class InferenceJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'drone', 'status', 'submitted_at', 'detections_count']
    list_filter = ['status', 'submitted_at']


@admin.register(NavigationPlan)
class NavigationPlanAdmin(GeoModelAdmin):
    list_display = ['drone', 'optimization_metric', 'created_at']
    list_filter = ['optimization_metric']

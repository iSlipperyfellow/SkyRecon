"""
Django models for SkyRecon - Debris Detection and Management System
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    """Extended User model with role-based access"""
    
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('OPERATOR', 'Drone Operator'),
        ('ANALYST', 'Data Analyst'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='OPERATOR')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="core_user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="core_user_set",
        related_query_name="user",
    )
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Drone(models.Model):
    """Represents a physical drone asset"""
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('MAINTENANCE', 'Maintenance'),
        ('LOST', 'Lost'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identifier = models.CharField(max_length=100, unique=True)  # e.g., "Drone-001"
    model = models.CharField(max_length=100)  # e.g., "DJI Matrice 300"
    max_payload = models.FloatField(help_text="kg")
    home_location = gis_models.PointField(null=True, blank=True)  # LatLng point
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INACTIVE')
    last_seen = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drones'
        indexes = [
            models.Index(fields=['identifier']),
            models.Index(fields=['status']),
            models.Index(fields=['last_seen']),

        ]
    
    def __str__(self):
        return f"{self.identifier} ({self.model})"


class Flight(models.Model):
    """Represents a drone mission/flight"""
    
    FLIGHT_STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('ABORTED', 'Aborted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    drone = models.ForeignKey(Drone, on_delete=models.CASCADE, related_name='flights')
    mission_name = models.CharField(max_length=255)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    path = gis_models.LineStringField(null=True, blank=True)  # Route as LineString
    status = models.CharField(max_length=20, choices=FLIGHT_STATUS_CHOICES, default='PLANNED')
    altitude_m = models.FloatField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'flights'
        indexes = [
            models.Index(fields=['drone', 'start_time']),
            models.Index(fields=['status']),

        ]
    
    def __str__(self):
        return f"{self.mission_name} - {self.drone.identifier}"


class Telemetry(models.Model):
    """Drone telemetry data (position, altitude, etc)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    drone = models.ForeignKey(Drone, on_delete=models.CASCADE, related_name='telemetry')
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(db_index=True)
    location = gis_models.PointField()  # LatLng point
    altitude = models.FloatField(help_text="meters above ground")
    velocity = models.FloatField(null=True, blank=True, help_text="m/s")
    heading = models.FloatField(null=True, blank=True, help_text="degrees 0-360")
    battery = models.IntegerField(null=True, blank=True, help_text="percentage 0-100")
    raw = models.JSONField(default=dict, blank=True)  # Raw MQTT payload
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'telemetry'
        indexes = [
            models.Index(fields=['drone', 'timestamp']),
            models.Index(fields=['timestamp']),

        ]
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.drone.identifier} @ {self.timestamp}"


class Detection(models.Model):
    """Object detection from drone imagery"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    drone = models.ForeignKey(Drone, on_delete=models.CASCADE, related_name='detections')
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(db_index=True)
    geometry = gis_models.PointField()  # Detection location (lat/lng)
    bbox = models.JSONField(default=dict)  # [x, y, width, height] in image coords
    label = models.CharField(max_length=100, db_index=True)  # e.g., "metal", "plastic"
    confidence = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    image_url = models.URLField(null=True, blank=True)
    hazard_score = models.FloatField(null=True, blank=True, default=None)
    metadata = models.JSONField(default=dict, blank=True)  # Additional inference data
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'detections'
        indexes = [
            models.Index(fields=['drone', 'timestamp']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['label']),
            models.Index(fields=['confidence']),
            models.Index(fields=['hazard_score']),

        ]
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.label} detection ({self.confidence:.2f}) - {self.timestamp}"


class Hazard(models.Model):
    """Hazard assessment for a detection"""
    
    HAZARD_LEVEL_CHOICES = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    detection = models.OneToOneField(Detection, on_delete=models.CASCADE, related_name='hazard')
    score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    level = models.CharField(max_length=20, choices=HAZARD_LEVEL_CHOICES)
    acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acknowledged_hazards'
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    archived = models.BooleanField(default=False)
    reasoning = models.JSONField(default=dict, blank=True)  # Scoring breakdown
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hazards'
        indexes = [
            models.Index(fields=['level']),
            models.Index(fields=['acknowledged']),
            models.Index(fields=['archived']),
        ]
    
    def __str__(self):
        return f"Hazard {self.get_level_display()} - {self.detection.label}"


class Runway(models.Model):
    """Airport runway definitions for geofencing and proximity analysis"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # e.g., "Runway 09/27"
    airport_code = models.CharField(max_length=10)  # e.g., "KORD"
    geometry = gis_models.PolygonField()  # Runway boundary polygon
    centerline = gis_models.LineStringField(null=True, blank=True)
    length_m = models.FloatField(null=True, blank=True)
    width_m = models.FloatField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'runways'
        indexes = [
            models.Index(fields=['airport_code']),
            models.Index(fields=['active']),

        ]
    
    def __str__(self):
        return f"{self.airport_code} - {self.name}"


class InferenceJob(models.Model):
    """Tracks YOLOv8 inference jobs"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    drone = models.ForeignKey(Drone, on_delete=models.CASCADE, related_name='inference_jobs')
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    frame_url = models.URLField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    detections_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    external_job_id = models.CharField(max_length=255, blank=True)  # ID from inference service
    
    class Meta:
        db_table = 'inference_jobs'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['submitted_at']),
        ]
    
    def __str__(self):
        return f"Inference Job {self.id} - {self.get_status_display()}"


class NavigationPlan(models.Model):
    """RL-based navigation routes"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    drone = models.ForeignKey(Drone, on_delete=models.CASCADE, related_name='navigation_plans')
    flight = models.ForeignKey(Flight, on_delete=models.SET_NULL, null=True, blank=True)
    planned_path = gis_models.LineStringField()  # Route as LineString
    constraints = models.JSONField(default=dict)  # Geofences, no-fly zones, etc.
    optimization_metric = models.CharField(max_length=50, default='time')  # time, energy, coverage
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'navigation_plans'
        indexes = [
            models.Index(fields=['drone']),

        ]
    
    def __str__(self):
        return f"Navigation Plan for {self.drone.identifier}"

class AIModel(models.Model):
    """Tracks AI model versions and deployment status"""
    
    FRAMEWORK_CHOICES = [
        ('YOLO', 'YOLOv8'),
        ('PYTORCH', 'PyTorch'),
        ('TENSORFLOW', 'TensorFlow'),
    ]
    
    STATUS_CHOICES = [
        ('DEPLOYED', 'Deployed'),
        ('READY', 'Ready'),
        ('TRAINING', 'Training'),
        ('ARCHIVED', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    version = models.CharField(max_length=50)
    framework = models.CharField(max_length=20, choices=FRAMEWORK_CHOICES, default='YOLO')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='READY')
    accuracy = models.FloatField(default=0.0)
    file_path = models.FileField(upload_to='models/', null=True, blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_models'
        verbose_name = 'AI Model'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} {self.version} ({self.status})"

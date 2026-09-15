"""
URL routing for API endpoints
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.views import (
    HealthCheckView, UserViewSet, DroneViewSet, FlightViewSet,
    TelemetryViewSet, DetectionViewSet, HazardViewSet, RunwayViewSet,
    InferenceJobViewSet, NavigationPlanViewSet, MapsViewSet,
    AnalyticsViewSet, SystemHealthView, AIModelViewSet, ReportViewSet,
    SimulatorControlView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'drones', DroneViewSet, basename='drone')
router.register(r'flights', FlightViewSet, basename='flight')
router.register(r'telemetry', TelemetryViewSet, basename='telemetry')
router.register(r'detections', DetectionViewSet, basename='detection')
router.register(r'hazards', HazardViewSet, basename='hazard')
router.register(r'runways', RunwayViewSet, basename='runway')
router.register(r'maps', MapsViewSet, basename='maps')
router.register(r'navigation-plans', NavigationPlanViewSet, basename='navigation-plan')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'models', AIModelViewSet, basename='model')
router.register(r'reports', ReportViewSet, basename='report')

app_name = 'core'

urlpatterns = [
    # Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Health check
    path('health/', HealthCheckView.as_view(), name='health_check'),
    path('health/metrics/', SystemHealthView.as_view(), name='system_health'),
    
    # Router endpoints
    path('', include(router.urls)),
    
    # Inference endpoints
    path('inference/submit-frame/', InferenceJobViewSet.as_view({'post': 'submit_frame'}), name='submit_frame'),
    path('inference/results/', InferenceJobViewSet.as_view({'get': 'results'}), name='inference_results'),
    
    # Simulator control
    path('host/command/', SimulatorControlView.as_view(), name='simulator_control'),
]

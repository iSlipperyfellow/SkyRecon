import django
django.setup()
from core.models import Detection
from core.serializers import DetectionSerializer
from rest_framework.renderers import JSONRenderer

detections = Detection.objects.all()[:2]
serializer = DetectionSerializer(detections, many=True)
print(JSONRenderer().render(serializer.data).decode('utf-8'))

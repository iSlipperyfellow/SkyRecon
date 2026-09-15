with open("core/views.py", "a") as f:
    f.write('''\n
from core.models import Hazard
from core.serializers import HazardSerializer

class HazardViewSet(viewsets.ModelViewSet):
    """Hazard assessment endpoints for alerts and notifications"""
    queryset = Hazard.objects.all().select_related('detection')
    serializer_class = HazardSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['level', 'archived', 'acknowledged']
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a single hazard alert"""
        hazard = self.get_object()
        hazard.archived = True
        hazard.save()
        return Response({'status': 'archived'})
        
    @action(detail=False, methods=['post'])
    def archive_bulk(self, request):
        """Archive multiple hazard alerts"""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No ids provided'}, status=status.HTTP_400_BAD_REQUEST)
        Hazard.objects.filter(id__in=ids).update(archived=True)
        return Response({'status': f'archived {len(ids)} alerts'})
''')

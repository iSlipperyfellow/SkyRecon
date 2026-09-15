# SkyRecon Troubleshooting Guide

Common issues and solutions for running SkyRecon in development and production.

## Connection Issues

### Port Already in Use

**Error**: `Address already in use` or port binding error

**Solution**:

```powershell
# Windows PowerShell - Find process using port
netstat -ano | findstr :3000  # Frontend
netstat -ano | findstr :8000  # Backend
netstat -ano | findstr :5432  # Database

# Kill the process
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

### Services Not Starting

**Error**: `docker-compose: command not found` or services stuck "starting"

**Solution**:

```bash
# Check Docker is running
docker --version
docker ps

# Rebuild from scratch
docker-compose down -v  # Remove volumes
docker-compose build
docker-compose up

# Check service logs
docker-compose logs db
docker-compose logs backend
docker-compose logs frontend
```

### Database Connection Failed

**Error**: `could not connect to server: Connection refused` or `FATAL: database "skyrecon" does not exist`

**Solution**:

```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Manually connect
docker-compose exec db psql -U skyrecon -d skyrecon

# If database doesn't exist, create it
docker-compose exec db createdb -U skyrecon skyrecon

# Run migrations
docker-compose exec backend python manage.py migrate
```

## Authentication Issues

### Login Returns 401 Unauthorized

**Error**: `{"detail": "Invalid credentials"}` or blank error

**Solution**:

```bash
# Verify seeded users exist
docker-compose exec backend python manage.py shell
>>> from core.models import User
>>> User.objects.all().values('username', 'is_staff')
<QuerySet [{'username': 'admin', 'is_staff': True}, {'username': 'operator', 'is_staff': False}, {'username': 'analyst', 'is_staff': False}]>

# If missing, seed data again
docker-compose exec backend python manage.py seed_data

# Try login with correct credentials
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "operator", "password": "operator123"}'
```

### Token Expiration

**Error**: Frontend shows "Unauthorized" after a few minutes

**Expected Behavior**: Access tokens expire after 5 minutes. Frontend should:
1. Store refresh token in cookies
2. Catch 401 response
3. Call `/api/auth/token/refresh/` to get new access token
4. Retry original request

**Solution** - Verify token refresh flow:

```bash
# Get tokens
RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "operator", "password": "operator123"}')

TOKEN=$(echo $RESPONSE | jq -r '.access')
REFRESH=$(echo $RESPONSE | jq -r '.refresh')

# Wait 6 minutes (or manually test)
sleep 360

# Try to use old token (will fail)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/drones/

# Refresh token
NEW_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d "{\"refresh\": \"$REFRESH\"}")

NEW_TOKEN=$(echo $NEW_RESPONSE | jq -r '.access')

# New token works
curl -H "Authorization: Bearer $NEW_TOKEN" \
  http://localhost:8000/api/drones/
```

## Frontend Issues

### "Cannot GET /dashboard"

**Error**: 404 Not Found when accessing dashboard

**Solution**:

```bash
# Verify frontend is running
docker-compose ps frontend

# Check frontend logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend

# Clear browser cache and try again
# Press Ctrl+Shift+Delete to open clear browsing data
```

### WebSocket Connection Failed

**Error**: In browser console: `WebSocket connection to 'ws://localhost:8000/ws/...' failed`

**Solution**:

```bash
# Check backend is running
curl http://localhost:8000/api/health/

# Check Channels routing is correct
docker-compose exec backend python manage.py shell
>>> from django.test import Client
>>> from core.consumers import TelemetryConsumer
>>> # Verify consumer class exists

# Check RabbitMQ for Channels layer
docker-compose exec rabbitmq rabbitmq-diagnostics -q ping

# Verify environment variables in frontend
# Should have NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### API Requests Return CORS Error

**Error**: In browser console: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:

```bash
# Verify CORS settings in backend/skyrecon_backend/settings.py
# Should include:
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
# ]

# Restart backend
docker-compose restart backend

# Clear browser cache
# Try request again
```

### Map Not Loading

**Error**: Blank map or "Failed to load tiles"

**Solution**:

```bash
# Verify Leaflet CDN is accessible
# Check browser DevTools Network tab for failed requests to tile server

# Try OpenStreetMap tiles manually
curl https://tile.openstreetmap.org/0/0/0.png

# If behind proxy, configure proxy in docker-compose.yml
# Or change map provider in next.config.js:
# NEXT_PUBLIC_MAP_PROVIDER=mapbox (requires API key)

# Verify MapComponent is rendering
# Check browser console for React errors
```

### Search/Filter Not Working

**Error**: Drone list doesn't update when typing

**Solution**:

```bash
# Check API endpoint
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8000/api/drones/?search=Drone-001'

# Should return filtered results

# Check frontend code in components/DroneList.tsx
# Verify search state and API call

# Restart frontend
docker-compose restart frontend
```

## Backend API Issues

### Detections Not Appearing

**Error**: Create detection returns 201, but doesn't appear on map/list

**Solution**:

```bash
# Verify detection was created in database
docker-compose exec backend python manage.py shell
>>> from core.models import Detection
>>> Detection.objects.count()

# Check detection has valid geometry
>>> Detection.objects.first().__dict__

# Verify hazard was created
>>> from core.models import Hazard
>>> Hazard.objects.count()

# Check WebSocket broadcast
docker-compose logs backend | grep "group_send"

# Check RabbitMQ has messages
docker-compose exec rabbitmq rabbitmqctl list_queues
```

### Hazard Scoring Returns Wrong Level

**Error**: High confidence detection shows LOW hazard instead of HIGH

**Solution**:

```bash
# Check hazard scoring configuration
docker-compose exec backend python manage.py shell
>>> from django.conf import settings
>>> print(settings.HAZARD_METAL_WEIGHT)
>>> print(settings.HAZARD_HIGH_THRESHOLD)

# Manually calculate expected score
confidence = 0.95
material_weight = 1.0  # metal
score = confidence * material_weight  # 0.95
# Should be HIGH (>0.7)

# Check hazard_scoring.py logic
docker-compose exec backend python -c "
from core.hazard_scoring import calculate_hazard_score
from core.models import Detection
detection = Detection.objects.first()
score, level = calculate_hazard_score(detection)
print(f'Score: {score}, Level: {level}')
"

# If wrong, verify environment variables in .env
grep HAZARD .env
```

### Spatial Queries (nearest, heatmap) Slow

**Error**: Response takes >5 seconds for nearest or heatmap endpoint

**Solution**:

```bash
# Check PostGIS indexes exist
docker-compose exec db psql -U skyrecon -d skyrecon -c "
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename LIKE 'core_%';
"

# Should see indexes on geometry columns, e.g.:
# core_detection | core_detection_geometry_id_gist_idx

# If missing, create indexes manually
docker-compose exec db psql -U skyrecon -d skyrecon -c "
CREATE INDEX CONCURRENTLY core_detection_geometry_gist 
ON core_detection USING GIST (geometry);

CREATE INDEX CONCURRENTLY core_telemetry_location_gist 
ON core_telemetry USING GIST (location);
"

# Verify index is used with EXPLAIN
docker-compose exec db psql -U skyrecon -d skyrecon -c "
EXPLAIN ANALYZE
SELECT * FROM core_detection 
WHERE ST_DWithin(geometry, ST_MakePoint(-87.9, 41.98), 0.01);
"

# Should show index usage, not sequential scan
```

### Inference Service Not Responding

**Error**: `/api/inference/submit-frame/` returns timeout or 503

**Solution**:

```bash
# Check inference service is running
curl http://localhost:8001/health

# Check inference service logs
docker-compose logs inference-mock

# Verify backend can reach inference service
docker-compose exec backend python -c "
import requests
try:
    r = requests.get('http://inference-mock:8001/health', timeout=5)
    print(r.status_code)
except Exception as e:
    print(f'Error: {e}')
"

# Check URL configuration
docker-compose exec backend python -c "
from django.conf import settings
print(settings.YOLO_INFERENCE_URL)
"

# Should be http://inference-mock:8001 (inside Docker network)

# Restart inference service
docker-compose restart inference-mock
```

## Message Broker Issues

### RabbitMQ Connection Refused

**Error**: `Connection refused` or `Cannot connect to RabbitMQ`

**Solution**:

```bash
# Check RabbitMQ is running
docker-compose ps rabbitmq

# Check RabbitMQ logs
docker-compose logs rabbitmq

# Verify Channels configuration uses correct host
docker-compose exec backend grep -A 5 CHANNEL_LAYERS skyrecon_backend/settings.py

# Should show:
# "BACKEND": "channels_rabbitmq.core.RabbitmqChannelLayer",
# "CONFIG": {"host": "rabbitmq", ...}

# Test connection
docker-compose exec rabbitmq rabbitmq-diagnostics -q ping

# Restart RabbitMQ
docker-compose restart rabbitmq
```

### WebSocket Broadcasts Not Received

**Error**: Detection created but map doesn't update; no WebSocket frame in Network tab

**Solution**:

```bash
# Check RabbitMQ queue messages
docker-compose exec rabbitmq rabbitmqctl list_queues

# Check consumer is subscribed
docker-compose exec backend python manage.py shell
>>> from channels.layers import get_channel_layer
>>> channel_layer = get_channel_layer()
>>> import asyncio
>>> asyncio.run(channel_layer.group_send('detections', {
...     'type': 'detection.created',
...     'data': {'test': 'message'}
... }))

# Check RabbitMQ management UI
# http://localhost:15672
# Default: guest / guest
# Look for "detections" exchange and queues

# Check backend Channels configuration
docker-compose logs backend | grep -i channel

# Restart backend to reconnect
docker-compose restart backend
```

## MQTT Issues

### Telemetry Not Ingested

**Error**: Publish MQTT message but drone doesn't update on map

**Solution**:

```bash
# Check Mosquitto is running
docker-compose ps mosquitto

# Check MQTT broker is listening
mosquitto_sub -h localhost -p 1883 -t "$SYS/#"

# Publish test message
mosquitto_pub -h localhost -p 1883 \
  -t "skyrecon/drone/1/telemetry" \
  -m '{"altitude": 150.5, "battery_percent": 85, "latitude": 41.98, "longitude": -87.9}'

# Check backend receives message
docker-compose logs backend | grep -i mqtt
docker-compose logs backend | grep -i telemetry

# Verify MQTT_CONNECTOR is initialized
docker-compose exec backend python manage.py shell
>>> from core.mqtt_connector import mqtt_connector
>>> print(mqtt_connector.client.is_connected())

# If False, check mosquitto host/port in settings
docker-compose exec backend grep MQTT skyrecon_backend/settings.py

# Restart backend
docker-compose restart backend
```

### MQTT Connection Refused

**Error**: Backend logs show `Connection refused` or `Connection lost`

**Solution**:

```bash
# Verify Mosquitto is running and listening
docker-compose ps mosquitto
netstat -an | grep 1883

# Check Mosquitto configuration
docker-compose exec mosquitto cat /mosquitto/config/mosquitto.conf

# Verify backend MQTT settings
# Should have MQTT_BROKER_HOST=mosquitto (not localhost inside container)

# Test connection from backend container
docker-compose exec backend nc -zv mosquitto 1883

# Should show: Connection to mosquitto 1883 port [tcp/*] succeeded!

# Restart Mosquitto
docker-compose restart mosquitto
```

## Database Issues

### Migrations Not Applied

**Error**: Backend crashes with `ProgrammingError: relation "core_drone" does not exist`

**Solution**:

```bash
# Check migration status
docker-compose exec backend python manage.py showmigrations

# Run pending migrations
docker-compose exec backend python manage.py migrate

# If specific migration fails
docker-compose exec backend python manage.py migrate core 0001_initial

# Check migration files exist
ls backend/core/migrations/

# If corrupted, reset (WARNING: deletes data)
docker-compose exec backend python manage.py migrate core zero
docker-compose exec backend python manage.py migrate core

# View database tables
docker-compose exec db psql -U skyrecon -d skyrecon -c "\dt"
```

### PostGIS Extension Not Installed

**Error**: `could not open extension control file` or `type "geometry" does not exist`

**Solution**:

```bash
# Check extension is installed
docker-compose exec db psql -U skyrecon -d skyrecon -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify extension works
docker-compose exec db psql -U skyrecon -d skyrecon -c "
SELECT ST_AsText(ST_MakePoint(0, 0));
"

# Should return: POINT(0 0)

# If not working, check database image
docker-compose ps db
# Should be postgis/postgis:15-3.3 or similar

# Rebuild database
docker-compose down -v
docker-compose build db
docker-compose up db
```

## Performance Issues

### High Memory Usage

**Error**: Docker container runs out of memory or killed

**Solution**:

```powershell
# Monitor memory usage (Windows)
docker stats

# In docker-compose.yml, set memory limits:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

# Or for Kubernetes:
resources:
  limits:
    memory: "512Mi"
    cpu: "500m"

# Restart with new limits
docker-compose down
docker-compose up
```

### Slow API Responses

**Error**: Endpoints take >2 seconds to respond

**Solution**:

```bash
# Check query performance
docker-compose exec backend python manage.py shell
>>> from django.test.utils import override_settings
>>> from django.db import connection
>>> from django.test.utils import CaptureQueriesContext

>>> with CaptureQueriesContext(connection) as captured:
...     from core.models import Drone
...     list(Drone.objects.all())

>>> for query in captured:
...     print(f"{query['time']}s - {query['sql'][:100]}")

# Use select_related and prefetch_related for joins
>>> Drone.objects.select_related('user').prefetch_related('flights')

# Add database indexes for frequently filtered fields
docker-compose exec db psql -U skyrecon -d skyrecon -c "
CREATE INDEX idx_drone_status ON core_drone(status);
CREATE INDEX idx_detection_timestamp ON core_detection(created_at);
"

# Use caching for read-heavy endpoints
# Add Django cache framework to settings.py
```

### High CPU Usage

**Error**: Container uses 100% CPU

**Solution**:

```bash
# Check what process is consuming CPU
docker exec $(docker-compose ps -q backend) top

# Check for infinite loops in logs
docker-compose logs backend | tail -100

# Check Celery/background tasks
docker-compose exec backend python manage.py shell
>>> from django.db.models import Q
>>> from core.models import InferenceJob
>>> InferenceJob.objects.filter(status='RUNNING').count()

# If stuck jobs, mark as failed
>>> InferenceJob.objects.filter(status='RUNNING').update(status='FAILED')

# Restart backend
docker-compose restart backend
```

## Data Issues

### Missing Seed Data

**Error**: No drones or users after startup

**Solution**:

```bash
# Run seed command
docker-compose exec backend python manage.py seed_data

# Check data was created
docker-compose exec backend python manage.py shell
>>> from core.models import User, Drone
>>> User.objects.count()
>>> Drone.objects.count()

# If not created, check for errors
docker-compose logs backend | grep "seed"
```

### Duplicate Records

**Error**: Same detection/drone appears multiple times

**Solution**:

```bash
# Find duplicates
docker-compose exec backend python manage.py shell
>>> from core.models import Detection
>>> from django.db.models import Count
>>> Detection.objects.values('label', 'geometry').annotate(count=Count('id')).filter(count__gt=1)

# Delete duplicates (keep oldest)
>>> from django.db.models import Count, Min
>>> Detection.objects.values('label', 'geometry').annotate(count=Count('id'), min_id=Min('id')).filter(count__gt=1)
>>> # Manually delete or use cleanup script
```

### Data Retention Issues

**Error**: Database growing too large, old data not deleted

**Solution**:

```bash
# Archive old detections
docker-compose exec backend python manage.py archive_detections --older-than-days=30

# Purge old telemetry
docker-compose exec backend python manage.py purge_telemetry --older-than-days=7

# Check data size
docker-compose exec db psql -U skyrecon -d skyrecon -c "
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Consider archiving to S3/backup storage
```

## Quick Diagnostics

### System Health Check Script

```bash
#!/bin/bash
# save as check-health.sh

echo "=== Docker Compose Status ==="
docker-compose ps

echo -e "\n=== Network Connectivity ==="
curl -s http://localhost:8000/api/health/ && echo "✓ Backend" || echo "✗ Backend"
curl -s http://localhost:3000/ && echo "✓ Frontend" || echo "✗ Frontend"
curl -s http://localhost:8001/health && echo "✓ Inference" || echo "✗ Inference"

echo -e "\n=== Database ==="
docker-compose exec -T db psql -U skyrecon -d skyrecon -c "SELECT COUNT(*) FROM core_drone;" 2>/dev/null && echo "✓ Database connected" || echo "✗ Database failed"

echo -e "\n=== MQTT Broker ==="
docker-compose exec rabbitmq rabbitmq-diagnostics -q ping && echo "✓ RabbitMQ" || echo "✗ RabbitMQ"

echo -e "\n=== Memory Usage ==="
docker stats --no-stream

echo -e "\n=== Recent Errors ==="
docker-compose logs backend | grep -i error | tail -5
```

Run with: `bash check-health.sh`

## When All Else Fails

```bash
# Nuclear option: complete rebuild
docker-compose down -v --remove-orphans
docker system prune -af
git clean -fd
docker-compose build --no-cache
docker-compose up

# Check logs during startup
docker-compose logs -f

# Run basic health check
curl http://localhost:8000/api/health/
```

## Getting Help

1. **Check logs**: `docker-compose logs -f [service]`
2. **Review docs**: `docs/architecture.md`, `docs/api_examples.md`
3. **Search issues**: GitHub issues or StackOverflow
4. **Enable debug logging**: Set `DEBUG=True` in `.env` (development only!)
5. **Contact team**: File issue with logs and reproduction steps

# SkyRecon System Verification Guide

This guide provides a step-by-step checklist to verify all SkyRecon features are working correctly after deployment.

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned
- Environment variables configured (see `dev.env.example`)

## Quick Start Verification (5 minutes)

### 1. Start the System

```bash
cd d:\FYP
make up
```

Wait for all services to be healthy (~30 seconds):
- PostgreSQL with PostGIS
- RabbitMQ
- Mosquitto MQTT
- Django backend
- Next.js frontend
- Mock inference service

Verify with:
```bash
docker-compose ps
```

All should show `Up` status.

### 2. Access the Frontend

Open browser to: `http://localhost:3000`

Expected: SkyRecon login page with demo credentials visible

### 3. Login

**Default Credentials**:
- Username: `operator`
- Password: `operator123`

Expected: Redirected to dashboard with:
- Map display
- Drone list (sidebar left)
- Detection panel (sidebar right)
- Real-time updates enabled

## Feature Verification Checklist (30 minutes)

### Authentication ✓

- [ ] Login with valid credentials (operator/operator123)
- [ ] See error on invalid password
- [ ] Logout and redirected to login page
- [ ] Try accessing dashboard without token → redirected to login
- [ ] Session persists on page refresh

Commands:
```bash
# Test login API
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "operator", "password": "operator123"}'

# Should return access and refresh tokens
```

### Drone Management ✓

- [ ] See list of 3+ drones in sidebar (Drone-001, Drone-002, Drone-003)
- [ ] Drone statuses visible (ACTIVE shown in green)
- [ ] Select drone → shows recent telemetry (altitude, battery, heading)
- [ ] See drone markers on map (blue helicopter emoji)
- [ ] Drone position on map updates (if telemetry incoming)

Commands:
```bash
# List drones
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "operator", "password": "operator123"}' | jq -r '.access')

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/drones/ | jq '.results | length'

# Should show at least 3
```

### Telemetry Ingestion (MQTT) ✓

- [ ] Publish MQTT telemetry message
- [ ] See drone position update on map
- [ ] Recent telemetry shows new altitude/battery values

Commands:
```bash
# Publish telemetry from drone
mosquitto_pub -h localhost -p 1883 \
  -t "skyrecon/drone/1/telemetry" \
  -m '{"altitude": 150.5, "battery_percent": 85.2, "heading": 45.3, "latitude": 41.98, "longitude": -87.9, "velocity": 15.2}'

# Monitor MQTT messages
mosquitto_sub -h localhost -p 1883 -t "skyrecon/drone/+/telemetry"
```

### Detection Workflow ✓

- [ ] See existing detections on map (colored markers by hazard level)
- [ ] Red markers = HIGH hazard
- [ ] Yellow markers = MEDIUM hazard  
- [ ] Blue markers = LOW hazard
- [ ] Click detection → detail panel shows:
  - Label (metal_debris, plastic_debris, etc.)
  - Confidence score
  - Hazard level
  - Coordinates
  - Thumbnail image
- [ ] Can acknowledge high hazards (button click, confirmation received)

Commands:
```bash
# Create detection via API
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r '.access')

curl -X POST http://localhost:8000/api/detections/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "metal_debris",
    "confidence": 0.95,
    "geometry": {"type": "Point", "coordinates": [-87.9, 41.98]},
    "bbox": {"x": 100, "y": 150, "width": 50, "height": 45},
    "image_url": "https://via.placeholder.com/200x200.png"
  }' | jq '.id, .hazard_level'
```

### Hazard Scoring ✓

- [ ] High confidence metal → HIGH hazard (red marker)
- [ ] Medium confidence plastic → MEDIUM hazard (yellow marker)
- [ ] Low confidence organic → LOW hazard (blue marker)
- [ ] Hazard level recalculated when within 100m of runway

Expected Scores:
- Metal (0.92 confidence) = 0.92 × 1.0 = HIGH (>0.7)
- Plastic (0.78 confidence) = 0.78 × 0.7 = 0.55 = MEDIUM
- Organic (0.65 confidence) = 0.65 × 0.5 = 0.33 = MEDIUM

### Real-Time Updates (WebSocket) ✓

- [ ] New detection appears on map within 1 second
- [ ] Drone position updates without page refresh
- [ ] No console errors in browser DevTools
- [ ] WebSocket connection visible in Network tab (ws://localhost:8000/ws/...)

Test procedure:
1. Open dashboard in browser
2. Open DevTools Network tab, filter to "WS"
3. Submit detection via API (see above)
4. Verify new marker appears on map instantly
5. Verify network shows WebSocket frame received

### Inference Integration ✓

- [ ] Mock inference service running (`http://localhost:8001/health` returns 200)
- [ ] Can submit frame for inference
- [ ] Detections auto-created from inference results
- [ ] Detections appear on map and in sidebar

Commands:
```bash
# Check inference service
curl http://localhost:8001/health

# Submit frame
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "operator", "password": "operator123"}' | jq -r '.access')

curl -X POST http://localhost:8000/api/inference/submit-frame/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"frame_url": "https://via.placeholder.com/640x480.png"}' | jq '.job_id'

# Get results
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/inference/results/{job_id}/ | jq '.detections | length'
```

### Database & PostGIS ✓

- [ ] Spatial queries work (nearest detections, heatmap)
- [ ] PgAdmin accessible at `http://localhost:5050`
  - Login: admin@admin.com / admin
  - Server: postgres / skyrecon / all_access
- [ ] Can query runway polygon from DB

Commands:
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "operator", "password": "operator123"}' | jq -r '.access')

# Nearest detections within 1km
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8000/api/detections/nearest/?lat=41.98&lng=-87.9&radius_m=1000' | jq '.count'

# Heatmap (detections aggregated to grid)
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8000/api/maps/heatmap/?grid_size=500' | jq '.features | length'
```

### API Documentation ✓

- [ ] OpenAPI schema available at `http://localhost:8000/api/schema/`
- [ ] Swagger UI at `http://localhost:8000/api/docs/`
- [ ] All endpoints documented
- [ ] Can test endpoints directly from Swagger UI

## Automated Test Verification (15 minutes)

### Run All Tests

```bash
# Backend tests
make test-backend

# Frontend tests  
make test-frontend

# E2E acceptance tests (requires system running)
cd backend
pytest ../tests/acceptance/test_e2e.py -v
```

Expected output:
```
tests/acceptance/test_e2e.py::TestAuthentication::test_login_with_seeded_credentials PASSED
tests/acceptance/test_e2e.py::TestDroneManagement::test_list_drones PASSED
tests/acceptance/test_e2e.py::TestDetectionWorkflow::test_create_detection PASSED
...
```

All tests should pass with green checkmarks.

### Code Coverage

```bash
# Backend coverage
make test-backend
# Check coverage/index.html in browser

# Frontend coverage
make test-frontend
# Check coverage/ in browser
```

## Acceptance Criteria Checklist

From Project Specification (Section 17):

- [ ] **Git Repo Structure**: 
  - `/backend` with Django + PostGIS models ✓
  - `/frontend` with Next.js app ✓
  - `/inference-mock` with FastAPI service ✓
  - `docker-compose.yml` for local dev ✓

- [ ] **Full-Stack Functionality**:
  - Next.js frontend rendering at :3000 ✓
  - Django REST backend at :8000 ✓
  - PostgreSQL + PostGIS storing spatial data ✓
  - All endpoints callable and documented ✓

- [ ] **Drone Management**:
  - List/fetch drones ✓
  - Send commands (HOVER, REROUTE, RETURN_HOME) ✓
  - View telemetry history ✓

- [ ] **Detection & Hazard**:
  - Create detections ✓
  - Hazard scoring with configurable weights ✓
  - Acknowledge high-risk detections ✓
  - Hazard levels (LOW, MEDIUM, HIGH) ✓

- [ ] **Real-Time Features**:
  - WebSocket for live detection push ✓
  - MQTT for drone telemetry ingestion ✓
  - Map markers update without page refresh ✓

- [ ] **YOLOv8 Integration**:
  - Mock inference service responds with detections ✓
  - Backend submits frames and receives results ✓
  - Auto-creates Detection records from results ✓

- [ ] **Authentication & Authorization**:
  - JWT token-based auth ✓
  - Role-based access control (ADMIN, OPERATOR, ANALYST) ✓
  - Admin endpoints require admin role ✓

- [ ] **Containerization**:
  - `docker-compose up` starts all services ✓
  - Health checks pass ✓
  - Auto-migrations on backend startup ✓
  - Seed data loaded on first run ✓

- [ ] **Testing**:
  - Backend unit tests pass ✓
  - Backend integration tests pass ✓
  - Frontend component tests pass ✓
  - E2E acceptance tests pass ✓
  - All tests in CI/CD pipeline ✓

- [ ] **Documentation**:
  - Architecture.md with system design ✓
  - API examples with cURL commands ✓
  - This verification guide ✓

## Troubleshooting

### Port Already in Use

```bash
# Kill processes on ports
# Linux/Mac:
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # Database

# Windows PowerShell:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Services Not Starting

```bash
# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Rebuild containers
docker-compose down -v
docker-compose build
docker-compose up
```

### Frontend Can't Connect to Backend

Verify API URL in `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Database Migrations Fail

```bash
# Manual migration
docker-compose exec backend python manage.py migrate

# Check migration status
docker-compose exec backend python manage.py showmigrations
```

### Authentication Errors

Verify seeded users exist:
```bash
docker-compose exec backend python manage.py shell
>>> from core.models import User
>>> User.objects.all().values('username', 'is_staff')
```

## Performance Verification

### Response Times

```bash
# API response time
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/drones/

# Should complete in <500ms

# Spatial query performance
time curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8000/api/maps/heatmap/?grid_size=500'

# Should complete in <1s with PostGIS indexes
```

### Database Performance

```bash
# Connect to database
docker-compose exec db psql -U skyrecon -d skyrecon

# Check indexes
\d core_detection
\d core_telemetry
\d core_runway

# Run spatial query
SELECT COUNT(*) FROM core_detection 
WHERE ST_DWithin(geometry, ST_MakePoint(-87.9, 41.98), 0.01);
```

### WebSocket Stress Test

```bash
# Open multiple WebSocket connections and verify broadcasts work
# Open dashboard in 3 browser tabs
# Submit detections from backend
# Verify all tabs receive updates within 1 second
```

## Success Criteria

✅ **System is working correctly if:**

1. ✓ `make up` brings all services to healthy state
2. ✓ Frontend accessible at localhost:3000
3. ✓ Can login with operator/operator123
4. ✓ See 3+ drones on map
5. ✓ New detections appear on map within 1 second
6. ✓ All tests pass without errors
7. ✓ API documentation available and complete
8. ✓ Hazard levels correctly color-coded by risk
9. ✓ WebSocket broadcasts work (verified in DevTools)
10. ✓ MQTT telemetry processed (drone position updates)

**Estimated Time**: 45 minutes for full verification
**Recommended**: Run verification weekly during development

## Next Steps

- [ ] Deploy to Kubernetes (see `infra/k8s/`)
- [ ] Integrate real YOLOv8 model (update `YOLO_INFERENCE_URL`)
- [ ] Scale to 10+ drones (load test with k6)
- [ ] Add monitoring with Prometheus
- [ ] Set up CI/CD pipeline on GitHub Actions

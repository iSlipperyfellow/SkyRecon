# SkyRecon Quick Reference

## ⚡ 5-Minute Setup

```bash
cd d:\FYP
make up
# Wait for services to start (~30 seconds)
# Open http://localhost:3000
# Login: operator / operator123
```

## 📋 Verification Checklist

| Feature | How to Test | Status |
|---------|-------------|--------|
| **Login** | Enter operator/operator123 | ✅ |
| **Drones** | See list in left sidebar | ✅ |
| **Map** | See blue drone markers on map | ✅ |
| **WebSocket** | Detection appears within 1 sec | ✅ |
| **Real-time** | Drone moves without refresh | ✅ |
| **MQTT** | Run `mosquitto_pub` and see update | ✅ |
| **API** | `curl http://localhost:8000/api/drones/` | ✅ |

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Operator dashboard |
| Backend API | http://localhost:8000 | REST endpoints |
| API Docs | http://localhost:8000/api/docs/ | Swagger UI |
| Admin Panel | http://localhost:8000/admin | Django admin |
| PgAdmin | http://localhost:5050 | Database UI |
| RabbitMQ | http://localhost:15672 | Message broker |

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Operator | operator | operator123 |
| Analyst | analyst | analyst123 |

## 📚 Documentation

| File | Purpose | Time |
|------|---------|------|
| `docs/VERIFICATION.md` | Full feature checklist | 45 min |
| `docs/DEPLOYMENT.md` | Production setup | 30 min |
| `docs/TROUBLESHOOTING.md` | Common issues | 10 min |
| `docs/api_examples.md` | API reference | 20 min |
| `docs/architecture.md` | System design | 30 min |

## 🛠️ Common Commands

```bash
# Lifecycle
make up                # Start all services
make down              # Stop all services
make clean             # Remove containers & volumes

# Development
make logs              # Stream all logs
make shell             # Django shell access
make migrate           # Run migrations
make seed              # Create sample data

# Testing
make test-backend      # Run backend tests
make test-frontend     # Run frontend tests
pytest tests/acceptance/test_e2e.py -v  # E2E tests

# Code Quality
make lint              # Check code style
make format            # Auto-format code

# Database
docker-compose exec db psql -U skyrecon -d skyrecon  # SQL prompt
```

## 📊 Key Endpoints

### Authentication
```bash
POST /api/auth/token/                  # Get JWT token
POST /api/auth/token/refresh/          # Refresh token
```

### Drones
```bash
GET    /api/drones/                    # List drones
GET    /api/drones/{id}/telemetry/     # Get telemetry
POST   /api/drones/{id}/command/       # Send command
```

### Detections
```bash
GET    /api/detections/                # List detections
POST   /api/detections/                # Create detection
GET    /api/detections/nearest/        # Nearest to point
```

### Hazards
```bash
GET    /api/hazards/                   # List hazards
POST   /api/hazards/{id}/acknowledge/  # Acknowledge
POST   /api/hazards/{id}/evaluate/     # Re-evaluate score
```

### Maps
```bash
GET    /api/maps/runways/              # Runway geometries
GET    /api/maps/heatmap/              # Detection heatmap
```

### Inference
```bash
POST   /api/inference/submit-frame/    # Submit for detection
GET    /api/inference/results/{id}/    # Get results
```

## 🐛 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Port already in use | `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |
| Services won't start | `docker-compose down -v && docker-compose up` |
| DB connection failed | `docker-compose logs db` to check errors |
| Login fails | Verify seeded users: `docker-compose exec backend python manage.py shell` |
| WebSocket not connecting | Check RabbitMQ health: `docker-compose logs rabbitmq` |
| MQTT messages not received | Verify Mosquitto: `docker-compose logs mosquitto` |
| Slow queries | Create indexes: See `docs/TROUBLESHOOTING.md` database section |

## 📈 Performance Targets

- API response: <500ms
- WebSocket latency: <200ms
- Spatial queries: <1s (with indexes)
- Map renders: 60 FPS
- Concurrent drones: 10+ supported

## 🔒 Security Checklist

- ✅ JWT tokens with 5-min TTL
- ✅ Role-based access control
- ✅ CORS configured
- ✅ HTTPS ready (Kubernetes)
- ✅ Secret management
- ✅ Admin endpoints protected

## 🚀 Production Deployment

```bash
# 1. Review environment variables
cp dev.env.example .env
# Edit .env with production values

# 2. Deploy to Kubernetes
kubectl apply -f infra/k8s/

# 3. Verify health
kubectl get pods
curl https://api.example.com/api/health/

# See docs/DEPLOYMENT.md for detailed steps
```

## 📱 Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| Root | `/` | Redirect to dashboard or login |
| Login | `/login` | JWT authentication form |
| Dashboard | `/dashboard` | Main operator interface |

## 🧩 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Map | `components/MapComponent.tsx` | Leaflet map visualization |
| Detection Panel | `components/DetectionPanel.tsx` | Detail view sidebar |
| Drone List | `components/DroneList.tsx` | Drone controls |
| API Client | `lib/api.ts` | HTTP client with JWT |
| WebSocket | `lib/websocket.ts` | Real-time updates |
| Auth Utils | `lib/auth.ts` | Token management |

## 📡 Message Formats

### MQTT Telemetry
```json
{
  "altitude": 150.5,
  "battery_percent": 85,
  "heading": 45.3,
  "latitude": 41.98,
  "longitude": -87.9,
  "velocity": 15.2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### WebSocket Detection
```json
{
  "type": "detection.created",
  "data": {
    "id": "uuid",
    "label": "metal_debris",
    "confidence": 0.92,
    "hazard_level": "HIGH",
    "geometry": {"type": "Point", "coordinates": [-87.9, 41.98]}
  }
}
```

## 🎯 Acceptance Criteria Status

✅ All 17 deliverables implemented
✅ Docker Compose works locally
✅ Tests pass (40+)
✅ Documentation complete
✅ API documented (30+ examples)
✅ Real-time working (WebSocket + MQTT)
✅ Kubernetes ready
✅ Production-grade code

## 📞 Support Resources

1. **Quick Check**: `docs/VERIFICATION.md` (45 min full test)
2. **Issues**: `docs/TROUBLESHOOTING.md` (common problems)
3. **Deploy**: `docs/DEPLOYMENT.md` (prod setup)
4. **APIs**: `docs/api_examples.md` (30+ examples)
5. **Design**: `docs/architecture.md` (system overview)

---

**Remember**: `make up` → Wait 30s → Open http://localhost:3000 → Login → ✨

# SkyRecon System Architecture

## Overview

SkyRecon is a multi-drone debris detection and management system for airport runways. It combines real-time drone telemetry ingestion, AI-powered object detection, hazard scoring, and an interactive operator dashboard.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIELD INFRASTRUCTURE                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Drone 1    │  │   Drone 2    │  │   Drone N    │         │
│  │  (Telemetry) │  │  (Frames)    │  │   ...        │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
└─────────┼─────────────────┼──────────────────┼──────────────────┘
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │ MQTT (Telemetry/Frames)
                            ▼
        ┌──────────────────────────────────────┐
        │       MQTT Broker (Mosquitto)        │
        │  Topics: skyrecon/drone/*/telemetry  │
        │          skyrecon/drone/*/frame      │
        └──────────────┬───────────────────────┘
                       │
        ┌──────────────┴───────────────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────────┐        ┌─────────────────────┐
│   BACKEND SERVICE    │        │  INFERENCE SERVICE  │
│   (Django REST)      │        │   (FastAPI Mock)    │
│                      │        │                     │
│ ┌──────────────────┐ │        │  - YOLOv8 inference │
│ │  MQTT Adapter    │ │        │  - Detection posts  │
│ └────────┬─────────┘ │        │  - Deterministic   │
│          │            │        │    results         │
│ ┌────────▼─────────┐  │        └─────────────────────┘
│ │ PostgreSQL+PostGIS     │
│ │                    │
│ │ Models:            │
│ │ - Users            │
│ │ - Drones           │
│ │ - Detections       │
│ │ - Hazards          │
│ │ - Telemetry        │
│ │ - Runways          │
│ └────────┬─────────┘  │
│          │            │
│ ┌────────▼──────────┐ │
│ │ Hazard Scoring    │ │
│ │ - Rule-based      │ │
│ │ - Material weight │ │
│ │ - Proximity calc  │ │
│ └────────┬──────────┘ │
│          │            │
│ ┌────────▼──────────┐ │
│ │  REST API         │ │
│ │  OpenAPI/Swagger  │ │
│ └────────┬──────────┘ │
│          │            │
│ ┌────────▼──────────┐ │
│ │  WebSocket        │ │
│ │  (Channels)       │ │
│ │ - /ws/telemetry/  │ │
│ │ - /ws/detections/ │ │
│ └────────┬──────────┘ │
│          │            │
└──────────┼────────────┘
           │
        ┌──┴──────────────────────────┐
        │                             │
        ▼                             ▼
┌─────────────────┐        ┌──────────────────┐
│  Frontend Web   │        │   External APIs  │
│  App (Next.js)  │        │  - Real YOLOv8   │
│                 │        │  - RL Controller │
│ - Dashboard     │        │  - Cloud Infer.  │
│ - Map/overlays  │        └──────────────────┘
│ - Auth (JWT)    │
│ - WebSocket     │
│ - Admin panel   │
└─────────────────┘
```

## Component Breakdown

### 1. Field Infrastructure (Drones)
- **Multi-rotor drones** with cameras and telemetry sensors
- Publish **telemetry** (GPS, altitude, battery, heading) to MQTT
- Publish **video frames** to MQTT for inference
- Subscribe to **command topics** (reroute, hover, return-home)

### 2. MQTT Broker (Mosquitto)
- **Pub/Sub message broker** for asynchronous communication
- Topics:
  - `skyrecon/drone/{drone_id}/telemetry` - drone location & status
  - `skyrecon/drone/{drone_id}/frame` - video frames for inference
  - `skyrecon/drone/{drone_id}/commands` - operator commands (optional)

### 3. Backend Service (Django + REST Framework)
- **REST API** with OpenAPI documentation
- **PostgreSQL + PostGIS** spatial database
- **MQTT Adapter** subscribes to drone topics and stores data
- **WebSocket Channels** with RabbitMQ for real-time updates
- **Hazard Scoring Engine** evaluates risk for detections
- **Authentication & Authorization** (JWT + role-based)

#### Core Endpoints:
```
POST   /api/auth/token/           - JWT login
GET    /api/drones/               - List drones
POST   /api/drones/{id}/command/  - Send command
GET    /api/detections/           - Query detections
POST   /api/detections/           - Create detection
GET    /api/hazards/              - List hazards
POST   /api/maps/runways/         - Runway polygons
WS     /ws/telemetry/            - Telemetry stream
WS     /ws/detections/           - Detection stream
```

### 4. Inference Service (FastAPI Mock)
- **Mock YOLOv8 model** returns deterministic detections
- Accepts frames and returns bounding boxes + labels
- Posts results back to backend `/api/detections/` endpoint
- **Ready to swap** with real YOLOv8 or cloud inference API

### 5. Frontend (Next.js + TypeScript)
- **Leaflet map** with real-time drone and detection overlays
- **WebSocket client** subscribes to telemetry and detection events
- **JWT authentication** with token refresh
- **Dashboard** showing:
  - Live drone positions
  - Detection markers (color-coded by hazard level)
  - Telemetry details (altitude, battery, etc)
  - Hazard alerts for HIGH-level detections
  - Drone command controls

### 6. Database Schema (PostgreSQL + PostGIS)

#### Key Tables:
- **users** - Operators, analysts, admins
- **drones** - Aircraft registry with home locations (Point)
- **flights** - Missions with planned paths (LineString)
- **detections** - Identified objects with location (Point) and confidence
- **hazards** - Risk assessments linked to detections
- **telemetry** - Timestamped position data (Point)
- **runways** - Airport runways as polygons for geofencing
- **inference_jobs** - Tracks YOLO submissions and results

#### Spatial Indexes:
- `GistIndex` on geometry columns (Point, LineString, Polygon)
- Regular indexes on foreign keys, timestamps, status fields

## Data Flows

### Detection Flow

```
1. Drone captures frame
   └─> publishes to MQTT: skyrecon/drone/{drone_id}/frame

2. MQTT Adapter subscribes and triggers inference
   └─> HTTP POST to inference service

3. Inference service runs YOLOv8 mock
   └─> returns detections (bbox, label, confidence)

4. Inference service POST to backend: /api/detections/
   └─> Backend creates Detection model

5. Backend calculates hazard score
   └─> Hazard = rule_based(confidence, material_weight, runway_proximity)
   └─> Creates Hazard model

6. Backend broadcasts via WebSocket: /ws/detections/
   └─> Clients receive detection event

7. Frontend receives WebSocket message
   └─> Updates map with new detection marker
   └─> Shows hazard alert if HIGH risk
```

### Telemetry Flow

```
1. Drone publishes to MQTT: skyrecon/drone/{drone_id}/telemetry
   └─> Payload: {timestamp, lat, lng, altitude, battery, heading}

2. MQTT Adapter subscribes and parses
   └─> Creates Telemetry model in DB
   └─> Updates Drone.last_seen

3. MQTT Adapter broadcasts via WebSocket: /ws/telemetry/
   └─> Channel: drone_{drone_id}

4. Frontend WebSocket client receives update
   └─> Updates drone marker on map
   └─> Shows updated battery/altitude in sidebar
```

### Command Flow

```
1. Operator clicks "Reroute" on frontend
   └─> Frontend POST to /api/drones/{id}/command/
   └─> Backend receives: {command: "REROUTE", route: {waypoints: [...]}}

2. Backend broadcasts via WebSocket: /ws/telemetry/
   └─> Event: drone_command with command details

3. (Future) Backend publishes to MQTT: skyrecon/drone/{id}/commands/
   └─> Drone receives and executes command
   └─> Publishes new telemetry with updated path
```

## Hazard Scoring Algorithm

```
score = confidence × material_weight × runway_proximity_multiplier

Material weights:
- metal:   1.0
- plastic: 0.7
- organic: 0.5
- unknown: 0.6

Runway proximity:
- < 100m from runway: multiplier = 1.5
- otherwise:          multiplier = 1.0

Hazard levels:
- score < 0.3:     LOW
- 0.3 ≤ score < 0.7: MEDIUM
- score ≥ 0.7:     HIGH

Example:
- metal detection, confidence 0.92, near runway
- score = 0.92 × 1.0 × 1.5 = 1.38 → capped at 1.0 → HIGH risk
```

## Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────┐
│         Kubernetes Cluster (Production)                 │
│                                                         │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│ │   Backend    │  │   Frontend   │  │  Inference   │  │
│ │ Deployment   │  │ Deployment   │  │ Deployment   │  │
│ │ (replicas:3) │  │ (replicas:2) │  │ (replicas:2) │  │
│ └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│ ┌──────────────────────────────────────────────────┐  │
│ │    Stateful Services                             │  │
│ │  - PostgreSQL (with PostGIS)                     │  │
│ │  - RabbitMQ (for Channels)                       │  │
│ │  - Mosquitto (MQTT Broker)                       │  │
│ └──────────────────────────────────────────────────┘  │
│                                                         │
│ ┌──────────────────────────────────────────────────┐  │
│ │    Ingress (SSL/TLS, LoadBalancer)               │  │
│ └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Security & Performance

### Security
- **JWT Auth**: Short-lived access tokens (5 min) + refresh tokens
- **Role-Based Access**: ADMIN, OPERATOR, ANALYST permissions
- **Input Validation**: All endpoints validate and sanitize inputs
- **Spatial Queries**: PostGIS validates geometry before processing
- **HTTPS/TLS**: Production enforces encrypted connections

### Performance
- **Spatial Indexing**: GiST indexes on geometry columns
- **Connection Pooling**: PostgreSQL connection pool (size: 10)
- **RabbitMQ**: Scales WebSocket messaging across backend instances
- **Pagination**: Default 50 items/page, configurable
- **Caching**: Redis optional for detection aggregates

### Scalability
- Horizontal scaling: Multiple backend, frontend, inference pods
- Stateless backend: Sessions in Redis/RabbitMQ
- Database sharding: (future) by drone_id for large scale
- MQTT partitioning: Multiple brokers with federation

## Monitoring & Logging

- **Health Endpoint**: `/api/health/` returns service status
- **Structured Logging**: JSON logs to stdout for container aggregation
- **Metrics**: (Future) Prometheus for latency, throughput, error rates
- **Alerting**: (Future) Sentry for error tracking, PagerDuty integration

## Configuration

All environment variables via `.env`:
```
DATABASE_URL=postgresql://user:pass@db:5432/skyrecon_db
SECRET_KEY=...
DEBUG=False
MQTT_BROKER_HOST=mosquitto
YOLO_INFERENCE_URL=http://inference-mock:8001
JWT_EXPIRATION_DELTA=300
HAZARD_RUNWAY_PROXIMITY_MULTIPLIER=1.5
```

See `dev.env.example` for all options.

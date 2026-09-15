# SkyRecon API Examples

## Authentication

### Get JWT Token

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator",
    "password": "operator123"
  }'
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Store the `access` token and use it for subsequent requests:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Refresh Token

```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "'$REFRESH_TOKEN'"}'
```

## Drones

### List All Drones

```bash
curl http://localhost:8000/api/drones/ \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "identifier": "Drone-001",
      "model": "DJI Matrice 300 RTK",
      "max_payload": 2.7,
      "home_location": {
        "type": "Point",
        "coordinates": [73.055, 33.6125]
      },
      "status": "ACTIVE",
      "last_seen": "2025-12-01T10:15:00Z",
      "recent_telemetry": {
        "id": "...",
        "timestamp": "2025-12-01T10:15:00Z",
        "location": {"type": "Point", "coordinates": [73.0555, 33.6127]},
        "altitude": 50.5,
        "velocity": 3.2,
        "battery": 78
      }
    }
  ]
}
```

### Get Drone Details

```bash
curl http://localhost:8000/api/drones/{drone_id}/ \
  -H "Authorization: Bearer $TOKEN"
```

### Get Recent Telemetry

```bash
curl http://localhost:8000/api/drones/{drone_id}/telemetry/ \
  -H "Authorization: Bearer $TOKEN"
```

### Send Drone Command

```bash
curl -X POST http://localhost:8000/api/drones/{drone_id}/command/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "REROUTE",
    "route": {
      "waypoints": [
        {"lat": 33.614, "lng": 73.055},
        {"lat": 33.615, "lng": 73.056},
        {"lat": 33.616, "lng": 73.057}
      ]
    }
  }'
```

**Available commands:**
- `REROUTE`: Change flight path
- `HOVER`: Pause and hold position
- `RETURN_HOME`: Return to home location
- `EMERGENCY_LAND`: Emergency landing

## Detections

### List Detections

```bash
curl "http://localhost:8000/api/detections/?label=metal&confidence=0.8" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters:**
- `label`: Filter by object class (metal, plastic, organic)
- `confidence`: Minimum confidence threshold (0-1)
- `hazard_score`: Filter by hazard score
- `time_range`: Date range filter
- `limit`: Results per page (default 50)
- `offset`: Pagination offset

### Create Detection (from Inference Service)

```bash
curl -X POST http://localhost:8000/api/detections/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "drone_id": "550e8400-e29b-41d4-a716-446655440001",
    "flight_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2025-12-01T10:15:00Z",
    "bbox": [100, 150, 200, 250],
    "label": "metal",
    "confidence": 0.92,
    "location": {
      "lat": 33.614,
      "lng": 73.055
    },
    "image_url": "https://storage.example.com/detection/123.jpg"
  }'
```

### Get Nearest Detections

```bash
curl "http://localhost:8000/api/detections/nearest/?lat=33.614&lng=73.055&radius_m=1000" \
  -H "Authorization: Bearer $TOKEN"
```

Returns detections within 1km radius, ordered by distance.

## Hazards

### List Hazards

```bash
curl "http://localhost:8000/api/hazards/?level=HIGH" \
  -H "Authorization: Bearer $TOKEN"
```

### Evaluate Hazard for Detection

```bash
curl -X POST http://localhost:8000/api/hazards/evaluate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "detection_id": "550e8400-e29b-41d4-a716-446655440003"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "detection": {...},
  "score": 0.862,
  "level": "HIGH",
  "acknowledged": false,
  "reasoning": {
    "confidence": 0.92,
    "material": "metal",
    "material_weight": 1.0,
    "runway_multiplier": 1.5,
    "base_score": 0.575
  }
}
```

### Acknowledge Hazard

```bash
curl -X POST http://localhost:8000/api/hazards/{hazard_id}/acknowledge/ \
  -H "Authorization: Bearer $TOKEN"
```

## Flights

### Create Flight Mission

```bash
curl -X POST http://localhost:8000/api/flights/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "drone": "550e8400-e29b-41d4-a716-446655440001",
    "mission_name": "Runway Inspection - ORD 09R",
    "path": {
      "type": "LineString",
      "coordinates": [
        [73.0550, 33.6125],
        [73.0560, 33.6130],
        [73.0570, 33.6135]
      ]
    },
    "altitude_m": 50,
    "status": "PLANNED"
  }'
```

### Get Flight Path

```bash
curl http://localhost:8000/api/flights/{flight_id}/path/ \
  -H "Authorization: Bearer $TOKEN"
```

## Maps

### Get Runways

```bash
curl http://localhost:8000/api/maps/runways/ \
  -H "Authorization: Bearer $TOKEN"
```

**Response (GeoJSON):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.05, 33.61], [73.06, 33.61], [73.06, 33.62], [73.05, 33.62], [73.05, 33.61]]]
      },
      "properties": {
        "id": "...",
        "name": "Runway 09R/27L",
        "airport_code": "ORD",
        "length_m": 3000,
        "width_m": 61,
        "active": true
      }
    }
  ]
}
```

### Get Heatmap

```bash
curl http://localhost:8000/api/maps/heatmap/ \
  -H "Authorization: Bearer $TOKEN"
```

Returns aggregated detection density as GeoJSON features.

## Inference

### Submit Frame for Inference

```bash
curl -X POST http://localhost:8000/api/inference/submit-frame/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "drone_id": "550e8400-e29b-41d4-a716-446655440001",
    "flight_id": "550e8400-e29b-41d4-a716-446655440002",
    "frame_url": "https://storage.example.com/frames/frame-001.jpg"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "status": "RUNNING",
  "frame_url": "https://storage.example.com/frames/frame-001.jpg",
  "submitted_at": "2025-12-01T10:15:00Z"
}
```

### Get Inference Results

```bash
curl "http://localhost:8000/api/inference/results/?job_id=550e8400-e29b-41d4-a716-446655440005" \
  -H "Authorization: Bearer $TOKEN"
```

## Health Check

```bash
curl http://localhost:8000/api/health/
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-01T10:15:00Z",
  "services": {
    "database": "ok",
    "channels": "ok",
    "mqtt": "ok"
  }
}
```

## WebSocket Examples

Connect to `/ws/telemetry/` or `/ws/detections/` to receive real-time updates.

### Subscribe to Drone Telemetry

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/telemetry/');

ws.onopen = () => {
  // Subscribe to specific drone
  ws.send(JSON.stringify({
    action: 'subscribe',
    drone_id: '550e8400-e29b-41d4-a716-446655440001'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Telemetry update:', message);
  // {
  //   "type": "telemetry_update",
  //   "data": {
  //     "drone_id": "...",
  //     "timestamp": "2025-12-01T10:15:00Z",
  //     "location": {"lat": 33.614, "lng": 73.055},
  //     "altitude": 50.5,
  //     "velocity": 3.2,
  //     "battery": 78
  //   }
  // }
};
```

### Listen for Detection Events

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/detections/');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'detection.created') {
    console.log('New detection:', message.data);
    // {
    //   "type": "detection.created",
    //   "data": {
    //     "id": "...",
    //     "label": "metal",
    //     "confidence": 0.92,
    //     "location": {"lat": 33.614, "lng": 73.055},
    //     "hazard_score": 0.86,
    //     "hazard_level": "HIGH",
    //     "image_url": "https://..."
    //   }
    // }
  }
};
```

## MQTT Examples

### Publish Telemetry

```bash
mosquitto_pub -h localhost -t "skyrecon/drone/Drone-001/telemetry" -m '{
  "timestamp": "2025-12-01T10:00:00Z",
  "lat": 33.614,
  "lng": 73.055,
  "altitude": 50,
  "velocity": 3.2,
  "battery": 78,
  "heading": 180
}'
```

### Publish Frame for Inference

```bash
mosquitto_pub -h localhost -t "skyrecon/drone/Drone-001/frame" -m '{
  "frame_url": "https://storage.example.com/frame.jpg",
  "timestamp": "2025-12-01T10:01:00Z"
}'
```

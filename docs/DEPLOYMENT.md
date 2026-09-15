# SkyRecon Deployment Guide

This guide provides instructions for deploying SkyRecon to production environments.

## Deployment Options

### Option 1: Docker Compose (Small Single-Node)

Best for: Testing, small deployments, single machine

```bash
# Clone repository
git clone <repo-url>
cd skyrecon

# Configure environment
cp dev.env.example .env
# Edit .env with production values:
# - DEBUG=False
# - SECRET_KEY=<generate-strong-key>
# - ALLOWED_HOSTS=skyrecon.example.com
# - DATABASE_URL=postgresql://...
# - RABBITMQ credentials
# - MQTT credentials

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Seed demo data (optional)
docker-compose exec backend python manage.py seed_data

# Check health
curl http://localhost:8000/api/health/
```

### Option 2: Kubernetes (Enterprise)

Best for: High availability, auto-scaling, managed infrastructure

#### Prerequisites

- Kubernetes cluster (1.24+) with:
  - kubectl configured
  - Persistent storage provisioner (e.g., EBS, GCE persistent disks)
  - Ingress controller (nginx, GKE ingress)
  - Cert-manager for TLS (optional but recommended)

#### Deployment Steps

**1. Create Kubernetes Secrets**

```bash
# Database credentials
kubectl create secret generic skyrecon-secrets \
  --from-literal=database-url="postgresql://skyrecon:password@postgres:5432/skyrecon_prod" \
  --from-literal=secret-key="your-very-secure-secret-key" \
  --from-literal=jwt-secret="your-jwt-secret"

# Container registry (if private)
kubectl create secret docker-registry regcred \
  --docker-server=docker.io \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email>
```

**2. Deploy Infrastructure**

```bash
# Create namespace
kubectl create namespace skyrecon

# Deploy PostgreSQL with PostGIS (or use managed service)
kubectl apply -f infra/k8s/postgresql.yaml -n skyrecon

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n skyrecon --timeout=300s

# Run migrations
kubectl run -it --rm migrate --image=skyrecon-backend:latest \
  --restart=Never -n skyrecon -- python manage.py migrate

# Deploy message brokers
kubectl apply -f infra/k8s/rabbitmq.yaml -n skyrecon
kubectl apply -f infra/k8s/mosquitto.yaml -n skyrecon
```

**3. Deploy Applications**

```bash
# Apply configurations
kubectl apply -f infra/k8s/configmap.yaml -n skyrecon

# Deploy applications
kubectl apply -f infra/k8s/deployments.yaml -n skyrecon

# Create services
kubectl apply -f infra/k8s/services.yaml -n skyrecon

# Create ingress with TLS
kubectl apply -f infra/k8s/ingress.yaml -n skyrecon

# Wait for deployments to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment -l app -n skyrecon
```

**4. Verify Deployment**

```bash
# Check pod status
kubectl get pods -n skyrecon

# Check services
kubectl get svc -n skyrecon

# Check ingress
kubectl get ingress -n skyrecon

# View logs
kubectl logs -f deployment/skyrecon-backend -n skyrecon
kubectl logs -f deployment/skyrecon-frontend -n skyrecon

# Port forward for testing
kubectl port-forward svc/skyrecon-backend-service 8000:8000 -n skyrecon
kubectl port-forward svc/skyrecon-frontend-service 3000:3000 -n skyrecon
```

**5. Scale Deployments**

```bash
# Scale backend to 5 replicas
kubectl scale deployment skyrecon-backend --replicas=5 -n skyrecon

# Scale frontend to 3 replicas
kubectl scale deployment skyrecon-frontend --replicas=3 -n skyrecon

# View current replicas
kubectl get deployment -n skyrecon
```

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://skyrecon:password@postgres:5432/skyrecon_prod
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=skyrecon_prod
POSTGRES_USER=skyrecon
POSTGRES_PASSWORD=<secure-password>

# Django
DEBUG=False
SECRET_KEY=<generate-with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
ALLOWED_HOSTS=skyrecon.example.com,api.example.com

# JWT
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DELTA=300
JWT_REFRESH_EXPIRATION_DELTA=86400

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=<password>

# MQTT
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
MQTT_BROKER_USER=
MQTT_BROKER_PASSWORD=

# Inference
YOLO_INFERENCE_URL=http://skyrecon-inference-service:8001
INFERENCE_TIMEOUT=30

# Frontend
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WS_URL=wss://api.example.com

# Hazard Scoring
HAZARD_METAL_WEIGHT=1.0
HAZARD_PLASTIC_WEIGHT=0.7
HAZARD_ORGANIC_WEIGHT=0.5
HAZARD_UNKNOWN_WEIGHT=0.6
HAZARD_LOW_THRESHOLD=0.3
HAZARD_HIGH_THRESHOLD=0.7
HAZARD_RUNWAY_PROXIMITY_MULTIPLIER=1.5
HAZARD_RUNWAY_PROXIMITY_DISTANCE_M=100

# Data Retention
DETECTION_RETENTION_DAYS=30
TELEMETRY_RETENTION_DAYS=7
```

### Generate Secure Values

```bash
# Generate SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Generate strong password
openssl rand -base64 32
```

## Database Setup

### PostgreSQL with PostGIS

#### Docker Compose

```bash
docker-compose up -d db
docker-compose exec db psql -U skyrecon -d skyrecon
```

#### Kubernetes

```bash
# PostgreSQL StatefulSet with PostGIS
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgis/postgis:15-3.3
        env:
        - name: POSTGRES_DB
          value: skyrecon_prod
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: skyrecon-secrets
              key: postgres-user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: skyrecon-secrets
              key: postgres-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
EOF
```

#### Initialize Database

```bash
# Run migrations
docker-compose exec backend python manage.py migrate
# or
kubectl exec deployment/skyrecon-backend -- python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
# or
kubectl exec -it deployment/skyrecon-backend -- python manage.py createsuperuser

# Seed demo data
docker-compose exec backend python manage.py seed_data
# or
kubectl exec deployment/skyrecon-backend -- python manage.py seed_data
```

## TLS/SSL Configuration

### Let's Encrypt with Cert-Manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Ingress will auto-create TLS certificates
```

## Monitoring & Health Checks

### Health Endpoints

```bash
# Backend health
curl https://api.example.com/api/health/

# Frontend (status page)
curl https://skyrecon.example.com/

# Inference service
curl http://skyrecon-inference-service:8001/health
```

### Logs

#### Docker Compose

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Export logs
docker-compose logs > logs.txt
```

#### Kubernetes

```bash
# View logs
kubectl logs -f deployment/skyrecon-backend -n skyrecon

# Stream multiple pods
kubectl logs -f deployment/skyrecon-backend deployment/skyrecon-frontend -n skyrecon

# Export logs
kubectl logs deployment/skyrecon-backend -n skyrecon > backend.log

# Debug pod
kubectl exec -it deployment/skyrecon-backend -n skyrecon -- bash
```

### Prometheus Metrics

Add to `skyrecon_backend/settings.py`:

```python
INSTALLED_APPS = [
    ...
    'django_prometheus',
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusMiddleware',
    ...
]
```

Then add Prometheus scrape target:

```yaml
scrape_configs:
  - job_name: 'skyrecon-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

## Backup & Recovery

### Database Backups

#### Docker Compose

```bash
# Backup
docker-compose exec db pg_dump -U skyrecon skyrecon > backup.sql

# Restore
docker-compose exec -T db psql -U skyrecon skyrecon < backup.sql
```

#### Kubernetes

```bash
# Backup
kubectl exec -it postgres-0 -n skyrecon -- pg_dump -U skyrecon skyrecon_prod > backup.sql

# Restore
kubectl exec -it postgres-0 -n skyrecon -- psql -U skyrecon skyrecon_prod < backup.sql

# Schedule daily backups with CronJob
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: skyrecon
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/sh
            - -c
            - pg_dump -h postgres -U skyrecon skyrecon_prod | gzip > /backups/backup-$(date +%Y%m%d).sql.gz
            volumeMounts:
            - name: backups
              mountPath: /backups
          volumes:
          - name: backups
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
```

### Data Retention Policies

```bash
# Archive old detections (monthly)
docker-compose exec backend python manage.py archive_detections --older-than-days=30

# Purge telemetry (weekly)
docker-compose exec backend python manage.py purge_telemetry --older-than-days=7
```

## Scaling Guidelines

### Horizontal Scaling

**Backend API**: Stateless, can scale to 5-10 replicas
```bash
kubectl scale deployment skyrecon-backend --replicas=10 -n skyrecon
```

**Frontend**: Static content, can scale to 5-10 replicas
```bash
kubectl scale deployment skyrecon-frontend --replicas=10 -n skyrecon
```

**Inference Service**: Dependent on GPU/compute, scale as needed
```bash
kubectl scale deployment skyrecon-inference --replicas=3 -n skyrecon
```

### Database Scaling

- ReadReplicas for read-heavy queries
- Connection pooling (pgBouncer)
- Increase worker processes

### Message Brokers

- RabbitMQ cluster mode for HA
- Mosquitto clustering for distributed MQTT

## Rollback Procedures

### Docker Compose

```bash
# Revert to previous version
git checkout previous-version
docker-compose build
docker-compose up -d

# If database issue, restore from backup
docker-compose exec -T db psql -U skyrecon skyrecon < backup.sql
```

### Kubernetes

```bash
# View rollout history
kubectl rollout history deployment/skyrecon-backend -n skyrecon

# Rollback to previous version
kubectl rollout undo deployment/skyrecon-backend -n skyrecon

# Rollback to specific revision
kubectl rollout undo deployment/skyrecon-backend --to-revision=3 -n skyrecon

# Monitor rollout
kubectl rollout status deployment/skyrecon-backend -n skyrecon
```

## Troubleshooting

### Database Connection Issues

```bash
# Check database connectivity
docker-compose exec backend python manage.py dbshell

# Verify PostgreSQL is running
docker-compose ps db

# Check logs
docker-compose logs db
```

### WebSocket Connection Issues

```bash
# Check RabbitMQ health
docker-compose exec rabbitmq rabbitmq-diagnostics -q ping

# Check Channels layer
docker-compose exec backend python manage.py shell
>>> from channels.layers import get_channel_layer
>>> import asyncio
>>> asyncio.run(get_channel_layer().group_send('test', {'type': 'test'}))
```

### Out of Memory

```bash
# Increase container memory limit in docker-compose.yml or Kubernetes manifest
# Monitor memory usage
docker stats
# or
kubectl top pods -n skyrecon
```

## Production Checklist

- [ ] Generate strong SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure database backups
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Test disaster recovery (restore from backup)
- [ ] Load test (10+ concurrent drones)
- [ ] Security audit (OWASP Top 10)
- [ ] Configure rate limiting
- [ ] Set up health checks and probes
- [ ] Document runbook procedures

## Support

For issues:
1. Check logs: `docker-compose logs -f` or `kubectl logs -f`
2. Verify environment variables
3. Check database connectivity
4. Consult troubleshooting section
5. Review documentation in `/docs`

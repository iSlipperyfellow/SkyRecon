# TODO - Future Work & Known Issues

## High Priority

- [ ] Real YOLOv8 integration (swap mock inference service)
  - Document model path configuration
  - Add GPU acceleration support in inference service Dockerfile
  - Implement batch processing for frame queue
  
- [ ] Production Kubernetes deployment
  - Complete k8s manifests (StatefulSet for DB, Deployments for services)
  - Helm chart scaffolding
  - Ingress + SSL/TLS configuration
  
- [ ] Advanced monitoring & observability
  - Prometheus metrics endpoint (detection rate, inference latency, etc.)
  - Structured JSON logging (Logstash/ELK integration)
  - Distributed tracing (Jaeger)
  - Health check aggregation dashboard

- [ ] RL Navigation engine integration
  - Implement PPO agent training pipeline
  - Route planning with dynamic constraints
  - Telemetry feedback loop for policy updates

## Medium Priority

- [ ] Frontend enhancements
  - PDF export for detection reports
  - CSV export for historical data
  - Advanced filtering UI (date range picker, hazard threshold sliders)
  - Video playback of drone footage with detection overlay
  - Dark mode support
  
- [ ] Backend optimizations
  - Async views for long-running operations
  - Caching layer (Redis) for frequently accessed data
  - Bulk detection upload endpoint
  - Background task queue for processing (Celery)
  
- [ ] Data archival & retention
  - Implement automatic purge of detections older than X days
  - Archive old flights to cold storage (S3)
  - Data export utilities for compliance
  
- [ ] Security hardening
  - Rate limiting per API endpoint
  - CORS configuration for production domains
  - Audit logging for admin actions
  - API key-based authentication for external services

## Low Priority (Future Versions)

- [ ] Mobile app (React Native or Flutter)
- [ ] Multi-tenant support (organization isolation)
- [ ] Drone swarm coordination
- [ ] Integration with real airport systems (ATIS, NOTAMs)
- [ ] ML-based anomaly detection for telemetry outliers
- [ ] Automated incident response (emergency landing, geofence triggers)

## Known Issues

- [ ] MQTT message ordering not guaranteed (acceptable for current use case)
- [ ] Large detection datasets (>100k) may experience query slowdowns (needs pagination refinement)
- [ ] WebSocket disconnections don't auto-reconnect on frontend (manual refresh required)
- [ ] Mock inference service returns deterministic data (not representative of real variance)

## Testing

- [ ] Add E2E tests with Cypress/Playwright
- [ ] Load testing for 10+ concurrent drones
- [ ] Chaos engineering tests for Channels failover
- [ ] Contract testing for mock inference service

## Documentation

- [ ] API rate limiting docs
- [ ] Troubleshooting guide for common issues
- [ ] Metrics and dashboarding setup guide
- [ ] Production deployment runbook with RTO/RPO targets
- [ ] Incident response procedures

## DevOps & CI/CD

- [ ] Automated blue-green deployments
- [ ] Container image scanning (Trivy)
- [ ] Dependency update automation (Dependabot)
- [ ] Performance regression testing in CI

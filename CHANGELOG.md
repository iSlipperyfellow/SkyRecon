# Changelog

All notable changes to SkyRecon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-01

### Added
- Initial project setup with Django backend and Next.js frontend
- PostgreSQL with PostGIS for spatial queries
- JWT-based authentication with role-based access control
- WebSocket support via Django Channels and RabbitMQ
- MQTT adapter for drone telemetry ingestion
- Mock YOLOv8 inference service
- Rule-based hazard scoring system
- Detection and hazard management models
- Drone, flight, and telemetry tracking models
- User management with ADMIN, OPERATOR, ANALYST roles
- REST API with OpenAPI/Swagger documentation
- Real-time detection and telemetry WebSocket consumers
- Docker and Docker Compose setup for local development
- Basic test suite for backend and frontend
- GitHub Actions CI/CD workflow
- Complete documentation and API examples

### Security
- JWT tokens with configurable TTL
- Refresh token support with DB revocation
- Role-based permission checks on all API endpoints
- Input validation on all endpoints

### Performance
- Database indexing on spatial columns and common query fields
- Connection pooling for PostgreSQL
- RabbitMQ for scalable WebSocket messaging

## [Unreleased]

### Planned
- Real YOLOv8 model integration
- RL-based autonomous navigation engine
- Prometheus metrics and monitoring
- Kubernetes manifests for production deployment
- Mobile app (React Native)
- Data archival and purge mechanisms
- Advanced hazard re-evaluation pipeline
- PDF/CSV export functionality
- Email alerts for HIGH hazard detections

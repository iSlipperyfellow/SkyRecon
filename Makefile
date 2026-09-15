.PHONY: help up down logs migrate seed test-backend test-frontend lint format clean shell mqtt-publish

help:
	@echo "SkyRecon Development Commands"
	@echo "=============================="
	@echo "make up              - Start all services (docker-compose)"
	@echo "make down            - Stop all services"
	@echo "make logs            - Tail service logs"
	@echo "make migrate         - Run Django migrations"
	@echo "make seed            - Create sample data"
	@echo "make test-backend    - Run backend test suite"
	@echo "make test-frontend   - Run frontend test suite"
	@echo "make lint            - Lint Python code"
	@echo "make format          - Format Python code"
	@echo "make clean           - Remove containers and volumes"
	@echo "make shell           - Open Django shell"
	@echo "make mqtt-publish    - Test MQTT telemetry publish"

up:
	docker-compose up -d
	@echo "Services started. Waiting for backend readiness..."
	@sleep 5
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000/api"
	@echo "API Docs: http://localhost:8000/api/docs"
	@echo "PgAdmin: http://localhost:5050 (admin@admin.com / admin)"

down:
	docker-compose down

logs:
	docker-compose logs -f

migrate:
	docker-compose exec backend python manage.py migrate

seed:
	docker-compose exec backend python manage.py seed_data

test-backend:
	docker-compose exec backend pytest core/tests/ -v --cov=core --cov-report=html

test-frontend:
	docker-compose exec frontend npm test -- --coverage --watchAll=false

lint:
	docker-compose exec backend bash -c "black --check . && isort --check-only . && ruff check ."

format:
	docker-compose exec backend bash -c "black . && isort . && ruff check --fix ."

clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf frontend/.next frontend/out frontend/build

shell:
	docker-compose exec backend python manage.py shell

mqtt-publish:
	docker-compose exec mosquitto mosquitto_pub \
		-h localhost \
		-t "skyrecon/drone/test-drone-1/telemetry" \
		-m '{"timestamp":"2025-12-01T10:00:00Z","lat":33.614,"lng":73.055,"altitude":10.5,"velocity":3.2,"battery":78,"heading":135}'

.DEFAULT_GOAL := help

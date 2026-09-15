#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo "Starting server..."
exec gunicorn skyrecon_backend.wsgi:application --bind 0.0.0.0:8000 --timeout 120 --workers 4

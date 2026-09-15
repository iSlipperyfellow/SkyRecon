"""
Django settings for skyrecon_backend project.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR.parent, ".env"))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", "your-super-secret-key-change-in-production")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Application definition
INSTALLED_APPS = [
    "daphne",  # WebSocket support
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",  # GeoDjango
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
    "channels",
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "skyrecon_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "skyrecon_backend.wsgi.application"
ASGI_APPLICATION = "skyrecon_backend.asgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.environ.get("POSTGRES_DB", "skyrecon_db"),
        "USER": os.environ.get("POSTGRES_USER", "skyrecon_user"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "skyrecon_pass"),
        "HOST": os.environ.get("DATABASE_HOST", "db"),
        "PORT": os.environ.get("DATABASE_PORT", "5432"),
        "CONN_MAX_AGE": 600,
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "core.User"

# ============================================
# Django REST Framework
# ============================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_FILTER_BACKENDS": [
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# ============================================
# JWT Configuration
# ============================================
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        seconds=int(os.environ.get("JWT_EXPIRATION_DELTA", "300"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        seconds=int(os.environ.get("JWT_REFRESH_EXPIRATION_DELTA", "86400"))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "ALGORITHM": os.environ.get("JWT_ALGORITHM", "HS256"),
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ============================================
# CORS Configuration
# ============================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://frontend:3000",
]
CORS_ALLOW_CREDENTIALS = True

# ============================================
# Django Channels (WebSocket)
# ============================================
ASGI_APPLICATION = "skyrecon_backend.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

# ============================================
# DRF Spectacular (OpenAPI)
# ============================================
SPECTACULAR_SETTINGS = {
    "TITLE": "SkyRecon API",
    "DESCRIPTION": "Multi-drone debris detection and management system",
    "VERSION": "0.1.0",
    "SERVE_PERMISSIONS": ["rest_framework.permissions.AllowAny"],
    "AUTHENTICATION_WHITELIST": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
}

# ============================================
# Application Settings
# ============================================
MQTT_BROKER_HOST = os.environ.get("MQTT_BROKER_HOST", "mosquitto")
MQTT_BROKER_PORT = int(os.environ.get("MQTT_BROKER_PORT", "1883"))
MQTT_BROKER_KEEPALIVE = int(os.environ.get("MQTT_BROKER_KEEPALIVE", "60"))

YOLO_INFERENCE_URL = os.environ.get("YOLO_INFERENCE_URL", "http://inference-mock:8001")
INFERENCE_TIMEOUT = int(os.environ.get("INFERENCE_TIMEOUT", "30"))

# Hazard scoring weights
HAZARD_MATERIAL_WEIGHTS = {
    "metal": float(os.environ.get("HAZARD_METAL_WEIGHT", "1.0")),
    "plastic": float(os.environ.get("HAZARD_PLASTIC_WEIGHT", "0.7")),
    "organic": float(os.environ.get("HAZARD_ORGANIC_WEIGHT", "0.5")),
    "unknown": 0.6,
}

HAZARD_LOW_THRESHOLD = float(os.environ.get("HAZARD_LOW_THRESHOLD", "0.3"))
HAZARD_MEDIUM_THRESHOLD = float(os.environ.get("HAZARD_MEDIUM_THRESHOLD", "0.7"))
HAZARD_RUNWAY_PROXIMITY_MULTIPLIER = float(
    os.environ.get("HAZARD_RUNWAY_PROXIMITY_MULTIPLIER", "1.5")
)

# Data retention
DETECTION_RETENTION_DAYS = int(os.environ.get("DETECTION_RETENTION_DAYS", "30"))
TELEMETRY_RETENTION_DAYS = int(os.environ.get("TELEMETRY_RETENTION_DAYS", "7"))

# Security settings
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "False").lower() == "true"
SESSION_COOKIE_SECURE = (
    os.environ.get("SESSION_COOKIE_SECURE", "False").lower() == "true"
)
CSRF_COOKIE_SECURE = os.environ.get("CSRF_COOKIE_SECURE", "False").lower() == "true"

# Ensure logs directory exists
LOGS_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
        "json": {
            "format": '{"time": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "message": "%(message)s"}',
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": os.path.join(LOGS_DIR, "skyrecon.log"),
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.environ.get("LOG_LEVEL", "INFO"),
            "propagate": False,
        },
        "core": {
            "handlers": ["console"],
            "level": os.environ.get("LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}

# Features
ENABLE_REAL_YOLO = os.environ.get("ENABLE_REAL_YOLO", "False").lower() == "true"
ENABLE_RL_NAVIGATION = os.environ.get("ENABLE_RL_NAVIGATION", "True").lower() == "true"
ENABLE_HEATMAP = os.environ.get("ENABLE_HEATMAP", "True").lower() == "true"
MAX_CONCURRENT_DRONES = int(os.environ.get("MAX_CONCURRENT_DRONES", "10"))

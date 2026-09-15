"""
Test module initialization
"""

import os

import django

# Configure Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skyrecon_backend.settings")
django.setup()

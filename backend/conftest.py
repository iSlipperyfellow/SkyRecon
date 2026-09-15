"""
Pytest configuration file
"""

import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skyrecon_backend.settings")

# Setup Django
django.setup()

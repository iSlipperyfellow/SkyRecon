"""
Pytest configuration file
"""

import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skyrecon_backend.settings')

# Setup Django
django.setup()

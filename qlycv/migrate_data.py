#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

# Temporarily switch to SQLite for dumping
os.environ['DB_ENGINE'] = 'django.db.backends.sqlite3'
os.environ['DB_NAME'] = str(BASE_DIR / 'db.sqlite3')

django.setup()

from django.core.management import call_command
from django.core.management import execute_from_command_line

print("Dumping data from SQLite...")
try:
    with open('sqlite_data.json', 'w', encoding='utf-8') as f:
        call_command('dumpdata', stdout=f, format='json', indent=2)
    print("✓ Data dumped from SQLite to sqlite_data.json")
except Exception as e:
    print(f"✗ Error dumping data: {e}")
    sys.exit(1)

# Switch back to PostgreSQL
os.environ['DB_ENGINE'] = 'django.db.backends.postgresql'
os.environ['DB_NAME'] = 'gis_database'
os.environ['DB_USER'] = 'admin'
os.environ['DB_PASSWORD'] = 'YourPassword123'
os.environ['DB_HOST'] = 'localhost'
os.environ['DB_PORT'] = '5432'

print("Loading data into PostgreSQL...")
try:
    call_command('loaddata', 'sqlite_data.json')
    print("✓ Data loaded into PostgreSQL")
except Exception as e:
    print(f"✗ Error loading data: {e}")
    sys.exit(1)

print("Migration completed successfully!")
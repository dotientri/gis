#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path

# Setup Django
BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / 'data'
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Temporarily switch to SQLite for dumping
os.environ['DB_ENGINE'] = 'django.db.backends.sqlite3'
os.environ['DB_NAME'] = str(DATA_DIR / 'db.sqlite3')

django.setup()

from django.core.management import call_command

fixture_path = DATA_DIR / 'sqlite_data.json'

print("Dumping data from SQLite...")
try:
    with fixture_path.open('w', encoding='utf-8') as f:
        call_command('dumpdata', stdout=f, format='json', indent=2)
    print(f"Data dumped from SQLite to {fixture_path}")
except Exception as e:
    print(f"Error dumping data: {e}")
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
    call_command('loaddata', str(fixture_path))
    print("Data loaded into PostgreSQL")
except Exception as e:
    print(f"Error loading data: {e}")
    sys.exit(1)

print("Migration completed successfully!")

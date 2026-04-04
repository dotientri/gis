#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from parks.models import NguoiDung

print("Testing the fix...")
try:
    active_count = NguoiDung.objects.filter(dang_hoat_dong=True).count()
    inactive_count = NguoiDung.objects.filter(dang_hoat_dong=False).count()
    print(f"✅ Success! Active users: {active_count}, Inactive users: {inactive_count}")
except Exception as e:
    print(f"❌ Error: {e}")

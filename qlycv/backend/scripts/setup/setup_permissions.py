#!/usr/bin/env python
"""Setup 4-tier permission system"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from parks.models import NhomQuyen

# Get existing roles
existing = set(NhomQuyen.objects.values_list('ten_nhom', flat=True))
print(f"Existing roles: {list(existing)}")

# Define all 4 roles
all_roles = [
    ('KHACH', 'Khách'),
    ('CONG_DONG', 'Người dùng cộng đồng'),
    ('QUAN_LY', 'Quản lý công viên'),
    ('QUAN_TRI', 'Quản trị viên'),
]

# Create missing roles
for code, display in all_roles:
    if code not in existing:
        role = NhomQuyen.objects.create(ten_nhom=code, mo_ta=display)
        print(f"✅ Created: {code} ({display})")
    else:
        print(f"✓ Already exists: {code}")

# List all roles
print("\nFinal roles:")
for role in NhomQuyen.objects.all():
    count = role.nguoi_dung.count()
    print(f"  - {role.ten_nhom} ({count} users)")

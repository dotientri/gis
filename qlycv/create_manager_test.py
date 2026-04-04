#!/usr/bin/env python
"""Create test manager user with park assignment"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from parks.models import NhomQuyen, NguoiDung, CongVien
from django.contrib.auth.hashers import make_password

# Get QUAN_LY role
try:
    quan_ly_role = NhomQuyen.objects.get(ten_nhom='QUAN_LY')
    print(f"✓ Found QUAN_LY role")
except:
    print("❌ QUAN_LY role not found!")
    exit(1)

# Get a park for manager to manage
try:
    park = CongVien.objects.first()
    if not park:
        print("❌ No parks found! Create a park first.")
        exit(1)
    print(f"✓ Found park: {park.ten_cong_vien}")
except Exception as e:
    print(f"❌ Error getting park: {e}")
    exit(1)

# Create manager user
try:
    manager = NguoiDung.objects.create(
        ten_dang_nhap='manager_test',
        email='manager@test.local',
        ho_ten='Quản Lý Test',
        mat_khau_hash=make_password('password123'),
        ma_nhom_quyen=quan_ly_role,
        ma_cong_vien=park,  # Assign park
        dang_hoat_dong=True
    )
    print(f"✅ Created manager user:")
    print(f"   Username: {manager.ten_dang_nhap}")
    print(f"   Name: {manager.ho_ten}")
    print(f"   Role: {manager.ma_nhom_quyen.ten_nhom}")
    print(f"   Assigned Park: {manager.ma_cong_vien.ten_cong_vien if manager.ma_cong_vien else 'None'}")
except Exception as e:
    print(f"❌ Error creating user: {e}")
    exit(1)

print("\n📋 Login credentials:")
print("   Username: manager_test")
print("   Password: password123")

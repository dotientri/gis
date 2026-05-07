#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from parks.models import NguoiDung

# Get manager test account
try:
    manager = NguoiDung.objects.get(ten_dang_nhap='manager_test')
    print(f"✅ Tài khoản Manager Test:")
    print(f"   Username: {manager.ten_dang_nhap}")
    print(f"   Email: {manager.email}")
    print(f"   Name: {manager.ho_ten}")
    print(f"   Token: {manager.token}")
    print(f"   Role: {manager.ma_nhom_quyen.ten_nhom} ({manager.ma_nhom_quyen.get_ten_nhom_display()})")
    print(f"   Assigned Park: {manager.ma_cong_vien.ten_cong_vien if manager.ma_cong_vien else '❌ Not assigned'}")
    print(f"   Status: {'🟢 Active' if manager.dang_hoat_dong else '🔴 Inactive'}")
    print(f"\n📌 Test with:")
    print(f"   Authorization: Bearer {manager.token}")
except NguoiDung.DoesNotExist:
    print("❌ Manager test account not found")
except Exception as e:
    print(f"❌ Error: {e}")

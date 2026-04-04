#!/usr/bin/env python
import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from parks.models import NguoiDung

# Get manager test account
try:
    manager = NguoiDung.objects.get(ten_dang_nhap='manager_test')
    
    # Generate token if not exists
    if not manager.token:
        manager.token = str(uuid.uuid4())
        manager.save(update_fields=['token'])
        print("🔄 Generated new token")
    
    print(f"✅ Tài khoản Manager Test:")
    print(f"   Username: manager_test")
    print(f"   Password: password123")
    print(f"   Email: {manager.email}")
    print(f"   Name: {manager.ho_ten}")
    print(f"   Token: {manager.token}")
    print(f"   Role: {manager.ma_nhom_quyen.get_ten_nhom_display()}")
    print(f"   Assigned Park: {manager.ma_cong_vien.ten_cong_vien if manager.ma_cong_vien else 'None'}")
    print(f"\n📌 Login test:")
    print(f"   POST /api/auth/login/")
    print(f"   Body: {{'ten_dang_nhap': 'manager_test', 'mat_khau': 'password123'}}")
    print(f"\n📌 API request header:")
    print(f"   Authorization: Bearer {manager.token}")
except NguoiDung.DoesNotExist:
    print("❌ Manager test account not found")
except Exception as e:
    print(f"❌ Error: {e}")

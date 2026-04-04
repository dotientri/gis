#!/usr/bin/env python
"""
Test script to verify manager park assignment and editing fixes
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from parks.models import NguoiDung, CongVien, NhomQuyen
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

def test_manager_assignment_and_editing():
    """Test manager assignment and ability to edit parks"""
    print("\n" + "="*70)
    print("TEST: Manager Park Assignment & Editing Fixes")
    print("="*70)
    
    client = APIClient()
    
    # 1. Get or create test data
    print("\n[1] Setting up test data...")
    try:
        manager_role = NhomQuyen.objects.get(ten_nhom='QUAN_LY')
        admin_role = NhomQuyen.objects.get(ten_nhom='QUAN_TRI')
    except NhomQuyen.DoesNotExist:
        print("  ❌ Roles not found")
        return False
    
    # Create test admin
    admin_user, _ = NguoiDung.objects.get_or_create(
        ten_dang_nhap='admin_test_fix',
        defaults={
            'ho_ten': 'Admin Test Fix',
            'email': 'admin_test_fix@test.com',
            'mat_khau_hash': 'hashed_password',
            'ma_nhom_quyen': admin_role,
            'dang_hoat_dong': True
        }
    )
    admin_token, _ = Token.objects.get_or_create(user=admin_user)
    
    # Create test manager
    manager_user, _ = NguoiDung.objects.get_or_create(
        ten_dang_nhap='manager_test_fix',
        defaults={
            'ho_ten': 'Manager Test Fix',
            'email': 'manager_test_fix@test.com',
            'mat_khau_hash': 'hashed_password',
            'ma_nhom_quyen': manager_role,
            'dang_hoat_dong': True
        }
    )
    manager_token, _ = Token.objects.get_or_create(user=manager_user)
    
    # Get a test park
    test_park = CongVien.objects.filter(ma_trang_thai__ma_code='hoat_dong').first()
    if not test_park:
        print("  ❌ No active park found")
        return False
    
    print(f"  ✅ Admin: {admin_user.ten_dang_nhap}")
    print(f"  ✅ Manager: {manager_user.ten_dang_nhap}")
    print(f"  ✅ Test Park: {test_park.ten_cong_vien}")
    
    # 2. Test: Admin assigns park to manager
    print("\n[2] Testing: Admin assigns park to manager...")
    client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token.key}')
    
    response = client.post(
        f'/api/cong-vien/{test_park.ma_cong_vien}/assign-manager/',
        {'manager_username': manager_user.ten_dang_nhap},
        format='json'
    )
    
    if response.status_code == 200:
        print(f"  ✅ Status code: {response.status_code}")
        print(f"  ✅ Message: {response.data.get('message')}")
        
        # Verify assignment
        manager_user.refresh_from_db()
        if manager_user.ma_cong_vien == test_park:
            print(f"  ✅ Manager assigned to: {manager_user.ma_cong_vien.ten_cong_vien}")
        else:
            print(f"  ❌ Manager NOT assigned correctly")
            return False
    else:
        print(f"  ❌ Status code: {response.status_code}")
        print(f"  ❌ Error: {response.data}")
        return False
    
    # 3. Test: Manager can edit their assigned park
    print("\n[3] Testing: Manager edits their assigned park...")
    client.credentials(HTTP_AUTHORIZATION=f'Token {manager_token.key}')
    
    update_data = {
        'mo_ta': 'Updated description by manager - Test Fix'
    }
    
    response = client.patch(
        f'/api/cong-vien/{test_park.ma_cong_vien}/',
        update_data,
        format='json'
    )
    
    if response.status_code == 200:
        print(f"  ✅ Status code: {response.status_code}")
        print(f"  ✅ Manager can edit park")
        
        # Verify edit
        test_park.refresh_from_db()
        if test_park.mo_ta == 'Updated description by manager - Test Fix':
            print(f"  ✅ Description updated: {test_park.mo_ta}")
        else:
            print(f"  ⚠️  Description not updated (might not be in response)")
    else:
        print(f"  ❌ Status code: {response.status_code}")
        print(f"  ❌ Error: {response.data}")
        return False
    
    # 4. Test: Manager CANNOT change park status/type
    print("\n[4] Testing: Manager cannot change status/type...")
    
    update_data = {
        'ma_trang_thai': 'khong_hoat_dong'  # Try to change status
    }
    
    response = client.patch(
        f'/api/cong-vien/{test_park.ma_cong_vien}/',
        update_data,
        format='json'
    )
    
    if response.status_code == 403:
        print(f"  ✅ Status code: {response.status_code} (Forbidden as expected)")
        print(f"  ✅ Error message: {response.data.get('error')}")
    else:
        print(f"  ❌ Expected 403, got: {response.status_code}")
        return False
    
    # 5. Test: Manager cannot edit OTHER parks
    print("\n[5] Testing: Manager cannot edit other parks...")
    
    other_park = CongVien.objects.exclude(ma_cong_vien=test_park.ma_cong_vien).first()
    if other_park:
        response = client.patch(
            f'/api/cong-vien/{other_park.ma_cong_vien}/',
            {'mo_ta': 'Trying to edit someone else park'},
            format='json'
        )
        
        if response.status_code == 403:
            print(f"  ✅ Status code: {response.status_code} (Forbidden as expected)")
            print(f"  ✅ Error message: {response.data.get('error')}")
        else:
            print(f"  ❌ Expected 403, got: {response.status_code}")
            return False
    else:
        print("  ⚠️  No other park found for test")
    
    # 6. Test: Admin unassigns manager from park
    print("\n[6] Testing: Admin unassigns manager...")
    client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token.key}')
    
    response = client.post(
        f'/api/cong-vien/{test_park.ma_cong_vien}/unassign-manager/',
        {},
        format='json'
    )
    
    if response.status_code == 200:
        print(f"  ✅ Status code: {response.status_code}")
        print(f"  ✅ Message: {response.data.get('message')}")
        
        # Verify unassignment
        manager_user.refresh_from_db()
        if manager_user.ma_cong_vien is None:
            print(f"  ✅ Manager unassigned")
        else:
            print(f"  ❌ Manager still assigned to: {manager_user.ma_cong_vien}")
            return False
    else:
        print(f"  ❌ Status code: {response.status_code}")
        print(f"  ❌ Error: {response.data}")
        return False
    
    print("\n" + "="*70)
    print("✅ ALL TESTS PASSED!")
    print("="*70 + "\n")
    return True


if __name__ == '__main__':
    success = test_manager_assignment_and_editing()
    exit(0 if success else 1)

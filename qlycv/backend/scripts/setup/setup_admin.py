from django.contrib.auth.hashers import make_password
from parks.models import NguoiDung, NhomQuyen

# Check if admin user exists
admin_user = NguoiDung.objects.filter(ten_dang_nhap='admin').first()

if admin_user:
    print(f"Admin user exists: {admin_user.ten_dang_nhap}")
    print(f"Email: {admin_user.email}")
    
    # Reset password to 'admin123'
    new_password = 'admin123'
    admin_user.mat_khau_hash = make_password(new_password)
    admin_user.save()
    print(f"✓ Password updated to: {new_password}")
else:
    print("Admin user not found, creating...")
    admin_role = NhomQuyen.objects.get(ten_nhom='QUAN_TRI')
    admin = NguoiDung.objects.create(
        ten_dang_nhap='admin',
        email='admin@example.com',
        ho_ten='Administrator',
        ma_nhom_quyen=admin_role,
        dang_hoat_dong=True,
        da_xac_thuc_email=True
    )
    admin.mat_khau_hash = make_password('admin123')
    admin.save()
    print(f"✓ Admin user created")
    print(f"Username: admin")
    print(f"Password: admin123")

from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from parks.models import NguoiDung, NhomQuyen

class Command(BaseCommand):
    help = 'Setup admin account with password'

    def handle(self, *args, **options):
        admin_user = NguoiDung.objects.filter(ten_dang_nhap='admin').first()
        
        if admin_user:
            self.stdout.write(f'✓ Admin user exists: {admin_user.ten_dang_nhap}')
            self.stdout.write(f'  Email: {admin_user.email}')
            
            # Reset password to 'admin123'
            new_password = 'admin123'
            admin_user.mat_khau_hash = make_password(new_password)
            admin_user.save()
            self.stdout.write(f'✓ Password updated')
        else:
            self.stdout.write('Creating admin user...')
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
            self.stdout.write('✓ Admin user created')
        
        self.stdout.write(self.style.SUCCESS('\n✓ Login Credentials:'))
        self.stdout.write(f'  Username: admin')
        self.stdout.write(f'  Password: admin123')

"""
Management command to test the tim_cong_vien_gan_nhat function
Usage: python manage.py test_find_parks
"""

from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from parks.models import CongVien, NguoiDung, DanhGia
from parks.utils import tim_cong_vien_gan_nhat


class Command(BaseCommand):
    help = 'Test GIS functions and create sample data'

    def add_arguments(self, parser):
        parser.add_argument('--create-sample', action='store_true', help='Create sample parks and data')
        parser.add_argument('--test-search', action='store_true', help='Test park search function')

    def handle(self, *args, **options):
        if options['create_sample']:
            self.create_sample_data()
        elif options['test_search']:
            self.test_search()
        else:
            self.stdout.write('Use --create-sample or --test-search')

    def create_sample_data(self):
        """Create sample parks for testing"""
        self.stdout.write('Creating sample parks...')

        # Sample parks (Hanoi area)
        parks_data = [
            {
                'ten': 'Công viên Tây Hồ',
                'mo_ta': 'Công viên lớn gần hồ Tây',
                'dia_diem': Point(105.8542, 21.0285),  # (kinh_do, vi_do)
                'dien_tich': 3.5,
                'trang_thai': True,
            },
            {
                'ten': 'Công viên Thủ Lệ',
                'mo_ta': 'Công viên cộng hòa, khu trung tâm',
                'dia_diem': Point(105.8047, 21.0285),
                'dien_tich': 2.1,
                'trang_thai': True,
            },
            {
                'ten': 'Công viên Các hàng',
                'mo_ta': 'Công viên nhỏ, khu phố cổ',
                'dia_diem': Point(105.8585, 21.0344),
                'dien_tich': 0.8,
                'trang_thai': True,
            }
        ]

        for park_data in parks_data:
            park, created = CongVien.objects.get_or_create(
                ten=park_data['ten'],
                defaults=park_data
            )
            if created:
                self.stdout.write(f'✓ Created: {park.ten}')
            else:
                self.stdout.write(f'- Exists: {park.ten}')

        # Create sample user
        user, created = NguoiDung.objects.get_or_create(
            email='user@example.com',
            defaults={
                'ten': 'Nguyễn Văn A',
                'so_dien_thoai': '0912345678',
                'trang_thai': True,
            }
        )

        if created:
            self.stdout.write(f'✓ Created user: {user.ten}')
        else:
            self.stdout.write(f'- User exists: {user.ten}')

        # Add some sample ratings
        for park in CongVien.objects.all()[:1]:
            for rating in [3, 4, 5, 5]:
                DanhGia.objects.get_or_create(
                    cong_vien=park,
                    nguoi_dung=user,
                    defaults={
                        'diem': rating,
                        'nhan_xet': f'Sample {rating}-star rating',
                        'duyet_cap': True,
                    }
                )
            self.stdout.write(f'✓ Added ratings for: {park.ten}')

    def test_search(self):
        """Test the park search function"""
        self.stdout.write('\nTesting tim_cong_vien_gan_nhat()...')
        
        # Search parameters (Center of Hanoi)
        vi_do = 21.0328
        kinh_do = 105.8542
        ban_kinh_km = 5
        
        self.stdout.write(f'Search: Latitude={vi_do}, Longitude={kinh_do}, Radius={ban_kinh_km}km')
        
        parks = tim_cong_vien_gan_nhat(vi_do, kinh_do, ban_kinh_km)
        
        if parks:
            self.stdout.write(f'\n✓ Found {len(parks)} parks:\n')
            for i, park in enumerate(parks, 1):
                self.stdout.write(
                    f"{i}. {park['ten']}\n"
                    f"   Rating: {park['diem_danh_gia']:.1f}★ ({park['tong_danh_gia']} reviews)\n"
                    f"   Distance: {park['khoang_cach_km']:.2f}km\n"
                )
        else:
            self.stdout.write('✗ No parks found in search radius')

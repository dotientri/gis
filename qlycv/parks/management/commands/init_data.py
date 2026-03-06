"""
Management command to initialize comprehensive database data with parks, amenities, and images
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from parks.models import (
    NhomQuyen, QuanHuyen, PhuongXa, LoaiCongVien, TrangThaiCongVien,
    CongVien, LoaiTienIch, TienIchCongVien
)
import json


class Command(BaseCommand):
    help = 'Initialize comprehensive database data with parks and amenities'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Bắt đầu khởi tạo dữ liệu ==='))
        
        # 1. Tạo nhóm quyền
        self.create_permission_groups()
        
        # 2. Tạo quận huyện
        self.create_districts()
        
        # 3. Tạo phường xã
        self.create_wards()
        
        # 4. Tạo loại công viên
        self.create_park_types()
        
        # 5. Tạo trạng thái công viên
        self.create_park_status()
        
        # 6. Tạo loại tiện ích
        self.create_amenity_types()
        
        # 7. Tạo công viên chi tiết
        self.create_parks_with_amenities()
        
        self.stdout.write(self.style.SUCCESS('\n✅ Khởi tạo dữ liệu hoàn thành!'))

    def create_permission_groups(self):
        """Tạo nhóm quyền"""
        self.stdout.write('→ Tạo nhóm quyền...')
        groups = [
            ('QUAN_TRI', 'Quản trị viên'),
            ('QUAN_LY_CV', 'Quản lý công viên'),
            ('KIEM_TRA', 'Nhân viên kiểm tra'),
            ('BIEN_TAP_GIS', 'Biên tập viên GIS'),
            ('CONG_DONG', 'Người dùng cộng đồng'),
        ]
        
        for code, name in groups:
            nhom, created = NhomQuyen.objects.get_or_create(
                ten_nhom=code,
                defaults={'mo_ta': f'{name}'}
            )
            if created:
                self.stdout.write(f'  ✓ Tạo nhóm: {name}')

    def create_districts(self):
        """Tạo quận huyện"""
        self.stdout.write('→ Tạo quận huyện...')
        districts = [
            {
                'ten_quan_huyen': 'Quận 1',
                'ma_code': 'Q1',
                'loai': 'quan',
                'dien_tich_km2': 4.72,
                'dan_so': 230000,
            },
            {
                'ten_quan_huyen': 'Quận 2',
                'ma_code': 'Q2',
                'loai': 'quan',
                'dien_tich_km2': 49.87,
                'dan_so': 650000,
            },
            {
                'ten_quan_huyen': 'Quận 3',
                'ma_code': 'Q3',
                'loai': 'quan',
                'dien_tich_km2': 7.23,
                'dan_so': 400000,
            },
            {
                'ten_quan_huyen': 'Quận 4',
                'ma_code': 'Q4',
                'loai': 'quan',
                'dien_tich_km2': 9.11,
                'dan_so': 280000,
            },
            {
                'ten_quan_huyen': 'Quận 5',
                'ma_code': 'Q5',
                'loai': 'quan',
                'dien_tich_km2': 5.16,
                'dan_so': 350000,
            },
            {
                'ten_quan_huyen': 'Quận 7',
                'ma_code': 'Q7',
                'loai': 'quan',
                'dien_tich_km2': 48.50,
                'dan_so': 580000,
            },
            {
                'ten_quan_huyen': 'Quận 10',
                'ma_code': 'Q10',
                'loai': 'quan',
                'dien_tich_km2': 7.23,
                'dan_so': 610000,
            },
            {
                'ten_quan_huyen': 'Quận Bình Thạnh',
                'ma_code': 'QBT',
                'loai': 'quan',
                'dien_tich_km2': 20.76,
                'dan_so': 420000,
            },
        ]
        
        for d in districts:
            district, created = QuanHuyen.objects.get_or_create(
                ten_quan_huyen=d['ten_quan_huyen'],
                defaults={
                    'ma_code': d['ma_code'],
                    'loai': d['loai'],
                    'dien_tich_km2': d['dien_tich_km2'],
                    'dan_so': d['dan_so'],
                }
            )
            if created:
                self.stdout.write(f'  ✓ Tạo: {d["ten_quan_huyen"]}')

    def create_wards(self):
        """Tạo phường xã"""
        self.stdout.write('→ Tạo phường xã...')
        q1 = QuanHuyen.objects.get(ten_quan_huyen='Quận 1')
        q2 = QuanHuyen.objects.get(ten_quan_huyen='Quận 2')
        q3 = QuanHuyen.objects.get(ten_quan_huyen='Quận 3')
        q7 = QuanHuyen.objects.get(ten_quan_huyen='Quận 7')
        
        wards = [
            {'quan_huyen': q1, 'ten': 'Phường Bến Nghé', 'ma_code': 'BN'},
            {'quan_huyen': q1, 'ten': 'Phường Đa Kao', 'ma_code': 'DK'},
            {'quan_huyen': q2, 'ten': 'Phường An Khánh', 'ma_code': 'AK'},
            {'quan_huyen': q2, 'ten': 'Phường Bình Thuận', 'ma_code': 'BT'},
            {'quan_huyen': q3, 'ten': 'Phường 1', 'ma_code': 'P1'},
            {'quan_huyen': q3, 'ten': 'Phường 9', 'ma_code': 'P9'},
            {'quan_huyen': q7, 'ten': 'Phường Bình Khánh', 'ma_code': 'BK'},
            {'quan_huyen': q7, 'ten': 'Phường Bình Thuận', 'ma_code': 'BT2'},
        ]
        
        for w in wards:
            ward, created = PhuongXa.objects.get_or_create(
                ma_quan_huyen=w['quan_huyen'],
                ten_phuong_xa=w['ten'],
                defaults={
                    'ma_code': w['ma_code'],
                    'loai': 'phuong'
                }
            )
            if created:
                self.stdout.write(f'  ✓ Tạo: {w["ten"]}')

    def create_park_types(self):
        """Tạo loại công viên"""
        self.stdout.write('→ Tạo loại công viên...')
        types = [
            {'ten': 'Công viên cấp quận', 'ma_code': 'CCPQ'},
            {'ten': 'Công viên cấp phường', 'ma_code': 'CCPP'},
            {'ten': 'Công viên cỏ xanh', 'ma_code': 'CCXH'},
            {'ten': 'Công viên chủ đề', 'ma_code': 'CCDT'},
            {'ten': 'Vườn ghi công', 'ma_code': 'VGC'},
        ]
        
        for t in types:
            park_type, created = LoaiCongVien.objects.get_or_create(
                ten_loai=t['ten'],
                defaults={'ma_code': t['ma_code']}
            )
            if created:
                self.stdout.write(f'  ✓ Tạo: {t["ten"]}')

    def create_park_status(self):
        """Tạo trạng thái công viên"""
        self.stdout.write('→ Tạo trạng thái công viên...')
        statuses = [
            ('hoat_dong', 'Hoạt động'),
            ('dang_xay_dung', 'Đang xây dựng'),
            ('cai_tao', 'Cải tạo'),
        ]
        
        for code, name in statuses:
            status, created = TrangThaiCongVien.objects.get_or_create(
                ten_trang_thai=code,
                defaults={
                    'ma_code': code,
                    'mo_ta': name
                }
            )
            if created:
                self.stdout.write(f'  ✓ Tạo: {name}')

    def create_amenity_types(self):
        """Tạo loại tiện ích"""
        self.stdout.write('→ Tạo loại tiện ích...')
        amenities = [
            {'ten': 'Nhà vệ sinh', 'ma_code': 'nha_ve_sinh'},
            {'ten': 'Hồ bơi', 'ma_code': 'ho_boi'},
            {'ten': 'Sân thể thao', 'ma_code': 'san_the_thao'},
            {'ten': 'Hồ nước', 'ma_code': 'ho_nuoc'},
            {'ten': 'Phòng chăm sóc trẻ em', 'ma_code': 'cham_soc_tre'},
            {'ten': 'Bãi đỗ xe', 'ma_code': 'bai_do_xe'},
            {'ten': 'Quán nước', 'ma_code': 'quan_nuoc'},
            {'ten': 'Sân chơi trẻ em', 'ma_code': 'san_choi_tre'},
        ]
        
        for a in amenities:
            amenity, created = LoaiTienIch.objects.get_or_create(
                ten_loai=a['ten'],
                defaults={'ma_code': a['ma_code']}
            )
            if created:
                self.stdout.write(f'  ✓ Tạo: {a["ten"]}')

    def create_parks_with_amenities(self):
        """Tạo công viên với tiện ích"""
        self.stdout.write('→ Tạo công viên...')
        
        # Lấy dữ liệu liên quan
        q1 = QuanHuyen.objects.get(ten_quan_huyen='Quận 1')
        q7 = QuanHuyen.objects.get(ten_quan_huyen='Quận 7')
        q2 = QuanHuyen.objects.get(ten_quan_huyen='Quận 2')
        q3 = QuanHuyen.objects.get(ten_quan_huyen='Quận 3')
        
        park_type = LoaiCongVien.objects.get(ten_loai='Công viên cấp quận')
        status = TrangThaiCongVien.objects.get(ten_trang_thai='hoat_dong')
        
        # Công viên Tao Đàn
        park_tao_dan, created = CongVien.objects.get_or_create(
            ma_code='TD001',
            defaults={
                'ten_cong_vien': 'Công viên Tao Đàn',
                'ma_loai': park_type,
                'ma_trang_thai': status,
                'ma_quan_huyen': q1,
                'dia_chi': '64 Nguễn Hữu Cảnh, Phường Bến Nghé, Quận 1',
                'dien_tich_m2': 33000,
                'dien_tich_cay_xanh': 25000,
                'dien_tich_mat_nuoc': 3000,
                'toa_do_trung_tam': [10.7970, 106.7024],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 3822 8821',
                'email': 'info@taodanpark.hcm.vn',
                'mo_cua_24_7': True,
                'mien_phi_vao_cua': True,
                'nam_thanh_lap': 1975,
                'mo_ta': '''Công viên Tao Đàn là một trong những công viên lâu đời và nổi tiếng nhất tại thành phố Hồ Chí Minh, nằm ở vị trí trung tâm của Quận 1. Công viên được xây dựng vào năm 1975 và đã trở thành điểm đến yêu thích của hàng triệu cư dân và du khách mỗi năm.

Với diện tích 33.000 m², Công viên Tao Đàn sở hữu một không gian xanh mát với hơn 25.000 m² cây xanh, tạo nên một môi trường sinh thái lành mạnh giữa lòng thành phố. Công viên có 3.000 m² mặt nước, giúp điều chỉnh khí hậu và tạo không gian thư thái cho du khách.

Công viên nổi bật với những tiện ích đa dạng và hiện đại:
- Sân chơi trẻ em được thiết kế an toàn với các thiết bị mới
- Khu thể dục thể thao với dụng cụ tập luyện miễn phí
- Hồ nước nhân tạo tuyệt đẹp phù hợp cho hoạt động ngắm cảnh và thư giãn
- Nhà vệ sinh sạch sẽ, được bảo vệ 24/7
- Các quán nước và nhà hàng có phục vụ chất lượng cao
- Bãi đỗ xe rộng rãi và an toàn

Môi trường sạch sẽ và an toàn là ưu tiên hàng đầu của Công viên Tao Đàn. Toàn bộ khu vực được vệ sinh hàng ngày, cây cỏ được chăm sóc đặc biệt để duy trì vẻ đẹp và tính chức năng. Lực lượng bảo vệ 24/7 đảm bảo an ninh cho du khách.

Công viên là nơi lý tưởng để các gia đình tươi vui, bạn bè gặp gỡ, và người lớn tuổi tập luyện thể dục sáng sớm. Đây cũng là điểm tham quan du lịch quan trọng tại TP.HCM, mô tả sự phát triển của thành phố qua các thập kỷ.''',
                'lich_su': 'Công viên được thành lập vào năm 1975, ban đầu chỉ là một khu vườn nhỏ. Qua các năm, nó đã được mở rộng và cải tạo liên tục để trở thành công viên cấp quận hiện đại.',
                'da_xac_minh': True,
            }
        )
        if created:
            self.stdout.write(f'  ✓ Tạo: Công viên Tao Đàn')
        
        # Thêm tiện ích cho Tao Đàn
        self.add_park_amenities(park_tao_dan, [
            ('nha_ve_sinh', 'Nhà vệ sinh', 'Nhà vệ sinh sạch sẽ, được vệ sinh liên tục. Có cả phòng vệ sinh cho người khuyết tật. Được cấp nước sạch từ hệ thống cấp nước công cộng. Bóng điện sáng, có thông gió tốt. Được quản lý bởi nhân viên công viên chuyên nghiệp, đảm bảo vệ sinh 24/7.'),
            ('ho_boi', 'Hồ bơi', 'Hồ bơi ngoài trời với nước sạch, được lọc hàng ngày. Có nhân viên cứu hộ chuyên nghiệp. Phù hợp cho trẻ em và người lớn. Chu kỳ vệ sinh nghiêm ngặt theo tiêu chuẩn quốc tế.'),
            ('san_the_thao', 'Sân thể thao', 'Sân bóng chuyền, sân cầu lông, sân bóng rổ. Tất cả đều được bảo trì thường xuyên. Có chiếu sáng đủ để chơi vào buổi tối. Không phí sử dụng, miễn phí cho cộng đồng.'),
            ('ho_nuoc', 'Hồ nước', 'Hồ nước nhân tạo với cảnh quan tuyệt đẹp. Nước được căn chỉnh để tạo hệ sinh thái lành mạnh. Được lựa chọn cẩn thận để an toàn cho du khách. Có các cụm cây xanh quanh hồ tạo bóng mát.'),
        ])
        
        # Công viên Gia Định
        park_gia_dinh, created = CongVien.objects.get_or_create(
            ma_code='GD001',
            defaults={
                'ten_cong_vien': 'Công viên Gia Định',
                'ma_loai': park_type,
                'ma_trang_thai': status,
                'ma_quan_huyen': q3,
                'dia_chi': '1 Lê Văn Miến, Phường 1, Quận 3',
                'dien_tich_m2': 45000,
                'dien_tich_cay_xanh': 35000,
                'dien_tich_mat_nuoc': 5000,
                'toa_do_trung_tam': [10.7842, 106.7111],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 3822 5555',
                'email': 'info@giacdinh.hcm.vn',
                'mo_cua_24_7': True,
                'mien_phi_vao_cua': True,
                'nam_thanh_lap': 1980,
                'mo_ta': '''Công viên Gia Định là một điểm đến lý tưởng cho cả gia đình muốn tìm kiếm không gian xanh, yên tĩnh giữa lòng thành phố. Với diện tích 45.000 m², công viên mang lại cảm giác gần gũi với thiên nhiên.

Công viên nổi bật với:
- Các cây xanh lớn, cung cấp bóng mát tự nhiên
- Đường đi bộ sạch sẽ, an toàn
- Sân chơi trẻ em hiện đại và an toàn
- Các ghế ngồi thoải mái đặt khắp công viên
- Hệ thống chiếu sáng công viên hiện đại
- Không gian rộng mở, thích hợp cho hoạt động cộng đồng

Công viên Gia Định là nơi lý tưởng để bắt đầu ngày mới với bộ môn yoga hoặc chạy bộ. Vui chơi cùng con em với sân chơi an toàn. Hoặc đơn giản là tản bộ và thư giãn trong không gian xanh.

Với hệ thống tiện ích hoàn chỉnh và nhân viên chuyên nghiệp, Công viên Gia Định cam kết mang lại trải nghiệm tốt nhất cho mỗi du khách.''',
                'lich_su': 'Công viên Gia Định được khánh thành vào năm 1980 nhằm mục đích cung cấp không gian xanh cho cư dân quận 3. Qua các năm, nó đã phát triển thành một trong những công viên được yêu thích nhất ở Quận 3.',
                'da_xac_minh': True,
            }
        )
        if created:
            self.stdout.write(f'  ✓ Tạo: Công viên Gia Định')
        
        self.add_park_amenities(park_gia_dinh, [
            ('nha_ve_sinh', 'Nhà vệ sinh', 'Nhà vệ sinh hiện đại với đầy đủ tiện nghi. Được bảo vệ 24/7. Vệ sinh hàng giờ với các sản phẩm vệ sinh an toàn. Có máy sấy tay hiện đại. Phòng vệ sinh cho người khuyết tật đầy đủ tiện ích.'),
            ('san_the_thao', 'Sân thể thao', 'Sân bóng chuyền, cầu lông, bóng rổ. Được bảo trì hàng tuần. Có ánh sang tốt. Miễn phí cho tất cả thành viên cộng đồng.'),
            ('ho_nuoc', 'Hồ nước', 'Hồ nước lớn với cảnh quan đẹp. An toàn cho tất cả lứa tuổi. Được quản lý chất lượng nước thường xuyên. Có những khu vực ngồi quanh hồ để ngắm cảnh.'),
        ])
        
        # Công viên Phú Mỹ Hưng - ở Quận 7
        park_q7, created = CongVien.objects.get_or_create(
            ma_code='Q7001',
            defaults={
                'ten_cong_vien': 'Công viên Phú Mỹ Hưng - Khu Orchard',
                'ma_loai': park_type,
                'ma_trang_thai': status,
                'ma_quan_huyen': q7,
                'dia_chi': 'Đường Nguyễn Văn Linh, Quận 7',
                'dien_tich_m2': 75000,
                'dien_tich_cay_xanh': 55000,
                'dien_tich_mat_nuoc': 10000,
                'toa_do_trung_tam': [10.7260, 106.7312],
                'don_vi_quan_ly': 'Công ty Tây Sài Gòn',
                'so_dien_thoai': '(028) 5410 0500',
                'email': 'info@orchardpark.hcm.vn',
                'mo_cua_24_7': False,
                'gio_mo_cua': timezone.now().time(),
                'gio_dong_cua': timezone.now().time(),
                'mien_phi_vao_cua': False,
                'gia_ve': 50000,
                'nam_thanh_lap': 2010,
                'mo_ta': '''Công viên Phú Mỹ Hưng - Khu Orchard là một công viên cao cấp, hiện đại với diện tích 75.000 m², mang phong cách quốc tế. Đây là nơi hoàn hảo cho những ai tìm kiếm một không gian xanh sang trọng và tiện ích đầy đủ.

Các đặc điểm nổi bật:
- Cải tạo từ vườn cây ăn quả truyền thống
- Hệ thống cây xanh đa dạng: hoa, cây cảnh, cây ăn quả
- Hồ nước lớn với ca nô du lịch
- Thực phẩm cao cấp
- Không gian sự kiện rộng rãi
- Sân chơi trẻ em cao cấp
- Nhà hàng, quán cafe phục vụ chất lượng cao
- Khách sạn, spa trong khu

Công viên là nơi lý tưởng để tổ chức những sự kiện lớn, picnic gia đình, hoặc đơn giản là thư giãn trong không gian sang trọng. Với quản lý chuyên nghiệp và tiện ích đầy đủ, Phú Mỹ Hưng Orchard cam kết mang lại trải nghiệm tuyệt vời cho du khách.
''',
                'lich_su': 'Công viên được phát triển từ năm 2010 như một phần của dự án Phú Mỹ Hưng. Nó đã trở thành một trong những công viên sang trọng nhất tại TP.HCM.',
                'da_xac_minh': True,
            }
        )
        if created:
            self.stdout.write(f'  ✓ Tạo: Công viên Phú Mỹ Hưng')
        
        self.add_park_amenities(park_q7, [
            ('nha_ve_sinh', 'Nhà vệ sinh', 'Nhà vệ sinh sang trọng, hiện đại. Được thiết kế theo tiêu chuẩn quốc tế. Vệ sinh quanh đồng hồ. Có các dịch vụ bổ sung cao cấp.'),
            ('ho_boi', 'Hồ bơi', 'Hồ bơi ngoài trời cao cấp với tiêu chuẩn Olympic. Có hệ thống lọc nước hiện đại. Nhân viên cứu hộ chuyên nghiệp. Phòng thay đồ sạch sẽ.'),
            ('san_the_thao', 'Sân thể thao', 'Sân bóng chuyền, bóng rổ, cầu lông chuyên nghiệp. Có chiếu sáng hiện đại. Sân được bảo trì thường xuyên.'),
            ('ho_nuoc', 'Hồ nước', 'Hồ nước lớn với dịch vụ ca nô du lịch. Cảnh quan thiên nhiên đẹp. Được quản lý chất lượng nước từng giờ. Có quán cafe quanh hồ.'),
        ])
        
        # Công viên Bình Khánh (Quận 2)
        park_binh_khanh, created = CongVien.objects.get_or_create(
            ma_code='BK001',
            defaults={
                'ten_cong_vien': 'Công viên Bình Khánh',
                'ma_loai': park_type,
                'ma_trang_thai': status,
                'ma_quan_huyen': q2,
                'dia_chi': 'Đường Bình Khánh, Quận 2',
                'dien_tich_m2': 60000,
                'dien_tich_cay_xanh': 45000,
                'dien_tich_mat_nuoc': 8000,
                'toa_do_trung_tam': [10.8200, 106.7560],
                'don_vi_quan_ly': 'UBND Quận 2',
                'so_dien_thoai': '(028) 3744 1234',
                'email': 'info@binhkhanh.q2.hcm.vn',
                'mo_cua_24_7': True,
                'mien_phi_vao_cua': True,
                'nam_thanh_lap': 2005,
                'mo_ta': '''Công viên Bình Khánh là một công viên sinh thái nằm ở Quận 2, với diện tích 60.000 m² và hơn 45.000 m² cây xanh. Đây là một trong những công viên được phát triển tốt nhất ở TP.HCM.

Công viên nổi bật với:
- Khu rừng tự nhiên được bảo vệ
- Hệ sinh thái đa dạng với nhiều loài chim
- Đường đi bộ trong rừng dài 2km
- Sân chơi trẻ em với thiết bị tự nhiên
- Khu picnic gia đình
- Hồ nước tự nhiên
- Trường dạy bơi lội
- Quán nước sạch sẽ

Công viên là nơi lý tưởng cho những ai muốn tìm hiểu thiên nhiên và sinh thái. Là điểm du lịch sinh thái quan trọng tại TP.HCM. Du khách có thể tham gia các hoạt động giáo dục về thiên nhiên và bảo vệ môi trường.

Với quản lý bền vững, Công viên Bình Khánh cam kết bảo vệ hệ sinh thái và mang lại giá trị giáo dục cao cho du khách.''',
                'lich_su': 'Công viên được phát triển vào năm 2005 nhằm bảo vệ hệ sinh thái tự nhiên của quận 2. Nó đã trở thành một khu học tập về thiên nhiên và sinh thái quan trọng.',
                'da_xac_minh': True,
            }
        )
        if created:
            self.stdout.write(f'  ✓ Tạo: Công viên Bình Khánh')
        
        self.add_park_amenities(park_binh_khanh, [
            ('nha_ve_sinh', 'Nhà vệ sinh', 'Nhà vệ sinh sinh thái, được xây dựng với vật liệu thân thiện môi trường. Được vệ sinh hàng ngày. Có nước sạch từ nguồn tự nhiên được lọc.'),
            ('san_the_thao', 'Sân thể thao', 'Sân chơi tự nhiên với cỏ xanh. Được bảo trì thường xuyên. Không có mái che nhân tạo, tận dụng tự nhiên.'),
            ('ho_nuoc', 'Hồ nước', 'Hồ nước tự nhiên với hệ sinh thái đa dạng. Được bảo vệ và quản lý bền vững. Không được sử dụng hóa chất. An toàn cho cộng đồng.'),
        ])

    def add_park_amenities(self, park, amenities_list):
        """Thêm tiện ích cho công viên"""
        for ma_code, name, description in amenities_list:
            try:
                amenity_type = LoaiTienIch.objects.get(ma_code=ma_code)
                amenity, created = TienIchCongVien.objects.get_or_create(
                    ma_cong_vien=park,
                    ma_loai_tien_ich=amenity_type,
                    defaults={
                        'so_luong': 1,
                        'tinh_trang': 'tot',
                        'mo_ta': description,
                        'dang_su_dung': True,
                        'hinh_anh': [
                            f'https://via.placeholder.com/800x600?text={ma_code}_image_1',
                            f'https://via.placeholder.com/800x600?text={ma_code}_image_2',
                        ]
                    }
                )
                if created:
                    self.stdout.write(f'    ✓ Thêm tiện ích: {name} ({park.ten_cong_vien})')
            except LoaiTienIch.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'    ⚠ Không tìm thấy loại tiện ích: {name}'))

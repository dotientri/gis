from django.core.management.base import BaseCommand
from parks.models import (
    NhomQuyen, NguoiDung, LoaiCongVien, TrangThaiCongVien, CongVien, 
    LoaiTienIch, TienIchCongVien, DanhMucSuCo, QuanHuyen, PhuongXa,
    LoaiCay, CayXanh, HinhAnhCongVien
)
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Create comprehensive sample data with parks, amenities, and full descriptions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🟢 Bắt đầu tạo dữ liệu mẫu...'))

        # Create roles
        admin_role, _ = NhomQuyen.objects.get_or_create(ten_nhom='QUAN_TRI')
        user_role, _ = NhomQuyen.objects.get_or_create(ten_nhom='CONG_DONG')

        # Create users
        admin, _ = NguoiDung.objects.get_or_create(
            ten_dang_nhap='admin',
            defaults={
                'ma_nhom_quyen': admin_role,
                'email': 'admin@example.com',
                'ho_ten': 'Quản trị viên hệ thống',
                'dang_hoat_dong': True,
                'da_xac_thuc_email': True,
            }
        )
        admin.mat_khau_hash = 'pbkdf2_sha256$260000$test'
        admin.save()

        user, _ = NguoiDung.objects.get_or_create(
            ten_dang_nhap='user',
            defaults={
                'ma_nhom_quyen': user_role,
                'email': 'user@example.com',
                'ho_ten': 'Người dùng thử',
                'dang_hoat_dong': True,
                'da_xac_thuc_email': True,
            }
        )
        user.mat_khau_hash = 'pbkdf2_sha256$260000$test'
        user.save()

        # Lấy hoặc tạo Quận/Huyện mẫu
        quan_1, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 1',
            defaults={'ma_code': 'Q1', 'loai': 'quan'}
        )
        quan_2, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 2',
            defaults={'ma_code': 'Q2', 'loai': 'quan'}
        )
        quan_3, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 3',
            defaults={'ma_code': 'Q3', 'loai': 'quan'}
        )
        quan_4, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 4',
            defaults={'ma_code': 'Q4', 'loai': 'quan'}
        )
        quan_5, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 5',
            defaults={'ma_code': 'Q5', 'loai': 'quan'}
        )
        quan_6, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 6',
            defaults={'ma_code': 'Q6', 'loai': 'quan'}
        )
        quan_7, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 7',
            defaults={'ma_code': 'Q7', 'loai': 'quan'}
        )
        quan_9, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 9',
            defaults={'ma_code': 'Q9', 'loai': 'quan'}
        )
        quan_10, _ = QuanHuyen.objects.get_or_create(
            ten_quan_huyen='Quận 10',
            defaults={'ma_code': 'Q10', 'loai': 'quan'}
        )

        # Create park types
        park_types_data = [
            {'ten_loai': 'Công viên giải trí', 'ma_code': 'GIAI_TRI'},
            {'ten_loai': 'Công viên cộng đồng', 'ma_code': 'CONG_DONG'},
            {'ten_loai': 'Công viên sinh thái', 'ma_code': 'SINH_THAI'},
            {'ten_loai': 'Công viên thể thao', 'ma_code': 'THE_THAO'},
            {'ten_loai': 'Công viên lịch sử', 'ma_code': 'LICH_SU'},
        ]
        
        park_types = {}
        for pt_data in park_types_data:
            pt, _ = LoaiCongVien.objects.get_or_create(
                ten_loai=pt_data['ten_loai'],
                defaults={'ma_code': pt_data['ma_code']}
            )
            park_types[pt_data['ma_code']] = pt
            
        # Create park status
        park_status, _ = TrangThaiCongVien.objects.get_or_create(
            ten_trang_thai='Hoạt động',
            defaults={'ma_code': 'HOAT_DONG'}
        )

        # Comprehensive parks data with full descriptions and history
        parks_data = [
            {
                'ten_cong_vien': 'Công viên Thống Nhất',
                'mo_ta': 'Công viên Thống Nhất là một trong những công viên lớn nhất và nổi tiếng nhất ở trung tâm thành phố. Với diện tích rộng lớn, công viên mang đến không gian xanh mát cho cư dân và du khách.',
                'lich_su': 'Công viên Thống Nhất được thành lập vào năm 1975 với mục đích tạo không gian công cộng cho cộng đồng TP.HCM. Công viên được xây dựng lại và tu sửa vào năm 2010, nâng cao tiêu chuẩn quốc tế. Tên gọi \"Thống Nhất\" được đặt để tưởng nhớ sự thống nhất của đất nước. Qua những năm, công viên liên tục được cải tạo và phát triển, trở thành điểm đến yêu thích của hàng triệu du khách trong và ngoài nước. Công viên không chỉ cung cấp các tiện ích giải trí mà còn là nơi lý tưởng cho việc tập thể dục, sáng tạo và kết nối cộng đồng.',
                'dia_chi': 'Đường Nguyễn Du, Quận 1, TP.HCM',
                'dien_tich_m2': 120000,
                'dien_tich_cay_xanh': 45000,
                'dien_tich_mat_nuoc': 8000,
                'nam_thanh_lap': 1975,
                'toa_do_trung_tam': [10.7745, 106.7020],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 3821 1111',
                'gio_mo_cua': '06:00',
                'gio_dong_cua': '21:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['GIAI_TRI'],
                'ma_quan_huyen': quan_1,
                'nam_thanh_lap': 1975,
            },
            {
                'ten_cong_vien': 'Công viên Tao Đàn',
                'mo_ta': 'Công viên Tao Đàn là một công viên nhỏ gọn nhưng sở hữu vẻ đẹp riêng với những cây xanh lâu năm và các tiện ích hiện đại. Là nơi lý tưởng để thư giãn, đọc sách, hoặc tập các hoạt động thể dục nhẹ nhàng.',
                'lich_su': 'Công viên Tao Đàn được xây dựng từ năm 1960, với tên gọi gắn liền với truyền thuyết dân gian Việt Nam. Công viên từng là địa điểm quan trọng trong các sự kiện lịch sử của thành phố. Năm 1995, công viên được cải tạo toàn diện, bổ sung các tiện ích hiện đại như sân chơi trẻ em, sân tập thể thao, và quán cà phê ngoài trời. Đến nay, công viên Tao Đàn vẫn giữ lại vẻ cổ kính đặc biệt, kết hợp với những cây cổ thụ hàng chục năm tuổi. Nó là biểu tượng của sự bền bỉ và sự kết nối giữa quá khứ và hiện đại.',
                'dia_chi': 'Đường Nguyễn Thái Học, Quận 1, TP.HCM',
                'dien_tich_m2': 28000,
                'dien_tich_cay_xanh': 12000,
                'dien_tich_mat_nuoc': 1500,
                'nam_thanh_lap': 1960,
                'toa_do_trung_tam': [10.7769, 106.6983],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 3822 5555',
                'gio_mo_cua': '06:00',
                'gio_dong_cua': '22:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['CONG_DONG'],
                'ma_quan_huyen': quan_1,
            },
            {
                'ten_cong_vien': 'Công viên 23 Tháng 9',
                'mo_ta': 'Công viên 23 Tháng 9 là không gian xanh quan trọng ở Quận 1, được dành riêng cho các hoạt động cộng đồng, sự kiện văn hóa và giải trí. Công viên khá rộng với nhiều khu vực khác nhau phục vụ nhiều mục đích sử dụng.',
                'lich_su': 'Được thành lập năm 1975 để kỷ niệm ngày 23 tháng 9, công viên này từ đó trở thành nơi tổ chức các sự kiện lễ kỷ niệm quốc gia và các hoạt động cộng đồng lớn. Công viên được mở rộng và cải thiện vào năm 2000, bổ sung thêm các tiện ích giải trí và thể thao. Hiện nay, công viên là trung tâm hoạt động văn hóa và thể thao sôi động của Quận 1, tổ chức hàng loạt chương trình vui chơi và rèn luyện sức khỏe cho mọi tuổi.',
                'dia_chi': 'Đường Nguyễn Huệ, Quận 1, TP.HCM',
                'dien_tich_m2': 95000,
                'dien_tich_cay_xanh': 35000,
                'dien_tich_mat_nuoc': 5000,
                'nam_thanh_lap': 1975,
                'toa_do_trung_tam': [10.7750, 106.7030],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 3829 0444',
                'gio_mo_cua': '05:30',
                'gio_dong_cua': '22:30',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['THE_THAO'],
                'ma_quan_huyen': quan_1,
            },
            {
                'ten_cong_vien': 'Công viên Gia Định',
                'mo_ta': 'Công viên Gia Định nằm ở vị trí chiến lược của Quận 5, là không gian xanh với các tiện ích đa dạng phục vụ nhu cầu giải trí, tập luyện và tổ chức các sự kiện cộng đồng.',
                'lich_su': 'Công viên được xây dựng vào năm 1985 để phục vụ cộng dân Quận 5. Từng thời gian, công viên được nâng cấp với việc trồng thêm cây xanh và bổ sung tiện ích. Năm 2008, công viên được tu sửa lớn với việc xây dựng các sân chơi hiện đại, khu vui chơi trẻ em, và hệ thống chiếu sáng LED. Công viên Gia Định nổi tiếng với các buổi chiều gia đình và các không gian thích hợp cho các hoạt động ngoài trời.',
                'dia_chi': 'Đường Cách Mạng Tháng 8, Quận 5, TP.HCM',
                'dien_tich_m2': 85000,
                'dien_tich_cay_xanh': 32000,
                'dien_tich_mat_nuoc': 4000,
                'nam_thanh_lap': 1985,
                'toa_do_trung_tam': [10.7500, 106.6850],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 3833 7777',
                'gio_mo_cua': '06:00',
                'gio_dong_cua': '21:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['CONG_DONG'],
                'ma_quan_huyen': quan_5,
            },
            {
                'ten_cong_vien': 'Công viên Vạn Hạnh',
                'mo_ta': 'Công viên Vạn Hạnh là một trong những công viên hiện đại nhất ở TP.HCM, được thiết kế với tiêu chuẩn quốc tế. Công viên sở hữu các khu vực giải trí đa dạng, từ sân chơi trẻ em, sân quần vợt, đến các khu vực thể dục tài năng.',
                'lich_su': 'Được xây dựng hoàn chỉnh vào năm 2005 với mục tiêu tạo không gian sống xanh cho cư dân khu vực. Công viên Vạn Hạnh nhanh chóng trở thành địa điểm yêu thích của hàng trăm nghìn cư dân. Năm 2015, công viên tiếp tục được nâng cấp với các tiện ích thể thao hiện đại hơn. Hiện nay, công viên được coi là một trong những công viên tốt nhất ở TP.HCM với lượng khách tham quan liên tục.',
                'dia_chi': 'Đường Nguyễn Xí, Quận 6, TP.HCM',
                'dien_tich_m2': 105000,
                'dien_tich_cay_xanh': 40000,
                'dien_tich_mat_nuoc': 6000,
                'nam_thanh_lap': 2005,
                'toa_do_trung_tam': [10.7400, 106.6700],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 3844 5555',
                'gio_mo_cua': '05:00',
                'gio_dong_cua': '23:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['GIAI_TRI'],
                'ma_quan_huyen': quan_6,
            },
            {
                'ten_cong_vien': 'Công viên Sinh Thái Thị Nghè',
                'mo_ta': 'Công viên Sinh Thái Thị Nghè là không gian xanh đặc biệt được thiết kế để bảo vệ và phát triển hệ sinh thái các loài chim và động vật hoang dã. Đây là nơi lý tưởng để tìm hiểu về thiên nhiên và bảo vệ môi trường.',
                'lich_su': 'Khu vực này được phát triển thành công viên sinh thái vào năm 2010, nhằm bảo tồn đa dạng sinh học và các loài chim di cư. Dự án được thực hiện dưới sự hỗ trợ của các tổ chức quốc tế về bảo vệ môi trường. Công viên Sinh Thái Thị Nghè của từng đạt được các chứng chỉ quốc tế về quản lý môi trường. Hiện nay, công viên là điểm thu hút của các nhà khoa học, sinh viên, và những người yêu thích thiên nhiên trong toàn khu vực.',
                'dia_chi': 'Đường Võ Oanh, Quận 4, TP.HCM',
                'dien_tich_m2': 115000,
                'dien_tich_cay_xanh': 50000,
                'dien_tich_mat_nuoc': 20000,
                'nam_thanh_lap': 2010,
                'toa_do_trung_tam': [10.7200, 106.7300],
                'don_vi_quan_ly': 'Sở Tài nguyên và Môi trường',
                'so_dien_thoai': '(028) 3898 6666',
                'gio_mo_cua': '06:30',
                'gio_dong_cua': '18:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['SINH_THAI'],
                'ma_quan_huyen': quan_4,
            },
            {
                'ten_cong_vien': 'Công viên Lịch Sử Chiến Tranh Mỹ',
                'mo_ta': 'Công viên này kết hợp giữa các giá trị lịch sử và không gian xanh, mang đến cho du khách cơ hội tìm hiểu về những sự kiện lịch sử của TP.HCM. Công viên cung cấp không gian suy tư và học hỏi.',
                'lich_su': 'Được biến thành công viên lịch sử vào năm 2000, với mục đích bảo tồn kỷ niệm và giáo dục cộng đồng. Công viên được trang bị các bảng thông tin chi tiết, tượng điêu khắc, và các khu vực tĩnh tại. Năm 2015, công viên được sắp xếp lại để tìm hòa cân tốt hơn giữa lịch sử và không gian xanh hiện đại. Công viên Lịch Sử Chiến Tranh Mỹ là điểm đến quan trọng cho các tour du lịch lịch sử của TP.HCM.',
                'dia_chi': 'Đường Lý Tự Trọng, Quận 1, TP.HCM',
                'dien_tich_m2': 75000,
                'dien_tich_cay_xanh': 28000,
                'dien_tich_mat_nuoc': 2000,
                'nam_thanh_lap': 2000,
                'toa_do_trung_tam': [10.7800, 106.7050],
                'don_vi_quan_ly': 'Sở Văn hóa TP.HCM',
                'so_dien_thoai': '(028) 3825 8888',
                'gio_mo_cua': '08:00',
                'gio_dong_cua': '17:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['LICH_SU'],
                'ma_quan_huyen': quan_1,
            },
            {
                'ten_cong_vien': 'Công viên Thể Thao Trung Tâm',
                'mo_ta': 'Công viên Thể Thao Trung Tâm là địa điểm đMain cho các hoạt động thể thao chuyên nghiệp và cộng đồng, với các sân vận động hiện đại, sân quần vợt, sân cầu lông và các khu tập luyện.',
                'lich_su': 'Xây dựng vào năm 1988 để phục vụ các sự kiện thể thao quốc gia và quốc tế. Công viên đã tổ chức hàng loạt các giải đấu thể thao lớn bao gồm các cuộc thi quốc tế. Năm 2012, công viên được cải tạo lớn với các sân vận động có công suất lớn hơn. Hiện nay, công viên Thể Thao Trung Tâm là nơi tập trung các vận động viên chuyên nghiệp và điểm tập luyện yêu thích của cộng đồng.',
                'dia_chi': 'Đường Ký Con, Quận 3, TP.HCM',
                'dien_tich_m2': 130000,
                'dien_tich_cay_xanh': 35000,
                'dien_tich_mat_nuoc': 3000,
                'nam_thanh_lap': 1988,
                'toa_do_trung_tam': [10.7600, 106.6900],
                'don_vi_quan_ly': 'Sở Văn hóa Thể thao',
                'so_dien_thoai': '(028) 3932 1111',
                'gio_mo_cua': '05:30',
                'gio_dong_cua': '22:00',
                'mien_phi_vao_cua': False,
                'gia_ve': 50000,
                'ma_loai': park_types['THE_THAO'],
                'ma_quan_huyen': quan_3,
            },
            {
                'ten_cong_vien': 'Công viên Cộng Hòa',
                'mo_ta': 'Công viên Cộng Hòa là một khu vực xanh lớn ở khu dân cư yên tĩnh, phù hợp cho các hoạt động quân chúng và giải trí gia đình. Công viên có không gian yên bình và các tiện ích đầy đủ.',
                'lich_su': 'Được thành lập vào năm 1992 nhằm cung cấp không gian xanh cho cộng dân khu vực. Công viên từng được sử dụng cho các hoạt động cộng đồng lớn và các sự kiện lễ hội. Năm 2010, công viên được cải tạo toàn diện với việc xây dựng các tiện ích hiện đại. Công viên Cộng Hòa vẫn giữ vẻ yên tĩnh và là nơi lý tưởng cho các hoạt động gia đình.',
                'dia_chi': 'Đường Nguyễn Hữu Cảnh, Quận 2, TP.HCM',
                'dien_tich_m2': 98000,
                'dien_tich_cay_xanh': 38000,
                'dien_tich_mat_nuoc': 5500,
                'nam_thanh_lap': 1992,
                'toa_do_trung_tam': [10.8100, 106.7500],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 2222 5555',
                'gio_mo_cua': '06:00',
                'gio_dong_cua': '21:30',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['CONG_DONG'],
                'ma_quan_huyen': quan_2,
            },
            {
                'ten_cong_vien': 'Công viên Phú Mỹ Hưng',
                'mo_ta': 'Công viên Phú Mỹ Hưng là không gian xanh hiện đại được thiết kế theo tiêu chuẩn quốc tế. Công viên sở hữu các tiện ích giải trí đa dạng, từ công viên nước đến các sân chơi trẻ em, với cảnh quan đẹp mắt.',
                'lich_su': 'Xây dựng hoàn chỉnh vào năm 2003 như một phần của dự án phát triển đô thị Phú Mỹ Hưng. Công viên được thiết kế bởi các kiến trúc sư hàng đầu thế giới. Từ khi khai trương, công viên đã trở thành điểm đến nổi tiếng tại TP.HCM. Năm 2018, công viên tiếp tục được nâng cấp với các tiện ích thể thao hiện đại. Hiện nay, công viên Phú Mỹ Hưng là biểu tượng của sự phát triển hiện đại ở TP.HCM.',
                'dia_chi': 'Đường Thảo Điền, Quận 2, TP.HCM',
                'dien_tich_m2': 140000,
                'dien_tich_cay_xanh': 55000,
                'dien_tich_mat_nuoc': 12000,
                'nam_thanh_lap': 2003,
                'toa_do_trung_tam': [10.8050, 106.7650],
                'don_vi_quan_ly': 'Công ty Phú Mỹ Hưng',
                'so_dien_thoai': '(028) 7300 8000',
                'gio_mo_cua': '06:30',
                'gio_dong_cua': '22:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['GIAI_TRI'],
                'ma_quan_huyen': quan_2,
            },
            {
                'ten_cong_vien': 'Công viên Tây Hồ',
                'mo_ta': 'Công viên Tây Hồ nằm cạnh Hồ Tây, tạo nên một không gian xanh tuyệt đẹp với view hồ nước tự nhiên. Công viên là nơi lý tưởng cho những người yêu thích thiên nhiên và các hoạt động ngoài trời.',
                'lich_su': 'Được phát triển dọc theo bờ Hồ Tây từ năm 1998, công viên từng qua nhiều giai đoạn cải tạo. Năm 2008, công viên được sắp xếp lại để bảo vệ hệ sinh thái hồ nước. Công viên Tây Hồ nổi tiếng với các bãi cỏ bằng phẳng và cây xanh lâu năm. Năm 2016, công viên được bổ sung các tiện ích mới trong khi vẫn giữ lại vẻ tự nhiên. Hiện nay, công viên Tây Hồ là điểm đến yêu thích của du khách và cư dân địa phương.',
                'dia_chi': 'Đường Phạm Hùng, Quận 7, TP.HCM',
                'dien_tich_m2': 125000,
                'dien_tich_cay_xanh': 48000,
                'dien_tich_mat_nuoc': 18000,
                'nam_thanh_lap': 1998,
                'toa_do_trung_tam': [10.7350, 106.7100],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 5415 8888',
                'gio_mo_cua': '06:00',
                'gio_dong_cua': '21:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['SINH_THAI'],
                'ma_quan_huyen': quan_7,
            },
            {
                'ten_cong_vien': 'Công viên Suối Tiên',
                'mo_ta': 'Công viên Suối Tiên là một công viên giải trí lớn với nhiều trò chơi thú vị, sân khấu ngoài trời, và các khu vực dã ngoại. Công viên là điểm đến phổ biến cho các gia đình và nhóm bạn bè.',
                'lich_su': 'Được xây dựng vào năm 1995 như một khu vui chơi công_cộng, Suối Tiên nhanh chóng trở thành một trong những công viên lớn nhất TP.HCM. Công viên đã tổ chức hàng loạt sự kiện văn hóa và lễ hội. Năm 2012, công viên được cải tạo với các trò chơi hiện đại hơn. Hiện nay, công viên Suối Tiên vẫn là điểm đến lôi cuốn với hàng triệu lượt khách hàng năm.',
                'dia_chi': 'Đường Quốc Hương, Quận 9, TP.HCM',
                'dien_tich_m2': 135000,
                'dien_tich_cay_xanh': 42000,
                'dien_tich_mat_nuoc': 8500,
                'nam_thanh_lap': 1995,
                'toa_do_trung_tam': [10.8300, 106.7800],
                'don_vi_quan_ly': 'Công Ty Du Lịch Suối Tiên',
                'so_dien_thoai': '(028) 3898 9888',
                'gio_mo_cua': '08:00',
                'gio_dong_cua': '17:00',
                'mien_phi_vao_cua': False,
                'gia_ve': 80000,
                'ma_loai': park_types['GIAI_TRI'],
                'ma_quan_huyen': quan_9,
            },
            {
                'ten_cong_vien': 'Công viên Hưng Thạnh',
                'mo_ta': 'Công viên Hưng Thạnh là một không gian xanh chung cho cộng đồng cư dân, được trang bị các tiện ích thể dục thể thao, sân chơi trẻ em và khu vui chơi dành cho bố mẹ trẻ.',
                'lich_su': 'Công viên được thành lập vào năm 1997 để phục vụ cộng dân khu vực Hưng Thạnh. Từ đó, công viên trở thành trung tâm hoạt động cộng đồng. Năm 2011, công viên được cải tạo với các tiện ích hiện đại. Công viên Hưng Thạnh vẫn giữ vai trò quan trọng trong cuộc sống cộng đồng.',
                'dia_chi': 'Đường Tạ Uyên, Quận 10, TP.HCM',
                'dien_tich_m2': 65000,
                'dien_tich_cay_xanh': 25000,
                'dien_tich_mat_nuoc': 2500,
                'nam_thanh_lap': 1997,
                'toa_do_trung_tam': [10.7900, 106.6550],
                'don_vi_quan_ly': 'Sở Xây dựng TP.HCM',
                'so_dien_thoai': '(028) 3932 3333',
                'gio_mo_cua': '05:00',
                'gio_dong_cua': '21:00',
                'mien_phi_vao_cua': True,
                'ma_loai': park_types['CONG_DONG'],
                'ma_quan_huyen': quan_10,
            },
        ]

        # Create parks with full data
        for park_data in parks_data:
            park, created = CongVien.objects.get_or_create(
                ten_cong_vien=park_data['ten_cong_vien'],
                defaults=park_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Tạo công viên: {park.ten_cong_vien}'))
            else:
                # Update existing park with full data
                for key, value in park_data.items():
                    setattr(park, key, value)
                park.save()
                self.stdout.write(self.style.WARNING(f'➜ Cập nhật công viên: {park.ten_cong_vien}'))

        self.stdout.write(self.style.SUCCESS('✅ Tạo xong công viên'))

        # Create amenity types
        amenity_types_data = [
            {'ten_loai': 'Ghế ngồi', 'ma_code': 'GHE_NGOI', 'mo_ta': 'Các ghế ngồi dành cho du khách'},
            {'ten_loai': 'Xe đạp công cộng', 'ma_code': 'XE_DAP', 'mo_ta': 'Dịch vụ cho thuê xe đạp'},
            {'ten_loai': 'Sân cầu lông', 'ma_code': 'SAN_CAU_LONG', 'mo_ta': 'Sân chơi cầu lông'},
            {'ten_loai': 'Sân quần vợt', 'ma_code': 'SAN_QUAN_VOT', 'mo_ta': 'Sân chơi quần vợt'},
            {'ten_loai': 'Sân bóng đá', 'ma_code': 'SAN_BONG_DA', 'mo_ta': 'Sân chơi bóng đá nhân tạo'},
            {'ten_loai': 'Khu vui chơi trẻ em', 'ma_code': 'KHU_TRE_EM', 'mo_ta': 'Các thiết bị vui chơi dành cho trẻ em'},
            {'ten_loai': 'Quán cà phê', 'ma_code': 'QUAN_CA_PHE', 'mo_ta': 'Quán cà phê và đồ uống'},
            {'ten_loai': 'Nhà vệ sinh', 'ma_code': 'NHA_VE_SINH', 'mo_ta': 'Các nhà vệ sinh công cộng'},
            {'ten_loai': 'Khu thể dục', 'ma_code': 'KHU_THE_DUC', 'mo_ta': 'Các dụng cụ thể dục'},
            {'ten_loai': 'Sân khấu ngoài trời', 'ma_code': 'SAN_KHAU', 'mo_ta': 'Sân khấu cho các sự kiện'},
            {'ten_loai': 'Tủ locker', 'ma_code': 'TU_LOCKER', 'mo_ta': 'Tủ để đồ'},
            {'ten_loai': 'Bãi đỗ xe', 'ma_code': 'BAI_DO_XE', 'mo_ta': 'Bãi đỗ xe miễn phí'},
        ]
        
        amenity_types = {}
        for at_data in amenity_types_data:
            at, _ = LoaiTienIch.objects.get_or_create(ten_loai=at_data['ten_loai'], defaults=at_data)
            amenity_types[at_data['ma_code']] = at
            self.stdout.write(self.style.SUCCESS(f'✓ Loại tiện ích: {at.ten_loai}'))

        # Create amenities for each park
        self.stdout.write(self.style.SUCCESS('\n🟢 Tạo tiện ích cho công viên...'))
        for park in CongVien.objects.all():
            # Add multiple amenities to each park
            amenities_for_park = [
                ('GHE_NGOI', 50, 'tot'),
                ('NHA_VE_SINH', 8, 'tot'),
                ('KHU_THE_DUC', 15, 'tot'),
            ]
            
            # Add amenities based on park type
            if park.ma_loai.ma_code == 'THE_THAO':
                amenities_for_park.extend([
                    ('SAN_BONG_DA', 2, 'tot'),
                    ('SAN_QUAN_VOT', 3, 'tot'),
                    ('SAN_CAU_LONG', 4, 'kha'),
                ])
            elif park.ma_loai.ma_code == 'GIAI_TRI':
                amenities_for_park.extend([
                    ('KHU_TRE_EM', 2, 'tot'),
                    ('SAN_KHAU', 1, 'tot'),
                    ('QUAN_CA_PHE', 3, 'tot'),
                ])
            elif park.ma_loai.ma_code == 'SINH_THAI':
                amenities_for_park.extend([
                    ('XE_DAP', 30, 'tot'),
                    ('QUAN_CA_PHE', 2, 'tot'),
                ])
            
            amenities_for_park.extend([
                ('BAI_DO_XE', 100, 'tot'),
                ('TU_LOCKER', 20, 'tot'),
            ])
            
            for amenity_code, quantity, condition in amenities_for_park:
                amenity, created = TienIchCongVien.objects.get_or_create(
                    ma_cong_vien=park,
                    ma_loai_tien_ich=amenity_types[amenity_code],
                    defaults={
                        'so_luong': quantity,
                        'tinh_trang': condition,
                        'dang_su_dung': True,
                        'mo_ta': f'{amenity_types[amenity_code].ten_loai} gồm {quantity} chiếc, tình trạng {condition}',
                    }
                )

        # Create incident categories
        incident_categories = [
            {'ten_danh_muc': 'Rác thải', 'mo_ta': 'Rác thải không được thu dọn'},
            {'ten_danh_muc': 'Hư hỏng cơ sở', 'mo_ta': 'Cơ sở vật chất bị hư hỏng'},
            {'ten_danh_muc': 'Cây xanh', 'mo_ta': 'Vấn đề liên quan đến cây xanh'},
            {'ten_danh_muc': 'An toàn', 'mo_ta': 'Các vấn đề về an toàn công cộng'},
            {'ten_danh_muc': 'Thể thao', 'mo_ta': 'Vấn đề liên quan đến khu thể thao'},
            {'ten_danh_muc': 'Khác', 'mo_ta': 'Các loại sự cố khác'},
        ]

        for cat_data in incident_categories:
            cat, created = DanhMucSuCo.objects.get_or_create(
                ten_danh_muc=cat_data['ten_danh_muc'],
                defaults={'mo_ta': cat_data['mo_ta']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Danh mục sự cố: {cat.ten_danh_muc}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Tạo dữ liệu mẫu thành công!'))
        self.stdout.write('\n📌 Thông tin đăng nhập:')
        self.stdout.write(f'👤 Admin: admin')
        self.stdout.write(f'👤 User: user')
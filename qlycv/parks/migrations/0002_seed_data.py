from django.db import migrations
import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_initial_data(apps, schema_editor):
    NhomQuyen = apps.get_model('parks', 'NhomQuyen')
    NguoiDung = apps.get_model('parks', 'NguoiDung')
    LoaiTienIch = apps.get_model('parks', 'LoaiTienIch')
    QuanHuyen = apps.get_model('parks', 'QuanHuyen')
    LoaiCongVien = apps.get_model('parks', 'LoaiCongVien')
    TrangThaiCongVien = apps.get_model('parks', 'TrangThaiCongVien')

    groups = {
        'QUAN_TRI': 'Quản trị viên',
        'CONG_DONG': 'Người dùng cộng đồng'
    }
    
    db_groups = {}
    for code, name in groups.items():
        g, _ = NhomQuyen.objects.get_or_create(ten_nhom=code, defaults={'mo_ta': name})
        db_groups[code] = g

    NguoiDung.objects.update_or_create(
        ten_dang_nhap='admin',
        defaults={
            'email': 'admin@gispark.com',
            'mat_khau_hash': hash_password('admin123'),
            'ho_ten': 'Administrator',
            'ma_nhom_quyen': db_groups['QUAN_TRI'],
            'dang_hoat_dong': True,
            'da_xac_thuc_email': True,
            'token': 'admin-initial-token'
        }
    )

    NguoiDung.objects.update_or_create(
        ten_dang_nhap='user',
        defaults={
            'email': 'user@gispark.com',
            'mat_khau_hash': hash_password('user123'),
            'ho_ten': 'Nguyễn Văn A',
            'ma_nhom_quyen': db_groups['CONG_DONG'],
            'dang_hoat_dong': True,
            'da_xac_thuc_email': True,
            'token': 'user-initial-token'
        }
    )

    amenities = [
        {'ten': 'Nhà vệ sinh', 'code': 'nha_ve_sinh', 'icon': '/icons/toilet.png'},
        {'ten': 'Hồ bơi', 'code': 'ho_boi', 'icon': '/icons/pool.png'},
        {'ten': 'Sân thể thao', 'code': 'san_the_thao', 'icon': '/icons/sport.png'},
        {'ten': 'Bãi giữ xe', 'code': 'bai_giu_xe', 'icon': '/icons/parking.png'},
        {'ten': 'Khu vui chơi', 'code': 'khu_vui_choi', 'icon': '/icons/playground.png'},
        {'ten': 'Hồ nước', 'code': 'ho_nuoc', 'icon': '/icons/lake.png'},
    ]

    for item in amenities:
        LoaiTienIch.objects.get_or_create(
            ma_code=item['code'],
            defaults={'ten_loai': item['ten'], 'icon_url': item['icon']}
        )

    districts = [
        {'name': 'Quận 1', 'code': 'Q1', 'type': 'quan'},
        {'name': 'Quận 3', 'code': 'Q3', 'type': 'quan'},
        {'name': 'Quận 4', 'code': 'Q4', 'type': 'quan'},
        {'name': 'Quận 5', 'code': 'Q5', 'type': 'quan'},
        {'name': 'Quận 6', 'code': 'Q6', 'type': 'quan'},
        {'name': 'Quận 7', 'code': 'Q7', 'type': 'quan'},
        {'name': 'Quận 8', 'code': 'Q8', 'type': 'quan'},
        {'name': 'Quận 10', 'code': 'Q10', 'type': 'quan'},
        {'name': 'Quận 11', 'code': 'Q11', 'type': 'quan'},
        {'name': 'Quận 12', 'code': 'Q12', 'type': 'quan'},
        {'name': 'Quận Bình Tân', 'code': 'BINH_TAN', 'type': 'quan'},
        {'name': 'Quận Bình Thạnh', 'code': 'BINH_THANH', 'type': 'quan'},
        {'name': 'Quận Gò Vấp', 'code': 'GO_VAP', 'type': 'quan'},
        {'name': 'Quận Phú Nhuận', 'code': 'PHU_NHUAN', 'type': 'quan'},
        {'name': 'Quận Tân Bình', 'code': 'TAN_BINH', 'type': 'quan'},
        {'name': 'Quận Tân Phú', 'code': 'TAN_PHU', 'type': 'quan'},
        {'name': 'TP Thủ Đức', 'code': 'THU_DUC', 'type': 'tpthuduc'},
        {'name': 'Huyện Bình Chánh', 'code': 'BINH_CHANH', 'type': 'huyen'},
        {'name': 'Huyện Cần Giờ', 'code': 'CAN_GIO', 'type': 'huyen'},
        {'name': 'Huyện Củ Chi', 'code': 'CU_CHI', 'type': 'huyen'},
        {'name': 'Huyện Hóc Môn', 'code': 'HOC_MON', 'type': 'huyen'},
        {'name': 'Huyện Nhà Bè', 'code': 'NHA_BE', 'type': 'huyen'},
    ]
    
    for d in districts:
        QuanHuyen.objects.get_or_create(
            ma_code=d['code'],
            defaults={'ten_quan_huyen': d['name'], 'loai': d['type']}
        )

    park_types = [
        {'name': 'Công viên văn hóa', 'code': 'CV_VAN_HOA'},
        {'name': 'Công viên cây xanh', 'code': 'CV_CAY_XANH'},
        {'name': 'Công viên giải trí', 'code': 'CV_GIAI_TRI'},
        {'name': 'Công viên thể thao', 'code': 'CV_THE_THAO'},
        {'name': 'Công viên chuyên đề', 'code': 'CV_CHUYEN_DE'},
    ]

    for t in park_types:
        LoaiCongVien.objects.get_or_create(
            ma_code=t['code'],
            defaults={'ten_loai': t['name']}
        )

    statuses = [
        {'name': 'Quy hoạch', 'code': 'quy_hoach', 'color': '#3b82f6'},
        {'name': 'Đang xây dựng', 'code': 'dang_xay_dung', 'color': '#f59e0b'},
        {'name': 'Hoạt động', 'code': 'hoat_dong', 'color': '#22c55e'},
        {'name': 'Cải tạo', 'code': 'cai_tao', 'color': '#f59e0b'},
        {'name': 'Tạm đóng', 'code': 'tam_dong', 'color': '#ef4444'},
        {'name': 'Ngưng hoạt động', 'code': 'ngung_hoat_dong', 'color': '#6b7280'},
    ]

    db_statuses = {}
    for s in statuses:
        status, _ = TrangThaiCongVien.objects.get_or_create(
            ma_code=s['code'],
            defaults={'ten_trang_thai': s['code'], 'mau_sac': s['color'], 'mo_ta': s['name']}
        )
        db_statuses[s['code']] = status
    
    hoat_dong_status = db_statuses.get('hoat_dong')

def remove_initial_data(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('parks', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_data, remove_initial_data),
    ]
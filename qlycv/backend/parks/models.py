from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class QuanHuyen(models.Model):
    LOAI_CHOICES = [
        ('quan', 'Quận'),
        ('huyen', 'Huyện'),
        ('tpthuduc', 'TP Thủ Đức'),
    ]
    
    ma_quan_huyen = models.AutoField(primary_key=True)
    ten_quan_huyen = models.CharField(max_length=100, unique=True)
    ma_code = models.CharField(max_length=20, unique=True)
    loai = models.CharField(max_length=50, choices=LOAI_CHOICES, null=True, blank=True)
    dien_tich_km2 = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    dan_so = models.IntegerField(null=True, blank=True)
    hinh_hoc = models.JSONField(null=True, blank=True, default=dict)
    ngay_tao = models.DateTimeField(auto_now_add=True)
    ngay_cap_nhat = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quan_huyen'
        ordering = ['ten_quan_huyen']
    
    def __str__(self):
        return self.ten_quan_huyen


class PhuongXa(models.Model):
    LOAI_CHOICES = [
        ('phuong', 'Phường'),
        ('xa', 'Xã'),
        ('thi_tran', 'Thị trấn'),
    ]
    
    ma_phuong_xa = models.AutoField(primary_key=True)
    ma_quan_huyen = models.ForeignKey(QuanHuyen, on_delete=models.CASCADE, related_name='phuong_xa')
    ten_phuong_xa = models.CharField(max_length=100)
    ma_code = models.CharField(max_length=20, unique=True)
    loai = models.CharField(max_length=50, choices=LOAI_CHOICES, null=True, blank=True)
    dien_tich_km2 = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    hinh_hoc = models.JSONField(null=True, blank=True, default=dict)
    
    class Meta:
        db_table = 'phuong_xa'
        ordering = ['ma_quan_huyen', 'ten_phuong_xa']
        unique_together = ['ma_quan_huyen', 'ten_phuong_xa']
    
    def __str__(self):
        return f"{self.ten_phuong_xa}, {self.ma_quan_huyen.ten_quan_huyen}"


class LoaiCongVien(models.Model):
    ma_loai = models.AutoField(primary_key=True)
    ten_loai = models.CharField(max_length=100, unique=True)
    ma_code = models.CharField(max_length=30, unique=True)
    mo_ta = models.TextField(null=True, blank=True)
    icon_url = models.CharField(max_length=255, null=True, blank=True)
    mau_sac = models.CharField(max_length=10, null=True, blank=True)
    
    class Meta:
        db_table = 'loai_cong_vien'
        ordering = ['ten_loai']
    
    def __str__(self):
        return self.ten_loai


class TrangThaiCongVien(models.Model):
    TRANG_THAI_CHOICES = [
        ('quy_hoach', 'Quy hoạch'),
        ('dang_xay_dung', 'Đang xây dựng'),
        ('hoat_dong', 'Hoạt động'),
        ('cai_tao', 'Cải tạo'),
        ('tam_dong', 'Tạm đóng'),
        ('ngung_hoat_dong', 'Ngưng hoạt động'),
    ]
    
    ma_trang_thai = models.AutoField(primary_key=True)
    ten_trang_thai = models.CharField(max_length=50, unique=True, choices=TRANG_THAI_CHOICES)
    ma_code = models.CharField(max_length=30, unique=True)
    mo_ta = models.TextField(null=True, blank=True)
    mau_sac = models.CharField(max_length=10, null=True, blank=True)
    
    class Meta:
        db_table = 'trang_thai_cong_vien'
        ordering = ['ma_trang_thai']
    
    def __str__(self):
        return self.ten_trang_thai


class CongVien(models.Model):
    ma_cong_vien = models.AutoField(primary_key=True)
    ten_cong_vien = models.CharField(max_length=200)
    ma_code = models.CharField(max_length=50, null=True, blank=True, unique=True)
    ma_loai = models.ForeignKey(LoaiCongVien, on_delete=models.SET_NULL, null=True, blank=True, related_name='cong_vien')
    ma_trang_thai = models.ForeignKey(TrangThaiCongVien, on_delete=models.SET_NULL, null=True, blank=True, related_name='cong_vien')
    ma_quan_huyen = models.ForeignKey(QuanHuyen, on_delete=models.SET_NULL, null=True, blank=True, related_name='cong_vien')
    ma_phuong_xa = models.ForeignKey(PhuongXa, on_delete=models.SET_NULL, null=True, blank=True, related_name='cong_vien')
    dia_chi = models.TextField(null=True, blank=True)
    dien_tich_m2 = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    dien_tich_cay_xanh = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    dien_tich_mat_nuoc = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    toa_do_trung_tam = models.JSONField(null=True, blank=True, default=list)
    ranh_gioi = models.JSONField(null=True, blank=True, default=dict)
    vi_tri_cong_vao = models.JSONField(null=True, blank=True, default=list)
    don_vi_quan_ly = models.CharField(max_length=200, null=True, blank=True)
    so_dien_thoai = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    gio_mo_cua = models.TimeField(null=True, blank=True)
    gio_dong_cua = models.TimeField(null=True, blank=True)
    mo_cua_24_7 = models.BooleanField(default=False)
    mien_phi_vao_cua = models.BooleanField(default=True)
    gia_ve = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    nam_thanh_lap = models.IntegerField(null=True, blank=True)
    mo_ta = models.TextField(null=True, blank=True)
    lich_su = models.TextField(null=True, blank=True)
    diem_trung_binh = models.DecimalField(max_digits=3, decimal_places=2, default=0.0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    so_luot_danh_gia = models.IntegerField(default=0)
    anh_dai_dien = models.CharField(max_length=500, null=True, blank=True)
    da_xac_minh = models.BooleanField(default=False)
    ngay_tao = models.DateTimeField(auto_now_add=True)
    ngay_cap_nhat = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cong_vien'
        ordering = ['-ngay_cap_nhat']
        indexes = [
            models.Index(fields=['ma_loai']),
            models.Index(fields=['ma_trang_thai']),
            models.Index(fields=['ma_quan_huyen']),
        ]
    
    def __str__(self):
        return self.ten_cong_vien
    
    def delete(self, *args, **kwargs):
        """Validation khi xóa công viên"""
        from django.core.exceptions import ValidationError
        
        # Kiểm tra có dữ liệu liên quan không
        if self.danh_gia.exists():
            raise ValidationError(f"Không thể xóa '{self.ten_cong_vien}' - còn có {self.danh_gia.count()} đánh giá")
        
        if self.bao_cao_su_co.exists():
            raise ValidationError(f"Không thể xóa '{self.ten_cong_vien}' - còn có {self.bao_cao_su_co.count()} báo cáo sự cố")
        
        if self.kiem_tra.exists():
            raise ValidationError(f"Không thể xóa '{self.ten_cong_vien}' - còn có {self.kiem_tra.count()} bản kiểm tra")
        
        if self.tien_ich.exists():
            raise ValidationError(f"Không thể xóa '{self.ten_cong_vien}' - còn có {self.tien_ich.count()} tiện ích")
        
        if self.su_kien.exists():
            raise ValidationError(f"Không thể xóa '{self.ten_cong_vien}' - còn có {self.su_kien.count()} sự kiện")
        
        if self.cay_xanh.exists():
            raise ValidationError(f"Không thể xóa '{self.ten_cong_vien}' - còn có {self.cay_xanh.count()} cây xanh")
        
        super().delete(*args, **kwargs)


class LoaiTienIch(models.Model):
    ma_loai_tien_ich = models.AutoField(primary_key=True)
    ten_loai = models.CharField(max_length=100, unique=True)
    ma_code = models.CharField(max_length=50, unique=True)
    mo_ta = models.TextField(null=True, blank=True)
    icon_url = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'loai_tien_ich'
        ordering = ['ten_loai']
    
    def __str__(self):
        return self.ten_loai


class TienIchCongVien(models.Model):
    TINH_TRANG_CHOICES = [
        ('tot', 'Tốt'),
        ('kha', 'Khá'),
        ('trung_binh', 'Trung bình'),
        ('kem', 'Kém'),
    ]
    
    ma_tien_ich = models.AutoField(primary_key=True)
    ma_cong_vien = models.ForeignKey(CongVien, on_delete=models.CASCADE, related_name='tien_ich')
    ma_loai_tien_ich = models.ForeignKey(LoaiTienIch, on_delete=models.CASCADE, related_name='tien_ich_cong_vien')
    so_luong = models.IntegerField(validators=[MinValueValidator(1)])
    tinh_trang = models.CharField(max_length=50, choices=TINH_TRANG_CHOICES)
    mo_ta = models.TextField(null=True, blank=True)
    vi_tri = models.JSONField(null=True, blank=True, default=list)
    dang_su_dung = models.BooleanField(default=True)
    ngay_kiem_tra = models.DateField(null=True, blank=True)
    hinh_anh = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'tien_ich_cong_vien'
        ordering = ['ma_cong_vien']
    
    def __str__(self):
        return f"{self.ma_loai_tien_ich.ten_loai} - {self.ma_cong_vien.ten_cong_vien}"


class HinhAnhCongVien(models.Model):
    ma_hinh_anh = models.AutoField(primary_key=True)
    ma_cong_vien = models.ForeignKey(CongVien, on_delete=models.CASCADE, related_name='hinh_anh')
    url_anh = models.CharField(max_length=500)
    mo_ta = models.TextField(null=True, blank=True)
    la_anh_chinh = models.BooleanField(default=False)
    ngay_chup = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'hinh_anh_cong_vien'
        ordering = ['ma_cong_vien', '-la_anh_chinh']
    
    def __str__(self):
        return f"Ảnh - {self.ma_cong_vien.ten_cong_vien}"


class NhomQuyen(models.Model):
    MA_NHUOM_CHOICES = [
        ('KHACH', 'Khách'),
        ('CONG_DONG', 'Người dùng cộng đồng'),
        ('QUAN_LY', 'Quản lý công viên'),
        ('QUAN_TRI', 'Quản trị viên'),
    ]
    
    ma_nhom_quyen = models.AutoField(primary_key=True)
    ten_nhom = models.CharField(max_length=100, unique=True, choices=MA_NHUOM_CHOICES)
    mo_ta = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'nhom_quyen'
        ordering = ['ma_nhom_quyen']
    
    def __str__(self):
        return self.get_ten_nhom_display()


class NguoiDung(models.Model):
    ma_nguoi_dung = models.AutoField(primary_key=True)
    ma_nhom_quyen = models.ForeignKey(NhomQuyen, on_delete=models.SET_NULL, null=True, related_name='nguoi_dung')
    ma_cong_vien = models.ForeignKey(CongVien, on_delete=models.SET_NULL, null=True, blank=True, related_name='quan_ly_cong_vien', help_text='Công viên được quản lý (chỉ dùng cho Manager)')
    ten_dang_nhap = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    mat_khau_hash = models.CharField(max_length=255)
    ho_ten = models.CharField(max_length=150, null=True, blank=True)
    dang_hoat_dong = models.BooleanField(default=True)
    da_xac_thuc_email = models.BooleanField(default=False)
    so_lan_dang_nhap = models.IntegerField(default=0)
    lan_dang_nhap_cuoi = models.DateTimeField(null=True, blank=True)
    token = models.CharField(max_length=255, null=True, blank=True, unique=True)
    reset_password_token = models.CharField(max_length=255, null=True, blank=True, unique=True)
    reset_password_expires_at = models.DateTimeField(null=True, blank=True)
    ngay_tao = models.DateTimeField(auto_now_add=True)
    ngay_cap_nhat = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'nguoi_dung'
        ordering = ['-ngay_cap_nhat']
        indexes = [
            models.Index(fields=['ten_dang_nhap']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.ho_ten} ({self.ten_dang_nhap})"


class DanhGiaCongVien(models.Model):
    ma_danh_gia = models.AutoField(primary_key=True)
    ma_cong_vien = models.ForeignKey(CongVien, on_delete=models.CASCADE, related_name='danh_gia')
    ma_nguoi_dung = models.ForeignKey(NguoiDung, on_delete=models.SET_NULL, null=True, blank=True, related_name='danh_gia')
    diem_tong_quat = models.SmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    diem_ve_sinh = models.SmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    diem_tien_ich = models.SmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    diem_an_toan = models.SmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    diem_tieu_can_thi = models.SmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    noi_dung = models.TextField(null=True, blank=True)
    da_duyet = models.BooleanField(default=False)
    vi_tri = models.JSONField(null=True, blank=True, default=list)
    ngay_tao = models.DateTimeField(auto_now_add=True)
    ngay_cap_nhat = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'danh_gia_cong_vien'
        ordering = ['-ngay_tao']
        indexes = [
            models.Index(fields=['ma_cong_vien', 'da_duyet']),
        ]
    
    def __str__(self):
        return f"Đánh giá {self.ma_cong_vien.ten_cong_vien}"


class LoaiKiemTra(models.Model):
    ma_loai_kiem_tra = models.AutoField(primary_key=True)
    ten_loai = models.CharField(max_length=100, unique=True)
    mo_ta = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'loai_kiem_tra'
        ordering = ['ten_loai']
    
    def __str__(self):
        return self.ten_loai


class KiemTraCongVien(models.Model):
    KET_QUA_CHOICES = [
        ('dat', 'Đạt'),
        ('khong_dat', 'Không đạt'),
        ('can_chu_y', 'Cần chú ý'),
        ('nguy_hiem', 'Nguy hiểm'),
    ]
    
    ma_kiem_tra = models.AutoField(primary_key=True)
    ma_cong_vien = models.ForeignKey(CongVien, on_delete=models.CASCADE, related_name='kiem_tra')
    ma_loai_kiem_tra = models.ForeignKey(LoaiKiemTra, on_delete=models.SET_NULL, null=True, blank=True)
    ma_nguoi_kiem_tra = models.ForeignKey(NguoiDung, on_delete=models.SET_NULL, null=True, blank=True)
    ngay_kiem_tra = models.DateField()
    ket_qua = models.CharField(max_length=50, choices=KET_QUA_CHOICES, null=True, blank=True)
    diem_tong = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    diem_ve_sinh = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    diem_an_toan = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    diem_tien_ich = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    van_de_phat_hien = models.TextField(null=True, blank=True)
    khuyen_nghi = models.TextField(null=True, blank=True)
    han_xu_ly = models.DateField(null=True, blank=True)
    ngay_tao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'kiem_tra_cong_vien'
        ordering = ['-ngay_kiem_tra']
        indexes = [
            models.Index(fields=['ma_cong_vien', 'ngay_kiem_tra']),
        ]
    
    def __str__(self):
        return f"Kiểm tra {self.ma_cong_vien.ten_cong_vien} - {self.ngay_kiem_tra}"


class DanhMucSuCo(models.Model):
    ma_danh_muc = models.AutoField(primary_key=True)
    ten_danh_muc = models.CharField(max_length=100, unique=True)
    mo_ta = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'danh_muc_su_co'
        ordering = ['ten_danh_muc']
    
    def __str__(self):
        return self.ten_danh_muc


class BaoCaoSuCo(models.Model):
    TRANG_THAI_CHOICES = [
        ('cho_xu_ly', 'Chờ xử lý'),
        ('dang_xu_ly', 'Đang xử lý'),
        ('da_xu_ly', 'Đã xử lý'),
    ]
    MUC_DO_CHOICES = [
        ('thap', 'Thấp'),
        ('trung_binh', 'Trung bình'),
        ('cao', 'Cao'),
        ('khan_cap', 'Khẩn cấp'),
    ]
    
    ma_bao_cao = models.AutoField(primary_key=True)
    ma_cong_vien = models.ForeignKey(CongVien, on_delete=models.CASCADE, related_name='bao_cao_su_co')
    ma_danh_muc = models.ForeignKey(DanhMucSuCo, on_delete=models.SET_NULL, null=True, blank=True)
    tieu_de = models.CharField(max_length=200)
    noi_dung_mo_ta = models.TextField()
    url_hinh_anh = models.JSONField(default=list, blank=True)
    trang_thai = models.CharField(max_length=30, choices=TRANG_THAI_CHOICES, default='cho_xu_ly')
    muc_do_uu_tien = models.CharField(max_length=20, choices=MUC_DO_CHOICES, default='trung_binh')
    ma_nguoi_phu_trach = models.ForeignKey(NguoiDung, on_delete=models.SET_NULL, null=True, blank=True, related_name='bao_cao_phu_trach')
    ma_nguoi_bao_cao = models.ForeignKey(NguoiDung, on_delete=models.SET_NULL, null=True, blank=True, related_name='bao_cao_da_tao')
    vi_tri = models.JSONField(null=True, blank=True, default=list)
    dia_chi = models.TextField(null=True, blank=True, help_text="Địa chỉ dựa trên công viên gần nhất")
    so_nguoi_xac_nhan = models.IntegerField(default=0)
    ngay_tao = models.DateTimeField(auto_now_add=True)
    ngay_cap_nhat = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False, help_text="Sự cố đã được xử lý và chuyển sang lịch sử")
    ngay_luu_tru = models.DateTimeField(null=True, blank=True, help_text="Ngày chuyển sang lịch sử")
    
    class Meta:
        db_table = 'bao_cao_su_co'
        ordering = ['-ngay_tao']
        indexes = [
            models.Index(fields=['ma_cong_vien', 'trang_thai']),
            models.Index(fields=['muc_do_uu_tien']),
            models.Index(fields=['is_archived', 'ngay_luu_tru']),
        ]
    
    def __str__(self):
        return f"{self.tieu_de} - {self.ma_cong_vien.ten_cong_vien}"

    def save(self, *args, **kwargs):
        if self.trang_thai == 'da_xu_ly':
            self.is_archived = True
            if not self.ngay_luu_tru:
                self.ngay_luu_tru = timezone.now()
        elif not self.is_archived:
            self.ngay_luu_tru = None

        super().save(*args, **kwargs)


class LoaiCay(models.Model):
    ma_loai_cay = models.AutoField(primary_key=True)
    ten_loai = models.CharField(max_length=100, unique=True)
    ten_khoa_hoc = models.CharField(max_length=150, null=True, blank=True)
    mo_ta = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'loai_cay'
        ordering = ['ten_loai']
    
    def __str__(self):
        return f"{self.ten_loai} ({self.ten_khoa_hoc})"


class CayXanh(models.Model):
    TINH_TRANG_CHOICES = [
        ('tot', 'Tốt'),
        ('kha', 'Khá'),
        ('trung_binh', 'Trung bình'),
        ('kem', 'Kém'),
        ('chet', 'Chết'),
    ]
    
    ma_cay = models.AutoField(primary_key=True)
    ma_cong_vien = models.ForeignKey(CongVien, on_delete=models.CASCADE, related_name='cay_xanh')
    ma_loai_cay = models.ForeignKey(LoaiCay, on_delete=models.SET_NULL, null=True, blank=True)
    ma_so_cay = models.CharField(max_length=50, null=True, blank=True)
    vi_tri = models.JSONField(default=list)
    chieu_cao_m = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    duong_kinh_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    ban_kinh_tan_m = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    tinh_trang = models.CharField(max_length=50, choices=TINH_TRANG_CHOICES, default='tot')
    ngay_cat_tia_cuoi = models.DateField(null=True, blank=True)
    ngay_trong = models.DateField(null=True, blank=True)
    ngay_tao = models.DateTimeField(auto_now_add=True)
    ngay_cap_nhat = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cay_xanh'
        ordering = ['ma_cong_vien']
        indexes = [
            models.Index(fields=['ma_cong_vien']),
            models.Index(fields=['tinh_trang']),
        ]
    
    def __str__(self):
        return f"Cây {self.ma_so_cay}" if self.ma_so_cay else f"Cây #{self.ma_cay}"


class SuKienCongVien(models.Model):
    LOAI_CHOICES = [
        ('le_hoi', 'Lễ hội'),
        ('the_thao', 'Thể thao'),
        ('van_hoa', 'Văn hóa'),
        ('am_nhac', 'Âm nhạc'),
    ]
    TRANG_THAI_CHOICES = [
        ('sap_dien_ra', 'Sắp diễn ra'),
        ('dang_dien_ra', 'Đang diễn ra'),
        ('da_ket_thuc', 'Đã kết thúc'),
        ('huy_bo', 'Hủy bỏ'),
    ]
    
    ma_su_kien = models.AutoField(primary_key=True)
    ma_cong_vien = models.ForeignKey(CongVien, on_delete=models.CASCADE, related_name='su_kien')
    ten_su_kien = models.CharField(max_length=200)
    loai_su_kien = models.CharField(max_length=100, choices=LOAI_CHOICES, null=True, blank=True)
    thoi_gian_bat_dau = models.DateTimeField()
    thoi_gian_ket_thuc = models.DateTimeField(null=True, blank=True)
    la_su_kien_lap_lai = models.BooleanField(default=False)
    mien_phi = models.BooleanField(default=True)
    suc_chua_toi_da = models.IntegerField(null=True, blank=True)
    trang_thai = models.CharField(max_length=30, choices=TRANG_THAI_CHOICES, default='sap_dien_ra')
    da_duyet = models.BooleanField(default=False)
    mo_ta = models.TextField(null=True, blank=True)
    ngay_tao = models.DateTimeField(auto_now_add=True)
    ngay_cap_nhat = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'su_kien_cong_vien'
        ordering = ['-thoi_gian_bat_dau']
        indexes = [
            models.Index(fields=['ma_cong_vien', 'trang_thai']),
        ]
    
    def __str__(self):
        return f"{self.ten_su_kien} - {self.ma_cong_vien.ten_cong_vien}"


class NhatKyThayDoi(models.Model):
    LOAI_THAY_DOI_CHOICES = [
        ('tao_moi', 'Tạo mới'),
        ('cap_nhat', 'Cập nhật'),
        ('xoa_mem', 'Xóa mềm'),
        ('phuc_hoi', 'Phục hồi'),
    ]
    
    ma_nhat_ky = models.AutoField(primary_key=True)
    loai_thay_doi = models.CharField(max_length=50, choices=LOAI_THAY_DOI_CHOICES)
    bang_du_lieu = models.CharField(max_length=100)
    id_ban_ghi = models.IntegerField()
    ma_nguoi_dung = models.ForeignKey(NguoiDung, on_delete=models.SET_NULL, null=True, blank=True)
    du_lieu_truoc = models.JSONField(null=True, blank=True)
    du_lieu_sau = models.JSONField(null=True, blank=True)
    mo_ta = models.CharField(max_length=500, null=True, blank=True)
    ngay_thay_doi = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'nhat_ky_thay_doi'
        ordering = ['-ngay_thay_doi']
        indexes = [
            models.Index(fields=['bang_du_lieu', 'id_ban_ghi']),
        ]
    
    def __str__(self):
        return f"{self.loai_thay_doi} - {self.bang_du_lieu}"


class ThongKetruyenCap(models.Model):
    ma_thong_ke = models.AutoField(primary_key=True)
    ngay = models.DateField(auto_now_add=True)
    so_lan_truy_cap = models.IntegerField(default=0)
    so_nguoi_truy_cap_doc_lap = models.IntegerField(default=0)
    trang_tim_kiem_nhat = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'thong_ke_truy_cap'
        ordering = ['-ngay']
        unique_together = ['ngay']
    
    def __str__(self):
        return f"Thống kê {self.ngay}"
class YeuCauLienHe(models.Model):
    ma_yeu_cau = models.AutoField(primary_key=True)
    ma_nguoi_dung = models.ForeignKey(NguoiDung, on_delete=models.SET_NULL, null=True, blank=True, related_name='yeu_cau_lien_he')
    ho_ten = models.CharField(max_length=150)
    email = models.EmailField()
    so_dien_thoai = models.CharField(max_length=20, null=True, blank=True)
    tieu_de = models.CharField(max_length=200)
    noi_dung = models.TextField()
    nguon_truy_cap = models.CharField(max_length=100, null=True, blank=True)
    email_nhan = models.EmailField()
    da_xu_ly = models.BooleanField(default=False)
    ngay_tao = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'yeu_cau_lien_he'
        ordering = ['-ngay_tao']
        indexes = [
            models.Index(fields=['da_xu_ly', 'ngay_tao']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.ho_ten} - {self.tieu_de}"

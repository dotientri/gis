from django.contrib import admin
from .models import (
    QuanHuyen, PhuongXa, LoaiCongVien, TrangThaiCongVien, CongVien,
    LoaiTienIch, TienIchCongVien, HinhAnhCongVien,
    NhomQuyen, NguoiDung,
    DanhGiaCongVien, LoaiKiemTra, KiemTraCongVien, DanhMucSuCo, BaoCaoSuCo,
    LoaiCay, CayXanh, SuKienCongVien, NhatKyThayDoi, ThongKetruyenCap, YeuCauLienHe
)


@admin.register(QuanHuyen)
class QuanHuyenAdmin(admin.ModelAdmin):
    list_display = ('ten_quan_huyen', 'ma_code', 'loai', 'dien_tich_km2', 'dan_so')
    list_filter = ('loai', 'ngay_tao')
    search_fields = ('ten_quan_huyen', 'ma_code')
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('ten_quan_huyen', 'ma_code', 'loai', 'dien_tich_km2', 'dan_so')
        }),
        ('Địa lý', {
            'fields': ('hinh_hoc',)
        }),
        ('Thời gian', {
            'fields': ('ngay_tao', 'ngay_cap_nhat'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('ngay_tao', 'ngay_cap_nhat')


@admin.register(PhuongXa)
class PhuongXaAdmin(admin.ModelAdmin):
    list_display = ('ten_phuong_xa', 'ma_quan_huyen', 'ma_code', 'loai', 'dien_tich_km2')
    list_filter = ('loai', 'ma_quan_huyen')
    search_fields = ('ten_phuong_xa', 'ma_code')
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('ten_phuong_xa', 'ma_quan_huyen', 'ma_code', 'loai', 'dien_tich_km2')
        }),
        ('Địa lý', {
            'fields': ('hinh_hoc',)
        }),
    )


@admin.register(LoaiCongVien)
class LoaiCongVienAdmin(admin.ModelAdmin):
    list_display = ('ten_loai', 'ma_code', 'mau_sac')
    search_fields = ('ten_loai', 'ma_code')
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('ten_loai', 'ma_code')
        }),
        ('Chi tiết', {
            'fields': ('mo_ta', 'icon_url', 'mau_sac')
        }),
    )


@admin.register(TrangThaiCongVien)
class TrangThaiCongVienAdmin(admin.ModelAdmin):
    list_display = ('ten_trang_thai', 'ma_code', 'mau_sac')
    search_fields = ('ten_trang_thai', 'ma_code')


@admin.register(CongVien)
class CongVienAdmin(admin.ModelAdmin):
    list_display = ('ten_cong_vien', 'ma_loai', 'ma_trang_thai', 'ma_quan_huyen', 'diem_trung_binh', 'so_luot_danh_gia')
    list_filter = ('ma_loai', 'ma_trang_thai', 'ma_quan_huyen', 'da_xac_minh', 'ngay_tao')
    search_fields = ('ten_cong_vien', 'ma_code', 'dia_chi')
    readonly_fields = ('ngay_tao', 'ngay_cap_nhat', 'so_luot_danh_gia')
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('ten_cong_vien', 'ma_code', 'ma_loai', 'ma_trang_thai', 'da_xac_minh')
        }),
        ('Vị trí hành chính', {
            'fields': ('ma_quan_huyen', 'ma_phuong_xa', 'dia_chi')
        }),
        ('Diện tích', {
            'fields': ('dien_tich_m2', 'dien_tich_cay_xanh', 'dien_tich_mat_nuoc'),
            'classes': ('collapse',)
        }),
        ('Địa lý', {
            'fields': ('toa_do_trung_tam', 'ranh_gioi', 'vi_tri_cong_vao')
        }),
        ('Thông tin quản lý', {
            'fields': ('don_vi_quan_ly', 'so_dien_thoai', 'email')
        }),
        ('Giờ hoạt động', {
            'fields': ('gio_mo_cua', 'gio_dong_cua', 'mo_cua_24_7'),
            'classes': ('collapse',)
        }),
        ('Vé và tiện ích', {
            'fields': ('mien_phi_vao_cua', 'gia_ve'),
            'classes': ('collapse',)
        }),
        ('Lịch sử', {
            'fields': ('nam_thanh_lap', 'lich_su', 'mo_ta'),
            'classes': ('collapse',)
        }),
        ('Đánh giá', {
            'fields': ('diem_trung_binh', 'so_luot_danh_gia', 'anh_dai_dien'),
            'classes': ('collapse',)
        }),
        ('Thời gian', {
            'fields': ('ngay_tao', 'ngay_cap_nhat'),
            'classes': ('collapse',)
        }),
    )


@admin.register(LoaiTienIch)
class LoaiTienIchAdmin(admin.ModelAdmin):
    list_display = ('ten_loai', 'ma_code')
    search_fields = ('ten_loai', 'ma_code')


@admin.register(TienIchCongVien)
class TienIchCongVienAdmin(admin.ModelAdmin):
    list_display = ('ma_cong_vien', 'ma_loai_tien_ich', 'so_luong', 'tinh_trang', 'dang_su_dung')
    list_filter = ('ma_loai_tien_ich', 'tinh_trang', 'dang_su_dung', 'ngay_kiem_tra')
    search_fields = ('ma_cong_vien__ten_cong_vien', 'ma_loai_tien_ich__ten_loai')


@admin.register(HinhAnhCongVien)
class HinhAnhCongVienAdmin(admin.ModelAdmin):
    list_display = ('ma_cong_vien', 'mo_ta', 'la_anh_chinh', 'ngay_chup')
    list_filter = ('la_anh_chinh', 'ngay_chup')
    search_fields = ('ma_cong_vien__ten_cong_vien', 'mo_ta')


@admin.register(NhomQuyen)
class NhomQuyenAdmin(admin.ModelAdmin):
    list_display = ('ten_nhom',)
    readonly_fields = ('ngay_tao', 'ngay_cap_nhat') if hasattr(NhomQuyen, 'ngay_tao') else ()


@admin.register(NguoiDung)
class NguoiDungAdmin(admin.ModelAdmin):
    list_display = ('ten_dang_nhap', 'email', 'ho_ten', 'ma_nhom_quyen', 'dang_hoat_dong', 'lan_dang_nhap_cuoi')
    list_filter = ('ma_nhom_quyen', 'dang_hoat_dong', 'da_xac_thuc_email', 'ngay_tao')
    search_fields = ('ten_dang_nhap', 'email', 'ho_ten')
    readonly_fields = ('ngay_tao', 'ngay_cap_nhat', 'so_lan_dang_nhap')
    fieldsets = (
        ('Đăng nhập', {
            'fields': ('ten_dang_nhap', 'email', 'mat_khau_hash')
        }),
        ('Thông tin cá nhân', {
            'fields': ('ho_ten', 'ma_nhom_quyen')
        }),
        ('Trạng thái', {
            'fields': ('dang_hoat_dong', 'da_xac_thuc_email')
        }),
        ('Lịch sử đăng nhập', {
            'fields': ('so_lan_dang_nhap', 'lan_dang_nhap_cuoi'),
            'classes': ('collapse',)
        }),
        ('Thời gian', {
            'fields': ('ngay_tao', 'ngay_cap_nhat'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DanhGiaCongVien)
class DanhGiaCongVienAdmin(admin.ModelAdmin):
    list_display = ('ma_cong_vien', 'ma_nguoi_dung', 'diem_tong_quat', 'da_duyet', 'ngay_tao')
    list_filter = ('da_duyet', 'ngay_tao', 'diem_tong_quat')
    search_fields = ('ma_cong_vien__ten_cong_vien', 'ma_nguoi_dung__ho_ten', 'noi_dung')
    readonly_fields = ('ngay_tao', 'ngay_cap_nhat')
    fieldsets = (
        ('Công viên & Người dùng', {
            'fields': ('ma_cong_vien', 'ma_nguoi_dung')
        }),
        ('Điểm số', {
            'fields': ('diem_tong_quat', 'diem_ve_sinh', 'diem_tien_ich', 'diem_an_toan', 'diem_tieu_can_thi')
        }),
        ('Nội dung', {
            'fields': ('noi_dung', 'vi_tri')
        }),
        ('Duyệt', {
            'fields': ('da_duyet',)
        }),
        ('Thời gian', {
            'fields': ('ngay_tao', 'ngay_cap_nhat'),
            'classes': ('collapse',)
        }),
    )
    actions = ['duyet_danh_gia', 'tu_choi_danh_gia']

    def duyet_danh_gia(self, request, queryset):
        updated = queryset.update(da_duyet=True)
        self.message_user(request, f'{updated} đánh giá đã được duyệt.')
    duyet_danh_gia.short_description = 'Duyệt những đánh giá được chọn'

    def tu_choi_danh_gia(self, request, queryset):
        updated = queryset.update(da_duyet=False)
        self.message_user(request, f'{updated} đánh giá đã bị từ chối.')
    tu_choi_danh_gia.short_description = 'Từ chối những đánh giá được chọn'


@admin.register(LoaiKiemTra)
class LoaiKiemTraAdmin(admin.ModelAdmin):
    list_display = ('ten_loai',)
    search_fields = ('ten_loai',)


@admin.register(KiemTraCongVien)
class KiemTraCongVienAdmin(admin.ModelAdmin):
    list_display = ('ma_cong_vien', 'ngay_kiem_tra', 'ket_qua', 'diem_tong', 'han_xu_ly')
    list_filter = ('ket_qua', 'ngay_kiem_tra', 'ma_loai_kiem_tra')
    search_fields = ('ma_cong_vien__ten_cong_vien',)
    readonly_fields = ('ngay_tao',)
    fieldsets = (
        ('Kiểm tra', {
            'fields': ('ma_cong_vien', 'ma_loai_kiem_tra', 'ma_nguoi_kiem_tra', 'ngay_kiem_tra')
        }),
        ('Kết quả', {
            'fields': ('ket_qua', 'diem_tong', 'diem_ve_sinh', 'diem_an_toan', 'diem_tien_ich')
        }),
        ('Vấn đề & Khuyến nghị', {
            'fields': ('van_de_phat_hien', 'khuyen_nghi', 'han_xu_ly'),
            'classes': ('collapse',)
        }),
        ('Thời gian', {
            'fields': ('ngay_tao',),
            'classes': ('collapse',)
        }),
    )


@admin.register(DanhMucSuCo)
class DanhMucSuCoAdmin(admin.ModelAdmin):
    list_display = ('ten_danh_muc',)
    search_fields = ('ten_danh_muc',)


@admin.register(BaoCaoSuCo)
class BaoCaoSuCoAdmin(admin.ModelAdmin):
    list_display = ('tieu_de', 'ma_cong_vien', 'trang_thai', 'muc_do_uu_tien', 'ma_nguoi_phu_trach', 'ngay_tao')
    list_filter = ('trang_thai', 'muc_do_uu_tien', 'ma_danh_muc', 'ngay_tao')
    search_fields = ('tieu_de', 'noi_dung_mo_ta', 'ma_cong_vien__ten_cong_vien')
    readonly_fields = ('ngay_tao', 'ngay_cap_nhat')
    fieldsets = (
        ('Thông tin báo cáo', {
            'fields': ('ma_cong_vien', 'ma_danh_muc', 'tieu_de', 'noi_dung_mo_ta')
        }),
        ('Hình ảnh', {
            'fields': ('url_hinh_anh',),
            'classes': ('collapse',)
        }),
        ('Xử lý', {
            'fields': ('trang_thai', 'muc_do_uu_tien', 'ma_nguoi_phu_trach', 'ma_nguoi_bao_cao')
        }),
        ('Chi tiết', {
            'fields': ('vi_tri', 'so_nguoi_xac_nhan'),
            'classes': ('collapse',)
        }),
        ('Thời gian', {
            'fields': ('ngay_tao', 'ngay_cap_nhat'),
            'classes': ('collapse',)
        }),
    )
    actions = ['cap_nhat_dang_xu_ly', 'cap_nhat_da_xu_ly']

    def cap_nhat_dang_xu_ly(self, request, queryset):
        updated = queryset.update(trang_thai='dang_xu_ly')
        self.message_user(request, f'{updated} báo cáo chuyển trạng thái "Đang xử lý".')
    cap_nhat_dang_xu_ly.short_description = 'Chuyển sang "Đang xử lý"'

    def cap_nhat_da_xu_ly(self, request, queryset):
        updated = 0
        for incident in queryset:
            incident.trang_thai = 'da_xu_ly'
            incident.save()
            updated += 1
        self.message_user(request, f'{updated} báo cáo chuyển trạng thái "Đã xử lý".')
    cap_nhat_da_xu_ly.short_description = 'Chuyển sang "Đã xử lý"'


@admin.register(LoaiCay)
class LoaiCayAdmin(admin.ModelAdmin):
    list_display = ('ten_loai', 'ten_khoa_hoc')
    search_fields = ('ten_loai', 'ten_khoa_hoc')


@admin.register(CayXanh)
class CayXanhAdmin(admin.ModelAdmin):
    list_display = ('ma_so_cay', 'ma_cong_vien', 'ma_loai_cay', 'tinh_trang', 'ngay_trong')
    list_filter = ('tinh_trang', 'ma_loai_cay', 'ma_cong_vien', 'ngay_trong')
    search_fields = ('ma_so_cay', 'ma_cong_vien__ten_cong_vien')
    readonly_fields = ('ngay_tao', 'ngay_cap_nhat')
    fieldsets = (
        ('Thông tin cây', {
            'fields': ('ma_so_cay', 'ma_cong_vien', 'ma_loai_cay')
        }),
        ('Vị trí', {
            'fields': ('vi_tri',)
        }),
        ('Kích thước', {
            'fields': ('chieu_cao_m', 'duong_kinh_cm', 'ban_kinh_tan_m')
        }),
        ('Tình trạng', {
            'fields': ('tinh_trang', 'ngay_cat_tia_cuoi', 'ngay_trong')
        }),
        ('Thời gian', {
            'fields': ('ngay_tao', 'ngay_cap_nhat'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SuKienCongVien)
class SuKienCongVienAdmin(admin.ModelAdmin):
    list_display = ('ten_su_kien', 'ma_cong_vien', 'loai_su_kien', 'thoi_gian_bat_dau', 'trang_thai', 'da_duyet')
    list_filter = ('loai_su_kien', 'trang_thai', 'da_duyet', 'thoi_gian_bat_dau')
    search_fields = ('ten_su_kien', 'ma_cong_vien__ten_cong_vien')
    readonly_fields = ('ngay_tao', 'ngay_cap_nhat')
    fieldsets = (
        ('Thông tin sự kiện', {
            'fields': ('ten_su_kien', 'ma_cong_vien', 'loai_su_kien', 'mo_ta')
        }),
        ('Thời gian', {
            'fields': ('thoi_gian_bat_dau', 'thoi_gian_ket_thuc', 'la_su_kien_lap_lai')
        }),
        ('Chi tiết', {
            'fields': ('mien_phi', 'suc_chua_toi_da', 'trang_thai', 'da_duyet'),
            'classes': ('collapse',)
        }),
        ('Thời gian lưu', {
            'fields': ('ngay_tao', 'ngay_cap_nhat'),
            'classes': ('collapse',)
        }),
    )
    actions = ['duyet_su_kien']

    def duyet_su_kien(self, request, queryset):
        updated = queryset.update(da_duyet=True)
        self.message_user(request, f'{updated} sự kiện đã được duyệt và công bố.')
    duyet_su_kien.short_description = 'Duyệt những sự kiện được chọn'


@admin.register(NhatKyThayDoi)
class NhatKyThayDoiAdmin(admin.ModelAdmin):
    list_display = ('loai_thay_doi', 'bang_du_lieu', 'id_ban_ghi', 'ma_nguoi_dung', 'ngay_thay_doi')
    list_filter = ('loai_thay_doi', 'bang_du_lieu', 'ngay_thay_doi')
    search_fields = ('bang_du_lieu', 'mo_ta')
    readonly_fields = ('ma_nhat_ky', 'loai_thay_doi', 'bang_du_lieu', 'id_ban_ghi', 'ma_nguoi_dung', 'du_lieu_truoc', 'du_lieu_sau', 'mo_ta', 'ngay_thay_doi')


@admin.register(ThongKetruyenCap)
class ThongKetruyenCapAdmin(admin.ModelAdmin):
    list_display = ('ngay', 'so_lan_truy_cap', 'so_nguoi_truy_cap_doc_lap')
    list_filter = ('ngay',)
    search_fields = ('trang_tim_kiem_nhat',)
    readonly_fields = ('ngay',)
    fieldsets = (
        ('Thông tin thống kê', {
            'fields': ('ngay',)
        }),
        ('Dữ liệu', {
            'fields': ('so_lan_truy_cap', 'so_nguoi_truy_cap_doc_lap', 'trang_tim_kiem_nhat')
        }),
    )
@admin.register(YeuCauLienHe)
class YeuCauLienHeAdmin(admin.ModelAdmin):
    list_display = ('ho_ten', 'email', 'tieu_de', 'email_nhan', 'da_xu_ly', 'ngay_tao')
    list_filter = ('da_xu_ly', 'ngay_tao')
    search_fields = ('ho_ten', 'email', 'tieu_de', 'noi_dung')
    readonly_fields = ('ma_nguoi_dung', 'ho_ten', 'email', 'so_dien_thoai', 'tieu_de', 'noi_dung', 'nguon_truy_cap', 'email_nhan', 'ngay_tao')
    fieldsets = (
        ('Nguoi gui', {
            'fields': ('ma_nguoi_dung', 'ho_ten', 'email', 'so_dien_thoai')
        }),
        ('Noi dung', {
            'fields': ('tieu_de', 'noi_dung', 'nguon_truy_cap', 'email_nhan')
        }),
        ('Xu ly', {
            'fields': ('da_xu_ly', 'ngay_tao')
        }),
    )

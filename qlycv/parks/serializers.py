from django.db.models import Count
from django.utils import timezone
from rest_framework import serializers
from .models import (
    QuanHuyen, PhuongXa, LoaiCongVien, TrangThaiCongVien, CongVien,
    LoaiTienIch, TienIchCongVien, HinhAnhCongVien,
    NhomQuyen, NguoiDung,
    DanhGiaCongVien, LoaiKiemTra, KiemTraCongVien, DanhMucSuCo, BaoCaoSuCo,
    LoaiCay, CayXanh, SuKienCongVien, NhatKyThayDoi, ThongKetruyenCap
)
from django.contrib.auth.hashers import make_password


class QuanHuyenSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuanHuyen
        fields = ['ma_quan_huyen', 'ten_quan_huyen', 'ma_code', 'loai', 'dien_tich_km2', 'dan_so', 'hinh_hoc', 'ngay_tao', 'ngay_cap_nhat']


class PhuongXaSerializer(serializers.ModelSerializer):
    quan_huyen_ten = serializers.CharField(source='ma_quan_huyen.ten_quan_huyen', read_only=True)
    
    class Meta:
        model = PhuongXa
        fields = ['ma_phuong_xa', 'ma_quan_huyen', 'quan_huyen_ten', 'ten_phuong_xa', 'ma_code', 'loai', 'dien_tich_km2', 'hinh_hoc']


class LoaiCongVienSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiCongVien
        fields = '__all__'


class TrangThaiCongVienSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrangThaiCongVien
        fields = '__all__'


class CongVienListSerializer(serializers.ModelSerializer):
    loai_ten = serializers.CharField(source='ma_loai.ten_loai', read_only=True)
    trang_thai_ten = serializers.CharField(source='ma_trang_thai.ten_trang_thai', read_only=True)
    ma_trang_thai_code = serializers.CharField(source='ma_trang_thai.ma_code', read_only=True)
    quan_huyen_ten = serializers.CharField(source='ma_quan_huyen.ten_quan_huyen', read_only=True)
    diem_trung_binh = serializers.FloatField(read_only=True)
    cay_so_luong = serializers.SerializerMethodField()
    tien_ich_so_luong = serializers.SerializerMethodField()
    anh_dai_dien = serializers.SerializerMethodField()
    dang_mo_cua = serializers.SerializerMethodField()
    trang_thai_van_hanh = serializers.SerializerMethodField()
    trang_thai_van_hanh_label = serializers.SerializerMethodField()
    loai_cay_noi_bat = serializers.SerializerMethodField()
    
    class Meta: 
        model = CongVien
        fields = [
            'ma_cong_vien', 'ten_cong_vien', 'ma_code', 'ma_loai', 'loai_ten',
            'ma_trang_thai', 'ma_trang_thai_code', 'trang_thai_ten', 'ma_quan_huyen', 'quan_huyen_ten',
            'dien_tich_m2', 'diem_trung_binh', 'so_luot_danh_gia', 'ranh_gioi', 'toa_do_trung_tam',
            'anh_dai_dien', 'da_xac_minh', 'ngay_cap_nhat', 'cay_so_luong', 'tien_ich_so_luong',
            'gio_mo_cua', 'gio_dong_cua', 'mo_cua_24_7', 'dang_mo_cua', 'trang_thai_van_hanh',
            'trang_thai_van_hanh_label', 'mo_ta', 'loai_cay_noi_bat'
        ]

    def _build_absolute_media_url(self, value):
        if not value:
            return None
        if isinstance(value, str) and value.startswith(('http://', 'https://')):
            return value

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(value)

        return value

    def _resolve_operational_state(self, obj):
        lifecycle_code = getattr(getattr(obj, 'ma_trang_thai', None), 'ma_code', None)
        if lifecycle_code and str(lifecycle_code).lower() != 'hoat_dong':
            return None

        if obj.mo_cua_24_7:
            return 'mo_cua_24_7'

        if not obj.gio_mo_cua or not obj.gio_dong_cua:
            return 'khong_ro'

        now_local = timezone.localtime().time()
        open_time = obj.gio_mo_cua
        close_time = obj.gio_dong_cua

        if open_time <= close_time:
            is_open = open_time <= now_local <= close_time
        else:
            is_open = now_local >= open_time or now_local <= close_time

        return 'dang_mo_cua' if is_open else 'dong_cua'

    def get_cay_so_luong(self, obj):
        return obj.cay_xanh.count()

    def get_tien_ich_so_luong(self, obj):
        return obj.tien_ich.count()

    def get_anh_dai_dien(self, obj):
        if obj.anh_dai_dien:
            return self._build_absolute_media_url(obj.anh_dai_dien)
        first_img = obj.hinh_anh.first()
        return self._build_absolute_media_url(first_img.url_anh) if first_img else None

    def get_dang_mo_cua(self, obj):
        return self._resolve_operational_state(obj) in ['mo_cua_24_7', 'dang_mo_cua']

    def get_trang_thai_van_hanh(self, obj):
        return self._resolve_operational_state(obj)

    def get_trang_thai_van_hanh_label(self, obj):
        label_map = {
            'mo_cua_24_7': 'Mo cua 24/7',
            'dang_mo_cua': 'Dang mo cua',
            'dong_cua': 'Dong cua',
            'khong_ro': 'Chua ro gio hoat dong',
        }
        return label_map.get(self._resolve_operational_state(obj))

    def get_loai_cay_noi_bat(self, obj):
        tree_groups = (
            obj.cay_xanh.exclude(ma_loai_cay__ten_loai__isnull=True)
            .exclude(ma_loai_cay__ten_loai__exact='')
            .values('ma_loai_cay__ten_loai')
            .annotate(so_luong=Count('ma_cay'))
            .order_by('-so_luong', 'ma_loai_cay__ten_loai')[:4]
        )

        return [
            {
                'ten_loai': item['ma_loai_cay__ten_loai'],
                'so_luong': item['so_luong'],
            }
            for item in tree_groups
        ]


class CongVienDetailSerializer(serializers.ModelSerializer):
    loai_ten = serializers.CharField(source='ma_loai.ten_loai', read_only=True)
    trang_thai_ten = serializers.CharField(source='ma_trang_thai.ten_trang_thai', read_only=True)
    ma_trang_thai_code = serializers.CharField(source='ma_trang_thai.ma_code', read_only=True)
    quan_huyen_ten = serializers.CharField(source='ma_quan_huyen.ten_quan_huyen', read_only=True)
    phuong_xa_ten = serializers.CharField(source='ma_phuong_xa.ten_phuong_xa', read_only=True)
    hinh_anh = serializers.SerializerMethodField()
    diem_trung_binh = serializers.FloatField(read_only=True)
    google_maps_url = serializers.SerializerMethodField()
    tien_ich = serializers.SerializerMethodField()
    tien_ich_so_luong = serializers.SerializerMethodField()
    cay_so_luong = serializers.SerializerMethodField()
    dang_mo_cua = serializers.SerializerMethodField()
    trang_thai_van_hanh = serializers.SerializerMethodField()
    trang_thai_van_hanh_label = serializers.SerializerMethodField()
    loai_cay_noi_bat = serializers.SerializerMethodField()
    
    class Meta:
        model = CongVien
        fields = [
            'ma_cong_vien', 'ten_cong_vien', 'ma_code', 'ma_loai', 'loai_ten',
            'ma_trang_thai', 'ma_trang_thai_code', 'trang_thai_ten', 'ma_quan_huyen', 'quan_huyen_ten',
            'ma_phuong_xa', 'phuong_xa_ten', 'dia_chi', 'dien_tich_m2',
            'dien_tich_cay_xanh', 'dien_tich_mat_nuoc', 'toa_do_trung_tam', 'ranh_gioi',
            'vi_tri_cong_vao', 'don_vi_quan_ly', 'so_dien_thoai', 'email',
            'gio_mo_cua', 'gio_dong_cua', 'mo_cua_24_7', 'mien_phi_vao_cua',
            'gia_ve', 'nam_thanh_lap', 'mo_ta', 'lich_su', 'diem_trung_binh',
            'so_luot_danh_gia', 'anh_dai_dien', 'da_xac_minh', 'hinh_anh', 'google_maps_url',
            'tien_ich', 'tien_ich_so_luong', 'cay_so_luong', 'dang_mo_cua', 'trang_thai_van_hanh',
            'trang_thai_van_hanh_label', 'loai_cay_noi_bat', 'ngay_tao', 'ngay_cap_nhat'
        ]
    
    def validate_ten_cong_vien(self, value):
        qs = CongVien.objects.filter(ten_cong_vien__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Tên công viên này đã tồn tại trong hệ thống. Vui lòng chọn tên khác.")
        return value

    def get_google_maps_url(self, obj):
        if obj.toa_do_trung_tam and isinstance(obj.toa_do_trung_tam, list) and len(obj.toa_do_trung_tam) >= 2:
            return f"https://www.google.com/maps/dir/?api=1&destination={obj.toa_do_trung_tam[0]},{obj.toa_do_trung_tam[1]}"
        return None
    
    def get_hinh_anh(self, obj):
        hinh_anh = obj.hinh_anh.all()
        return HinhAnhCongVienSerializer(hinh_anh, many=True).data
    
    def get_tien_ich(self, obj):
        tien_ich = obj.tien_ich.all()
        return TienIchCongVienSerializer(tien_ich, many=True).data
    
    def get_tien_ich_so_luong(self, obj):
        return obj.tien_ich.count()
    
    def get_cay_so_luong(self, obj):
        return obj.cay_xanh.count()

    def _list_serializer(self):
        return CongVienListSerializer(context=self.context)

    def get_dang_mo_cua(self, obj):
        return self._list_serializer().get_dang_mo_cua(obj)

    def get_trang_thai_van_hanh(self, obj):
        return self._list_serializer().get_trang_thai_van_hanh(obj)

    def get_trang_thai_van_hanh_label(self, obj):
        return self._list_serializer().get_trang_thai_van_hanh_label(obj)

    def get_loai_cay_noi_bat(self, obj):
        return self._list_serializer().get_loai_cay_noi_bat(obj)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        list_serializer = self._list_serializer()
        data['anh_dai_dien'] = list_serializer.get_anh_dai_dien(instance)

        for image in data.get('hinh_anh') or []:
            image['url_anh'] = list_serializer._build_absolute_media_url(image.get('url_anh'))

        return data


class LoaiTienIchSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiTienIch
        fields = '__all__'


class TienIchCongVienSerializer(serializers.ModelSerializer):
    loai_tien_ich_ten = serializers.CharField(source='ma_loai_tien_ich.ten_loai', read_only=True)
    cong_vien_ten = serializers.CharField(source='ma_cong_vien.ten_cong_vien', read_only=True)
    
    class Meta:
        model = TienIchCongVien
        fields = ['ma_tien_ich', 'ma_cong_vien', 'cong_vien_ten', 'ma_loai_tien_ich', 'loai_tien_ich_ten', 'so_luong', 'tinh_trang', 'mo_ta', 'vi_tri', 'dang_su_dung', 'ngay_kiem_tra', 'hinh_anh']


class HinhAnhCongVienSerializer(serializers.ModelSerializer):
    class Meta:
        model = HinhAnhCongVien
        fields = ['ma_hinh_anh', 'ma_cong_vien', 'url_anh', 'mo_ta', 'la_anh_chinh', 'ngay_chup']


class NhomQuyenSerializer(serializers.ModelSerializer):
    class Meta:
        model = NhomQuyen
        fields = '__all__'


class NguoiDungSerializer(serializers.ModelSerializer):
    nhom_quyen_ten = serializers.CharField(source='ma_nhom_quyen.get_ten_nhom_display', read_only=True)
    nhom_quyen_code = serializers.CharField(source='ma_nhom_quyen.ten_nhom', read_only=True)
    ma_cong_vien_ten = serializers.CharField(source='ma_cong_vien.ten_cong_vien', read_only=True, allow_null=True)
    
    class Meta:
        model = NguoiDung
        fields = [
            'ma_nguoi_dung', 'ma_nhom_quyen', 'nhom_quyen_ten', 'nhom_quyen_code', 
            'ma_cong_vien', 'ma_cong_vien_ten',
            'ten_dang_nhap', 'email', 'ho_ten', 'dang_hoat_dong', 'da_xac_thuc_email',
            'so_lan_dang_nhap', 'lan_dang_nhap_cuoi', 'ngay_tao', 'ngay_cap_nhat'
        ]
        extra_kwargs = {'mat_khau_hash': {'write_only': True}}


class NguoiDungCreateSerializer(serializers.ModelSerializer):
    mat_khau = serializers.CharField(write_only=True)
    
    class Meta:
        model = NguoiDung
        fields = ['ten_dang_nhap', 'email', 'ho_ten', 'mat_khau', 'ma_nhom_quyen', 'ma_cong_vien']

    def validate(self, attrs):
        role = attrs.get('ma_nhom_quyen')
        park = attrs.get('ma_cong_vien')

        if role and role.ten_nhom == 'QUAN_LY':
            if not park:
                raise serializers.ValidationError({'ma_cong_vien': 'Manager phai duoc gan dung 1 cong vien.'})

            existing_manager = NguoiDung.objects.filter(
                ma_nhom_quyen__ten_nhom='QUAN_LY',
                ma_cong_vien=park
            ).first()
            if existing_manager:
                raise serializers.ValidationError({
                    'ma_cong_vien': f'Cong vien nay da duoc giao cho manager {existing_manager.ten_dang_nhap}.'
                })
        elif park:
            raise serializers.ValidationError({'ma_cong_vien': 'Chi manager moi duoc gan cong vien quan ly.'})

        return attrs
    
    def create(self, validated_data):
        mat_khau = validated_data.pop('mat_khau')
        validated_data['mat_khau_hash'] = make_password(mat_khau)
        user = NguoiDung.objects.create(**validated_data)
        return user


class NguoiDungAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NguoiDung
        fields = ['email', 'ho_ten', 'ma_nhom_quyen', 'ma_cong_vien', 'dang_hoat_dong']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        role = attrs.get('ma_nhom_quyen', instance.ma_nhom_quyen if instance else None)
        park = attrs.get('ma_cong_vien', instance.ma_cong_vien if instance else None)

        if role and role.ten_nhom == 'QUAN_LY':
            if not park:
                raise serializers.ValidationError({'ma_cong_vien': 'Manager phai duoc gan dung 1 cong vien.'})

            existing_manager = NguoiDung.objects.filter(
                ma_nhom_quyen__ten_nhom='QUAN_LY',
                ma_cong_vien=park
            )
            if instance:
                existing_manager = existing_manager.exclude(pk=instance.pk)

            existing_manager = existing_manager.first()
            if existing_manager:
                raise serializers.ValidationError({
                    'ma_cong_vien': f'Cong vien nay da duoc giao cho manager {existing_manager.ten_dang_nhap}.'
                })
        else:
            attrs['ma_cong_vien'] = None

        return attrs


class DanhGiaCongVienSerializer(serializers.ModelSerializer):
    cong_vien_ten = serializers.CharField(source='ma_cong_vien.ten_cong_vien', read_only=True)
    nguoi_dung_ten = serializers.CharField(source='ma_nguoi_dung.ho_ten', read_only=True)
    
    class Meta:
        model = DanhGiaCongVien
        fields = [
            'ma_danh_gia', 'ma_cong_vien', 'cong_vien_ten', 'ma_nguoi_dung',
            'nguoi_dung_ten', 'diem_tong_quat', 'diem_ve_sinh', 'diem_tien_ich',
            'diem_an_toan', 'diem_tieu_can_thi', 'noi_dung', 'da_duyet',
            'vi_tri', 'ngay_tao', 'ngay_cap_nhat'
        ]


class LoaiKiemTraSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiKiemTra
        fields = '__all__'


class KiemTraCongVienSerializer(serializers.ModelSerializer):
    cong_vien_ten = serializers.CharField(source='ma_cong_vien.ten_cong_vien', read_only=True)
    kiem_tra_vien_ten = serializers.CharField(source='ma_nguoi_kiem_tra.ho_ten', read_only=True)
    
    class Meta:
        model = KiemTraCongVien
        fields = [
            'ma_kiem_tra', 'ma_cong_vien', 'cong_vien_ten', 'ma_loai_kiem_tra',
            'ma_nguoi_kiem_tra', 'kiem_tra_vien_ten', 'ngay_kiem_tra', 'ket_qua',
            'diem_tong', 'diem_ve_sinh', 'diem_an_toan', 'diem_tien_ich',
            'van_de_phat_hien', 'khuyen_nghi', 'han_xu_ly', 'ngay_tao'
        ]


class DanhMucSuCoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DanhMucSuCo
        fields = '__all__'


class BaoCaoSuCoSerializer(serializers.ModelSerializer):
    cong_vien_ten = serializers.CharField(source='ma_cong_vien.ten_cong_vien', read_only=True)
    danh_muc_ten = serializers.CharField(source='ma_danh_muc.ten_danh_muc', read_only=True)
    nguoi_phu_trach_ten = serializers.CharField(source='ma_nguoi_phu_trach.ho_ten', read_only=True)
    
    class Meta:
        model = BaoCaoSuCo
        fields = [
            'ma_bao_cao', 'ma_cong_vien', 'cong_vien_ten', 'ma_danh_muc',
            'danh_muc_ten', 'tieu_de', 'noi_dung_mo_ta', 'url_hinh_anh',
            'trang_thai', 'muc_do_uu_tien', 'ma_nguoi_phu_trach',
            'nguoi_phu_trach_ten', 'ma_nguoi_bao_cao', 'vi_tri', 'dia_chi',
            'so_nguoi_xac_nhan', 'ngay_tao', 'ngay_cap_nhat', 'is_archived', 'ngay_luu_tru'
        ]


class LoaiCaySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiCay
        fields = '__all__'


class CayXanhSerializer(serializers.ModelSerializer):
    cong_vien_ten = serializers.CharField(source='ma_cong_vien.ten_cong_vien', read_only=True)
    loai_cay_ten = serializers.CharField(source='ma_loai_cay.ten_loai', read_only=True)
    
    class Meta:
        model = CayXanh
        fields = [
            'ma_cay', 'ma_cong_vien', 'cong_vien_ten', 'ma_loai_cay',
            'loai_cay_ten', 'ma_so_cay', 'vi_tri', 'chieu_cao_m',
            'duong_kinh_cm', 'ban_kinh_tan_m', 'tinh_trang',
            'ngay_cat_tia_cuoi', 'ngay_trong', 'ngay_tao', 'ngay_cap_nhat'
        ]


class SuKienCongVienSerializer(serializers.ModelSerializer):
    cong_vien_ten = serializers.CharField(source='ma_cong_vien.ten_cong_vien', read_only=True)
    
    class Meta:
        model = SuKienCongVien
        fields = [
            'ma_su_kien', 'ma_cong_vien', 'cong_vien_ten', 'ten_su_kien',
            'loai_su_kien', 'thoi_gian_bat_dau', 'thoi_gian_ket_thuc',
            'la_su_kien_lap_lai', 'mien_phi', 'suc_chua_toi_da',
            'trang_thai', 'da_duyet', 'mo_ta', 'ngay_tao', 'ngay_cap_nhat'
        ]


class NhatKyThayDoiSerializer(serializers.ModelSerializer):
    nguoi_dung_ten = serializers.CharField(source='ma_nguoi_dung.ho_ten', read_only=True)
    
    class Meta:
        model = NhatKyThayDoi
        fields = [
            'ma_nhat_ky', 'loai_thay_doi', 'bang_du_lieu', 'id_ban_ghi',
            'ma_nguoi_dung', 'nguoi_dung_ten', 'du_lieu_truoc', 'du_lieu_sau',
            'mo_ta', 'ngay_thay_doi'
        ]
        read_only_fields = fields


class ThongKeTruyenCapSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThongKetruyenCap
        fields = '__all__'
        read_only_fields = fields

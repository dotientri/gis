from django.test import TestCase
from django.conf import settings

from parks.models import BaoCaoSuCo, CayXanh, CongVien, DanhMucSuCo, LoaiCay
from parks.serializers import BaoCaoSuCoSerializer, CayXanhSerializer, CongVienDetailSerializer


class BasicProjectTests(TestCase):
    def test_parks_app_installed(self):
        self.assertIn('parks', settings.INSTALLED_APPS)


class ValidationSerializerTests(TestCase):
    def setUp(self):
        self.park = CongVien.objects.create(ten_cong_vien='Cong vien Tao Dan', ma_code='CV-001')
        self.other_park = CongVien.objects.create(ten_cong_vien='Cong vien Le Van Tam', ma_code='CV-002')
        self.tree_type = LoaiCay.objects.create(ten_loai='Bang lang')
        self.incident_category = DanhMucSuCo.objects.create(ten_danh_muc='Den hong')

    def test_park_name_and_code_are_normalized_unique(self):
        serializer = CongVienDetailSerializer(data={'ten_cong_vien': '  cong   vien tao dan ', 'ma_code': ' cv001 '})
        self.assertFalse(serializer.is_valid())
        self.assertIn('ten_cong_vien', serializer.errors)
        self.assertIn('ma_code', serializer.errors)

    def test_tree_code_must_be_unique_within_same_park(self):
        CayXanh.objects.create(ma_cong_vien=self.park, ma_loai_cay=self.tree_type, ma_so_cay='TREE-01', vi_tri=[])

        serializer = CayXanhSerializer(data={
            'ma_cong_vien': self.park.ma_cong_vien,
            'ma_loai_cay': self.tree_type.ma_loai_cay,
            'ma_so_cay': ' tree-01 ',
            'vi_tri': [],
            'tinh_trang': 'tot',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('ma_so_cay', serializer.errors)

    def test_tree_code_can_repeat_in_different_parks(self):
        CayXanh.objects.create(ma_cong_vien=self.park, ma_loai_cay=self.tree_type, ma_so_cay='TREE-01', vi_tri=[])

        serializer = CayXanhSerializer(data={
            'ma_cong_vien': self.other_park.ma_cong_vien,
            'ma_loai_cay': self.tree_type.ma_loai_cay,
            'ma_so_cay': 'TREE-01',
            'vi_tri': [],
            'tinh_trang': 'tot',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_incident_title_must_be_unique_within_same_park(self):
        BaoCaoSuCo.objects.create(
            ma_cong_vien=self.park,
            ma_danh_muc=self.incident_category,
            tieu_de='Canh bao den hong',
            noi_dung_mo_ta='Mo ta 1',
        )

        serializer = BaoCaoSuCoSerializer(data={
            'ma_cong_vien': self.park.ma_cong_vien,
            'ma_danh_muc': self.incident_category.ma_danh_muc,
            'tieu_de': '  canh bao   den hong ',
            'noi_dung_mo_ta': 'Mo ta 2',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('tieu_de', serializer.errors)

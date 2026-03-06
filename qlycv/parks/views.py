"""
Django REST Framework Views for GIS Park Management System
Cung cấp CRUD API cho tất cả các bảng dữ liệu
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone 
from datetime import timedelta
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import json

from .permissions import (
    IsAuthenticated, IsAdmin, IsParkManager, IsGISEditor,
    IsParkManagerOrGISEditor, IsInspector, IsOwnerOrAdmin,
    CanCreatePark, CanRateAndReview, CanReportIncident
)

from .models import (
    QuanHuyen, PhuongXa, LoaiCongVien, TrangThaiCongVien, CongVien,
    LoaiTienIch, TienIchCongVien, HinhAnhCongVien,
    NhomQuyen, NguoiDung,
    DanhGiaCongVien, LoaiKiemTra, KiemTraCongVien, DanhMucSuCo, BaoCaoSuCo,
    LoaiCay, CayXanh, SuKienCongVien, NhatKyThayDoi, ThongKetruyenCap
)
from .serializers import (
    QuanHuyenSerializer, PhuongXaSerializer, LoaiCongVienSerializer,
    TrangThaiCongVienSerializer, CongVienListSerializer, CongVienDetailSerializer,
    LoaiTienIchSerializer, TienIchCongVienSerializer, HinhAnhCongVienSerializer,
    NhomQuyenSerializer, NguoiDungSerializer, NguoiDungCreateSerializer,
    DanhGiaCongVienSerializer, LoaiKiemTraSerializer, KiemTraCongVienSerializer,
    DanhMucSuCoSerializer, BaoCaoSuCoSerializer,
    LoaiCaySerializer, CayXanhSerializer, SuKienCongVienSerializer,
    NhatKyThayDoiSerializer, ThongKeTruyenCapSerializer
)


# ==================== ĐỊA LÝ HÀNH CHÍNH ====================

class QuanHuyenViewSet(viewsets.ModelViewSet):
    """CRUD quận / huyện - Chỉ Admin/Quản lý có thể tạo/sửa/xóa"""
    queryset = QuanHuyen.objects.all()
    serializer_class = QuanHuyenSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['ten_quan_huyen', 'ma_code']
    filterset_fields = ['loai']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


class PhuongXaViewSet(viewsets.ModelViewSet):
    """CRUD phường / xã - Chỉ Admin/Quản lý có thể tạo/sửa/xóa"""
    queryset = PhuongXa.objects.select_related('ma_quan_huyen')
    serializer_class = PhuongXaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['ten_phuong_xa', 'ma_code']
    filterset_fields = ['ma_quan_huyen', 'loai']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


# ==================== CÔNG VIÊN ====================

class LoaiCongVienViewSet(viewsets.ModelViewSet):
    """CRUD loại công viên - Chỉ Admin/GIS Editor có thể tạo/sửa/xóa"""
    queryset = LoaiCongVien.objects.all()
    serializer_class = LoaiCongVienSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsGISEditor()]


class TrangThaiCongVienViewSet(viewsets.ModelViewSet):
    """CRUD trạng thái công viên - Chỉ Admin có thể tạo/sửa/xóa"""
    queryset = TrangThaiCongVien.objects.all()
    serializer_class = TrangThaiCongVienSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


class CongVienViewSet(viewsets.ModelViewSet):
    """CRUD công viên - Chỉ Quản lý/Biên tập viên GIS có thể tạo/sửa/xóa"""
    queryset = CongVien.objects.select_related(
        'ma_loai', 'ma_trang_thai', 'ma_quan_huyen', 'ma_phuong_xa'
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['ten_cong_vien', 'ma_code', 'dia_chi']
    filterset_fields = ['ma_loai', 'ma_trang_thai', 'ma_quan_huyen', 'da_xac_minh']
    ordering_fields = ['-diem_trung_binh', '-so_luot_danh_gia', 'ten_cong_vien']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsParkManagerOrGISEditor()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CongVienListSerializer
        return CongVienDetailSerializer
    
    @action(detail=False, methods=['post'], url_path='tim-gan-nhat', permission_classes=[AllowAny])
    def tim_gan_nhat(self, request):
        """Tìm công viên gần nhất theo tọa độ GPS"""
        try:
            # Chấp nhận latitude, longitude hoặc vi_do, kinh_do
            vi_do = float(request.data.get('vi_do') or request.data.get('latitude'))
            kinh_do = float(request.data.get('kinh_do') or request.data.get('longitude'))
            ban_kinh_km = float(request.data.get('ban_kinh_km', 50))  # Tăng bán kính mặc định
        except (TypeError, ValueError):
            return Response({
                'error': 'vi_do/latitude, kinh_do/longitude, và ban_kinh_km phải là các con số hợp lệ',
                'received': f"vi_do={request.data.get('vi_do')}, kinh_do={request.data.get('kinh_do')}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not vi_do or not kinh_do:
            return Response({
                'error': 'vi_do/latitude và kinh_do/longitude là bắt buộc',
                'data_keys': list(request.data.keys())
            }, status=status.HTTP_400_BAD_REQUEST)
        
        import math
        def haversine(lat1, lon1, lat2, lon2):
            """Tính khoảng cách giữa 2 tọa độ GPS (km)"""
            R = 6371  # Bán kính Trái Đất (km)
            dLat = math.radians(lat2 - lat1)
            dLon = math.radians(lon2 - lon1)
            a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                 math.sin(dLon / 2) * math.sin(dLon / 2))
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c

        parks_with_distance = []
        # Lấy tất cả công viên, không chỉ những cái "hoạt động"
        active_parks = self.queryset.all()

        for park in active_parks:
            # Kiểm tra tọa độ có hợp lệ
            if not park.toa_do_trung_tam:
                continue
            
            if isinstance(park.toa_do_trung_tam, list) and len(park.toa_do_trung_tam) == 2:
                try:
                    park_lat, park_lon = float(park.toa_do_trung_tam[0]), float(park.toa_do_trung_tam[1])
                    distance = haversine(vi_do, kinh_do, park_lat, park_lon)
                    if distance <= ban_kinh_km:
                        park.distance = distance
                        parks_with_distance.append(park)
                except (ValueError, TypeError):
                    continue  # Bỏ qua công viên có tọa độ không hợp lệ

        # Sắp xếp theo khoảng cách
        parks_with_distance.sort(key=lambda p: p.distance)
        queryset = parks_with_distance[:50]  # Tăng giới hạn lên 50 công viên
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': len(queryset),
            'user_location': {'latitude': vi_do, 'longitude': kinh_do},
            'radius_km': ban_kinh_km,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def ban_do(self, request):
        """API trả về toàn bộ công viên hoạt động để hiển thị trên bản đồ (không phân trang)"""
        queryset = self.queryset.filter(ma_trang_thai__ten_trang_thai='hoat_dong')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def can_kiem_tra(self, request):
        """Danh sách công viên chưa kiểm tra trong 30 ngày"""
        thoi_gian_30_ngay = timezone.now() - timedelta(days=30)
        parks_not_checked = CongVien.objects.filter(
            ma_trang_thai__ten_trang_thai='hoat_dong'
        ).exclude(
            kiem_tra__ngay_kiem_tra__gte=thoi_gian_30_ngay
        ).distinct()
        
        serializer = self.get_serializer(parks_not_checked, many=True)
        return Response(serializer.data)


# ==================== TIỆN ÍCH & NỘI DUNG ====================

class LoaiTienIchViewSet(viewsets.ModelViewSet):
    """CRUD loại tiện ích - Chỉ GIS Editor có thể tạo/sửa/xóa"""
    queryset = LoaiTienIch.objects.all()
    serializer_class = LoaiTienIchSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsGISEditor()]


class TienIchCongVienViewSet(viewsets.ModelViewSet):
    """CRUD tiện ích công viên - Chỉ Quản lý/GIS Editor có thể tạo/sửa/xóa"""
    queryset = TienIchCongVien.objects.select_related('ma_cong_vien', 'ma_loai_tien_ich')
    serializer_class = TienIchCongVienSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ma_cong_vien', 'ma_loai_tien_ich', 'tinh_trang']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsParkManagerOrGISEditor()]
    
    def create(self, request, *args, **kwargs):
        # Xử lý upload nhiều ảnh cho tiện ích
        data = request.data.copy()
        
        # Lấy danh sách file từ key 'hinh_anh_files'
        images = request.FILES.getlist('hinh_anh_files')
        image_urls = []
        
        if images:
            for img in images:
                # Lưu file và lấy đường dẫn
                file_name = default_storage.save(f'amenity_images/{img.name}', ContentFile(img.read()))
                file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
                image_urls.append(file_url)
        
        # Lưu mảng URL vào field hinh_anh (JSON)
        if image_urls:
            data['hinh_anh'] = image_urls # Serializer sẽ tự xử lý JSONField
            
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        
        # Xử lý upload thêm ảnh cho tiện ích
        images = request.FILES.getlist('hinh_anh_files')
        
        if images:
            # Lấy danh sách ảnh hiện tại
            current_images = instance.hinh_anh or []
            new_urls = []
            for img in images:
                file_name = default_storage.save(f'amenity_images/{img.name}', ContentFile(img.read()))
                file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
                new_urls.append(file_url)
            
            # Gộp ảnh cũ và mới
            data['hinh_anh'] = current_images + new_urls
            
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class HinhAnhCongVienViewSet(viewsets.ModelViewSet):
    """CRUD hình ảnh công viên - Chỉ Quản lý/GIS Editor có thể tạo/sửa/xóa"""
    queryset = HinhAnhCongVien.objects.select_related('ma_cong_vien')
    serializer_class = HinhAnhCongVienSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ma_cong_vien']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsParkManagerOrGISEditor()]
    
    def create(self, request, *args, **kwargs):
        # Xử lý upload ảnh công viên
        data = request.data.copy()
        file = request.FILES.get('url_anh')
        
        if file:
            file_name = default_storage.save(f'park_images/{file.name}', ContentFile(file.read()))
            # Tạo URL đầy đủ
            file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
            data['url_anh'] = file_url
            
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# ==================== NGƯỜI DÙNG & PHÂN QUYỀN ====================

class NhomQuyenViewSet(viewsets.ReadOnlyModelViewSet):
    """Xem danh sách nhóm quyền"""
    queryset = NhomQuyen.objects.all()
    serializer_class = NhomQuyenSerializer


class NguoiDungViewSet(viewsets.ModelViewSet):
    """CRUD nhân viên - Chỉ Admin có thể quản lý tài khoản"""
    queryset = NguoiDung.objects.select_related('ma_nhom_quyen')
    serializer_class = NguoiDungSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['ten_dang_nhap', 'email', 'ho_ten']
    filterset_fields = ['ma_nhom_quyen', 'dang_hoat_dong']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        # Chỉ xem danh sách hoặc thông tin cá nhân
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Nếu không phải Admin, chỉ xem thông tin cá nhân
        if hasattr(self.request, 'user') and self.request.user and self.request.user.ma_nhom_quyen.ten_nhom != 'QUAN_TRI':
            return NguoiDung.objects.filter(ma_nguoi_dung=self.request.user.ma_nguoi_dung)
        return self.queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NguoiDungCreateSerializer
        return NguoiDungSerializer


# ==================== NGHIỆP VỤ ====================

class DanhGiaCongVienViewSet(viewsets.ModelViewSet):
    """CRUD đánh giá công viên - Người dùng có thể tạo, Admin duyệt"""
    queryset = DanhGiaCongVien.objects.select_related('ma_cong_vien', 'ma_nguoi_dung')
    serializer_class = DanhGiaCongVienSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ma_cong_vien', 'da_duyet']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def danh_gia_chua_duyet(self, request):
        """Lấy danh sách đánh giá chưa duyệt (chỉ Admin)"""
        queryset = self.queryset.filter(da_duyet=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class LoaiKiemTraViewSet(viewsets.ModelViewSet):
    """CRUD loại kiểm tra - Chỉ Admin có thể tạo/sửa/xóa"""
    queryset = LoaiKiemTra.objects.all()
    serializer_class = LoaiKiemTraSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


class KiemTraCongVienViewSet(viewsets.ModelViewSet):
    """CRUD kiểm tra công viên - Chỉ Kiểm tra viên có thể tạo/sửa"""
    queryset = KiemTraCongVien.objects.select_related('ma_cong_vien', 'ma_nguoi_kiem_tra')
    serializer_class = KiemTraCongVienSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ma_cong_vien', 'ngay_kiem_tra__gte', 'ket_qua']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsInspector()]


class DanhMucSuCoViewSet(viewsets.ModelViewSet):
    """CRUD danh mục sự cố - Chỉ Admin có thể tạo/sửa/xóa"""
    queryset = DanhMucSuCo.objects.all()
    serializer_class = DanhMucSuCoSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


class BaoCaoSuCoViewSet(viewsets.ModelViewSet):
    """CRUD báo cáo sự cố - Người dùng tạo, Quản lý xử lý"""
    queryset = BaoCaoSuCo.objects.select_related(
        'ma_cong_vien', 'ma_danh_muc', 'ma_nguoi_phu_trach', 'ma_nguoi_bao_cao'
    )
    serializer_class = BaoCaoSuCoSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ma_cong_vien', 'trang_thai', 'muc_do_uu_tien']
    ordering_fields = ['-muc_do_uu_tien', '-ngay_tao']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        # Chỉ Quản lý có thể cập nhật trạng thái
        return [IsParkManager()]
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # 1. Xử lý upload ảnh (Lưu vào mảng JSON url_hinh_anh)
        images = request.FILES.getlist('hinh_anh_files')
        image_urls = []
        
        if images:
            for img in images:
                file_name = default_storage.save(f'incident_images/{img.name}', ContentFile(img.read()))
                file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
                image_urls.append(file_url)
        
        if image_urls:
            data['url_hinh_anh'] = image_urls
            
        # 2. Tự động gán người báo cáo nếu đã đăng nhập
        if request.user.is_authenticated:
            data['ma_nguoi_bao_cao'] = request.user.ma_nguoi_dung

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
            
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['patch'])
    def cap_nhat_trang_thai(self, request, pk=None):
        """Cập nhật trạng thái xử lý báo cáo"""
        bao_cao = self.get_object()
        trang_thai = request.data.get('trang_thai')
        if trang_thai:
            bao_cao.trang_thai = trang_thai
            bao_cao.save()
            return Response({'message': 'Cập nhật trạng thái thành công'})
        return Response({'error': 'trang_thai là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)


# ==================== SINH THÁI & HỆ THỐNG ====================

class LoaiCayViewSet(viewsets.ModelViewSet):
    """CRUD loại cây - Chỉ Admin có thể tạo/sửa/xóa"""
    queryset = LoaiCay.objects.all()
    serializer_class = LoaiCaySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['ten_loai', 'ten_khoa_hoc']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


class CayXanhViewSet(viewsets.ModelViewSet):
    """CRUD cây xanh - Quản lý/GIS Editor có thể tạo/sửa/xóa"""
    queryset = CayXanh.objects.select_related('ma_cong_vien', 'ma_loai_cay')
    serializer_class = CayXanhSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ma_cong_vien', 'ma_loai_cay', 'tinh_trang']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsParkManagerOrGISEditor()]
    
    @action(detail=False, methods=['get'])
    def thong_ke_tinh_trang(self, request):
        """Thống kê cây theo tình trạng sức khỏe"""
        stats = CayXanh.objects.values('tinh_trang').annotate(
            count=Count('ma_cay')
        ).order_by('tinh_trang')
        return Response(stats)


class SuKienCongVienViewSet(viewsets.ModelViewSet):
    """CRUD sự kiện công viên - Người dùng tạo, Admin duyệt"""
    queryset = SuKienCongVien.objects.select_related('ma_cong_vien')
    serializer_class = SuKienCongVienSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ma_cong_vien', 'trang_thai', 'loai_su_kien']
    ordering_fields = ['thoi_gian_bat_dau']
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [IsAdmin()]
    
    @action(detail=False, methods=['get'])
    def su_kien_sap_toi(self, request):
        """Danh sách sự kiện sắp diễn ra"""
        thoi_gian_hien_tai = timezone.now()
        thoi_gian_mot_tuan = thoi_gian_hien_tai + timedelta(days=7)
        
        queryset = self.queryset.filter(
            thoi_gian_bat_dau__gte=thoi_gian_hien_tai,
            thoi_gian_bat_dau__lte=thoi_gian_mot_tuan,
            da_duyet=True
        ).order_by('thoi_gian_bat_dau')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class NhatKyThayDoiViewSet(viewsets.ReadOnlyModelViewSet):
    """Xem lịch sử thay đổi dữ liệu - Chỉ Admin có thể xem"""
    queryset = NhatKyThayDoi.objects.select_related('ma_nguoi_dung')
    serializer_class = NhatKyThayDoiSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['bang_du_lieu', 'loai_thay_doi']
    ordering_fields = ['-ngay_thay_doi']
    permission_classes = [IsAdmin]


class ThongKeTruyenCapViewSet(viewsets.ReadOnlyModelViewSet):
    """Xem thống kê truy cập hệ thống - Chỉ Admin có thể xem"""
    queryset = ThongKetruyenCap.objects.all()
    serializer_class = ThongKeTruyenCapSerializer
    ordering_fields = ['-ngay']
    permission_classes = [IsAdmin]


# ==================== DASHBOARD THỐNG KÊ ====================

@api_view(['GET'])
def dashboard_thong_ke(request):
    """Dashboard thống kê tổng quan - Chỉ Admin"""
    try:
        # Kiểm tra quyền
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if token:
            try:
                user = NguoiDung.objects.get(token=token)
                if user.ma_nhom_quyen.ten_nhom != 'QUAN_TRI':
                    return Response(
                        {'error': 'Bạn không có quyền truy cập'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except NguoiDung.DoesNotExist:
                return Response(
                    {'error': 'Token không hợp lệ'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        stats = {
            'tong_cong_vien': CongVien.objects.filter(ma_trang_thai__ten_trang_thai='hoat_dong').count(),
            'cong_vien_can_kiem_tra': CongVien.objects.filter(
                ma_trang_thai__ten_trang_thai='hoat_dong'
            ).exclude(
                kiem_tra__ngay_kiem_tra__gte=timezone.now() - timedelta(days=30)
            ).distinct().count(),
            'baocao_su_co_cho_xu_ly': BaoCaoSuCo.objects.filter(trang_thai='cho_xu_ly').count(),
            'danh_gia_cho_duyet': DanhGiaCongVien.objects.filter(da_duyet=False).count(),
            'tong_dien_tich_m2': CongVien.objects.aggregate(
                total=Sum('dien_tich_m2')
            )['total'] or 0,
            'tong_cay_xanh': CayXanh.objects.count(),
            'cay_benh': CayXanh.objects.filter(tinh_trang='kem').count(),
        }
        return Response(stats)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

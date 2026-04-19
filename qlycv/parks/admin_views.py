from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone

from .models import (
    NguoiDung, NhomQuyen, DanhGiaCongVien, SuKienCongVien, 
    BaoCaoSuCo, HinhAnhCongVien, CongVien
)
from .serializers import NguoiDungSerializer, NguoiDungCreateSerializer, NguoiDungAdminUpdateSerializer
from .permissions import IsAdmin
from django.contrib.auth.hashers import make_password


class AdminUsersViewSet(viewsets.ModelViewSet):
    queryset = NguoiDung.objects.select_related('ma_nhom_quyen')
    serializer_class = NguoiDungSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['ten_dang_nhap', 'email', 'ho_ten']
    filterset_fields = ['ma_nhom_quyen', 'dang_hoat_dong']
    ordering_fields = ['-ngay_cap_nhat', 'ho_ten', 'ten_dang_nhap']

    def get_serializer_class(self):
        if self.action == 'create':
            return NguoiDungCreateSerializer
        if self.action in ['update', 'partial_update']:
            return NguoiDungAdminUpdateSerializer
        return NguoiDungSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = NguoiDungCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def disable(self, request, pk=None):
        user = self.get_object()
        user.dang_hoat_dong = False
        user.save()
        return Response({
            'message': f'Đã khóa tài khoản {user.ten_dang_nhap}',
            'user': NguoiDungSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def enable(self, request, pk=None):
        user = self.get_object()
        user.dang_hoat_dong = True
        user.save()
        return Response({
            'message': f'Đã kích hoạt tài khoản {user.ten_dang_nhap}',
            'user': NguoiDungSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        try:
            role = NhomQuyen.objects.get(ma_nhom_quyen=role_id)
            user.ma_nhom_quyen = role
            user.save()
            return Response({
                'message': f'Đã cập nhật vai trò thành {role.get_ten_nhom_display()}',
                'user': NguoiDungSerializer(user).data
            })
        except NhomQuyen.DoesNotExist:
            return Response(
                {'error': 'Vai trò không tồn tại'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        return Response({
            'total_users': NguoiDung.objects.count(),
            'active_users': NguoiDung.objects.filter(dang_hoat_dong=True).count(),
            'disabled_users': NguoiDung.objects.filter(dang_hoat_dong=False).count(),
            'by_role': list(
                NhomQuyen.objects.annotate(count=Count('nguoi_dung')).values('ten_nhom', 'count')
            ),
            'recently_created': list(
                NguoiDung.objects.order_by('-ngay_tao')[:5].values(
                    'ma_nguoi_dung', 'ten_dang_nhap', 'ho_ten', 'ngay_tao'
                )
            )
        })
    
    @action(detail=False, methods=['post'])
    def reset_password(self, request):
        user_id = request.data.get('user_id')
        new_password = request.data.get('password')
        
        try:
            user = NguoiDung.objects.get(ma_nguoi_dung=user_id)
            user.mat_khau_hash = make_password(new_password)
            user.save()
            return Response({
                'message': f'Đã reset mật khẩu cho người dùng {user.ten_dang_nhap}',
                'new_password': new_password
            })
        except NguoiDung.DoesNotExist:
            return Response(
                {'error': 'Người dùng không tồn tại'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminRatingsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DanhGiaCongVien.objects.select_related('ma_cong_vien', 'ma_nguoi_dung')
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ma_cong_vien', 'da_duyet']
    ordering_fields = ['-ngay_tao', 'diem_tong_quat']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        rating = self.get_object()
        rating.da_duyet = True
        rating.save()
        return Response({'message': f'Đã phê duyệt đánh giá ID {pk}'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        rating = self.get_object()
        rating.delete()
        return Response({'message': f'Đã xóa đánh giá ID {pk}'})
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending_ratings = self.get_queryset().filter(da_duyet=False)
        page = self.paginate_queryset(pending_ratings)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(pending_ratings, many=True)
        return Response({
            'count': pending_ratings.count(),
            'results': serializer.data
        })


class AdminEventsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SuKienCongVien.objects.select_related('ma_cong_vien')
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ma_cong_vien', 'da_duyet']
    ordering_fields = ['-ngay_tao', 'thoi_gian_bat_dau']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        event = self.get_object()
        event.da_duyet = True
        event.save()
        return Response({'message': f'Đã phê duyệt sự kiện ID {pk}'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        event = self.get_object()
        event.delete()
        return Response({'message': f'Đã xóa sự kiện ID {pk}'})
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending_events = self.get_queryset().filter(da_duyet=False)
        return Response({
            'count': pending_events.count(),
            'results': list(pending_events.values(
                'ma_su_kien', 'ten_su_kien', 'loai_su_kien', 'thoi_gian_bat_dau',
                'ma_cong_vien__ten_cong_vien', 'ngay_tao'
            ))
        })


class AdminIncidentsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BaoCaoSuCo.objects.select_related('ma_cong_vien', 'ma_nguoi_dung')
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ma_cong_vien', 'trang_thai']
    ordering_fields = ['-ngay_tao', 'trang_thai']
    
    @action(detail=True, methods=['post'])
    def mark_resolved(self, request, pk=None):
        incident = self.get_object()
        incident.trang_thai = 'da_xu_ly'
        incident.ghi_chu = request.data.get('note', '')
        incident.save()
        return Response({'message': f'Đã xử lý báo cáo ID {pk}'})
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending = self.get_queryset().filter(trang_thai='cho_xu_ly')
        return Response({
            'count': pending.count(),
            'urgent': pending.count(),
            'results': list(pending.values(
                'ma_bao_cao', 'noi_dung', 'trang_thai', 
                'ma_cong_vien__ten_cong_vien', 'ma_nguoi_dung__ho_ten', 'ngay_tao'
            ))
        })


class AdminImagesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HinhAnhCongVien.objects.select_related('ma_cong_vien', 'ma_nguoi_dung')
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ma_cong_vien', 'da_duyet']
    ordering_fields = ['-ngay_tao']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        image = self.get_object()
        image.da_duyet = True
        image.save()
        return Response({'message': f'Đã phê duyệt hình ảnh ID {pk}'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        image = self.get_object()
        image.delete()
        return Response({'message': f'Đã xóa hình ảnh ID {pk}'})
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending_images = self.get_queryset().filter(da_duyet=False)
        return Response({
            'count': pending_images.count(),
            'results': list(pending_images.values(
                'ma_hinh_anh', 'ma_cong_vien__ten_cong_vien', 
                'ma_nguoi_dung__ho_ten', 'ngay_tao'
            ))
        })


@api_view(['GET'])
def admin_dashboard(request):
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
    
    return Response({
        'system_stats': {
            'total_users': NguoiDung.objects.count(),
            'active_users': NguoiDung.objects.filter(dang_hoat_dong=True).count(),
            'total_parks': CongVien.objects.count(),
        },
        'pending_approvals': {
            'ratings': DanhGiaCongVien.objects.filter(da_duyet=False).count(),
            'events': SuKienCongVien.objects.filter(da_duyet=False).count(),
            'images': HinhAnhCongVien.objects.filter(da_duyet=False).count(),
            'incidents': BaoCaoSuCo.objects.filter(trang_thai='cho_xu_ly').count(),
        },
        'recent_users': list(
            NguoiDung.objects.order_by('-ngay_tao')[:5].values(
                'ma_nguoi_dung', 'ten_dang_nhap', 'ho_ten', 'ngay_tao'
            )
        ),
        'recent_incidents': list(
            BaoCaoSuCo.objects.order_by('-ngay_tao')[:5].values(
                'ma_bao_cao', 'trang_thai', 'noi_dung', 'ngay_tao'
            )
        ),
        'timestamp': timezone.now()
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_system_log(request):
    action = request.data.get('action')
    details = request.data.get('details')
    return Response({
        'message': 'Hành động đã được ghi nhận',
        'timestamp': timezone.now()
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def system_settings(request):
    if request.method == 'GET':
        return Response({
            'system': {
                'version': '1.0.0',
                'database': 'SQLite/PostgreSQL',
                'debug': False,
            },
            'features': {
                'ratings_enabled': True,
                'events_enabled': True,
                'incidents_enabled': True,
                'image_upload_enabled': True,
            },
            'limits': {
                'max_image_size_mb': 5,
                'max_description_length': 1000,
                'min_rating': 1,
                'max_rating': 5,
            }
        })

from rest_framework.permissions import BasePermission
from .models import NguoiDung


class IsAuthenticated(BasePermission):
    """
    Kiểm tra authentication bằng token.
    Bind user vào request.user để các permission class khác sử dụng.
    """
    def has_permission(self, request, view):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return False
        
        try:
            user = NguoiDung.objects.get(token=token)
            request.user = user
            return True
        except NguoiDung.DoesNotExist:
            return False


class IsGuest(IsAuthenticated):
    """Khách - Chỉ đọc (GET)."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.ma_nhom_quyen.ten_nhom == 'KHACH'


class IsUser(IsAuthenticated):
    """Người dùng cộng đồng - Đọc + đánh giá/báo cáo."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.ma_nhom_quyen.ten_nhom == 'CONG_DONG'


class IsParkManager(IsAuthenticated):
    """
    Quản lý công viên - Quản lý 1 công viên cụ thể.
    
    Quyền:
    - Xử lý sự cố (BaoCaoSuCo): Create, Update, Delete
    - Cập nhật tiện ích (TienIchCongVien): Update status
    - Thêm sự kiện (SuKienCongVien): Create
    
    KHÔNG được:
    - Cập nhật trạng thái công viên (chỉ Admin)
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.ma_nhom_quyen.ten_nhom == 'QUAN_LY'
    
    def has_object_permission(self, request, view, obj):
        """
        Kiểm tra xem manager này có quản lý công viên này không.
        """
        # Admin always has permission
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        
        # Nếu object là CongVien
        if hasattr(obj, 'ma_cong_vien'):
            return obj == request.user.ma_cong_vien
        
        # Nếu object có ma_cong_vien (BaoCaoSuCo, TienIchCongVien, SuKienCongVien)
        if hasattr(obj, 'ma_cong_vien'):
            return obj.ma_cong_vien == request.user.ma_cong_vien
        
        return False


class IsAdmin(IsAuthenticated):
    """Admin - Toàn quyền."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI'


class IsReadOnly(IsAuthenticated):
    """Chỉ cho phép GET (đọc)."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.method in ['GET', 'HEAD', 'OPTIONS']


class IsManagerOrAdmin(IsAuthenticated):
    """Manager hoặc Admin."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.ma_nhom_quyen.ten_nhom in ['QUAN_LY', 'QUAN_TRI']


class CanCreatePark(IsAdmin):
    """
    Chỉ admin được tạo/chỉnh sửa công viên.
    Mọi người có thể xem (GET công khai).
    """
    def has_permission(self, request, view):
        if request.method == 'GET':
            return True
        return super().has_permission(request, view)


class CanUpdateParkStatus(IsAdmin):
    """
    Chỉ Admin được cập nhật trạng thái công viên.
    Manager KHÔNG được cập nhật trạng thái.
    """
    def has_permission(self, request, view):
        if not isinstance(super(), IsAuthenticated):
            return False
        # Chỉ Admin được phép
        return request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI'


class CanHandleIncident(IsManagerOrAdmin):
    """
    Manager/Admin có thể xử lý báo cáo sự cố.
    - Manager: chỉ xử lý sự cố của công viên mình quản lý
    - Admin: xử lý tất cả
    """
    def has_object_permission(self, request, view, obj):
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        # Manager chỉ xử lý sự cố của công viên mình
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_LY':
            return obj.ma_cong_vien == request.user.ma_cong_vien
        return False


class CanManageAmenities(IsManagerOrAdmin):
    """
    Manager/Admin có thể cập nhật tiện ích.
    - Manager: chỉ cập nhật tiện ích của công viên mình quản lý
    - Admin: cập nhật tất cả
    """
    def has_object_permission(self, request, view, obj):
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        # Manager chỉ quản lý tiện ích của công viên mình
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_LY':
            return obj.ma_cong_vien == request.user.ma_cong_vien
        return False


class CanCreateEvent(IsManagerOrAdmin):
    """
    Manager/Admin có thể tạo sự kiện.
    - Manager: tạo sự kiện cho công viên mình quản lý
    - Admin: tạo tất cả
    """
    def has_permission(self, request, view):
        return super().has_permission(request, view)
    
    def has_object_permission(self, request, view, obj):
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        # Manager chỉ tạo sự kiện của công viên mình
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_LY':
            return obj.ma_cong_vien == request.user.ma_cong_vien
        return False


class CanRateAndReview(IsAuthenticated):
    """Người dùng xác thực có thể đánh giá/nhận xét."""
    def has_permission(self, request, view):
        return super().has_permission(request, view)


class CanReportIncident(IsAuthenticated):
    """Người dùng xác thực có thể báo cáo sự cố."""
    def has_permission(self, request, view):
        return super().has_permission(request, view)


# Legacy aliases for backward compatibility
class IsGISEditor(IsAdmin):
    """Legacy - Alias của IsAdmin."""
    pass


class IsParkManagerOrGISEditor(IsManagerOrAdmin):
    """Legacy - Manager hoặc Admin."""
    pass


class IsInspector(IsAdmin):
    """Legacy - Alias của IsAdmin."""
    pass


class IsOwnerOrAdmin(IsAuthenticated):
    """Owner hoặc Admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        
        if hasattr(obj, 'ma_nguoi_dung'):
            return obj.ma_nguoi_dung == request.user.ma_nguoi_dung
        
        return False

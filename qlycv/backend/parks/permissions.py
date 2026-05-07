from rest_framework.permissions import BasePermission

from .models import NguoiDung


class TokenPermission(BasePermission):
    allowed_roles = None

    def get_user(self, request):
        token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
        if not token:
            return None
        try:
            return NguoiDung.objects.get(token=token)
        except NguoiDung.DoesNotExist:
            return None

    def has_permission(self, request, view):
        user = self.get_user(request)
        if not user:
            return False
        request.user = user
        if self.allowed_roles is None:
            return True
        return user.ma_nhom_quyen and user.ma_nhom_quyen.ten_nhom in self.allowed_roles


class IsAuthenticated(TokenPermission):
    pass


class IsGuest(TokenPermission):
    allowed_roles = ['KHACH']


class IsUser(TokenPermission):
    allowed_roles = ['CONG_DONG']


class IsParkManager(TokenPermission):
    allowed_roles = ['QUAN_LY']

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, 'ma_cong_vien') or not request.user.ma_cong_vien:
            return False
        park = obj if obj.__class__.__name__ == 'CongVien' else getattr(obj, 'ma_cong_vien', None)
        return park == request.user.ma_cong_vien


class IsAdmin(TokenPermission):
    allowed_roles = ['QUAN_TRI']


class IsReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in ['GET', 'HEAD', 'OPTIONS']


class IsManagerOrAdmin(TokenPermission):
    allowed_roles = ['QUAN_LY', 'QUAN_TRI']


class CanCreatePark(IsAdmin):
    pass


class CanUpdateParkStatus(IsAdmin):
    pass


class CanHandleIncident(IsManagerOrAdmin):
    def has_object_permission(self, request, view, obj):
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        return request.user.ma_cong_vien and obj.ma_cong_vien == request.user.ma_cong_vien


class CanManageAmenities(IsManagerOrAdmin):
    def has_object_permission(self, request, view, obj):
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        return request.user.ma_cong_vien and obj.ma_cong_vien == request.user.ma_cong_vien


class CanCreateEvent(IsManagerOrAdmin):
    def has_object_permission(self, request, view, obj):
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        return request.user.ma_cong_vien and obj.ma_cong_vien == request.user.ma_cong_vien


class CanRateAndReview(TokenPermission):
    allowed_roles = ['CONG_DONG', 'QUAN_LY', 'QUAN_TRI']


class CanReportIncident(TokenPermission):
    allowed_roles = ['CONG_DONG', 'QUAN_LY', 'QUAN_TRI']


class IsGISEditor(IsAdmin):
    pass


class IsParkManagerOrGISEditor(IsManagerOrAdmin):
    pass


class IsInspector(IsAdmin):
    pass


class IsOwnerOrAdmin(IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        if hasattr(obj, 'ma_nguoi_dung'):
            return obj.ma_nguoi_dung == request.user.ma_nguoi_dung
        return False

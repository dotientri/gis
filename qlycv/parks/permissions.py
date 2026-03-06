"""
Custom Permission Classes for Parks GIS System
Xác định quyền hạn cho từng loại người dùng
"""

from rest_framework.permissions import BasePermission
from .models import NguoiDung


class IsAuthenticated(BasePermission):
    """Kiểm tra người dùng đã xác thực (có token hợp lệ)"""
    
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


class IsAdmin(IsAuthenticated):
    """Chỉ Admin (QUAN_TRI) mới có quyền"""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        return request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI'


class IsParkManager(IsAuthenticated):
    """Quản lý công viên (QUAN_LY_CV) hoặc Admin (QUAN_TRI)"""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        role = request.user.ma_nhom_quyen.ten_nhom
        return role in ['QUAN_TRI', 'QUAN_LY_CV']


class IsGISEditor(IsAuthenticated):
    """Biên tập viên GIS (BIEN_TAP_GIS) hoặc Admin"""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        role = request.user.ma_nhom_quyen.ten_nhom
        return role in ['QUAN_TRI', 'BIEN_TAP_GIS']


class IsParkManagerOrGISEditor(IsAuthenticated):
    """Quản lý công viên hoặc Biên tập viên GIS"""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        role = request.user.ma_nhom_quyen.ten_nhom
        return role in ['QUAN_TRI', 'QUAN_LY_CV', 'BIEN_TAP_GIS']


class IsInspector(IsAuthenticated):
    """Nhân viên kiểm tra (KIEM_TRA) hoặc Admin"""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        role = request.user.ma_nhom_quyen.ten_nhom
        return role in ['QUAN_TRI', 'KIEM_TRA']


class IsOwnerOrAdmin(IsAuthenticated):
    """Chủ sở hữu tài khoản hoặc Admin"""
    
    def has_object_permission(self, request, view, obj):
        # Admin có thể truy cập tất cả
        if request.user.ma_nhom_quyen.ten_nhom == 'QUAN_TRI':
            return True
        
        # Người dùng có thể truy cập tài khoản của chính mình
        if hasattr(obj, 'ma_nguoi_dung'):
            return obj.ma_nguoi_dung == request.user.ma_nguoi_dung
        
        return False


class CanCreatePark(IsAuthenticated):
    """
    Chỉ có thể tạo công viên nếu:
    - Admin (QUAN_TRI)
    - Quản lý công viên (QUAN_LY_CV)
    - Biên tập viên GIS (BIEN_TAP_GIS)
    """
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Cho phép GET cho tất cả (đã xác thực)
        if request.method == 'GET':
            return True
        
        # Chỉ cho phép CREATE, UPDATE, DELETE cho các vai trò có quyền
        role = request.user.ma_nhom_quyen.ten_nhom
        return role in ['QUAN_TRI', 'QUAN_LY_CV', 'BIEN_TAP_GIS']


class CanRateAndReview(IsAuthenticated):
    """Người dùng xác thực có thể đánh giá"""
    
    def has_permission(self, request, view):
        return super().has_permission(request, view)


class CanReportIncident(IsAuthenticated):
    """Người dùng xác thực có thể báo cáo sự cố"""
    
    def has_permission(self, request, view):
        return super().has_permission(request, view)

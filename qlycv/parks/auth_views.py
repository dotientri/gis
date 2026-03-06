"""
Authentication API Views
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q
from .models import NguoiDung, NhomQuyen
from .serializers import NguoiDungSerializer
import hashlib
import uuid


def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token():
    """Generate a unique token"""
    return str(uuid.uuid4())


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login"""
    # Chấp nhận ten_dang_nhap, username HOẶC email
    identifier = request.data.get('ten_dang_nhap') or request.data.get('username') or request.data.get('email')
    mat_khau = request.data.get('mat_khau') or request.data.get('password')
    
    if not identifier or not mat_khau:
        return Response(
            {'error': 'Vui lòng cung cấp tên đăng nhập/email và mật khẩu'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Tìm user theo tên đăng nhập HOẶC email
        user = NguoiDung.objects.get(Q(ten_dang_nhap=identifier) | Q(email=identifier))
    except NguoiDung.DoesNotExist:
        return Response(
            {'error': 'Tên đăng nhập hoặc mật khẩu không chính xác'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Hash password to verify
    password_hash = hash_password(mat_khau)
    
    if user.mat_khau_hash != password_hash:
        return Response(
            {'error': 'Tên đăng nhập hoặc mật khẩu không chính xác'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.dang_hoat_dong:
        return Response(
            {'error': 'Tài khoản của bạn đã bị vô hiệu hóa'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate or reuse token
    if not user.token:
        user.token = generate_token()
        user.save(update_fields=['token'])
    
    return Response({
        'token': user.token,
        'user': NguoiDungSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration"""
    ten_dang_nhap = request.data.get('ten_dang_nhap')
    email = request.data.get('email')
    password = request.data.get('password')
    ho_ten = request.data.get('ho_ten', '')
    
    if not all([ten_dang_nhap, email, password]):
        return Response(
            {'error': 'Vui lòng cung cấp tên đăng nhập, email và mật khẩu'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if NguoiDung.objects.filter(ten_dang_nhap=ten_dang_nhap).exists():
        return Response(
            {'error': 'Tên đăng nhập đã tồn tại'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if NguoiDung.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email đã được đăng ký'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get default user group (Người dùng cộng đồng)
    try:
        user_group = NhomQuyen.objects.get(ten_nhom='CONG_DONG')
    except NhomQuyen.DoesNotExist:
        user_group = None
    
    # Hash password
    password_hash = hash_password(password)
    token = generate_token()
    
    user = NguoiDung.objects.create(
        ten_dang_nhap=ten_dang_nhap,
        email=email,
        mat_khau_hash=password_hash,
        ho_ten=ho_ten,
        ma_nhom_quyen=user_group,
        token=token
    )
    
    return Response({
        'token': user.token,
        'user': NguoiDungSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_current_user(request):
    """Get current user info"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return Response(
            {'error': 'Token not provided'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        user = NguoiDung.objects.get(token=token)
        return Response(
            NguoiDungSerializer(user).data,
            status=status.HTTP_200_OK
        )
    except NguoiDung.DoesNotExist:
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_401_UNAUTHORIZED
        )

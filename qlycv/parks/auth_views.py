from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q
from .models import NguoiDung, NhomQuyen
from .serializers import NguoiDungSerializer
from django.contrib.auth.hashers import make_password, check_password
import uuid


def generate_token():
    """Generate a unique token"""
    return str(uuid.uuid4())


import logging
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    identifier = request.data.get('ten_dang_nhap') or request.data.get('username') or request.data.get('email')
    mat_khau = request.data.get('mat_khau') or request.data.get('password')
    
    logger.info(f"Login attempt with identifier: '{identifier}'")
    if identifier:
        identifier = str(identifier).strip()
    if mat_khau:
        mat_khau = str(mat_khau).strip()

    if not identifier or not mat_khau:
        logger.warning("Login failed: Identifier or password not provided.")
        return Response(
            {'error': 'Vui lòng cung cấp tên đăng nhập/email và mật khẩu'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = NguoiDung.objects.get(Q(ten_dang_nhap__iexact=identifier) | Q(email__iexact=identifier))
        logger.info(f"User found: {user.ten_dang_nhap}")
    except NguoiDung.DoesNotExist:
        logger.warning(f"Login failed: User with identifier '{identifier}' not found.")
        return Response(
            {'error': 'Tên đăng nhập hoặc mật khẩu không chính xác'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not check_password(mat_khau, user.mat_khau_hash):
        logger.warning(f"Login failed: Password mismatch for user '{user.ten_dang_nhap}'.")
        return Response(
            {'error': 'Tên đăng nhập hoặc mật khẩu không chính xác'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.dang_hoat_dong:
        logger.warning(f"Login failed: User '{user.ten_dang_nhap}' is inactive.")
        return Response(
            {'error': 'Tài khoản của bạn đã bị vô hiệu hóa'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.token:
        user.token = generate_token()
        user.save(update_fields=['token'])
    
    logger.info(f"Login successful for user '{user.ten_dang_nhap}'.")
    return Response({
        'token': user.token,
        'user': NguoiDungSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    ten_dang_nhap = request.data.get('ten_dang_nhap')
    email = request.data.get('email')
    password = request.data.get('password')
    ho_ten = request.data.get('ho_ten', '')
    
    if not all([ten_dang_nhap, email, password]):
        return Response(
            {'error': 'Vui lòng cung cấp tên đăng nhập, email và mật khẩu'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if NguoiDung.objects.filter(ten_dang_nhap__iexact=ten_dang_nhap).exists():
        return Response(
            {'error': 'Tên đăng nhập đã tồn tại'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if NguoiDung.objects.filter(email__iexact=email).exists():
        return Response(
            {'error': 'Email đã được đăng ký'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_group = NhomQuyen.objects.get(ten_nhom='CONG_DONG')
    except NhomQuyen.DoesNotExist:
        user_group = None
    
    password_hash = make_password(password)
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

import logging
import hashlib
import smtplib
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.core.mail import EmailMessage
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import NguoiDung, NhomQuyen, YeuCauLienHe
from .serializers import NguoiDungSerializer, YeuCauLienHeSerializer

logger = logging.getLogger(__name__)


def generate_token():
    return str(uuid.uuid4())


def verify_password(raw_password, stored_password):
    if not raw_password or not stored_password:
        return False

    try:
        if check_password(raw_password, stored_password):
            return True
    except Exception:
        logger.warning('Stored password is not a valid Django hash for backward compatibility check.')

    legacy_sha256 = hashlib.sha256(raw_password.encode('utf-8')).hexdigest()
    if stored_password == legacy_sha256:
        return True

    if stored_password == raw_password:
        return True

    return False


def get_user_from_token(request):
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return None
    try:
        return NguoiDung.objects.get(token=token)
    except NguoiDung.DoesNotExist:
        return None


def send_reset_password_email(user):
    frontend_base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    reset_url = f"{frontend_base_url.rstrip('/')}/reset-password?token={user.reset_password_token}"
    subject = 'Khoi phuc mat khau QlyCV'
    message = (
        f'Xin chao {user.ho_ten or user.ten_dang_nhap},\n\n'
        f'Ban vua yeu cau dat lai mat khau. Truy cap duong dan sau de tiep tuc:\n{reset_url}\n\n'
        'Lien ket nay se het han sau 30 phut.'
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


def get_contact_receiver_email():
    return getattr(settings, 'CONTACT_RECEIVER_EMAIL', None) or 'dotientri0285@gmail.com'


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    identifier = request.data.get('ten_dang_nhap') or request.data.get('username') or request.data.get('email')
    mat_khau = request.data.get('mat_khau') or request.data.get('password')

    if identifier:
        identifier = str(identifier).strip()
    if mat_khau:
        mat_khau = str(mat_khau).strip()

    if not identifier or not mat_khau:
        return Response({'error': 'Vui long cung cap ten dang nhap/email va mat khau.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = NguoiDung.objects.get(Q(ten_dang_nhap__iexact=identifier) | Q(email__iexact=identifier))
    except NguoiDung.DoesNotExist:
        return Response({'error': 'Ten dang nhap hoac mat khau khong chinh xac.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not verify_password(mat_khau, user.mat_khau_hash):
        return Response({'error': 'Ten dang nhap hoac mat khau khong chinh xac.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.dang_hoat_dong:
        return Response({'error': 'Tai khoan cua ban da bi vo hieu hoa.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.mat_khau_hash.startswith('pbkdf2_'):
        user.mat_khau_hash = make_password(mat_khau)

    user.token = generate_token()
    user.so_lan_dang_nhap += 1
    user.lan_dang_nhap_cuoi = timezone.now()
    user.save(update_fields=['mat_khau_hash', 'token', 'so_lan_dang_nhap', 'lan_dang_nhap_cuoi'])

    return Response({'token': user.token, 'user': NguoiDungSerializer(user).data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    ten_dang_nhap = request.data.get('ten_dang_nhap')
    email = request.data.get('email')
    password = request.data.get('password')
    ho_ten = request.data.get('ho_ten', '')

    if not all([ten_dang_nhap, email, password]):
        return Response({'error': 'Vui long cung cap ten dang nhap, email va mat khau.'}, status=status.HTTP_400_BAD_REQUEST)

    if NguoiDung.objects.filter(ten_dang_nhap__iexact=ten_dang_nhap).exists():
        return Response({'error': 'Ten dang nhap da ton tai.'}, status=status.HTTP_400_BAD_REQUEST)

    if NguoiDung.objects.filter(email__iexact=email).exists():
        return Response({'error': 'Email da duoc dang ky.'}, status=status.HTTP_400_BAD_REQUEST)

    user_group = NhomQuyen.objects.filter(ten_nhom='CONG_DONG').first()
    user = NguoiDung.objects.create(
        ten_dang_nhap=ten_dang_nhap,
        email=email,
        mat_khau_hash=make_password(password),
        ho_ten=ho_ten,
        ma_nhom_quyen=user_group,
        token=generate_token(),
    )

    return Response({'token': user.token, 'user': NguoiDungSerializer(user).data}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
def get_current_user(request):
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        return Response(NguoiDungSerializer(user).data, status=status.HTTP_200_OK)

    email = request.data.get('email', user.email)
    ho_ten = request.data.get('ho_ten', user.ho_ten)

    if email and NguoiDung.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
        return Response({'error': 'Email da duoc su dung boi tai khoan khac.'}, status=status.HTTP_400_BAD_REQUEST)

    user.email = email
    user.ho_ten = ho_ten
    user.save(update_fields=['email', 'ho_ten', 'ngay_cap_nhat'])
    return Response(NguoiDungSerializer(user).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = str(request.data.get('email', '')).strip()
    if not email:
        return Response({'error': 'Email la bat buoc.'}, status=status.HTTP_400_BAD_REQUEST)

    user = NguoiDung.objects.filter(email__iexact=email, dang_hoat_dong=True).first()
    if user:
        user.reset_password_token = generate_token()
        user.reset_password_expires_at = timezone.now() + timedelta(minutes=30)
        user.save(update_fields=['reset_password_token', 'reset_password_expires_at'])
        try:
            send_reset_password_email(user)
        except smtplib.SMTPDataError as exc:
            logger.warning('Mailtrap rate limit when sending reset email: %s', exc)
        except Exception as exc:
            logger.exception('Failed to send reset password email: %s', exc)

    return Response({'message': 'Neu email ton tai trong he thong, huong dan dat lai mat khau da duoc gui.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token = str(request.data.get('token', '')).strip()
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')

    if not token or not password or not confirm_password:
        return Response({'error': 'Token va mat khau moi la bat buoc.'}, status=status.HTTP_400_BAD_REQUEST)

    if password != confirm_password:
        return Response({'error': 'Mat khau xac nhan khong khop.'}, status=status.HTTP_400_BAD_REQUEST)

    user = NguoiDung.objects.filter(reset_password_token=token).first()
    if not user or not user.reset_password_expires_at or user.reset_password_expires_at < timezone.now():
        return Response({'error': 'Lien ket dat lai mat khau khong hop le hoac da het han.'}, status=status.HTTP_400_BAD_REQUEST)

    user.mat_khau_hash = make_password(password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    user.token = generate_token()
    user.save(update_fields=['mat_khau_hash', 'reset_password_token', 'reset_password_expires_at', 'token'])

    return Response({'message': 'Da dat lai mat khau thanh cong.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
def change_password(request):
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not current_password or not new_password or not confirm_password:
        return Response({'error': 'Vui long dien day du thong tin doi mat khau.'}, status=status.HTTP_400_BAD_REQUEST)

    if not verify_password(current_password, user.mat_khau_hash):
        return Response({'error': 'Mat khau hien tai khong chinh xac.'}, status=status.HTTP_400_BAD_REQUEST)

    if new_password != confirm_password:
        return Response({'error': 'Mat khau moi va xac nhan mat khau khong khop.'}, status=status.HTTP_400_BAD_REQUEST)

    user.mat_khau_hash = make_password(new_password)
    user.token = generate_token()
    user.save(update_fields=['mat_khau_hash', 'token'])

    return Response({'message': 'Da doi mat khau thanh cong.', 'token': user.token}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_contact_request(request):
    user = get_user_from_token(request)
    payload = request.data.copy()

    if user:
        payload['ma_nguoi_dung'] = user.ma_nguoi_dung
        payload['ho_ten'] = payload.get('ho_ten') or user.ho_ten or user.ten_dang_nhap
        payload['email'] = payload.get('email') or user.email

    serializer = YeuCauLienHeSerializer(data=payload)
    serializer.is_valid(raise_exception=True)

    contact_request = YeuCauLienHe.objects.create(
        **serializer.validated_data,
        ma_nguoi_dung=user,
        email_nhan=get_contact_receiver_email(),
    )

    warning = None
    sender_label = contact_request.ho_ten
    if user:
        sender_label = f'{sender_label} ({user.ten_dang_nhap})'

    email_body = (
        f'Nguoi gui: {sender_label}\n'
        f'Email: {contact_request.email}\n'
        f'So dien thoai: {contact_request.so_dien_thoai or "Khong cung cap"}\n'
        f'Nguon: {contact_request.nguon_truy_cap or "Khong ro"}\n\n'
        f'Noi dung:\n{contact_request.noi_dung}'
    )

    try:
        message = EmailMessage(
            subject=f'[QlyCV] {contact_request.tieu_de}',
            body=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[contact_request.email_nhan],
            reply_to=[contact_request.email] if contact_request.email else None,
        )
        message.send(fail_silently=False)
    except Exception as exc:
        logger.exception('Failed to send contact request email: %s', exc)
        warning = 'Yeu cau da duoc luu, nhung he thong gui email dang tam thoi gap loi.'

    response_data = YeuCauLienHeSerializer(contact_request).data
    response_data['message'] = 'Da gui yeu cau lien he thanh cong.'
    if warning:
        response_data['warning'] = warning

    return Response(response_data, status=status.HTTP_201_CREATED)

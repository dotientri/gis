from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from . import debug_views
from . import admin_views

router = DefaultRouter()
router.register(r'quan-huyen', views.QuanHuyenViewSet)
router.register(r'phuong-xa', views.PhuongXaViewSet)
router.register(r'loai-cong-vien', views.LoaiCongVienViewSet)
router.register(r'trang-thai-cong-vien', views.TrangThaiCongVienViewSet)
router.register(r'cong-vien', views.CongVienViewSet, basename='cong-vien')
router.register(r'loai-tien-ich', views.LoaiTienIchViewSet)
router.register(r'tien-ich-cong-vien', views.TienIchCongVienViewSet)
router.register(r'hinh-anh-cong-vien', views.HinhAnhCongVienViewSet)
router.register(r'nhom-quyen', views.NhomQuyenViewSet)
router.register(r'nguoi-dung', views.NguoiDungViewSet, basename='nguoi-dung')
router.register(r'danh-gia-cong-vien', views.DanhGiaCongVienViewSet)
router.register(r'loai-kiem-tra', views.LoaiKiemTraViewSet)
router.register(r'kiem-tra-cong-vien', views.KiemTraCongVienViewSet)
router.register(r'danh-muc-su-co', views.DanhMucSuCoViewSet)
router.register(r'bao-cao-su-co', views.BaoCaoSuCoViewSet)
router.register(r'loai-cay', views.LoaiCayViewSet)
router.register(r'cay-xanh', views.CayXanhViewSet)
router.register(r'su-kien-cong-vien', views.SuKienCongVienViewSet)
router.register(r'nhat-ky-thay-doi', views.NhatKyThayDoiViewSet)
router.register(r'thong-ke-truyen-cap', views.ThongKeTruyenCapViewSet)

router.register(r'admin/users', admin_views.AdminUsersViewSet, basename='admin-users')
router.register(r'admin/ratings', admin_views.AdminRatingsViewSet, basename='admin-ratings')
router.register(r'admin/events', admin_views.AdminEventsViewSet, basename='admin-events')
router.register(r'admin/incidents', admin_views.AdminIncidentsViewSet, basename='admin-incidents')
router.register(r'admin/images', admin_views.AdminImagesViewSet, basename='admin-images')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', auth_views.login, name='api-login'),
    path('auth/register/', auth_views.register, name='api-register'),
    path('auth/me/', auth_views.get_current_user, name='api-me'),
    path('dashboard/thong-ke/', views.dashboard_thong_ke, name='api-dashboard'),
    path('debug/parks-coordinates/', debug_views.debug_parks_coordinates, name='debug-parks-coordinates'),
    path('debug/nearest-parks/', debug_views.debug_nearest_parks, name='debug-nearest-parks'),
]

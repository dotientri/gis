from django.db import connection
from django.contrib.gis.geos import Point
import math


def tim_cong_vien_gan_nhat(vi_do, kinh_do, ban_kinh_km=10):
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT * FROM tim_cong_vien_gan_nhat(%s, %s, %s)',
            [vi_do, kinh_do, ban_kinh_km]
        )
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Tính khoảng cách giữa 2 điểm dùng công thức Haversine
    Trả về khoảng cách tính bằng km
    """
    R = 6371  # Bán kính Trái Đất (km)
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_centroid_from_geojson(geojson_data):
    """
    Lấy tâm của một GeoJSON polygon
    Trả về [latitude, longitude]
    """
    if not geojson_data or 'coordinates' not in geojson_data:
        return None
    
    coords = geojson_data.get('coordinates', [])
    if not coords:
        return None
    
    # Xử lý Polygon hoặc MultiPolygon
    if geojson_data.get('type') == 'Polygon':
        exterior_ring = coords[0]
    elif geojson_data.get('type') == 'MultiPolygon':
        # Lấy polygon đầu tiên
        exterior_ring = coords[0][0]
    else:
        return None
    
    # Tính trung bình kinh độ, vĩ độ
    if not exterior_ring or len(exterior_ring) < 3:
        return None
    
    lats = [coord[1] for coord in exterior_ring]
    lons = [coord[0] for coord in exterior_ring]
    
    return [sum(lats) / len(lats), sum(lons) / len(lons)]


def get_nearest_phuong_xa(latitude, longitude):
    """
    Tìm phường/xã gần nhất dựa trên tọa độ
    Trả về PhuongXa object hoặc None
    """
    from .models import PhuongXa
    
    # Lấy tất cả phường/xã
    phuong_xa_list = PhuongXa.objects.select_related('ma_quan_huyen')
    
    if not phuong_xa_list.exists():
        return None
    
    nearest_phuong_xa = None
    min_distance = float('inf')
    
    for phuong_xa in phuong_xa_list:
        if not phuong_xa.hinh_hoc:
            continue
        
        # Lấy tâm của phường/xã
        centroid = get_centroid_from_geojson(phuong_xa.hinh_hoc)
        if not centroid:
            continue
        
        # Tính khoảng cách
        distance = haversine_distance(latitude, longitude, centroid[0], centroid[1])
        
        if distance < min_distance:
            min_distance = distance
            nearest_phuong_xa = phuong_xa
    
    return nearest_phuong_xa


def build_dia_chi(phuong_xa_obj=None, quan_huyen_obj=None, dia_chi_raw=None):
    """
    Xây dựng chuỗi địa chỉ từ phường/xã và quận/huyện
    
    Args:
        phuong_xa_obj: PhuongXa instance
        quan_huyen_obj: QuanHuyen instance
        dia_chi_raw: String địa chỉ gốc (nếu có)
    
    Returns:
        String địa chỉ được format lại
    """
    parts = []
    
    if dia_chi_raw and dia_chi_raw.strip():
        parts.append(dia_chi_raw.strip())
    
    if phuong_xa_obj:
        parts.append(f"{phuong_xa_obj.ten_phuong_xa}")
    
    if quan_huyen_obj:
        parts.append(f"{quan_huyen_obj.ten_quan_huyen}")
    
    if not parts:
        return ""
    
    # Xóa duplicates và join
    return ", ".join(dict.fromkeys(parts))

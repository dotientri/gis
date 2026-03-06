"""
Utility functions for GIS operations
"""
from django.db import connection
from django.contrib.gis.geos import Point


def tim_cong_vien_gan_nhat(vi_do, kinh_do, ban_kinh_km=10):
    """
    Tìm công viên gần nhất theo tọa độ GPS và bán kính tìm kiếm.
    
    Args:
        vi_do (float): Vĩ độ (Latitude)
        kinh_do (float): Kinh độ (Longitude)
        ban_kinh_km (float): Bán kính tìm kiếm (km), mặc định 10km
    
    Returns:
        list: Danh sách công viên (dict) sắp xếp theo khoảng cách tăng dần
    
    Example:
        >>> parks = tim_cong_vien_gan_nhat(21.0285, 105.8542, 5)
        >>> for park in parks:
        ...     print(f"{park['ten']}: {park['khoang_cach_km']:.2f}km")
    """
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT * FROM tim_cong_vien_gan_nhat(%s, %s, %s)',
            [vi_do, kinh_do, ban_kinh_km]
        )
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

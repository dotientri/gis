from django.db import connection
from django.contrib.gis.geos import Point


def tim_cong_vien_gan_nhat(vi_do, kinh_do, ban_kinh_km=10):
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT * FROM tim_cong_vien_gan_nhat(%s, %s, %s)',
            [vi_do, kinh_do, ban_kinh_km]
        )
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

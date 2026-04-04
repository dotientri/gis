import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from parks.models import CongVien

parks = CongVien.objects.all()
print(f"Total parks in database: {parks.count()}\n")

for park in parks:
    print(f"Park: {park.ten_cong_vien}")
    print(f"  ID: {park.ma_cong_vien}")
    print(f"  Center coords: {park.toa_do_trung_tam}")
    print(f"  Has boundary: {park.ranh_gioi is not None}")
    if park.ranh_gioi:
        print(f"  Boundary coords count: {len(park.ranh_gioi.get('coordinates', [[]])[0])}")
    print(f"  Status: {park.ma_trang_thai.ma_code if park.ma_trang_thai else 'None'}")
    print()

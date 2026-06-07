import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from parks.models import CongVien

parks = CongVien.objects.all()
for park in parks:
    if park.ranh_gioi:
        boundary = park.ranh_gioi
        print(f"\nPark: {park.ten_cong_vien}")
        print(f"Type: {type(boundary)}")
        if isinstance(boundary, dict):
            print(f"Keys: {list(boundary.keys())}")
            print(f"Geometry type: {boundary.get('type')}")
            coords = boundary.get('coordinates')
            if coords:
                print(f"Has coordinates: True")
                print(f"Coordinates length: {len(coords)}")
                if coords and len(coords) > 0:
                    print(f"First coord ring length: {len(coords[0])}")
                    print(f"Sample points: {coords[0][:2]}")
        else:
            print(f"Boundary is not dict: {type(boundary)}")
            print(f"First 200 chars: {str(boundary)[:200]}")

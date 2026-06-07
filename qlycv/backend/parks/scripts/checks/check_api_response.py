import os
import django
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Check what the API returns for the map endpoint
response = requests.get('http://localhost:8000/api/cong-vien/ban_do/')
data = response.json()

print(f"API Response - Number of parks: {len(data)}")
if len(data) > 0:
    park = data[0]
    print(f"\nFirst park: {park.get('ten_cong_vien')}")
    print(f"Has ranh_gioi: {'ranh_gioi' in park}")
    if 'ranh_gioi' in park:
        boundary = park['ranh_gioi']
        print(f"Boundary type: {type(boundary)}")
        if isinstance(boundary, dict):
            print(f"Geometry type: {boundary.get('type')}")
            coords = boundary.get('coordinates')
            if coords:
                print(f"Coordinates length: {len(coords)}")
        else:
            print(f"Boundary is: {str(boundary)[:100]}")

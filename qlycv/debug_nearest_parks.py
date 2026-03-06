"""
Debug script để test API tìm công viên gần nhất
Chạy trong Django shell: python manage.py shell < debug_nearest_parks.py
"""

from parks.models import CongVien
from django.contrib.gis.geos import Point
import math

def haversine(lat1, lon1, lat2, lon2):
    """Tính khoảng cách giữa 2 tọa độ GPS (km)"""
    R = 6371  # Bán kính Trái Đất (km)
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Test tọa độ - TP.HCM gần Bến Thành
test_lat = 10.7769
test_lng = 106.6966
radius_km = 50

print(f"\n📍 Test tìm công viên gần: Lat={test_lat}, Lng={test_lng}, Radius={radius_km}km")
print("=" * 80)

# Lấy tất cả công viên
all_parks = CongVien.objects.all()
print(f"\n✓ Tổng cộng {all_parks.count()} công viên trong DB")

# Kiểm tra công viên có tọa độ
parks_with_coords = [p for p in all_parks if p.toa_do_trung_tam and isinstance(p.toa_do_trung_tam, list)]
print(f"✓ Công viên có tọa độ: {len(parks_with_coords)}")

# Lọc công viên gần
nearby_parks = []
for park in all_parks:
    if not park.toa_do_trung_tam:
        continue
    
    if isinstance(park.toa_do_trung_tam, list) and len(park.toa_do_trung_tam) == 2:
        park_lat, park_lng = float(park.toa_do_trung_tam[0]), float(park.toa_do_trung_tam[1])
        distance = haversine(test_lat, test_lng, park_lat, park_lng)
        
        nearby_parks.append({
            'id': park.ma_cong_vien,
            'name': park.ten_cong_vien,
            'lat': park_lat,
            'lng': park_lng,
            'distance': distance,
            'status': park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else 'N/A'
        })

# Sắp xếp theo khoảng cách
nearby_parks.sort(key=lambda x: x['distance'])

# Lọc theo bán kính
filtered_parks = [p for p in nearby_parks if p['distance'] <= radius_km]

print(f"✓ Công viên trong bán kính {radius_km}km: {len(filtered_parks)}")
print("\n📊 Chi tiết:")
print("-" * 80)

if filtered_parks:
    for i, park in enumerate(filtered_parks[:10], 1):
        print(f"\n{i}. {park['name']}")
        print(f"   ID: {park['id']}")
        print(f"   Tọa độ: ({park['lat']:.4f}, {park['lng']:.4f})")
        print(f"   Khoảng cách: {park['distance']:.2f} km")
        print(f"   Trạng thái: {park['status']}")
else:
    print("\n❌ Không tìm thấy công viên nào!")
    print("\n🔍 Tất cả công viên có tọa độ:")
    print("-" * 80)
    for park in nearby_parks[:10]:
        print(f"{park['name']}: {park['distance']:.2f} km away")

print("\n" + "=" * 80)

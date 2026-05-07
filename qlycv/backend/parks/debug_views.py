from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CongVien
import math

@api_view(['GET'])
def debug_parks_coordinates(request):
    parks = CongVien.objects.all()
    
    parks_data = []
    parks_with_coords = 0
    parks_without_coords = 0
    
    for park in parks:
        park_info = {
            'id': park.ma_cong_vien,
            'name': park.ten_cong_vien,
            'coordinates': park.toa_do_trung_tam,
            'has_valid_coords': False
        }
        
        if park.toa_do_trung_tam and isinstance(park.toa_do_trung_tam, list) and len(park.toa_do_trung_tam) == 2:
            park_info['has_valid_coords'] = True
            parks_with_coords += 1
        else:
            parks_without_coords += 1
        
        parks_data.append(park_info)
    
    return Response({
        'total_parks': parks.count(),
        'parks_with_valid_coordinates': parks_with_coords,
        'parks_without_coordinates': parks_without_coords,
        'parks': parks_data
    })


@api_view(['POST'])
def debug_nearest_parks(request):
    try:
        lat = float(request.data.get('latitude'))
        lng = float(request.data.get('longitude'))
        radius = float(request.data.get('radius_km', 50))
    except (TypeError, ValueError):
        return Response({'error': 'Invalid parameters'}, status=400)
    
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dLon / 2) * math.sin(dLon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    
    parks = CongVien.objects.all()
    results = []
    
    for park in parks:
        if not park.toa_do_trung_tam or not isinstance(park.toa_do_trung_tam, list):
            continue
        
        if len(park.toa_do_trung_tam) == 2:
            try:
                park_lat, park_lng = float(park.toa_do_trung_tam[0]), float(park.toa_do_trung_tam[1])
                distance = haversine(lat, lng, park_lat, park_lng)
                
                results.append({
                    'id': park.ma_cong_vien,
                    'name': park.ten_cong_vien,
                    'coordinates': [park_lat, park_lng],
                    'distance_km': round(distance, 2),
                    'within_radius': distance <= radius
                })
            except (ValueError, TypeError):
                continue
    
    results.sort(key=lambda x: x['distance_km'])
    nearby = [p for p in results if p['within_radius']]
    
    return Response({
        'search_center': {'latitude': lat, 'longitude': lng},
        'radius_km': radius,
        'total_parks_checked': len(results),
        'parks_within_radius': len(nearby),
        'nearby_parks': nearby[:20],
        'all_parks_distances': results[:20]
    })

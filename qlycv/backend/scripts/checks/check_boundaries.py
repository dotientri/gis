from parks.models import CongVien

parks = CongVien.objects.all()
for park in parks:
    has_boundary = park.ranh_gioi is not None
    print(f"Park: {park.ten_cong_vien}, Has boundary: {has_boundary}")
    if has_boundary:
        print(f"  Boundary type: {type(park.ranh_gioi)}")
        print(f"  First 200 chars: {str(park.ranh_gioi)[:200]}")
    else:
        print(f"  No boundary data")

#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from parks.models import BaoCaoSuCo
from datetime import date

# Test exporting incidents
print("Testing export_excel function...")

try:
    # Get incidents from today
    queryset = BaoCaoSuCo.objects.select_related(
        'ma_cong_vien', 'ma_danh_muc', 'ma_nguoi_phu_trach', 'ma_nguoi_bao_cao'
    ).filter(is_archived=False, ngay_tao__date=date.today())
    
    print(f"✅ Found {queryset.count()} incidents")
    
    if queryset.exists():
        for incident in queryset[:3]:
            print(f"  - {incident.tieu_de}")
            print(f"    Người báo cáo: {incident.ma_nguoi_bao_cao.ten_dang_nhap if incident.ma_nguoi_bao_cao else 'None'}")
            print(f"    Người phụ trách: {incident.ma_nguoi_phu_trach.ten_dang_nhap if incident.ma_nguoi_phu_trach else 'None'}")
            print(f"    Ngày tạo: {incident.ngay_tao.strftime('%d/%m/%Y %H:%M')}")
    else:
        print("⚠️ No incidents to test")
        
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

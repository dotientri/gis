#!/usr/bin/env python
"""
GIS Park Management Tool - CLI for managing parks, trees, and geographic data
Công cụ quản lý công viên GIS - CLI để quản lý công viên, cây xanh, và dữ liệu địa lý
"""

import click
import csv
import json
import sys
import os
from datetime import datetime
from pathlib import Path
from decimal import Decimal
from tabulate import tabulate
import django
from typing import List, Dict, Any

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from parks.models import (
    CongVien, CayXanh, DanhGiaCongVien, QuanHuyen, PhuongXa,
    LoaiCongVien, TrangThaiCongVien, LoaiTienIch, TienIchCongVien,
    SuKienCongVien, KiemTraCongVien, NguoiDung, LoaiCay
)
from django.db.models import Count, Avg, Sum
from math import radians, sin, cos, sqrt, atan2, degrees

User = NguoiDung


# ==================== UTILITY FUNCTIONS ====================

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers
    """
    # convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # haversine formula 
    dlat = lat2 - lat1 
    dlon = lon2 - lon1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r


def tim_cong_vien_gan_nhat(vi_do, kinh_do, ban_kinh_km=10):
    """
    Find parks near coordinates - Python implementation without GDAL
    """
    parks = CongVien.objects.filter(
        ma_trang_thai__ma_code='hoat_dong',
        toa_do_trung_tam__isnull=False
    ).select_related('ma_quan_huyen')
    
    nearby_parks = []
    
    for park in parks:
        if park.toa_do_trung_tam and len(park.toa_do_trung_tam) >= 2:
            distance = haversine_distance(
                vi_do, kinh_do,
                park.toa_do_trung_tam[0], park.toa_do_trung_tam[1]
            )
            
            if distance <= ban_kinh_km:
                nearby_parks.append({
                    'ma_cong_vien': park.ma_cong_vien,
                    'ten': park.ten_cong_vien,
                    'quan_huyen': park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A',
                    'loai': park.ma_loai.ten_loai if park.ma_loai else 'N/A',
                    'diem_danh_gia': float(park.diem_trung_binh),
                    'khoang_cach_km': distance,
                    'toa_do': park.toa_do_trung_tam
                })
    
    # Sort by distance
    nearby_parks.sort(key=lambda x: x['khoang_cach_km'])
    
    return nearby_parks


class CustomCommand(click.Group):
    """Custom command group for better formatting"""
    def format_help(self, ctx, formatter):
        self.format_usage(ctx, formatter)
        self.format_help_text(ctx, formatter)
        if self.commands:
            with formatter.section('Commands'):
                rows = []
                for cmd_name in sorted(self.commands.keys()):
                    cmd = self.commands[cmd_name]
                    rows.append((cmd_name, cmd.get_short_help_str(100) or ''))
                formatter.write_dl(rows)


@click.group(cls=CustomCommand)
@click.version_option(version='1.0.0', prog_name='GIS Park Tool')
def cli():
    """
    🌳 GIS PARK MANAGEMENT TOOL - Quản lý Công viên GIS
    
    Công cụ quản lý toàn diện cho hệ thống công viên, cây xanh và dữ liệu địa lý.
    """
    pass


# ==================== PARKS MANAGEMENT ====================

@cli.group()
def parks():
    """🏞️  Parks Management - Quản lý Công viên"""
    pass


@parks.command()
@click.option('--district', '-d', help='Filter by district name')
@click.option('--status', '-s', help='Filter by status (hoat_dong, tam_dong, etc.)')
@click.option('--limit', '-l', default=10, help='Number of parks to display')
@click.option('--output', '-o', type=click.Choice(['table', 'json']), default='table')
def list(district, status, limit, output):
    """List all parks - Liệt kê tất cả công viên"""
    parks_query = CongVien.objects.all()
    
    if district:
        parks_query = parks_query.filter(ma_quan_huyen__ten_quan_huyen__icontains=district)
    if status:
        parks_query = parks_query.filter(ma_trang_thai__ma_code=status)
    
    parks_list = parks_query[:limit]
    
    if output == 'json':
        data = []
        for park in parks_list:
            data.append({
                'id': park.ma_cong_vien,
                'name': park.ten_cong_vien,
                'district': park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A',
                'status': park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else 'N/A',
                'area': float(park.dien_tich_m2) if park.dien_tich_m2 else 0,
                'rating': float(park.diem_trung_binh),
                'reviews': park.so_luot_danh_gia
            })
        click.echo(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        headers = ['ID', 'Name', 'District', 'Status', 'Area (m²)', 'Rating', 'Reviews']
        rows = []
        for park in parks_list:
            rows.append([
                park.ma_cong_vien,
                park.ten_cong_vien[:30],
                park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A',
                park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else 'N/A',
                f"{park.dien_tich_m2:,.0f}" if park.dien_tich_m2 else '0',
                f"{park.diem_trung_binh:.2f}",
                park.so_luot_danh_gia
            ])
        click.echo(tabulate(rows, headers=headers, tablefmt='grid'))


@parks.command()
@click.argument('park_id', type=int)
def detail(park_id):
    """Show detailed information about a park - Chi tiết công viên"""
    try:
        park = CongVien.objects.get(ma_cong_vien=park_id)
        click.secho(f"\n{'='*60}", fg='cyan')
        click.secho(f"🏞️  {park.ten_cong_vien}", fg='green', bold=True)
        click.secho(f"{'='*60}\n", fg='cyan')
        
        details = [
            ('ID', park.ma_cong_vien),
            ('Code', park.ma_code or 'N/A'),
            ('District', park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A'),
            ('Ward', park.ma_phuong_xa.ten_phuong_xa if park.ma_phuong_xa else 'N/A'),
            ('Status', park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else 'N/A'),
            ('Type', park.ma_loai.ten_loai if park.ma_loai else 'N/A'),
            ('Address', park.dia_chi or 'N/A'),
            ('Area (m²)', f"{park.dien_tich_m2:,.0f}" if park.dien_tich_m2 else 'N/A'),
            ('Green Area (m²)', f"{park.dien_tich_cay_xanh:,.0f}" if park.dien_tich_cay_xanh else 'N/A'),
            ('Water Area (m²)', f"{park.dien_tich_mat_nuoc:,.0f}" if park.dien_tich_mat_nuoc else 'N/A'),
            ('Coordinates', f"Lat: {park.toa_do_trung_tam[0]}, Lng: {park.toa_do_trung_tam[1]}" if park.toa_do_trung_tam else 'N/A'),
            ('Manager', park.don_vi_quan_ly or 'N/A'),
            ('Phone', park.so_dien_thoai or 'N/A'),
            ('Email', park.email or 'N/A'),
            ('24/7 Open', 'Yes' if park.mo_cua_24_7 else 'No'),
            ('Free Entry', 'Yes' if park.mien_phi_vao_cua else f"₫{park.gia_ve:,.0f}" if park.gia_ve else 'N/A'),
            ('Est. Year', park.nam_thanh_lap or 'N/A'),
            ('Rating', f"{park.diem_trung_binh:.2f}/5.0"),
            ('Reviews', park.so_luot_danh_gia),
            ('Verified', '✓' if park.da_xac_minh else '✗'),
            ('Created', park.ngay_tao.strftime('%Y-%m-%d %H:%M')),
            ('Updated', park.ngay_cap_nhat.strftime('%Y-%m-%d %H:%M')),
        ]
        
        for key, value in details:
            click.echo(f"  {key:.<25} {value}")
        
        if park.mo_ta:
            click.secho(f"\n📝 Description:", fg='blue', bold=True)
            click.echo(f"  {park.mo_ta}")
        
        # Show amenities
        amenities = park.tien_ich.all()
        if amenities:
            click.secho(f"\n🛠️  Amenities: ", fg='blue', bold=True)
            for amenity in amenities:
                status_color = 'green' if amenity.dang_su_dung else 'red'
                click.echo(f"  • {amenity.ma_loai_tien_ich.ten_loai}: {amenity.so_luong} units - {amenity.tinh_trang} ({amenity.get_tinh_trang_display()})")
        
        # Show trees count
        trees_count = CayXanh.objects.filter(ma_cong_vien=park).count()
        if trees_count > 0:
            click.secho(f"\n🌳 Trees: {trees_count}", fg='green')
        
        click.secho(f"\n{'='*60}\n", fg='cyan')
        
    except CongVien.DoesNotExist:
        click.secho(f"❌ Park with ID {park_id} not found", fg='red', err=True)
        sys.exit(1)


@parks.command()
@click.argument('file_path', type=click.Path(exists=True))
@click.option('--update', is_flag=True, help='Update existing parks instead of skipping')
def import_csv(file_path, update):
    """Import parks from CSV file - Nhập dữ liệu công viên từ file CSV"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            created = 0
            updated = 0
            
            with click.progressbar(reader, label='Importing parks') as bar:
                for row in bar:
                    try:
                        # Try to get or create district
                        district = None
                        if row.get('district'):
                            district, _ = QuanHuyen.objects.get_or_create(
                                ten_quan_huyen=row['district'],
                                defaults={'ma_code': row['district'].lower().replace(' ', '_')}
                            )
                        
                        park_defaults = {
                            'ten_cong_vien': row.get('name', 'Unnamed Park'),
                            'dia_chi': row.get('address', ''),
                            'ma_quan_huyen': district,
                            'dien_tich_m2': Decimal(row.get('area', 0)) if row.get('area') else None,
                            'dien_tich_cay_xanh': Decimal(row.get('green_area', 0)) if row.get('green_area') else None,
                            'don_vi_quan_ly': row.get('manager', ''),
                            'so_dien_thoai': row.get('phone', ''),
                            'email': row.get('email', ''),
                            'nam_thanh_lap': int(row['year']) if row.get('year', '').isdigit() else None,
                            'mo_ta': row.get('description', ''),
                            'mien_phi_vao_cua': row.get('free_entry', 'true').lower() == 'true',
                        }
                        
                        if row.get('coordinates'):
                            try:
                                coords = json.loads(row['coordinates'])
                                park_defaults['toa_do_trung_tam'] = coords
                            except:
                                pass
                        
                        park, created_flag = CongVien.objects.get_or_create(
                            ma_code=row.get('code'),
                            defaults=park_defaults
                        )
                        
                        if created_flag:
                            created += 1
                        elif update:
                            for key, value in park_defaults.items():
                                setattr(park, key, value)
                            park.save()
                            updated += 1
                    
                    except Exception as e:
                        click.echo(f"Error processing row: {str(e)}", err=True)
        
        click.secho(f"\n✅ Import completed!", fg='green', bold=True)
        click.echo(f"  Created: {created} parks")
        click.echo(f"  Updated: {updated} parks")
        
    except Exception as e:
        click.secho(f"❌ Error: {str(e)}", fg='red', err=True)
        sys.exit(1)


@parks.command()
@click.argument('output_file', type=click.Path())
@click.option('--format', '-f', type=click.Choice(['csv', 'geojson', 'json']), default='csv')
@click.option('--district', '-d', help='Filter by district')
def export(output_file, format, district):
    """Export parks data - Xuất dữ liệu công viên"""
    parks_query = CongVien.objects.all()
    
    if district:
        parks_query = parks_query.filter(ma_quan_huyen__ten_quan_huyen__icontains=district)
    
    parks_list = parks_query.values()
    
    try:
        if format == 'csv':
            export_to_csv(parks_list, output_file)
        elif format == 'geojson':
            export_to_geojson(parks_query, output_file)
        else:
            export_to_json(parks_list, output_file)
        
        click.secho(f"✅ Exported {parks_query.count()} parks to {output_file}", fg='green')
    except Exception as e:
        click.secho(f"❌ Error: {str(e)}", fg='red', err=True)
        sys.exit(1)


def export_to_csv(data, filepath):
    """Export data to CSV"""
    if not data:
        click.secho("No data to export", fg='yellow')
        return
    
    data_list = list(data)
    keys = data_list[0].keys() if data_list else []
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        for row in data_list:
            writer.writerow({k: v for k, v in row.items()})


def export_to_json(data, filepath):
    """Export data to JSON"""
    data_list = list(data)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data_list, f, indent=2, ensure_ascii=False, default=str)


def export_to_geojson(parks, filepath):
    """Export parks to GeoJSON format"""
    features = []
    
    for park in parks:
        if park.toa_do_trung_tam:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [park.toa_do_trung_tam[1], park.toa_do_trung_tam[0]]
                },
                "properties": {
                    "id": park.ma_cong_vien,
                    "name": park.ten_cong_vien,
                    "district": park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A',
                    "address": park.dia_chi,
                    "area": float(park.dien_tich_m2) if park.dien_tich_m2 else 0,
                    "rating": float(park.diem_trung_binh),
                    "status": park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else 'N/A'
                }
            }
            features.append(feature)
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)


# ==================== GEOGRAPHIC ANALYSIS ====================

@cli.group()
def geo():
    """🗺️  Geographic Analysis - Phân tích địa lý"""
    pass


@geo.command()
@click.option('--latitude', '-lat', type=float, required=True, help='Latitude')
@click.option('--longitude', '-lng', type=float, required=True, help='Longitude')
@click.option('--radius', '-r', type=float, default=5, help='Search radius in km')
@click.option('--limit', '-l', type=int, default=10, help='Number of results')
def nearby(latitude, longitude, radius, limit):
    """Find parks near coordinates - Tìm công viên gần vị trí"""
    try:
        parks = tim_cong_vien_gan_nhat(latitude, longitude, radius)[:limit]
        
        if not parks:
            click.secho("No parks found", fg='yellow')
            return
        
        click.secho(f"\n🗺️  Parks near ({latitude}, {longitude})\n", fg='green', bold=True)
        
        headers = ['Rank', 'Name', 'Distance (km)', 'District', 'Rating']
        rows = []
        for i, park in enumerate(parks, 1):
            rows.append([
                i,
                park['ten'][:30],
                f"{park['khoang_cach_km']:.2f}",
                park['quan_huyen'],
                f"{park['diem_danh_gia']:.2f}/5.0"
            ])
        
        click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
        click.echo()
        
    except Exception as e:
        click.secho(f"❌ Error: {str(e)}", fg='red', err=True)
        sys.exit(1)


@geo.command()
@click.argument('park_id', type=int)
@click.option('--within', '-w', type=float, default=2, help='Find parks within X km')
def distance(park_id, within):
    """Calculate distances between parks - Tính khoảng cách giữa công viên"""
    try:
        main_park = CongVien.objects.get(ma_cong_vien=park_id)
        if not main_park.toa_do_trung_tam:
            click.secho(f"❌ Park {park_id} has no coordinates", fg='red', err=True)
            sys.exit(1)
        
        nearby_parks = tim_cong_vien_gan_nhat(
            main_park.toa_do_trung_tam[0],
            main_park.toa_do_trung_tam[1],
            within
        )
        
        if not nearby_parks:
            click.secho("No parks found nearby", fg='yellow')
            return
        
        click.secho(f"\n🏞️  Parks near {main_park.ten_cong_vien} (within {within}km)\n", fg='green', bold=True)
        
        headers = ['Name', 'Distance (km)', 'Type', 'Rating']
        rows = []
        for park in nearby_parks[1:]:  # Skip the main park itself
            rows.append([
                park['ten'][:35],
                f"{park['khoang_cach_km']:.2f}",
                park.get('loai', 'N/A'),
                f"{park['diem_danh_gia']:.2f}/5.0"
            ])
        
        click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
        click.echo()
        
    except CongVien.DoesNotExist:
        click.secho(f"❌ Park with ID {park_id} not found", fg='red', err=True)
        sys.exit(1)


# ==================== TREES MANAGEMENT ====================

@cli.group()
def trees():
    """🌳 Trees Management - Quản lý Cây xanh"""
    pass


@trees.command()
@click.option('--park-id', '-p', type=int, help='Filter by park ID')
@click.option('--species', '-s', help='Filter by species')
@click.option('--limit', '-l', default=20, help='Number of trees to display')
def list(park_id, species, limit):
    """List trees - Liệt kê cây xanh"""
    trees_query = CayXanh.objects.all()
    
    if park_id:
        trees_query = trees_query.filter(ma_cong_vien=park_id)
    if species:
        trees_query = trees_query.filter(ten_loai_cay__icontains=species)
    
    trees_list = trees_query[:limit]
    
    headers = ['ID', 'Species', 'Park', 'Age (years)', 'Height (m)', 'Diameter (cm)', 'Status']
    rows = []
    
    for tree in trees_list:
        age = tree.tuoi_cay if hasattr(tree, 'tuoi_cay') else 'N/A'
        height = f"{tree.chieu_cao:.2f}" if hasattr(tree, 'chieu_cao') and tree.chieu_cao else 'N/A'
        diameter = f"{tree.duong_kinh_than:.2f}" if hasattr(tree, 'duong_kinh_than') and tree.duong_kinh_than else 'N/A'
        
        rows.append([
            tree.ma_cay,
            tree.ten_loai_cay[:25],
            tree.ma_cong_vien.ten_cong_vien[:20] if tree.ma_cong_vien else 'N/A',
            age,
            height,
            diameter,
            tree.tinh_trang if hasattr(tree, 'tinh_trang') else 'N/A'
        ])
    
    click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
    click.echo(f"\nTotal: {trees_query.count()} trees")


@trees.command()
@click.argument('tree_id', type=int)
def detail(tree_id):
    """Show tree details - Chi tiết cây xanh"""
    try:
        tree = CayXanh.objects.get(ma_cay=tree_id)
        
        click.secho(f"\n🌳 {tree.ten_loai_cay}", fg='green', bold=True)
        click.secho("="*50 + "\n", fg='cyan')
        
        details = [
            ('ID', tree.ma_cay),
            ('Park', tree.ma_cong_vien.ten_cong_vien if tree.ma_cong_vien else 'N/A'),
            ('Species', tree.ten_loai_cay),
            ('Status', getattr(tree, 'tinh_trang', 'N/A')),
            ('Age (years)', getattr(tree, 'tuoi_cay', 'N/A')),
            ('Height (m)', f"{tree.chieu_cao:.2f}" if hasattr(tree, 'chieu_cao') and tree.chieu_cao else 'N/A'),
            ('Diameter (cm)', f"{tree.duong_kinh_than:.2f}" if hasattr(tree, 'duong_kinh_than') and tree.duong_kinh_than else 'N/A'),
            ('Health Score', f"{tree.diem_suc_khoe:.2f}/10" if hasattr(tree, 'diem_suc_khoe') and tree.diem_suc_khoe else 'N/A'),
            ('Last Check', getattr(tree, 'ngay_kiem_tra', 'Never').strftime('%Y-%m-%d') if hasattr(tree, 'ngay_kiem_tra') else 'Unknown'),
        ]
        
        for key, value in details:
            click.echo(f"  {key:.<35} {value}")
        
        click.secho("\n" + "="*50 + "\n", fg='cyan')
        
    except CayXanh.DoesNotExist:
        click.secho(f"❌ Tree with ID {tree_id} not found", fg='red', err=True)
        sys.exit(1)


@trees.command()
@click.argument('park_id', type=int)
def stats(park_id):
    """Show tree statistics for a park - Thống kê cây xanh công viên"""
    try:
        park = CongVien.objects.get(ma_cong_vien=park_id)
        trees = CayXanh.objects.filter(ma_cong_vien=park)
        
        click.secho(f"\n🌳 Tree Statistics for {park.ten_cong_vien}\n", fg='green', bold=True)
        
        total = trees.count()
        
        # Group by species
        species_stats = trees.values('ten_loai_cay').annotate(count=Count('ma_cay')).order_by('-count')
        
        click.echo(f"Total Trees: {total}\n")
        
        if species_stats:
            click.secho("Trees by Species:", fg='blue', bold=True)
            headers = ['Species', 'Count', 'Percentage']
            rows = []
            for stat in species_stats:
                percentage = (stat['count'] / total * 100) if total > 0 else 0
                rows.append([
                    stat['ten_loai_cay'],
                    stat['count'],
                    f"{percentage:.1f}%"
                ])
            
            click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
        
        # Status distribution if available
        try:
            status_stats = trees.values('tinh_trang').annotate(count=Count('ma_cay'))
            if status_stats:
                click.secho("\nTrees by Status:", fg='blue', bold=True)
                headers = ['Status', 'Count']
                rows = []
                for stat in status_stats:
                    rows.append([stat['tinh_trang'], stat['count']])
                click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
        except:
            pass
        
        click.echo()
        
    except CongVien.DoesNotExist:
        click.secho(f"❌ Park with ID {park_id} not found", fg='red', err=True)
        sys.exit(1)


# ==================== STATISTICS & REPORTS ====================

@cli.group()
def stats():
    """📊 Statistics and Reports - Thống kê và Báo cáo"""
    pass


@stats.command()
def overview():
    """System overview and statistics - Tổng quan hệ thống"""
    click.secho("\n📊 GIS PARK SYSTEM OVERVIEW\n", fg='cyan', bold=True)
    click.secho("="*60 + "\n", fg='cyan')
    
    total_parks = CongVien.objects.count()
    active_parks = CongVien.objects.filter(ma_trang_thai__ma_code='hoat_dong').count()
    total_trees = CayXanh.objects.count()
    total_users = NguoiDung.objects.count()
    total_ratings = DanhGiaCongVien.objects.count()
    
    stats_data = [
        ('Total Parks', total_parks),
        ('Active Parks', active_parks),
        ('Total Trees', total_trees),
        ('Registered Users', total_users),
        ('Total Ratings', total_ratings),
    ]
    
    for label, value in stats_data:
        click.echo(f"  {label:.<40} {value:>10}")
    
    # Average rating
    avg_rating = CongVien.objects.exclude(diem_trung_binh=0).aggregate(Avg('diem_trung_binh'))['diem_trung_binh__avg']
    if avg_rating:
        click.echo(f"  {'Average Park Rating':.<40} {avg_rating:>10.2f}/5.0")
    
    click.secho("\n" + "="*60, fg='cyan')
    
    # District breakdown
    click.secho("\nParks by District:\n", fg='blue', bold=True)
    
    district_stats = (
        CongVien.objects
        .values('ma_quan_huyen__ten_quan_huyen')
        .annotate(count=Count('ma_cong_vien'), avg_rating=Avg('diem_trung_binh'))
        .order_by('-count')
    )
    
    headers = ['District', 'Parks', 'Avg Rating']
    rows = []
    for stat in district_stats:
        district_name = stat['ma_quan_huyen__ten_quan_huyen'] or 'Unknown'
        rows.append([
            district_name,
            stat['count'],
            f"{stat['avg_rating']:.2f}" if stat['avg_rating'] else 'N/A'
        ])
    
    click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
    
    click.echo()


@stats.command()
@click.option('--limit', '-l', default=10, help='Top N parks to show')
@click.option('--sort', '-s', type=click.Choice(['rating', 'reviews', 'area']), default='rating')
def top_parks(limit, sort):
    """Show top rated parks - Công viên được đánh giá cao nhất"""
    click.secho(f"\n🏆 Top {limit} Parks by {sort.upper()}\n", fg='yellow', bold=True)
    
    if sort == 'rating':
        parks = CongVien.objects.order_by('-diem_trung_binh')[:limit]
        headers = ['Rank', 'Park Name', 'Rating', 'Reviews', 'District']
        rows = []
        for i, park in enumerate(parks, 1):
            rows.append([
                i,
                park.ten_cong_vien[:35],
                f"{park.diem_trung_binh:.2f}/5.0",
                park.so_luot_danh_gia,
                park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A'
            ])
    
    elif sort == 'reviews':
        parks = CongVien.objects.order_by('-so_luot_danh_gia')[:limit]
        headers = ['Rank', 'Park Name', 'Reviews', 'Rating', 'District']
        rows = []
        for i, park in enumerate(parks, 1):
            rows.append([
                i,
                park.ten_cong_vien[:35],
                park.so_luot_danh_gia,
                f"{park.diem_trung_binh:.2f}/5.0",
                park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A'
            ])
    
    else:  # area
        parks = CongVien.objects.exclude(dien_tich_m2__isnull=True).order_by('-dien_tich_m2')[:limit]
        headers = ['Rank', 'Park Name', 'Area (m²)', 'Rating', 'District']
        rows = []
        for i, park in enumerate(parks, 1):
            rows.append([
                i,
                park.ten_cong_vien[:35],
                f"{park.dien_tich_m2:,.0f}" if park.dien_tich_m2 else 'N/A',
                f"{park.diem_trung_binh:.2f}/5.0",
                park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A'
            ])
    
    click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
    click.echo()


@stats.command()
def district_report():
    """Generate district report - Báo cáo theo khu vực"""
    click.secho("\n📋 DISTRICT REPORT\n", fg='cyan', bold=True)
    
    districts = QuanHuyen.objects.all().order_by('ten_quan_huyen')
    
    headers = ['District', 'Parks', 'Trees', 'Avg Rating', 'Total Area (m²)']
    rows = []
    
    for district in districts:
        parks = CongVien.objects.filter(ma_quan_huyen=district)
        trees = CayXanh.objects.filter(ma_cong_vien__ma_quan_huyen=district)
        
        park_count = parks.count()
        tree_count = trees.count()
        avg_rating = parks.aggregate(Avg('diem_trung_binh'))['diem_trung_binh__avg'] or 0
        total_area = parks.aggregate(Sum('dien_tich_m2'))['dien_tich_m2__sum'] or 0
        
        rows.append([
            district.ten_quan_huyen,
            park_count,
            tree_count,
            f"{avg_rating:.2f}",
            f"{total_area:,.0f}"
        ])
    
    click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
    click.echo()


# ==================== DATA MANAGEMENT ====================

@cli.group()
def data():
    """💾 Data Management - Quản lý Dữ liệu"""
    pass


@data.command()
@click.confirmation_option(prompt='This will validate all park data. Continue?')
def validate():
    """Validate data integrity - Kiểm tra tính toàn vẹn dữ liệu"""
    click.secho("\n🔍 Validating data...\n", fg='blue', bold=True)
    
    errors = []
    warnings = []
    
    parks = CongVien.objects.all()
    
    with click.progressbar(parks, label='Checking parks') as bar:
        for park in bar:
            # Check for missing coordinates
            if not park.toa_do_trung_tam:
                warnings.append(f"Park '{park.ten_cong_vien}' has no coordinates")
            
            # Check for invalid ratings
            if park.diem_trung_binh < 0 or park.diem_trung_binh > 5:
                errors.append(f"Park '{park.ten_cong_vien}' has invalid rating: {park.diem_trung_binh}")
            
            # Check for missing name
            if not park.ten_cong_vien:
                errors.append(f"Park with ID {park.ma_cong_vien} has no name")
            
            # Check for area consistency
            if park.dien_tich_cay_xanh and park.dien_tich_m2:
                if park.dien_tich_cay_xanh > park.dien_tich_m2:
                    warnings.append(f"Park '{park.ten_cong_vien}': green area > total area")
    
    if errors:
        click.secho(f"\n❌ {len(errors)} ERRORS FOUND:\n", fg='red', bold=True)
        for error in errors:
            click.echo(f"  • {error}")
    
    if warnings:
        click.secho(f"\n⚠️  {len(warnings)} WARNINGS:\n", fg='yellow', bold=True)
        for warning in warnings:
            click.echo(f"  • {warning}")
    
    if not errors and not warnings:
        click.secho("✅ All data is valid!\n", fg='green', bold=True)
    
    click.echo()


@data.command()
@click.option('--days', '-d', type=int, default=30, help='Days to keep (default: 30)')
@click.confirmation_option(prompt='This will delete old ratings. Continue?')
def cleanup(days):
    """Clean up old data - Dọn dẹp dữ liệu cũ"""
    from datetime import timedelta
    from django.utils import timezone
    
    cutoff_date = timezone.now() - timedelta(days=days)
    
    ratings_count = DanhGiaCongVien.objects.filter(ngay_tao__lt=cutoff_date).count()
    
    click.secho(f"\n🗑️  Deleting ratings older than {days} days...\n", fg='blue', bold=True)
    
    DanhGiaCongVien.objects.filter(ngay_tao__lt=cutoff_date).delete()
    
    click.secho(f"✅ Deleted {ratings_count} old ratings\n", fg='green', bold=True)


@data.command()
@click.argument('output_file', type=click.Path())
def backup(output_file):
    """Create backup of parks and trees data - Sao lưu dữ liệu"""
    click.secho("\n💾 Creating backup...\n", fg='blue', bold=True)
    
    backup_data = {
        'timestamp': datetime.now().isoformat(),
        'parks': [],
        'trees': [],
        'ratings': [],
        'metadata': {
            'version': '1.0',
            'data_type': 'GIS Park Backup'
        }
    }
    
    parks = CongVien.objects.all()
    with click.progressbar(parks, label='Backing up parks') as bar:
        for park in bar:
            backup_data['parks'].append({
                'id': park.ma_cong_vien,
                'name': park.ten_cong_vien,
                'code': park.ma_code,
                'coordinates': park.toa_do_trung_tam,
                'address': park.dia_chi,
                'area': float(park.dien_tich_m2) if park.dien_tich_m2 else None,
                'rating': float(park.diem_trung_binh),
                'created': park.ngay_tao.isoformat()
            })
    
    trees = CayXanh.objects.all()
    with click.progressbar(trees, label='Backing up trees') as bar:
        for tree in bar:
            backup_data['trees'].append({
                'id': tree.ma_cay,
                'species': tree.ten_loai_cay,
                'park_id': tree.ma_cong_vien.ma_cong_vien if tree.ma_cong_vien else None,
            })
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    
    click.secho(f"✅ Backup created: {output_file}\n", fg='green', bold=True)
    click.echo(f"  Parks: {len(backup_data['parks'])}")
    click.echo(f"  Trees: {len(backup_data['trees'])}")
    click.echo()


# ==================== UTILITIES ====================

@cli.group()
def utils():
    """🔧 Utilities - Tiện ích"""
    pass


@utils.command()
@click.argument('park_id', type=int)
@click.argument('new_name', type=str)
def rename(park_id, new_name):
    """Rename a park - Đổi tên công viên"""
    try:
        park = CongVien.objects.get(ma_cong_vien=park_id)
        old_name = park.ten_cong_vien
        park.ten_cong_vien = new_name
        park.save()
        
        click.secho(f"✅ Renamed '{old_name}' to '{new_name}'", fg='green')
    except CongVien.DoesNotExist:
        click.secho(f"❌ Park with ID {park_id} not found", fg='red', err=True)
        sys.exit(1)


@utils.command()
@click.argument('park_id', type=int)
@click.argument('latitude', type=float)
@click.argument('longitude', type=float)
def set_coords(park_id, latitude, longitude):
    """Set park coordinates - Đặt tọa độ công viên"""
    try:
        park = CongVien.objects.get(ma_cong_vien=park_id)
        park.toa_do_trung_tam = [latitude, longitude]
        park.save()
        
        click.secho(f"✅ Updated coordinates for '{park.ten_cong_vien}': ({latitude}, {longitude})", fg='green')
    except CongVien.DoesNotExist:
        click.secho(f"❌ Park with ID {park_id} not found", fg='red', err=True)
        sys.exit(1)


@utils.command()
def check_db():
    """Check database connection - Kiểm tra kết nối cơ sở dữ liệu"""
    click.secho("\n🔍 Checking database connection...\n", fg='blue', bold=True)
    
    try:
        parks_count = CongVien.objects.count()
        trees_count = CayXanh.objects.count()
        users_count = NguoiDung.objects.count()
        
        click.secho("✅ Database is connected!\n", fg='green', bold=True)
        click.echo(f"  Parks: {parks_count}")
        click.echo(f"  Trees: {trees_count}")
        click.echo(f"  Users: {users_count}")
        click.echo()
        
    except Exception as e:
        click.secho(f"❌ Database error: {str(e)}\n", fg='red', bold=True, err=True)
        sys.exit(1)


@utils.command()
def help_models():
    """Show available models and fields - Hiển thị mô hình dữ liệu"""
    click.secho("\n📚 AVAILABLE MODELS\n", fg='cyan', bold=True)
    
    models_info = [
        ('CongVien (Parks)', ['ma_cong_vien', 'ten_cong_vien', 'dia_chi', 'dien_tich_m2', 'diem_trung_binh']),
        ('CayXanh (Trees)', ['ma_cay', 'ten_loai_cay', 'ma_cong_vien', 'tuoi_cay', 'chieu_cao']),
        ('DanhGia (Ratings)', ['ma_danh_gia', 'ma_nguoi_dung', 'ma_cong_vien', 'diem', 'nhan_xet']),
        ('QuanHuyen (Districts)', ['ma_quan_huyen', 'ten_quan_huyen', 'loai']),
    ]
    
    for model_name, fields in models_info:
        click.secho(f"\n{model_name}:", fg='green', bold=True)
        for field in fields:
            click.echo(f"  • {field}")
    
    click.echo()


# ==================== ADMIN COMMANDS ====================

@cli.group()
def admin():
    """Quản lý hệ thống - Chỉ dành cho quản trị viên"""
    pass


# ========== QUẢN LÝ NGƯỜI DÙNG ==========

@admin.group()
def users():
    """Quản lý tài khoản người dùng"""
    pass


def hash_password(password):
    """Hash password using SHA256"""
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token():
    """Generate a unique token"""
    import uuid
    return str(uuid.uuid4())


@users.command()
def list():
    """Liệt kê tất cả người dùng"""
    users_data = NguoiDung.objects.select_related('ma_nhom_quyen').all()
    
    if not users_data:
        click.echo(click.style("Không có người dùng nào", fg='yellow'))
        return
    
    rows = []
    for user in users_data:
        role = user.ma_nhom_quyen.get_ten_nhom_display() if user.ma_nhom_quyen else 'N/A'
        status = click.style("✓ Hoạt động", fg='green') if user.dang_hoat_dong else click.style("✗ Đã khóa", fg='red')
        rows.append([
            user.ma_nguoi_dung,
            user.ten_dang_nhap,
            user.ho_ten or '-',
            user.email,
            role,
            status,
            user.so_lan_dang_nhap,
            user.ngay_tao.strftime('%d/%m/%Y') if user.ngay_tao else '-',
        ])
    
    headers = ['ID', 'Username', 'Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Lần đăng nhập', 'Ngày tạo']
    click.echo(tabulate(rows, headers=headers))


@users.command()
@click.option('--username', '-u', prompt='Tên đăng nhập', help='Tên đăng nhập mới')
@click.option('--email', '-e', prompt='Email', help='Địa chỉ email')
@click.option('--password', '-p', prompt='Mật khẩu', hide_input=True, confirmation_prompt=True)
@click.option('--fullname', '-n', default='', help='Họ và tên')
@click.option('--role', '-r', type=click.Choice(['QUAN_TRI', '
              default='CONG_DONG', help='Vai trò người dùng')
def create(username, email, password, fullname, role):
    """Tạo người dùng mới"""
    try:
        if NguoiDung.objects.filter(ten_dang_nhap=username).exists():
            click.secho("✗ Tên đăng nhập đã tồn tại!", fg='red')
            return
        
        if NguoiDung.objects.filter(email=email).exists():
            click.secho("✗ Email đã được đăng ký!", fg='red')
            return
        
        # Get role
        try:
            nhom_quyen = NhomQuyen.objects.get(ten_nhom=role)
        except NhomQuyen.DoesNotExist:
            click.secho(f"✗ Vai trò '{role}' không tồn tại!", fg='red')
            return
        
        # Create user
        user = NguoiDung.objects.create(
            ten_dang_nhap=username,
            email=email,
            mat_khau_hash=hash_password(password),
            ho_ten=fullname or username,
            ma_nhom_quyen=nhom_quyen,
            token=generate_token(),
            dang_hoat_dong=True
        )
        
        click.secho(f"✓ Tạo người dùng thành công!", fg='green')
        click.echo(f"  ID: {user.ma_nguoi_dung}")
        click.echo(f"  Username: {user.ten_dang_nhap}")
        click.echo(f"  Email: {user.email}")
        click.echo(f"  Vai trò: {user.ma_nhom_quyen.get_ten_nhom_display()}")
        click.echo(f"  Token: {user.token}")
    except Exception as e:
        click.secho(f"✗ Lỗi: {str(e)}", fg='red')


@users.command()
@click.argument('user_id', type=int)
@click.option('--fullname', '-n', help='Cập nhật họ tên')
@click.option('--email', '-e', help='Cập nhật email')
@click.option('--password', '-p', help='Cập nhật mật khẩu', hide_input=True)
@click.option('--role', '-r', type=click.Choice(['QUAN_TRI', 'CONG_DONG']), 
              help='Thay đổi vai trò')
def edit(user_id, fullname, email, password, role):
    """Chỉnh sửa thông tin người dùng"""
    try:
        user = NguoiDung.objects.get(ma_nguoi_dung=user_id)
        changed = False
        
        if fullname:
            user.ho_ten = fullname
            changed = True
        
        if email:
            if NguoiDung.objects.filter(email=email).exclude(ma_nguoi_dung=user_id).exists():
                click.secho("✗ Email đã được sử dụng!", fg='red')
                return
            user.email = email
            changed = True
        
        if password:
            user.mat_khau_hash = hash_password(password)
            changed = True
        
        if role:
            try:
                nhom_quyen = NhomQuyen.objects.get(ten_nhom=role)
                user.ma_nhom_quyen = nhom_quyen
                changed = True
            except NhomQuyen.DoesNotExist:
                click.secho(f"✗ Vai trò '{role}' không tồn tại!", fg='red')
                return
        
        if changed:
            user.save()
            click.secho("✓ Cập nhật thành công!", fg='green')
        else:
            click.echo("Không có thay đổi nào")
    except NguoiDung.DoesNotExist:
        click.secho(f"✗ Người dùng ID {user_id} không tồn tại!", fg='red')


@users.command()
@click.argument('user_id', type=int)
@click.confirmation_option(prompt='Bạn có chắc chắn muốn khóa người dùng này không?')
def disable(user_id):
    """Khóa tài khoản người dùng"""
    try:
        user = NguoiDung.objects.get(ma_nguoi_dung=user_id)
        if not user.dang_hoat_dong:
            click.echo("Tài khoản này đã bị khóa rồi")
            return
        
        user.dang_hoat_dong = False
        user.save()
        click.secho(f"✓ Đã khóa tài khoản {user.ten_dang_nhap}", fg='green')
    except NguoiDung.DoesNotExist:
        click.secho(f"✗ Người dùng ID {user_id} không tồn tại!", fg='red')


@users.command()
@click.argument('user_id', type=int)
def enable(user_id):
    """Kích hoạt tài khoản người dùng"""
    try:
        user = NguoiDung.objects.get(ma_nguoi_dung=user_id)
        if user.dang_hoat_dong:
            click.echo("Tài khoản này đã hoạt động rồi")
            return
        
        user.dang_hoat_dong = True
        user.save()
        click.secho(f"✓ Đã kích hoạt tài khoản {user.ten_dang_nhap}", fg='green')
    except NguoiDung.DoesNotExist:
        click.secho(f"✗ Người dùng ID {user_id} không tồn tại!", fg='red')


@users.command()
@click.argument('user_id', type=int)
@click.confirmation_option(prompt='Bạn có chắc chắn muốn xóa người dùng này không?')
def delete(user_id):
    """Xóa người dùng"""
    try:
        user = NguoiDung.objects.get(ma_nguoi_dung=user_id)
        username = user.ten_dang_nhap
        user.delete()
        click.secho(f"✓ Đã xóa người dùng {username}", fg='green')
    except NguoiDung.DoesNotExist:
        click.secho(f"✗ Người dùng ID {user_id} không tồn tại!", fg='red')


# ========== DUYỆT NỘI DUNG ==========

@admin.group()
def approvals():
    """Duyệt nội dung người dùng"""
    pass


@approvals.command()
@click.option('--pending', '-p', is_flag=True, help='Chỉ hiển thị đang chờ duyệt')
def ratings(pending):
    """Quản lý đánh giá công viên"""
    query = DanhGiaCongVien.objects.select_related('ma_cong_vien', 'ma_nguoi_dung')
    
    if pending:
        query = query.filter(da_duyet=False)
    
    if not query.exists():
        click.echo(click.style("Không có đánh giá nào", fg='yellow'))
        return
    
    rows = []
    for rating in query:
        status = click.style("✓ Duyệt", fg='green') if rating.da_duyet else click.style("⏳ Chờ", fg='yellow')
        rows.append([
            rating.ma_danh_gia,
            rating.ma_cong_vien.ten_cong_vien,
            rating.ma_nguoi_dung.ho_ten if rating.ma_nguoi_dung else 'N/A',
            f"{rating.diem_tong_quat}/5" if rating.diem_tong_quat else '-',
            rating.noi_dung[:50] + '...' if rating.noi_dung and len(rating.noi_dung) > 50 else rating.noi_dung,
            status,
            rating.ngay_tao.strftime('%d/%m/%Y %H:%M'),
        ])
    
    headers = ['ID', 'Công viên', 'Người dùng', 'Điểm', 'Nội dung', 'Trạng thái', 'Ngày tạo']
    click.echo(tabulate(rows, headers=headers))


@approvals.command()
@click.argument('rating_id', type=int)
def approve_rating(rating_id):
    """Phê duyệt đánh giá"""
    try:
        rating = DanhGiaCongVien.objects.get(ma_danh_gia=rating_id)
        rating.da_duyet = True
        rating.save()
        click.secho(f"✓ Đã phê duyệt đánh giá ID {rating_id}", fg='green')
    except DanhGiaCongVien.DoesNotExist:
        click.secho(f"✗ Đánh giá ID {rating_id} không tồn tại!", fg='red')


@approvals.command()
@click.argument('rating_id', type=int)
@click.confirmation_option(prompt='Bạn có chắc chắn muốn từ chối đánh giá này không?')
def reject_rating(rating_id):
    """Từ chối và xóa đánh giá"""
    try:
        rating = DanhGiaCongVien.objects.get(ma_danh_gia=rating_id)
        rating.delete()
        click.secho(f"✓ Đã xóa đánh giá ID {rating_id}", fg='green')
    except DanhGiaCongVien.DoesNotExist:
        click.secho(f"✗ Đánh giá ID {rating_id} không tồn tại!", fg='red')


@approvals.command()
@click.option('--pending', '-p', is_flag=True, help='Chỉ hiển thị đang chờ duyệt')
def events(pending):
    """Quản lý sự kiện công viên"""
    query = SuKienCongVien.objects.select_related('ma_cong_vien')
    
    if pending:
        query = query.filter(da_duyet=False)
    
    if not query.exists():
        click.echo(click.style("Không có sự kiện nào", fg='yellow'))
        return
    
    rows = []
    for event in query:
        status = click.style("✓ Duyệt", fg='green') if event.da_duyet else click.style("⏳ Chờ", fg='yellow')
        rows.append([
            event.ma_su_kien,
            event.ma_cong_vien.ten_cong_vien,
            event.ten_su_kien,
            event.loai_su_kien,
            event.thoi_gian_bat_dau.strftime('%d/%m/%Y') if event.thoi_gian_bat_dau else '-',
            status,
        ])
    
    headers = ['ID', 'Công viên', 'Tên sự kiện', 'Loại', 'Ngày bắt đầu', 'Trạng thái']
    click.echo(tabulate(rows, headers=headers))


@approvals.command()
@click.argument('event_id', type=int)
def approve_event(event_id):
    """Phê duyệt sự kiện"""
    try:
        event = SuKienCongVien.objects.get(ma_su_kien=event_id)
        event.da_duyet = True
        event.save()
        click.secho(f"✓ Đã phê duyệt sự kiện ID {event_id}", fg='green')
    except SuKienCongVien.DoesNotExist:
        click.secho(f"✗ Sự kiện ID {event_id} không tồn tại!", fg='red')


@approvals.command()
@click.argument('event_id', type=int)
@click.confirmation_option(prompt='Bạn có chắc chắn muốn từ chối sự kiện này không?')
def reject_event(event_id):
    """Từ chối và xóa sự kiện"""
    try:
        event = SuKienCongVien.objects.get(ma_su_kien=event_id)
        event.delete()
        click.secho(f"✓ Đã xóa sự kiện ID {event_id}", fg='green')
    except SuKienCongVien.DoesNotExist:
        click.secho(f"✗ Sự kiện ID {event_id} không tồn tại!", fg='red')


@approvals.command()
@click.option('--pending', '-p', is_flag=True, help='Chỉ hiển thị đang chờ xử lý')
def incidents(pending):
    """Quản lý báo cáo sự cố"""
    query = BaoCaoSuCo.objects.select_related('ma_cong_vien', 'ma_nguoi_dung')
    
    if pending:
        query = query.filter(trang_thai='cho_xu_ly')
    
    if not query.exists():
        click.echo(click.style("Không có báo cáo nào", fg='yellow'))
        return
    
    rows = []
    for incident in query:
        rows.append([
            incident.ma_bao_cao,
            incident.ma_cong_vien.ten_cong_vien if incident.ma_cong_vien else 'N/A',
            incident.ma_nguoi_dung.ho_ten if incident.ma_nguoi_dung else 'N/A',
            incident.trang_thai,
            incident.noi_dung[:50] + '...' if len(incident.noi_dung) > 50 else incident.noi_dung,
            incident.ngay_tao.strftime('%d/%m/%Y %H:%M'),
        ])
    
    headers = ['ID', 'Công viên', 'Người báo cáo', 'Trạng thái', 'Nội dung', 'Ngày tạo']
    click.echo(tabulate(rows, headers=headers))


@approvals.command()
@click.argument('incident_id', type=int)
@click.option('--note', '-n', prompt=True, help='Ghi chú xử lý')
def handle_incident(incident_id, note):
    """Xử lý báo cáo sự cố"""
    try:
        incident = BaoCaoSuCo.objects.get(ma_bao_cao=incident_id)
        incident.trang_thai = 'da_xu_ly'
        incident.ghi_chu = note
        incident.save()
        click.secho(f"✓ Đã xử lý báo cáo ID {incident_id}", fg='green')
    except BaoCaoSuCo.DoesNotExist:
        click.secho(f"✗ Báo cáo ID {incident_id} không tồn tại!", fg='red')


if __name__ == '__main__':
    cli()

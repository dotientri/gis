# GISpark Backend - Django GIS Park Management System

## Project Overview

This is a Django-based GIS backend for managing parks and vegetation data with PostGIS integration.

### Features

- **Parks Management (Công viên)**: Store and manage park information with geographic coordinates
- **User Management (Người dùng)**: User accounts with ratings/reviews
- **Tree Database (Cây xanh)**: Track trees within parks with detailed attributes
- **Ratings System (Đánh giá)**: Allow users to rate and review parks
- **PostgreSQL/PostGIS Integration**: Use PostGIS for accurate geographic distance calculations

## Database Functions (PostgreSQL)

### 1. `tim_cong_vien_gan_nhat(vi_do, kinh_do, ban_kinh_km)`

Find nearby parks based on GPS coordinates and search radius.

**Parameters:**

- `vi_do` (float): Latitude
- `kinh_do` (float): Longitude
- `ban_kinh_km` (float): Search radius in kilometers (default: 10)

**Returns:** List of active parks within range, sorted by distance (ascending)

**Uses:**

- `ST_DWithin()`: Find points within distance
- `ST_Distance()`: Calculate accurate Earth surface distance
- `geography` type: For accurate distance calculations

**Example Usage from Python:**

```python
from parks.utils import tim_cong_vien_gan_nhat

parks = tim_cong_vien_gan_nhat(21.0285, 105.8542, 5)
for park in parks:
    print(f"{park['ten']}: {park['khoang_cach_km']:.2f}km")
```

**Example API Call:**

```bash
curl -X POST http://localhost:8000/api/tim-cong-vien/ \
  -H "Content-Type: application/json" \
  -d '{
    "vi_do": 21.0285,
    "kinh_do": 105.8542,
    "ban_kinh_km": 10
  }'
```

---

### 2. `cap_nhat_diem_danh_gia()`

Automatically updates park rating statistics whenever ratings are created or updated.

**Triggered by:** INSERT or UPDATE on `danh_gia` table

**Actions:**

- Recalculates average rating (`diem_danh_gia`) from approved ratings
- Updates total approved rating count (`tong_danh_gia`)
- Sets update timestamp (`ngay_cap_nhat`)

**Behavior:**

- Only counts ratings where `duyet_cap = TRUE`
- Runs automatically, no manual invocation needed
- Updates the related park's statistics

---

### 3. `cap_nhat_thoi_gian()`

Automatically updates the `ngay_cap_nhat` timestamp whenever a record is modified.

**Applied to tables:**

- `cong_vien` (Parks)
- `nguoi_dung` (Users)
- `cay_xanh` (Trees)

**Triggered by:** BEFORE UPDATE

**Action:** Sets `ngay_cap_nhat` to current timestamp automatically

---

## Project Structure

```
qlycv/
├── manage.py                          # Django management script
├── requirements.txt                   # Python dependencies
├── gispark_backend/                   # Main Django project
│   ├── __init__.py
│   ├── settings.py                   # Django settings (with PostGIS config)
│   ├── urls.py                       # URL routing
│   ├── asgi.py                       # ASGI config
│   └── wsgi.py                       # WSGI config
└── parks/                            # Main Django app
    ├── migrations/
    │   ├── 0001_initial.py           # Create models
    │   └── 0002_create_functions.py  # Create PostgreSQL functions/triggers
    ├── models.py                     # Database models
    ├── admin.py                      # Django admin interface
    ├── views.py                      # API views
    ├── utils.py                      # Utility functions
    └── apps.py                       # App configuration
```

## Database Models

### NguoiDung (User)

- `id`: Primary key
- `ten`: User name
- `email`: Email (unique)
- `so_dien_thoai`: Phone number
- `trang_thai`: Active status
- `ngay_tao`: Creation timestamp
- `ngay_cap_nhat`: Last update timestamp

### CongVien (Park)

- `id`: Primary key
- `ten`: Park name
- `mo_ta`: Description
- `dia_diem`: Geographic point (GIS PointField with geography)
- `dien_tich`: Area in km²
- `diem_danh_gia`: Average rating (auto-updated by trigger)
- `tong_danh_gia`: Total approved ratings (auto-updated by trigger)
- `trang_thai`: Active status
- `ngay_tao`: Creation timestamp
- `ngay_cap_nhat`: Last update timestamp

### CayXanh (Tree)

- `id`: Primary key
- `ten`: Tree name
- `ten_khoa_hoc`: Scientific name
- `cong_vien`: Foreign key to Park
- `dia_diem`: Geographic point
- `chieu_cao`: Height in meters
- `duong_kinh_tran`: Crown diameter in meters
- `ngay_trong`: Planting date
- `trang_thai`: Health status (binh_thuong, benh, duc, chet)
- `ngay_tao`: Creation timestamp
- `ngay_cap_nhat`: Last update timestamp

### DanhGia (Rating)

- `id`: Primary key
- `cong_vien`: Foreign key to Park
- `nguoi_dung`: Foreign key to User
- `diem`: Rating 1-5
- `nhan_xet`: Review text
- `duyet_cap`: Approval status (only approved ratings count in statistics)
- `ngay_tao`: Creation timestamp
- `ngay_cap_nhat`: Last update timestamp
- Constraint: Users can only have one active rating per park

## Setup Instructions

### 1. Prerequisites

- Python 3.8+
- PostgreSQL with PostGIS extension
- GDAL libraries (required for GeoDjango)

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb gis_database

# Enable PostGIS extension
psql gis_database -c "CREATE EXTENSION postgis;"

# Update database credentials in gispark_backend/settings.py if needed
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

This will:

- Create all tables from models
- Create the PostgreSQL functions
- Create the triggers

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

Access admin interface at: `http://localhost:8000/admin/`

## API Endpoints

### Find Nearest Parks

**POST** `/api/tim-cong-vien/`

Request body:

```json
{
  "vi_do": 21.0285,
  "kinh_do": 105.8542,
  "ban_kinh_km": 10
}
```

Response:

```json
{
  "success": true,
  "count": 3,
  "parks": [
    {
      "id": 1,
      "ten": "Công viên Tây Hồ",
      "diem_danh_gia": 4.5,
      "tong_danh_gia": 42,
      "khoang_cach_km": 0.5
    }
  ]
}
```

## Admin Interface

Access Django admin at `/admin/` with superuser account to:

- Add/edit parks, users, trees, and ratings
- Bulk approve/reject ratings with custom actions
- View GIS map fields for coordinates
- Search and filter by various criteria
- Auto-timestamp management

## Key Implementation Details

### PostGIS Functions

All three functions use proper PostgreSQL syntax with:

- Geography types for accurate Earth surface calculations
- Proper parameter handling and type conversion
- Trigger integration for automatic updates
- Reverse migration SQL for safety

### Django Integration

- Models use `django.contrib.gis` for geographic fields
- Migrations use `RunSQL` operations for raw PostgreSQL
- Utility functions provide Python wrapper around DB functions
- API views handle JSON serialization and error handling

### Database Triggers

- **Automatic Rating Updates**: When ratings are added/modified, park statistics auto-update
- **Timestamp Management**: Modification time auto-updates across multiple tables
- **Data Consistency**: Triggers ensure data stays in sync without application logic

## Notes

- The `cap_nhat_diem_danh_gia()` function also updates `ngay_cap_nhat` on the park table
- PostGIS `geography` type ensures accurate distance calculations over long distances
- All timestamps use `CURRENT_TIMESTAMP` for database-level consistency
- The API endpoint accepts both metric and decimal degree coordinates

## Database Backup

```bash
# Backup
pg_dump -U admin gis_database > backup.sql

# Restore
psql -U admin gis_database -f backup.sql
```

## Support for Functions in Queries

Once migrations are applied, you can use the functions directly in raw SQL:

```python
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute(
        'SELECT * FROM tim_cong_vien_gan_nhat(%s, %s, %s)',
        [21.0285, 105.8542, 5]
    )
    results = cursor.fetchall()
```

Or use the provided utility function:

```python
from parks.utils import tim_cong_vien_gan_nhat
parks = tim_cong_vien_gan_nhat(21.0285, 105.8542, 5)
```

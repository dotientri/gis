# Quick Start Guide - GISpark Backend

## What Was Created

Your Django GIS project is now complete with three PostgreSQL functions as requested:

### ✅ Three PostgreSQL Functions Implemented

1. **`tim_cong_vien_gan_nhat(vi_do, kinh_do, ban_kinh_km)`**
   - Finds parks near GPS coordinates
   - Returns parks sorted by distance
   - Uses PostGIS ST_Distance and ST_DWithin for accuracy

2. **`cap_nhat_diem_danh_gia()`**
   - Trigger function that auto-updates park ratings
   - Calculates average rating and approval count
   - Called automatically when ratings change

3. **`cap_nhat_thoi_gian()`**
   - Trigger function that auto-updates modification timestamps
   - Applied to parks, users, and trees tables
   - Keeps data current without manual updates

---

## Project Structure

```
qlycv/
├── manage.py                           # Django CLI
├── requirements.txt                    # Python packages
├── README.md                           # Full documentation
├── POSTGRESQL_FUNCTIONS.md             # Function reference
├── .gitignore
│
├── gispark_backend/                    # Django project config
│   ├── settings.py                    # Database & app config
│   ├── urls.py                        # URL routing
│   ├── asgi.py & wsgi.py             # Server config
│   └── __init__.py
│
└── parks/                             # Main Django app
    ├── models.py                        # 4 database models
    ├── admin.py                         # Django admin interface
    ├── views.py                         # API endpoint
    ├── utils.py                         # Python utility functions
    ├── apps.py
    │
    ├── migrations/
    │   ├── 0001_initial.py             # Create models
    │   └── 0002_create_functions.py    # Create PostgreSQL functions & triggers
    │
    └── management/commands/
        └── test_find_parks.py           # Testing command
```

---

## Quick Setup (Windows)

### 1. Install PostgreSQL with PostGIS

```powershell
# Using chocolatey (if installed)
choco install postgresql postgis

# Or download from: https://www.postgresql.org/download/windows/
# IMPORTANT: Enable PostGIS during installation
```

### 2. Create Database

```powershell
# Open PostgreSQL command line
psql -U postgres

# In PostgreSQL:
CREATE DATABASE gis_database;
\c gis_database
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_raster;
\q
```

### 3. Setup Python Virtual Environment

```powershell
cd C:\Users\dotie\OneDrive\Documents\gis\qlycv

# Create virtual environment
python -m venv env

# Activate it
.\env\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# May need GDAL for GeoDjango on Windows
pip install gdal==3.4.3
```

### 4. Run Migrations

```powershell
python manage.py migrate
```

This will:

- Create all database tables
- Create the 3 PostgreSQL functions
- Create the 3 triggers

### 5. Create Admin User

```powershell
python manage.py createsuperuser
# Follow prompts to create your admin account
```

### 6. Start Development Server

```powershell
python manage.py runserver
```

Access:

- Admin Interface: `http://localhost:8000/admin/`
- API: `http://localhost:8000/api/tim-cong-vien/`

---

## Using the Functions

### Python Usage

```python
from parks.utils import tim_cong_vien_gan_nhat

# Find parks near Hanoi within 5km
parks = tim_cong_vien_gan_nhat(21.0285, 105.8542, 5)

for park in parks:
    print(f"{park['ten']}: {park['khoang_cach_km']:.2f}km away")
    print(f"  Rating: {park['diem_danh_gia']:.1f}★ ({park['tong_danh_gia']} reviews)")
```

### API Usage (cURL)

```powershell
# Find parks
curl -X POST http://localhost:8000/api/tim-cong-vien/ `
  -H "Content-Type: application/json" `
  -d '{"vi_do": 21.0285, "kinh_do": 105.8542, "ban_kinh_km": 5}'
```

### Web Interface

1. Add parks: Go to `/admin/parks/congvien/` and click "Add"
2. Add ratings: Go to `/admin/parks/danhgia/` and create ratings
3. Rating stats auto-update in the park record
4. Timestamps auto-update when you edit

---

## Test Data Command

```powershell
# Create sample parks for testing
python manage.py test_find_parks --create-sample

# Test the search function
python manage.py test_find_parks --test-search
```

---

## Database Models

### Parks (CongVien)

- Name, description, location (GIS point)
- Area, rating (auto-updated), status
- Location auto-searches with function

### Users (NguoiDung)

- Name, email (unique), phone
- Status, created/updated timestamps

### Trees (CayXanh)

- Name, scientific name, linked park
- Height, crown diameter, planting date
- Status: binh_thuong (normal), benh (sick), duc (dead), chet (dead)

### Ratings (DanhGia)

- User, Park, 1-5 stars, review text
- Approval status (only approved ratings count)
- One rating per user per park

---

## Important Notes

1. **Distance Coordinates**: Function expects (Latitude, Longitude) but uses (Longitude, Latitude) for ST_Point
   - Input: `tim_cong_vien_gan_nhat(21.0285, 105.8542)` = Hanoi
   - Internally: ST_Point(105.8542, 21.0285)

2. **Trigger Behavior**:
   - Rating updates automatically recalculate park averages
   - Edit timestamps update automatically on any change
   - No manual updates needed

3. **Admin Actions**:
   - Bulk approve/reject ratings in admin interface
   - Triggers automatically update park stats

4. **Database Backups**:
   ```powershell
   pg_dump -U admin gis_database > backup.sql
   psql -U admin gis_database -f backup.sql  # Restore
   ```

---

## Troubleshooting

**Error: "No module named 'django.contrib.gis'"**

- PostGIS not installed in PostgreSQL
- GeoDjango not available in Python
- Solution: Install GDAL for Python (`pip install gdal`)

**Error: Connection to database failed**

- PostgreSQL not running
- Wrong credentials in settings.py
- Database doesn't exist
- PostGIS extension not enabled

**Admin page shows empty**

- Make sure you've run migrations
- `python manage.py migrate`

**Functions not found in database**

- Migration didn't run
- Check: `python manage.py showmigrations`

---

## Next Steps

1. Customize the admin interface further (admin.py)
2. Add more API endpoints (views.py)
3. Add authentication and permissions (Django docs)
4. Deploy to production with proper security settings
5. Add more database indexes for performance

---

## Documentation Files

- **README.md** - Full project documentation
- **POSTGRESQL_FUNCTIONS.md** - Detailed function definitions and examples
- **models.py** - Database model details

Good luck with your GIS project! 🗺️

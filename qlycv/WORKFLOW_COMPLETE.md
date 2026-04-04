# 🗺️ GIS PARK MANAGEMENT - COMPLETE WORKFLOW

**Ngày cập nhật**: 30/03/2026  
**Status**: ✅ Production Ready

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Permission System (4-tier)](#permission-system-4-tier)
4. [Map & Location Features](#map--location-features)
5. [Incident Management](#incident-management)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Setup & Migration](#setup--migration)

---

## 🏗️ System Overview

### Technology Stack

- **Backend**: Django REST Framework 4.1.0
- **Frontend**: React + Leaflet.js
- **Database**: SQLite / PostgreSQL
- **Maps**: Leaflet (Open Street Map)
- **Auth**: Token-based (Bearer token)
- **Excel Export**: openpyxl 3.1.0+

### Core Features

✅ Park map visualization with Leaflet  
✅ Search radius feature (Haversine formula)  
✅ 4-tier permission system (Guest → User → Manager → Admin)  
✅ Incident management with auto-archiving  
✅ Amenities & Event management  
✅ Article/Blog system with images  
✅ Rating & Review system

---

## 🗄️ Database Schema

### Models Hierarchy

```
QuanHuyen (District)
  └── PhuongXa (Ward)
      └── CongVien (Park) ← CORE
          ├── ma_loai: LoaiCongVien
          ├── ma_trang_thai: TrangThaiCongVien
          ├── toa_do_trung_tam: [LAT, LNG] ✨ COORDINATES
          ├── ranh_gioi: GeoJSON Boundary
          ├── danh_gia: DanhGiaCongVien (Ratings)
          ├── bao_cao_su_co: BaoCaoSuCo (Incidents)
          ├── tien_ich: TienIchCongVien (Amenities)
          ├── su_kien: SuKienCongVien (Events)
          ├── cay_xanh: CayXanh (Trees)
          └── quan_ly_cong_vien: NguoiDung (Manager)

NguoiDung (User) ← USERS
├── ma_nhom_quyen: NhomQuyen (Role)
├── ma_cong_vien: CongVien (For Managers only)
├── token: Bearer Token
└── Related:
    ├── danh_gia: Ratings created
    ├── bao_cao_phu_trach: Incidents handling
    └── bao_cao_da_tao: Incidents reported
```

### Park Coordinates Structure

```json
{
  "ma_cong_vien": 1,
  "ten_cong_vien": "Công viên Tao Đàn",
  "toa_do_trung_tam": [10.7724, 106.6885],
  "ranh_gioi": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[10.77, 106.68], [10.77, 106.69], ...]]
        }
      }
    ]
  },
  "vi_tri_cong_vao": [[10.7724, 106.6885], [10.7725, 106.6886]]
}
```

### Park Status (Trạng Thái)

| Code              | Vietnamese      | Color     | Usage                    |
| ----------------- | --------------- | --------- | ------------------------ |
| `hoat_dong`       | Hoạt động       | 🟢 Green  | Operating                |
| `dang_xay_dung`   | Đang xây dựng   | 🟡 Yellow | Under construction       |
| `cai_tao`         | Cải tạo         | 🟡 Yellow | Renovation               |
| `tam_dong`        | Tạm đóng        | 🟡 Yellow | Temporarily closed       |
| `ngung_hoat_dong` | Ngưng hoạt động | 🔴 Red    | Closed                   |
| `quy_hoach`       | Quy hoạch       | ⚪ Gray   | Planning (HIDDEN on map) |

---

## 👥 Permission System (4-tier)

### 1. KHACH (Guest)

- **Access Level**: Read-only
- **Permissions**:
  - ✅ View all parks on map
  - ✅ Search parks by name/radius
  - ✅ View park details
  - ❌ No login required (optional)

**API**: `GET /api/cong-vien/ban_do/` (all except quy_hoach)

---

### 2. CONG_DONG (Community User)

- **Access Level**: Read + Report
- **Permissions**:
  - ✅ All Guest features
  - ✅ Rate parks (POST /danh_gia/)
  - ✅ Report incidents (POST /bao_cao_su_co/)
  - ✅ Create events (POST /su_kien_cong_vien/)
  - ❌ Cannot handle incidents

**Auth**: Bearer token required  
**Model**: `ma_nhom_quyen.ten_nhom = 'CONG_DONG'`

---

### 3. QUAN_LY (Park Manager)

- **Access Level**: Manage 1 assigned park
- **Assignment**: `NguoiDung.ma_cong_vien` (1:1 relationship)
- **Permissions**:
  - ✅ All User features
  - ✅ Update amenities of assigned park (PATCH /tien_ich_cong_vien/{id}/)
  - ✅ Handle incidents (PATCH /bao_cao_su_co/{id}/)
  - ✅ Create events (POST /su_kien_cong_vien/)
  - ✅ View incidents for assigned park
  - ❌ Cannot change park status
  - ❌ Cannot delete parks
  - ❌ Cannot manage other parks

**Auth**: Bearer token + `ma_cong_vien` set  
**Model**: `ma_nhom_quyen.ten_nhom = 'QUAN_LY'`

**Check Permission**:

```python
# In permissions.py: IsParkManager
def has_object_permission(self, request, view, obj):
    return request.user.ma_cong_vien == obj.ma_cong_vien
```

---

### 4. QUAN_TRI (Admin)

- **Access Level**: Full access
- **Permissions**:
  - ✅ All features
  - ✅ Create/Update/Delete parks
  - ✅ Change park status
  - ✅ Manage all users
  - ✅ Delete archived incidents
  - ✅ Assign managers to parks

**Auth**: Bearer token + QUAN_TRI role  
**Model**: `ma_nhom_quyen.ten_nhom = 'QUAN_TRI'`

---

## 🗺️ Map & Location Features

### Map Display

**Endpoint**: `GET /api/cong-vien/ban_do/`

```bash
curl http://localhost:8000/api/cong-vien/ban_do/
```

**Response**:

```json
{
  "count": 45,
  "results": [
    {
      "ma_cong_vien": 1,
      "ten_cong_vien": "Công viên Tao Đàn",
      "toa_do_trung_tam": [10.7724, 106.6885],
      "dien_tich_m2": 128000.00,
      "ma_trang_thai": "hoat_dong",
      "ranh_gioi": { "type": "FeatureCollection", "features": [...] }
    }
  ]
}
```

**Features**:

- Default center: [10.8231, 106.6797] (Ho Chi Minh City)
- Default zoom: 10
- Marker colors by status (Green/Yellow/Red)
- Polygon boundary overlay
- Popup with park info on click

---

### Search by Radius

**Endpoint**: `POST /api/cong-vien/tim_gan_nhat/`

**Request**:

```json
{
  "lat": 10.8231,
  "lng": 106.6797,
  "ban_kinh_km": 5.0
}
```

**Formula**: Haversine distance calculation

```python
def haversine(lat1, lon1, lat2, lon2):
    from math import radians, cos, sin, asin, sqrt
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Km
    return c * r
```

**Response**:

```json
{
  "count": 8,
  "results": [
    {
      "ma_cong_vien": 5,
      "ten_cong_vien": "Park A",
      "khoang_cach_km": 2.5,
      "toa_do_trung_tam": [10.835, 106.7]
    }
  ]
}
```

---

### Frontend: ParkMapPage.jsx

**Features**:

1. **Leaflet Map**
   - Dynamic tile layer selection
   - Marker clustering
   - Boundary polygon rendering
   - Routing machine (OSRM)

2. **Search Controls**
   - Text search: Filter by park name
   - Radius search: Find nearest parks
   - Drag marker to change search location

3. **Filters** (sidebar)
   - Filter by park name
   - Radius range: 1-20 km slider

4. **Routing**
   - Calculate route to park
   - Multiple transport modes (driving/bike/walking)

---

## 🚨 Incident Management

### Model: BaoCaoSuCo

```python
class BaoCaoSuCo(models.Model):
    TRANG_THAI_CHOICES = [
        ('cho_xu_ly', 'Chờ xử lý'),      # Pending
        ('dang_xu_ly', 'Đang xử lý'),    # In progress
        ('da_xu_ly', 'Đã xử lý'),        # Resolved → AUTO ARCHIVE
    ]

    MUC_DO_CHOICES = [
        ('thap', 'Thấp'),                # Low
        ('trung_binh', 'Trung bình'),    # Medium
        ('cao', 'Cao'),                  # High
        ('khan_cap', 'Khẩn cấp'),        # Critical
    ]

    ma_bao_cao: int                      # Primary key
    ma_cong_vien: FK(CongVien)          # 1 park : N incidents
    tieu_de: str(200)                   # Title
    noi_dung_mo_ta: text                # Description
    url_hinh_anh: JSON[list]            # Image URLs
    trang_thai: str                     # Status
    muc_do_uu_tien: str                 # Priority
    ma_nguoi_phu_trach: FK(NguoiDung)   # Handler (Manager)
    ma_nguoi_bao_cao: FK(NguoiDung)     # Reporter
    vi_tri: JSON                        # GPS location [lat, lng]
    so_nguoi_xac_nhan: int              # Confirmations
    ngay_tao: datetime                  # Created
    ngay_cap_nhat: datetime             # Updated

    # NEW FIELDS for archiving
    is_archived: bool = False           # Archive flag
    ngay_luu_tru: datetime              # Archive date
```

---

### Incident Workflow

```
1. Reporter (CONG_DONG)
   └─> POST /bao_cao_su_co/ (Create incident)
       ├─ trang_thai = "cho_xu_ly" (default)
       ├─ muc_do_uu_tien = selected
       └─ Assigned to Park Manager

2. Manager (QUAN_LY)
   └─> PATCH /bao_cao_su_co/{id}/ (Handle incident)
       ├─ trang_thai = "dang_xu_ly" (In progress)
       └─ ma_nguoi_phu_trach = manager

3. Manager (QUAN_LY)
   └─> PATCH /bao_cao_su_co/{id}/ (Complete)
       ├─ trang_thai = "da_xu_ly" (Resolved)
       └─ Trigger: is_archived = True, ngay_luu_tru = now

4. Cron/Command: archive_incidents
   └─> Auto-archive incidents with "da_xu_ly"
   └─> Keep 7 days (configurable)
   └─> Delete older archived incidents
```

---

### Excel Export (No Duplicates)

**Endpoint**: `GET /api/bao_cao_su_co/export_excel/`

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `is_archived` | bool | false | Show active/archived |
| `date` | YYYY-MM-DD | today | Filter by date |

**Examples**:

```bash
# Export today's active incidents (no duplicates)
GET /api/bao_cao_su_co/export_excel/?is_archived=false

# Export specific date
GET /api/bao_cao_su_co/export_excel/?date=2026-03-30&is_archived=false

# Export archived incidents
GET /api/bao_cao_su_co/export_excel/?is_archived=true
```

**Duplicate Removal Logic**:

```python
seen = set()
unique_incidents = []
for incident in queryset:
    key = (incident.ma_cong_vien.ma_cong_vien, incident.tieu_de)
    # Remove duplicates by: PARK + TITLE
    if key not in seen:
        seen.add(key)
        unique_incidents.append(incident)
```

**Excel File Format**:

- Columns: STT | Công viên | Tiêu đề | Mô tả | Loại | Mức độ | Trạng thái | Người báo cáo | Người phụ trách | Số xác nhận | Ngày tạo
- Styling: Blue header, bordered cells, wrapped text
- Naming: `su_co_2026-03-30.xlsx`

---

### Auto-Archive Command

**Command**: `python manage.py archive_incidents [--days 7]`

```bash
# Archive with default 7 days
python manage.py archive_incidents

# Archive with custom days
python manage.py archive_incidents --days 14

# Output example:
# ✅ Archived 12 handled incidents
# 🗑️  Deleted 3 old archived incidents (older than 7 days)
# 📊 Current status:
#   📍 Active incidents: 45
#   📦 Archived incidents: 28
```

---

## 🔌 API Endpoints

### Parks (công viên)

| Method    | Endpoint                       | Auth | Role  | Description                   |
| --------- | ------------------------------ | ---- | ----- | ----------------------------- |
| GET       | `/api/cong-vien/`              | No   | Guest | List all parks                |
| GET       | `/api/cong-vien/ban_do/`       | No   | Guest | Map view (excludes planning)  |
| POST      | `/api/cong-vien/tim_gan_nhat/` | No   | Guest | Search by radius              |
| POST      | `/api/cong-vien/`              | Yes  | Admin | Create park                   |
| PUT/PATCH | `/api/cong-vien/{id}/`         | Yes  | Admin | Update park                   |
| DELETE    | `/api/cong-vien/{id}/`         | Yes  | Admin | Delete park (with validation) |

---

### Incidents (báo cáo sự cố)

| Method | Endpoint                           | Auth | Role    | Description     |
| ------ | ---------------------------------- | ---- | ------- | --------------- |
| GET    | `/api/bao-cao-su-co/`              | Yes  | Any     | List incidents  |
| GET    | `/api/bao-cao-su-co/export_excel/` | Yes  | Any     | Export Excel    |
| POST   | `/api/bao-cao-su-co/`              | Yes  | User+   | Create incident |
| PATCH  | `/api/bao-cao-su-co/{id}/`         | Yes  | Manager | Update status   |
| DELETE | `/api/bao-cao-su-co/{id}/`         | Yes  | Admin   | Delete incident |

**Filter Parameters**:

- `ma_cong_vien`: Park ID
- `trang_thai`: Status (cho_xu_ly, dang_xu_ly, da_xu_ly)
- `muc_do_uu_tien`: Priority
- `is_archived`: true/false

---

### Amenities (tiện ích)

| Method | Endpoint                        | Role    | Description    |
| ------ | ------------------------------- | ------- | -------------- |
| GET    | `/api/tien-ich-cong-vien/`      | Any     | List amenities |
| POST   | `/api/tien-ich-cong-vien/`      | Manager | Create amenity |
| PATCH  | `/api/tien-ich-cong-vien/{id}/` | Manager | Update amenity |
| DELETE | `/api/tien-ich-cong-vien/{id}/` | Admin   | Delete amenity |

---

### Events (sự kiện)

| Method | Endpoint                       | Role    | Description  |
| ------ | ------------------------------ | ------- | ------------ |
| GET    | `/api/su-kien-cong-vien/`      | Any     | List events  |
| POST   | `/api/su-kien-cong-vien/`      | Manager | Create event |
| PATCH  | `/api/su-kien-cong-vien/{id}/` | Manager | Update event |

---

### Users (người dùng)

Admin only endpoints:

- GET `/api/nguoi-dung/` - List users
- POST `/api/nguoi-dung/` - Create user
- PATCH `/api/nguoi-dung/{id}/` - Update user (assign role/park)
- DELETE `/api/nguoi-dung/{id}/` - Delete user

---

## 🎨 Frontend Components

### Directory Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── ParkMapPage.jsx       ← Main map interface
│   │   ├── ParkListPage.jsx      ← List view
│   │   ├── ParkDetailPage.jsx    ← Park details
│   │   ├── ParkArticlesPage.jsx  ← Blog articles
│   │   ├── IncidentsPage.jsx     ← Incident management
│   │   ├── AdminUsersPage.jsx    ← User admin (Role + Park assignment)
│   │   └── ...
│   ├── components/
│   │   ├── ProtectedRoute.jsx    ← Permission check
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   └── ...
│   ├── api.js                    ← API client
│   ├── store.js                  ← Zustand store
│   ├── hooks.js                  ← Custom hooks
│   └── constants.js              ← Config
```

---

### Key Components

#### 1. ParkMapPage.jsx

- **Purpose**: Display parks on interactive Leaflet map
- **Features**:
  - Marker placement with status colors
  - Boundary polygon overlay
  - Radius search with geolocation
  - Routing machine integration
  - Sidebar with park list
  - Filters (name, park type, status)

**Search Flow**:

```
User clicks "Tìm Quanh Vị Trí Này"
    ↓
Geolocation API gets user location [lat, lng]
    ↓
setSearchLocation([lat, lng])
setSearchRadius(radius)
    ↓
Trigger: useEffect on searchLocation + searchRadius
    ↓
Call API: getNearestParks(lat, lng, radius)
    ↓
Backend: Haversine formula filters
    ↓
setDisplayedParks(apiResponse)
    ↓
NOT filtered again (no double filtering)
    ↓
Render markers on map
```

---

#### 2. IncidentsPage.jsx

- **Purpose**: Manage park incidents/issues
- **Features**:
  - List incidents by park
  - Filter by status/priority
  - Create new incident with photos
  - Update status (for managers)
  - Export to Excel

---

#### 3. AdminUsersPage.jsx

- **Purpose**: Manage users & roles
- **Features**:
  - View all users
  - Assign role (KHACH/CONG_DONG/QUAN_LY/QUAN_TRI)
  - **Assign park to Manager** (ma_cong_vien field)
  - Enable/Disable users
  - Change password

---

#### 4. ParkArticlesPage.jsx

- **Purpose**: Display park articles/blog
- **Featured Image Size**: 280px height (enlarged from 200px)
- **Features**:
  - Responsive grid layout
  - Image overlay with category badge
  - Search box
  - Link to detail page

---

### API Client (api.js)

```javascript
const parksAPI = {
  // Map endpoints
  getAllForMap: () => GET /api/cong-vien/ban_do/,
  getNearestParks: (lat, lng, radius) => POST /api/cong-vien/tim_gan_nhat/,

  // Incident endpoints
  getIncidents: () => GET /api/bao-cao-su-co/,
  createIncident: (data) => POST /api/bao-cao-su-co/,
  updateIncident: (id, data) => PATCH /api/bao-cao-su-co/{id}/,
  exportIncidentsExcel: (params) => GET /api/bao-cao-su-co/export_excel/,

  // User endpoints
  getUsers: () => GET /api/nguoi-dung/,
  updateUser: (id, data) => PATCH /api/nguoi-dung/{id}/,
};
```

---

## 🚀 Setup & Migration

### Prerequisites

```bash
# Backend
Python 3.9+
Django 4.1.0
DRF 3.14.0
openpyxl 3.1.0+
Shapely 2.0.1+

# Frontend
Node.js 16+
React 18+
React Router 6+
Leaflet.js
Zustand
```

---

### Installation

#### Backend Setup

```bash
cd qlycv

# 1. Install dependencies
pip install -r requirements.txt

# 2. Create migration for new models
python manage.py makemigrations parks

# 3. Apply migrations
python manage.py migrate

# 4. Create initial data
python manage.py create_sample_data

# 5. Setup admin (optional)
python manage.py setup_admin

# 6. Run server
python manage.py runserver
```

---

#### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# 3. Run dev server
npm run dev

# 4. Build for production
npm run build
```

---

### Database Migrations

All migrations are in `parks/migrations/`:

| File                                              | Description                               |
| ------------------------------------------------- | ----------------------------------------- |
| `0001_initial.py`                                 | Initial models                            |
| `0002_seed_data.py`                               | Sample data                               |
| `0003_tienichcongvien_hinh_anh.py`                | Add images to amenities                   |
| `0004_alter_...`                                  | Previous updates                          |
| `0005_add_incident_archiving.py`                  | **NEW**: is_archived, ngay_luu_tru        |
| `0006_add_permission_roles_manager_assignment.py` | **NEW**: 4-tier roles, ma_cong_vien field |

**Run migrations**:

```bash
python manage.py migrate parks
```

---

### Data Initialization

#### Create Permission Roles

```bash
python manage.py shell

from parks.models import NhomQuyen

# Create 4 roles (if not exist)
roles = [
    ('KHACH', 'Khách'),
    ('CONG_DONG', 'Người dùng cộng đồng'),
    ('QUAN_LY', 'Quản lý công viên'),
    ('QUAN_TRI', 'Quản trị viên'),
]

for code, name in roles:
    NhomQuyen.objects.get_or_create(
        ten_nhom=code,
        defaults={'mo_ta': name}
    )

exit()
```

---

#### Create Test Users

```bash
python manage.py shell

from parks.models import NguoiDung, NhomQuyen, CongVien
import hashlib

# Admin user
admin_role = NhomQuyen.objects.get(ten_nhom='QUAN_TRI')
admin = NguoiDung.objects.create(
    ten_dang_nhap='admin',
    email='admin@gis.local',
    mat_khau_hash=hashlib.sha256('admin123'.encode()).hexdigest(),
    ho_ten='Administrator',
    ma_nhom_quyen=admin_role,
    token='admin_token_123'
)

# Manager user (assigned to park 1)
manager_role = NhomQuyen.objects.get(ten_nhom='QUAN_LY')
park = CongVien.objects.first()
manager = NguoiDung.objects.create(
    ten_dang_nhap='manager1',
    email='manager1@gis.local',
    mat_khau_hash=hashlib.sha256('manager123'.encode()).hexdigest(),
    ho_ten='Park Manager',
    ma_nhom_quyen=manager_role,
    ma_cong_vien=park,  # ← Assigned to park
    token='manager_token_123'
)

exit()
```

---

#### Test Geolocation API

```bash
# Get parks near location [10.8231, 106.6797] with 5km radius
curl -X POST http://localhost:8000/api/cong-vien/tim_gan_nhat/ \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 10.8231,
    "lng": 106.6797,
    "ban_kinh_km": 5.0
  }'
```

---

## 📊 Example Workflows

### Workflow 1: Report Incident (User)

```
1. User opens app (CONG_DONG role)
2. Navigates to: Incidents → Create New
3. Fills form:
   - Park: Select from dropdown
   - Title: "Trash scattered in playground"
   - Description: Detailed issue
   - Priority: "Cao" (High)
   - Location: [10.87, 106.68] (current GPS)
   - Images: Upload 2-3 photos
4. Submit → POST /api/bao-cao-su-co/
5. Status auto-set to "cho_xu_ly" (Pending)
6. Assigned to Park Manager

**Park Manager workflow:**
7. Manager receives notification
8. Opens Incidents → Assigned to Me
9. Updates status to "dang_xu_ly" (In progress)
10. Fixes the issue
11. Updates status to "da_xu_ly" (Resolved)
    - Triggers: is_archived = True, ngay_luu_tru = now()
12. Moved to History automatically

**Admin workflow (later):**
13. Cron runs: python manage.py archive_incidents
14. After 7 days: Archived incident deleted from system
```

---

### Workflow 2: Assign Park Manager

```
1. Admin opens: Users Management
2. Selects user with role "Quick_LY" (Manager)
3. Assigns "Park to Manage": Select "Công viên Tao Đàn"
   - Updates: NguoiDung.ma_cong_vien = Park ID
4. Manager can now:
   - View park details
   - Update park amenities
   - Handle incidents for this park ONLY
   - Create events for this park ONLY
5. Permission check (every request):
   - If role != QUAN_TRI:
     - Check: request.user.ma_cong_vien == object.ma_cong_vien
     - If False → 403 Forbidden
```

---

### Workflow 3: Export Incidents

```
1. Admin/Manager opens: Incidents
2. Clicks: Export Excel
3. System calls: GET /api/bao-cao-su-co/export_excel/
   ?is_archived=false&date=2026-03-30

4. Backend:
   - Filters: trang_thai != 'da_xu_ly'
   - Filters: ngay_tao.date() = 2026-03-30
   - Removes duplicates (Park + Title)
   - Creates Excel file with:
     * Blue header row
     * All incident details
     * Formatted cells
     * Wrapped text

5. Browser downloads: su_co_2026-03-30.xlsx
```

---

### Workflow 4: Search Parks by Radius

```
1. User opens Map
2. Default view: All parks in HCMC [10.8231, 106.6797], zoom 10

3. User clicks: "Tìm Quanh Vị Trí Này"
4. Browser requests geolocation permission
5. Gets user location: [10.8350, 106.6950]
6. Sets radius: 5 km

7. Frontend triggers API:
   POST /api/cong-vien/tim_gan_nhat/
   {
     "lat": 10.8350,
     "lng": 106.6950,
     "ban_kinh_km": 5.0
   }

8. Backend calculates:
   - Haversine distance for each park
   - Filters: distance <= 5 km
   - Returns 8 parks with distance

9. Frontend:
   - setDisplayedParks(response.results)
   - NO additional filtering
   - Render markers on map
   - Show circle overlay (5km radius)

10. User clicks marker → View park details
11. User clicks "Chỉ đường tới đây" → Routing machine calculates
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Search Radius Shows Wrong Parks

**Symptom**: Parks outside radius still showing  
**Root Cause**: Double filtering (API filter + Frontend filter)  
**Solution**: In `ParkMapPage.jsx`, check `searchRadius > 0` before applying filters

---

### Issue 2: Manager Can't Edit Other Parks

**Symptom**: 403 Forbidden error  
**Root Cause**: Permission check fails  
**Solution**: Verify `ma_cong_vien` assignment in admin panel

---

### Issue 3: Old Incidents Still in List

**Symptom**: Archived incidents from 14 days ago still visible  
**Root Cause**: Command not run  
**Solution**: Setup cron job or run manually:

```bash
python manage.py archive_incidents --days 7
```

---

## 📝 Summary

✅ **Permission System**: 4-tier role-based access control  
✅ **Map Features**: Leaflet with radius search, routing, boundary overlay  
✅ **Incident Management**: Create → Handle → Archive → Delete (7 days)  
✅ **Excel Export**: No duplicates, formatted, filterable  
✅ **User Management**: Assign roles and park management permissions  
✅ **Image Handling**: Upload to /media/, stored in JSON arrays  
✅ **API Authentication**: Token-based bearer auth

**Status**: 🟢 PRODUCTION READY

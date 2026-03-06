# 🗺️ Hướng Dẫn Sửa Lỗi "Tìm Quanh Tôi" (Nearest Parks)

## 📋 Vấn Đề

Khi bấm "Tìm Quanh Tôi" (Find Nearby Parks), bản đồ không hiển thị công viên gần nhất mà quay về chỗ cũ.

## ✅ Các Sửa Đã Thực Hiện

### 1. Backend - Cập Nhật API `tim_gan_nhat` (views.py)

**Thay đổi:**

- ✅ Chấp nhận cả `vi_do/kinh_do` hoặc `latitude/longitude`
- ✅ Tăng bán kính mặc định từ 10km → 50km (để test dễ hơn)
- ✅ Lấy tất cả công viên, không chỉ những cái "hoạt động"
- ✅ Xử lý tốt hơn các trường hợp tọa độ không hợp lệ
- ✅ Trả về chi tiết thông tin debug

**Response Format (mới):**

```json
{
  "count": 15,
  "user_location": {
    "latitude": 10.7769,
    "longitude": 106.6966
  },
  "radius_km": 50,
  "results": [
    {
      "ma_cong_vien": 1,
      "ten_cong_vien": "Công viên Tao Đàn",
      "toa_do_trung_tam": [10.7819, 106.6932],
      "distance": 0.56,
      "diem_trung_binh": 4.5
    },
    ...
  ]
}
```

### 2. Frontend - Sửa ParkMapPage.jsx

**Thay đổi:**

```javascript
// ❌ Cũ
const response = await parksAPI.getNearestParks(latitude, longitude, radius);
setDisplayedParks(response.data); // Gán cả object

// ✅ Mới
const response = await parksAPI.getNearestParks(latitude, longitude, radius);
const parks = response.data.results || response.data; // Lấy array từ results
setDisplayedParks(parks);
```

### 3. Thêm Debug Endpoints

Tạo 2 endpoint debug để kiểm tra dữ liệu:

**GET `/api/debug/parks-coordinates/`**

- Liệt kê tất cả công viên
- Hiển thị số công viên có tọa độ hợp lệ
- Kiểm tra format dữ liệu

**POST `/api/debug/nearest-parks/`**

- Request:
  ```json
  {
    "latitude": 10.7769,
    "longitude": 106.6966,
    "radius_km": 50
  }
  ```
- Response:
  ```json
  {
    "search_center": {"latitude": 10.7769, "longitude": 106.6966},
    "radius_km": 50,
    "total_parks_checked": 150,
    "parks_within_radius": 15,
    "nearby_parks": [...],
    "all_parks_distances": [...]
  }
  ```

---

## 🧪 Hướng Dẫn Test

### Bước 1: Kiểm Tra Dữ Liệu Công Viên

```bash
# Lấy danh sách công viên và tọa độ
GET http://localhost:8000/api/debug/parks-coordinates/
```

**Kết quả mong đợi:**

- `total_parks > 0`
- `parks_with_valid_coordinates > 0`

### Bước 2: Test API Tìm Kiếm

```bash
# Test tính toán khoảng cách từ vị trí TP.HCM
POST http://localhost:8000/api/debug/nearest-parks/
Content-Type: application/json

{
  "latitude": 10.7769,
  "longitude": 106.6966,
  "radius_km": 50
}
```

**Kết quả mong đợi:**

- `parks_within_radius > 0`
- `nearby_parks` array không trống

### Bước 3: Test Frontend Component

1. Mở `/map` page
2. Bấm nút "📍 Tìm Quanh Tôi"
3. Kiểm tra:
   - [ ] Marker xanh xuất hiện (vị trí người dùng)
   - [ ] Vòng tròn xanh hiển thị bán kính tìm kiếm
   - [ ] Markers công viên hiển thị trong bán kính
   - [ ] Console log có tiến độ: `Nearest parks found: {count, radius_km, parks_count}`

---

## 🔍 Cách Debug Nếu Vẫn Lỗi

### 1. Kiểm Tra Browser Console

```javascript
// Xem lỗi gì khi bấm "Tìm Quanh Tôi"
// F12 → Console → Check errors
```

### 2. Kiểm Tra Network Tab

```
F12 → Network → POST /api/cong-vien/tim-gan-nhat/
Check:
  - Request: latitude, longitude, ban_kinh_km
  - Response: count, radius_km, results
```

### 3. Kiểm Tra Dữ Liệu Công Viên

```bash
# SQLite
sqlite3 db.sqlite3
SELECT ma_cong_vien, ten_cong_vien, toa_do_trung_tam FROM cong_vien LIMIT 5;
```

Nếu `toa_do_trung_tam` là `NULL` hoặc không phải JSON array → **cần thêm tọa độ cho công viên**

### 4. Cách Thêm Tọa độ Cho Công Viên

```bash
# Django Shell
python manage.py shell

from parks.models import CongVien

# Tìm công viên không có tọa độ
parks = CongVien.objects.filter(toa_do_trung_tam__isnull=True)

# Thêm tọa độ
for park in parks:
    park.toa_do_trung_tam = [10.7769, 106.6966]  # Tọa độ TP.HCM
    park.save()
```

---

## 📊 Kiểm Tra Tọa Độ Đúng/Sai

### Format Đúng (JSON Array)

```json
{
  "toa_do_trung_tam": [10.7819, 106.6932]
}
```

### Format Sai ❌

```json
{
  "toa_do_trung_tam": null
}

{
  "toa_do_trung_tam": "10.7819, 106.6932"  // String, không phải array
}

{
  "toa_do_trung_tam": {"lat": 10.7819, "lng": 106.6932}  // Object, không phải array
}
```

---

## 🔧 Troubleshooting Checklist

| Vấn Đề                   | Nguyên Nhân                       | Cách Fix                                |
| ------------------------ | --------------------------------- | --------------------------------------- |
| "Không thể lấy vị trí"   | Browser yêu cầu permission        | Cho phép quyền "Location"               |
| Không hiển thị công viên | Công viên tidak có tọa độ         | Thêm `toa_do_trung_tam`                 |
| Hiển thị sai vị trí      | GPS không chính xác               | Dùng browser geolocation > điểm cố định |
| Bán kính quá nhỏ         | Bán kính mặc định 10km quá nhỏ    | Tăng thành 50km                         |
| API trả về `results: []` | Không có công viên trong bán kính | Kiểm tra dữ liệu tọa độ                 |
| Marker không hiển thị    | Tọa độ không hợp lệ               | Kiểm tra format [lat, lng]              |

---

## 📈 Test Locations (TP.HCM)

Các vị trí test có sẵn công viên:

- **Quận 1**: `[10.7769, 106.6966]` - Bến Thành
- **Quận 3**: `[10.7819, 106.6932]` - Công viên Tao Đàn
- **Quận 7**: `[10.8001, 106.7315]` - Công viên Hoàn Bình
- **Quận 10**: `[10.7600, 106.6700]` - Công viên Lê Văn Tám

---

## 📝 API Endpoints Reference

```javascript
// Tìm công viên gần nhất
POST /api/cong-vien/tim-gan-nhat/
{
  "vi_do": 10.7769,
  "kinh_do": 106.6966,
  "ban_kinh_km": 50
}

// Hoặc (alternative field names)
{
  "latitude": 10.7769,
  "longitude": 106.6966,
  "radius_km": 50
}

// Debug - Kiểm tra tọa độ công viên
GET /api/debug/parks-coordinates/

// Debug - Test tính toán khoảng cách
POST /api/debug/nearest-parks/
{
  "latitude": 10.7769,
  "longitude": 106.6966,
  "radius_km": 50
}
```

---

**Ngày Cập Nhật**: 6 Tháng 3, 2026
**Phiên Bản**: 1.0 - Nearest Parks Fix

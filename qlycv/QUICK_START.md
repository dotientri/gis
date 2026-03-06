# 🚀 QUICK START - Hướng Dẫn Nhanh

## 1️⃣ Khởi Tạo Dữ Liệu

```bash
# Chạy command để tạo tất cả dữ liệu mẫu
python manage.py init_data

# Output kỳ vọng:
# ✅ Khởi tạo dữ liệu hoàn thành!
```

## 2️⃣ Khởi Động Server

```bash
# Backend (Django)
python manage.py runserver

# Frontend (trong terminal khác)
cd frontend
npm run dev
```

## 3️⃣ Truy Cập Form Thêm Công Viên

```
URL: http://localhost:3000/create-park
hoặc: http://localhost:3000/parks/create
```

## 4️⃣ Điền Form - Bước Chi Tiết

### Phần 1: Thông Tin Cơ Bản

```
- Tên công viên: "Công viên Tây Sài Gòn" (required)
- Mô tả chi tiết: Viết ≥250 ký tự để tối ưu SEO
  Ví dụ: "Công viên Tây Sài Gòn là công viên cấp quận nằm ở
  vị trí trung tâm, với diện tích 50.000 m². Công viên được
  xây dựng vào năm 2015 để cung cấp không gian xanh cho cư
  dân. Với hơn 35.000 m² cây xanh và 6.000 m² mặt nước, công
  viên tạo nên một môi trường sinh thái lành mạnh giữa lòng
  thành phố. Công viên nổi bật với những tiện ích đa dạng..."
- Diện tích: 50000 (m²)
- Quận/Huyện: Chọn từ dropdown
- Loại công viên: Chọn từ dropdown
- Từ khóa SEO: "công viên Quận 1, công viên xanh TP.HCM, không gian vui chơi"
```

### Phần 2: Vị Trí Tọa Độ

```
- Bấm "Chọn Vị Trí Trên Bản Đồ"
- Bản đồ sẽ mở bằng Modal
- Click vào vị trí công viên trên bản đồ
- Dấu chấm đỏ sẽ hiển thị vị trí đã chọn
- Bấm "Xác nhận vị trí"
- Tọa độ sẽ tự động cập nhật (6 chữ số thập phân)

Ví dụ: 10.780000, 106.705000
```

### Phần 3: Hình Ảnh Công Viên

```
- Bấm "Chọn tệp" hoặc kéo thả 4+ ảnh
- Nên tải các ảnh đa dạng:
  * 1 ảnh toàn cảnh công viên
  * 1 ảnh tiện ích chính
  * 1 ảnh cây xanh/cảnh quan
  * 1 ảnh hoạt động/sự kiện

- Sẽ hiển thị preview nhỏ (100x100px)
- Bấm X để xóa ảnh nếu cần
- Cần >= 4 ảnh (sẽ có cảnh báo đỏ nếu chưa đủ)
```

### Phần 4: Tiện Ích

```
Có 4 loại tiện ích mặc định:
1. Nhà vệ sinh □
2. Hồ bơi □
3. Sân thể thao □
4. Hồ nước □

Cho mỗi tiện ích được chọn:
1. Tải 2 ảnh minh họa (giới hạn tự động)
   - Ảnh 1: Toàn cảnh tiện ích
   - Ảnh 2: Chi tiết tiện ích

2. Viết mô tả chi tiết ≥150 ký tự:
   Ví dụ (Nhà vệ sinh):
   "Nhà vệ sinh sạch sẽ, được vệ sinh liên tục hàng giờ.
   Có cả phòng vệ sinh cho người khuyết tật với đầy đủ
   tiện ích. Được cấp nước sạch từ hệ thống công cộng.
   Có ánh sáng tốt và thông gió. Được quản lý bởi nhân
   viên công viên chuyên nghiệp, đảm bảo vệ sinh 24/7.
   Có máy sấy tay hiện đại."

3. Sẽ có bộ đếm ký tự:
   - < 150: Hiển thị ORANGE (cảnh báo)
   - >= 150: Hiển thị GREEN (tốt)
```

## 5️⃣ Gửi Form

```
- Kiểm tra tất cả field bắt buộc (*)
- Tối thiểu 4 ảnh công viên
- Ít nhất 1 tiện ích được chọn (khuyến nghị)
- Bấm "Tạo Công Viên" (nút xanh)
- Chờ xử lý (sẽ hiển thị "Đang lưu...")
- Sẽ chuyển hướng đến trang chi tiết công viên
```

## 📊 Kiểm Tra Dữ Liệu

### 1. Xem Dữ Liệu Công Viên đã Tạo

```bash
curl http://localhost:8000/api/cong-vien/
```

### 2. Xem Chi Tiết Công Viên

```bash
curl http://localhost:8000/api/cong-vien/1/
```

### 3. Xem Loại Tiện Ích

```bash
curl http://localhost:8000/api/loai-tien-ich/
```

### 4. Xem Quận Huyện

```bash
curl http://localhost:8000/api/quan-huyen/
```

## 🐛 Khắc Phục Sự Cố

### Sự cố 1: "Error creating park"

**Giải pháp**:

- Kiểm tra tất cả field bắt buộc (có dấu \*)
- Kiểm tra bạn đã chọn ≥4 ảnh
- Xem console (F12) để xem chi tiết lỗi

### Sự cố 2: Bản đồ không hiển thị

**Giải pháp**:

- Kiểm tra bạn đã import `react-leaflet` và `leaflet`
- Kiểm tra CSS được load: `leaflet/dist/leaflet.css`
- Restart server frontend

### Sự cố 3: Không tìm thấy loại tiện ích

**Giải pháp**:

- Chạy `python manage.py init_data`
- Kiểm tra API: `http://localhost:8000/api/loai-tien-ich/`

### Sự cố 4: Hình ảnh không upload

**Giải pháp**:

- Kiểm tra định dạng ảnh (JPG, PNG, GIF)
- Kiểm tra kích thước ảnh (< 10MB khuyến nghị)
- Xem console browser để chi tiết lỗi

## 🎯 Lưu Ý Quan Trọng

1. **Mô tả chi tiết**: ≥250 ký tự cho công viên, ≥150 cho tiện ích
   - Tối ưu SEO
   - Giúp du khách tìm kiếm
   - Cải thiện xếp hạng tìm kiếm

2. **Hình ảnh chất lượng cao**:
   - Tối thiểu 4 ảnh công viên
   - 2 ảnh/tiện ích nếu có
   - Chọn ảnh đa dạng và rõ ràng

3. **Tọa độ GPS**:
   - Phải chính xác (max 6 chữ số thập phân)
   - Dùng bản đồ để chọn
   - Ảnh hưởng đến tìm kiếm "công viên gần nhất"

4. **Từ khóa SEO**:
   - Không bắt buộc nhưng rất khuyến nghị
   - Giúp người dùng tìm kiếm dễ hơn
   - Tối ưu công cụ tìm kiếm (Google, Bing, etc.)

## 📱 API Documentation

### POST /api/cong-vien/

Tạo công viên mới

```json
{
  "ten_cong_vien": "...",
  "mo_ta": "...",
  "dien_tich_m2": 50000,
  "ma_loai": 1,
  "ma_quan_huyen": 1,
  "toa_do_trung_tam": [10.78, 106.7]
}
```

### POST /api/hinh-anh-cong-vien/

Upload ảnh công viên (multipart/form-data)

```
ma_cong_vien: 1
url_anh: (file upload)
la_anh_chinh: true/false
```

### POST /api/tien-ich-cong-vien/

Tạo tiện ích (multipart/form-data)

```
ma_cong_vien: 1
ma_loai_tien_ich: 1
so_luong: 1
mo_ta: "..."
tinh_trang: "tot"
dang_su_dung: true
hinh_anh_files: (file uploads)
```

---

**Lưu ý**: Tất cả dữ liệu mẫu đã được tạo sẵn. Bạn có thể xem các công viên mẫu hoặc tạo công viên mới của mình!

Happy creating! 🎉

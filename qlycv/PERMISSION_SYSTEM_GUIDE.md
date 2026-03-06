# Hệ Thống Xác Nhân & Phân Quyền - GIS Park Management

## 📋 Tóm Tắt Các Vấn Đề & Lỗi Đã Sửa

### ❌ Vấn Đề Gốc

1. **Không kiểm tra quyền hạn**: Tất cả API endpoints sử dụng `AllowAny()` hoặc không có permission classes
2. **Người dùng thường có thể sửa/xóa công viên**: Chẳng có kiểm tra quyền để giới hạn quyền truy cập
3. **Quản lý người dùng không có bảo vệ**: Bất cứ ai cũng có thể tạo/sửa/xóa tài khoản người dùng
4. **Token không được xác thực**: Không có kiểm tra token trong hầu hết các endpoint

### ✅ Giải Pháp Đã Triển Khai

#### 1. Tạo File Permissions (`parks/permissions.py`)

Đã tạo custom permission classes để kiểm tra vai trò người dùng:

```python
# Các Roles trong Hệ Thống
- QUAN_TRI (Admin) - Quản trị viên toàn hệ thống
- QUAN_LY_CV (Manager) - Quản lý công viên
- KIEM_TRA (Inspector) - Nhân viên kiểm tra
- BIEN_TAP_GIS (GIS Editor) - Biên tập viên GIS
- CONG_DONG (Community) - Người dùng cộng đồng
```

#### 2. Custom Permission Classes

**IsAuthenticated**: Xác thực basic - người dùng phải có token hợp lệ

```python
- Kiểm tra header Authorization
- Tìm user bằng token
- Gán request.user nếu token hợp lệ
```

**IsAdmin**: Chỉ Admin (QUAN_TRI)
**IsParkManager**: Quản lý công viên hoặc Admin
**IsGISEditor**: Biên tập viên GIS hoặc Admin
**IsParkManagerOrGISEditor**: Quản lý hoặc GIS Editor
**IsInspector**: Nhân viên kiểm tra hoặc Admin
**IsOwnerOrAdmin**: Chủ sở hữu tài khoản hoặc Admin

#### 3. Cập Nhật Views.py

Tất cả ViewSets được cập nhật với `get_permissions()` method:

```python
def get_permissions(self):
    if self.request.method == 'GET':
        return [AllowAny()]  # Cho phép đọc
    return [RequiredPermission()]  # Yêu cầu quyền hạn để tạo/sửa/xóa
```

#### 4. Sửa Admin_views.py

Tất cả ViewSets trong admin_views.py được cập nhật:

- Thay `AdminPermission` bằng `IsAdmin()`
- Cập nhật dashboard_admin() để kiểm tra token

---

## 🔐 Quyền Truy Cập Chi Tiết Cho Mỗi API

### Công Viên (CongVien)

- **GET**: AllowAny (Ai cũng xem được)
- **POST, PUT, PATCH, DELETE**: IsParkManagerOrGISEditor (Quản lý hoặc GIS Editor)

### Người Dùng (NguoiDung)

- **GET danh sách/tìm kiếm**: IsAuthenticated (Đã đăng nhập)
  - Nếu không phải Admin, chỉ xem thông tin của chính mình
- **POST (tạo)**: IsAdmin
- **PUT, PATCH, DELETE**: IsAdmin

### Đánh Giá (DanhGiaCongVien)

- **GET**: AllowAny
- **POST (tạo đánh giá)**: IsAuthenticated
- **PUT, PATCH, DELETE (sửa/xóa)**: IsAdmin

### Kiểm Tra Công Viên (KiemTraCongVien)

- **GET**: AllowAny
- **POST, PUT, PATCH, DELETE**: IsInspector (Kiểm tra viên hoặc Admin)

### Báo Cáo Sự Cố (BaoCaoSuCo)

- **GET**: AllowAny
- **POST (tạo báo cáo)**: IsAuthenticated
- **PUT, PATCH, DELETE (xử lý)**: IsParkManager

### Sự Kiện (SuKienCongVien)

- **GET**: AllowAny
- **POST (tạo sự kiện)**: IsAuthenticated
- **PUT, PATCH, DELETE (duyệt)**: IsAdmin

### Hình Ảnh (HinhAnhCongVien)

- **GET**: AllowAny
- **POST, PUT, PATCH, DELETE**: IsParkManagerOrGISEditor

### Tiện Ích (TienIchCongVien, LoaiTienIch)

- **GET**: AllowAny
- **POST, PUT, PATCH, DELETE**: IsGISEditor hoặc IsParkManager

### Cây Xanh (CayXanh, LoaiCay)

- **GET**: AllowAny
- **POST, PUT, PATCH, DELETE**: IsParkManagerOrGISEditor

### Admin Dashboard

- **GET**: IsAdmin

### Lịch Sử Thay Đổi (NhatKyThayDoi)

- **GET**: IsAdmin

### Thống Kê Truy Cập (ThongKeTruyenCap)

- **GET**: IsAdmin

---

## 🧪 Cách Test Permission System

### 1. Test Login

```javascript
POST /
  api /
  auth /
  login /
  {
    ten_dang_nhap: "admin",
    mat_khau: "admin123",
  };
// Nhận token
```

### 2. Test với Token

```javascript
GET /api/parks/
Authorization: Bearer {token}
// Xem công viên không cần token (AllowAny)

POST /api/parks/
Authorization: Bearer {token}
Body: {...}
// Chỉ Quản lý/GIS Editor mới có thể tạo
// Người dùng thường sẽ nhận 403 Forbidden
```

### 3. Test Quản Lý Người Dùng

```javascript
GET /api/users/
Authorization: Bearer {user_token}
// Chỉ Admin xem được tất cả, người khác thì chỉ xem được của mình

POST /api/users/
Authorization: Bearer {user_token}
Body: {...}
// Chỉ Admin mới có thể tạo người dùng mới
// Người khác sẽ nhận 403 Forbidden
```

---

## 📝 Hướng Dẫn Sử Dụng Frontend

### Lưu Token Sau Khi Login

```javascript
const response = await fetch("/api/auth/login/", {
  method: "POST",
  body: JSON.stringify({
    ten_dang_nhap: username,
    mat_khau: password,
  }),
});

const data = await response.json();
localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));
```

### Gửi Token Trong Mỗi Request

```javascript
const token = localStorage.getItem("token");
const response = await fetch("/api/parks/", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(parkData),
});

if (response.status === 403) {
  // Hiển thị: "Bạn không có quyền thực hiện hành động này"
}
```

### Kiểm Tra Quyền Ở Frontend

```javascript
const user = JSON.parse(localStorage.getItem("user"));
const role = user.ma_nhom_quyen.ten_nhom;

// Chỉ hiển thị nút Edit/Delete cho admin/quản lý
if (["QUAN_TRI", "QUAN_LY_CV"].includes(role)) {
  // Hiển thị nút Edit, Delete
}

// Chỉ GIS Editor mới có thể thêm tiện ích
if (["QUAN_TRI", "BIEN_TAP_GIS"].includes(role)) {
  // Hiển thị form thêm tiện ích
}
```

---

## 🚨 Lỗi Phổ Biến & Cách Xử Lý

### 401 Unauthorized

**Nguyên nhân**: Token không hợp lệ hoặc bị hết hạn
**Cách Fix**:

- Kiểm tra token có tồn tại không
- Đăng nhập lại nếu bị expire

### 403 Forbidden

**Nguyên nhân**: Người dùng không có quyền thực hiện hành động
**Cách Fix**:

- Kiểm tra vai trò của người dùng
- Chỉ cho phép các tác vụ phù hợp với vai trò
- Hiển thị thông báo "Bạn không có quyền thực hiện hành động này"

### 400 Bad Request

**Nguyên nhân**: Dữ liệu gửi không hợp lệ
**Cách Fix**: Kiểm tra định dạng dữ liệu gửi đi

---

## 📊 Bảng So Sánh: Trước & Sau

| Chức Năng              | Trước             | Sau                    |
| ---------------------- | ----------------- | ---------------------- |
| Tạo/Sửa/Xóa Công Viên  | Ai cũng được      | Chỉ Quản lý/GIS Editor |
| Quản Lý Người Dùng     | Ai cũng được      | Chỉ Admin              |
| Xem Điều Chỉnh Lịch Sử | Ai cũng được      | Chỉ Admin              |
| Xem Dashboard Admin    | Ai cũng được      | Chỉ Admin              |
| Tạo Đánh Giá           | Không có kiểm tra | Chỉ Đã Đăng Nhập       |
| Tạo/Xóa Tài Khoản      | Ai cũng được      | Chỉ Admin              |
| Token Validation       | Không kiểm tra    | Kiểm tra Strict        |

---

## 🔄 Cập Nhật Tiếp Theo (Tùy Chọn)

1. **JWT Tokens** - Thay token string hiện tại bằng JWT với expiry time
2. **Role-Based View Filters** - Tự động lọc dữ liệu theo quyền người dùng
3. **Audit Logging** - Ghi log tất cả hành động của admin
4. **IP Whitelisting** - Giới hạn IP có thể truy cập admin panel
5. **Two-Factor Authentication** - Xác thực hai lớp cho admin

---

**Ngày Cập Nhật**: 6 Tháng 3, 2026
**Phiên Bản**: 1.0 - Permission System Implementation

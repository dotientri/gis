# Manager Park Assignment & Editing - API Documentation

## Overview

Fixed critical bugs in manager role permission system:

1. **Manager park editing bug** - Manager couldn't edit parks (object vs ID comparison bug)
2. **Missing assign/unassign endpoints** - No way to assign manager to parks
3. **Error handling** - No proper error catching in update method

## Endpoints

### 1. Assign Manager to Park

**Admin-only endpoint to assign a manager to a park**

```
POST /api/cong-vien/{park_id}/assign-manager/
Authorization: Token {admin_token}
Content-Type: application/json
```

**Request Body (choose one):**

```json
{
  "manager_id": 123
}
```

OR

```json
{
  "manager_username": "manager_test"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Đã phân công công viên \"Công viên Vạn Hạnh\" cho manager \"manager_test\"",
  "park": {
    /* CongVienDetailSerializer data */
  },
  "manager": {
    /* NguoiDungSerializer data */
  }
}
```

**Error Responses:**

- **400 Bad Request**: Missing manager_id/manager_username

  ```json
  { "error": "Cần cung cấp manager_id hoặc manager_username" }
  ```

- **404 Not Found**: Manager doesn't exist

  ```json
  { "error": "Manager không tồn tại" }
  ```

- **400 Bad Request**: User is not a manager role

  ```json
  { "error": "Người dùng \"username\" không phải là manager" }
  ```

- **400 Bad Request**: Manager already assigned to another park
  ```json
  { "error": "Manager \"username\" đã được gán cho công viên khác: Park Name" }
  ```

---

### 2. Unassign Manager from Park

**Admin-only endpoint to remove manager assignment from a park**

```
POST /api/cong-vien/{park_id}/unassign-manager/
Authorization: Token {admin_token}
Content-Type: application/json
```

**Success Response (200 OK):**

```json
{
  "message": "Đã gỡ bỏ manager \"manager_test\" khỏi công viên \"Công viên Vạn Hạnh\"",
  "park": {
    /* CongVienDetailSerializer data */
  }
}
```

**Error Response (404 Not Found):**

```json
{ "error": "Không có manager nào được gán cho công viên này" }
```

---

### 3. Manager Edit Park (FIXED)

**Manager can now edit their assigned park**

```
PATCH /api/cong-vien/{park_id}/
Authorization: Token {manager_token}
Content-Type: application/json
```

**Request Body (editable fields for manager):**

```json
{
  "mo_ta": "Updated description",
  "dia_chi": "New address",
  "email": "contact@park.com",
  "so_dien_thoai": "0123456789",
  "gia_ve": "50000"
}
```

**Restricted Fields (manager CANNOT change):**

- `ma_trang_thai` - Park status
- `ma_loai` - Park type

**Success Response (200 OK):**

```json
{
  /* Updated CongVienDetailSerializer data */
}
```

**Error Responses:**

- **403 Forbidden**: Manager not assigned to this park

  ```json
  { "error": "Bạn chỉ được quản lý công viên được gán cho mình" }
  ```

- **403 Forbidden**: Trying to change status/type

  ```json
  { "error": "Bạn không có quyền thay đổi trạng thái hoặc loại công viên" }
  ```

- **400 Bad Request**: General error
  ```json
  { "error": "Lỗi khi cập nhật công viên: [error details]" }
  ```

---

## Bug Fixes Explained

### Bug #1: Object vs ID Comparison

**Problem:**

```python
// BEFORE (WRONG)
if park != request.user.ma_cong_vien:  # Comparing object with ID or FK
    return 403 error
```

**Fix:**

```python
# AFTER (CORRECT)
user_assigned_park_id = request.user.ma_cong_vien_id if hasattr(request.user.ma_cong_vien, 'ma_cong_vien') else request.user.ma_cong_vien
if park.ma_cong_vien != user_assigned_park_id:
    return 403 error
```

### Bug #2: Missing Error Handling

**Added try-except blocks:**

- `update()` method now catches all errors and returns proper 400 responses
- `perform_update()` method now catches save errors

### Bug #3: Missing Endpoints

**Added two new endpoints:**

- `POST /api/cong-vien/{id}/assign-manager/` - Assign manager
- `POST /api/cong-vien/{id}/unassign-manager/` - Remove assignment

---

## Frontend Integration Example

### 1. Assign Manager to Park (Admin Page)

```javascript
async function assignManagerTopark(parkId, managerUsername) {
  const response = await fetch(`/api/cong-vien/${parkId}/assign-manager/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      manager_username: managerUsername,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Lỗi phân công");
  }

  const data = await response.json();
  console.log(data.message); // Success!
  return data;
}
```

### 2. Manager Edit Park (Manager Page)

```javascript
async function managerEditPark(parkId, updateData) {
  const response = await fetch(`/api/cong-vien/${parkId}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${managerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    // Returns proper error message from backend
    throw new Error(error.error || "Lỗi cập nhật");
  }

  return await response.json();
}
```

---

## Testing

Run the test script:

```bash
python test_manager_fixes.py
```

Expected output: "✅ ALL TESTS PASSED!"

---

## Permission Matrix

| Action                         | Guest | User | Manager | Admin |
| ------------------------------ | ----- | ---- | ------- | ----- |
| GET /cong-vien                 | ✅    | ✅   | ✅      | ✅    |
| POST /cong-vien                | ❌    | ❌   | ❌      | ✅    |
| PATCH /cong-vien (own)         | ❌    | ❌   | ✅      | ✅    |
| PATCH /cong-vien (status/type) | ❌    | ❌   | ❌      | ✅    |
| POST /assign-manager           | ❌    | ❌   | ❌      | ✅    |
| POST /unassign-manager         | ❌    | ❌   | ❌      | ✅    |

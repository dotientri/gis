# 🐳 HƯỚNG DẪN SETUP PROJECT - TỪ TẢI DOCKER ĐẾN CHẠY PROJECT

> **Hướng dẫn này dành cho:** Người hoàn toàn mới, máy chưa cài gì, muốn dùng Docker để chạy project.

---

## 📋 DANH SÁCH CÔNG VIỆC

### **GIAI ĐOẠN 1: CÀI ĐẶT CÔNG CỤ** (30 phút)

- [ ] Tải Git
- [ ] Cài Git
- [ ] Tải Docker Desktop
- [ ] Cài Docker Desktop
- [ ] Kiểm tra Docker hoạt động

### **GIAI ĐOẠN 2: LẤY PROJECT VỀ** (5 phút)

- [ ] Clone project từ GitHub
- [ ] Kiểm tra folder project

### **GIAI ĐOẠN 3: CHẠY PROJECT** (10 phút)

- [ ] Chạy Docker Compose
- [ ] Truy cập ứng dụng

---

# 🔧 CHI TIẾT TỪNG BƯỚC

## **GIAI ĐOẠN 1: CÀI ĐẶT CÔNG CỤ**

### **BƯỚC 1: Tải Git**

Git là công cụ để lấy code từ GitHub về máy.

**Các bước tải:**

1. Mở trình duyệt, vào: https://git-scm.com/download/win
2. Bạn sẽ thấy trang tải xuống như hình:

   ```
   Git for Windows Setup
   [Download]
   ```

3. Nhấp nút **"Download"** bên trái
   - Sẽ tải file tên `Git-X.XX.X-64-bit.exe` (ví dụ: `Git-2.42.0-64-bit.exe`)
   - File sẽ vào thư mục `Downloads` của bạn

4. **Kiểm tra:** Vào `C:\Users\{tên_bạn}\Downloads`, xem có file `.exe` không

✅ **Xong bước tải Git**

---

### **BƯỚC 2: Cài Git**

1. Vào thư mục `Downloads`, tìm file `Git-X.XX.X-64-bit.exe`
2. Nhấp đúp vào file để chạy
3. Sẽ hiện cửa sổ:

   ```
   "Do you want to allow this app to make changes?"
   [Yes]  [No]
   ```

   → Nhấp **[Yes]**

4. Cửa sổ cài đặt sẽ mở:

   ```
   ┌─────────────────────────────┐
   │   Git Setup Wizard 2.42.0   │
   ├─────────────────────────────┤
   │                             │
   │ Welcome to Git Setup!       │
   │                             │
   │ [Next >]                    │
   └─────────────────────────────┘
   ```

   → Nhấp **[Next >]**

5. Cửa sổ "Select Destination Location":

   ```
   C:\Program Files\Git
   ```

   → Giữ nguyên, nhấp **[Next >]**

6. Cửa sổ "Select Components":
   - Đánh dấu: ☑ Git Bash
   - Đánh dấu: ☑ Git CMD
   - Đánh dấu: ☑ Git GUI
     → Nhấp **[Next >]**

7. Cửa sổ "Start Menu Folder":
   → Nhấp **[Next >]** (giữ nguyên)

8. Cửa sổ "Choose the default editor used by Git":
   - Chọn: **Nano** (trình soạn thảo đơn giản)
     → Nhấp **[Next >]**

9. Cửa sổ "Adjusting the name of the initial branch in new repositories":
   - Chọn: **Let Git decide** (tùy chọn đầu tiên)
     → Nhấp **[Next >]**

10. Cửa sổ "Adjusting your PATH environment":
    - Chọn: **Git from the command line and also from 3rd-party software**
      → Nhấp **[Next >]**

11. Cửa sổ "Choosing the SSH executable":
    → Nhấp **[Next >]** (giữ nguyên)

12. Cửa sổ "Choosing HTTPS transport backend":
    → Nhấp **[Next >]** (giữ nguyên)

13. Cửa sổ "Configuring the line ending conversions":
    - Chọn: **Checkout as-is, commit as-is**
      → Nhấp **[Next >]**

14. Cửa sổ "Configuring the terminal emulator to use with Git Bash":
    - Chọn: **Use MinTTY (the default terminal of MSYS2)**
      → Nhấp **[Next >]**

15. Cửa sổ "Choose a credential helper":
    → Nhấp **[Next >]** (giữ nguyên)

16. Cửa sổ "Configuring extra options":
    → Nhấp **[Next >]** (giữ nguyên)

17. Cuối cùng, nhấp **[Install]**

18. Chờ quá trình cài (2-3 phút)

19. Khi xong, sẽ có checkbox:
    - ☐ Launch Git Bash
    - ☐ View Release Notes
      → **Bỏ đánh dấu cả hai**, nhấp **[Finish]**

✅ **Xong cài Git**

---

### **BƯỚC 3: Kiểm tra Git đã cài đúng**

1. Nhấp phải vào **Desktop** → chọn **"Open PowerShell here"**
2. Cửa sổ PowerShell sẽ mở:

   ```
   PS C:\Users\{tên_bạn}\Desktop>
   ```

3. Gõ lệnh:

   ```powershell
   git --version
   ```

4. Nhấp Enter

5. **Nếu thấy:**

   ```
   git version 2.42.0.windows.2
   ```

   → ✅ Git cài đúng!

6. **Nếu thấy:**
   ```
   git : The term 'git' is not recognized as the name of a cmdlet...
   ```
   → ❌ Git chưa cài đúng, cài lại

---

### **BƯỚC 4: Tải Docker Desktop**

Docker là công cụ chạy project trong "hộp" riêng.

**Các bước tải:**

1. Mở trình duyệt, vào: https://www.docker.com/products/docker-desktop

2. Bạn sẽ thấy:

   ```
   Download Docker Desktop
   [Download for Windows]
   ```

3. Nhấp **[Download for Windows]**
   - Sẽ tải file `Docker Desktop Installer.exe`

4. **Kiểm tra:** Vào `Downloads`, xem có file không

✅ **Xong bước tải Docker**

---

### **BƯỚC 5: Cài Docker Desktop**

1. Vào `Downloads`, tìm file `Docker Desktop Installer.exe`

2. Nhấp đúp vào file

3. Sẽ hỏi "Do you want to allow this app to make changes?"
   → Nhấp **[Yes]**

4. Quá trình cài sẽ bắt đầu (2-5 phút)

   ```
   Installing Docker Desktop...
   [████████████████████] 100%
   ```

5. Khi xong:

   ```
   ┌──────────────────────┐
   │ Installation Success │
   ├──────────────────────┤
   │ Docker Desktop is    │
   │ ready to use!        │
   │ [Close]              │
   └──────────────────────┘
   ```

   → Nhấp **[Close]**

6. ⚠️ **QUAN TRỌNG: Khởi động lại máy**
   - Nhấp Start menu → Power → **Restart**
   - Chờ máy khởi động lại

✅ **Xong cài Docker, máy đang khởi động lại**

---

### **BƯỚC 6: Kiểm tra Docker đã cài đúng**

**Sau khi máy khởi động lại:**

1. Mở **PowerShell** lại (nhấp phải Desktop → "Open PowerShell here")

2. Gõ:

   ```powershell
   docker --version
   ```

3. Nhấp Enter

4. **Nếu thấy:**

   ```
   Docker version 24.0.0, build abc1234
   ```

   → ✅ Docker cài đúng!

5. **Nếu thấy:**

   ```
   docker : The term 'docker' is not recognized...
   ```

   → ❌ Docker chưa cài xong, chờ thêm hoặc khởi động lại lại

6. **Nếu thấy:**
   ```
   error during connect: cannot connect to Docker daemon
   ```
   → Docker chưa chạy, mở Docker Desktop từ Start menu

---

### **BƯỚC 7: Chạy Docker Desktop**

1. Nhấp **Start menu** (Windows logo)

2. Gõ: `Docker`

3. Kết quả tìm kiếm sẽ hiện:

   ```
   Docker Desktop
   ```

4. Nhấp vào **Docker Desktop**

5. Cửa sổ Docker sẽ mở. Chờ cho đến khi:
   - Thấy icon Docker ở taskbar (góc dưới bên phải) **có dấu xanh** ✅
   - Hoặc thấy thông báo: "Docker Desktop is running"

✅ **Xong, Docker đang chạy**

---

## **GIAI ĐOẠN 2: LẤY PROJECT VỀ MÁY**

### **BƯỚC 8: Clone Project từ GitHub**

"Clone" có nghĩa là tải toàn bộ project code từ GitHub về máy.

**Các bước:**

1. Mở PowerShell

2. Chọn nơi muốn lưu project (ví dụ: Desktop hoặc Documents)

   ```powershell
   cd Desktop
   ```

3. Gõ lệnh clone project:

   ```powershell
   git clone https://github.com/dotientri/qlycv.git
   ```

   ⚠️ **Thay `username` bằng GitHub username của project!**

   Nếu project là public:

   ```powershell
   git clone https://github.com/dotientri0285/qlycv.git
   ```

4. Nhấp Enter, chờ quá trình tải (1-3 phút)

   ```
   Cloning into 'qlycv'...
   remote: Counting objects: 100% (1234/1234), done.
   Receiving objects: 100% (1234/1234), 50.00 MB | 5.00 MB/s
   ```

5. Khi xong sẽ thấy:
   ```
   Resolving deltas: 100% (567/567), done.
   ```

✅ **Project đã tải về!**

---

### **BƯỚC 9: Kiểm tra Project**

1. Vào thư mục project vừa tải:

   ```powershell
   cd qlycv
   ```

2. Liệt kê các file:

   ```powershell
   dir
   ```

3. Bạn sẽ thấy:
   ```
   Mode                 Name
   ----                 ----
   d-----          backend
   d-----          frontend
   d-----          docs
   -a---           docker-compose.yml
   -a---           Dockerfile
   -a---           README.md
   ```

✅ **Project nhìn thấy đúng cấu trúc!**

---

## **GIAI ĐOẠN 3: CHẠY PROJECT VỚI DOCKER**

### **BƯỚC 10: Chạy Docker Compose**

**Bây giờ chạy toàn bộ project chỉ với 1 lệnh!**

1. **Chắc chắn** bạn đang ở thư mục project (`qlycv`)

   ```powershell
   # Bạn sẽ thấy:
   PS C:\Users\{tên_bạn}\Desktop\qlycv>
   ```

2. Gõ lệnh chạy project:

   ```powershell
   docker-compose up
   ```

3. **Lần đầu sẽ mất 2-5 phút** để tải các Docker image

4. Chờ cho đến khi thấy:

   ```
   ✔ Container gis_db is healthy
   ✔ Container gis_backend is running
   ✔ Container gis_frontend is running
   ```

   Hoặc thấy:

   ```
   VITE v... ready in ... ms
   ➜  Local:   http://127.0.0.1:5173/
   ```

✅ **Project đang chạy!**

---

### **BƯỚC 11: Truy Cập Ứng Dụng**

Mở trình duyệt (Chrome, Edge, Firefox...) và vào các URL:

| Thành phần                     | URL                         | Ấn Ctrl+Click để mở         |
| ------------------------------ | --------------------------- | --------------------------- |
| **Frontend (Giao diện chính)** | http://localhost:5173       | http://localhost:5173       |
| **Backend Admin**              | http://localhost:8000/admin | http://localhost:8000/admin |
| **API**                        | http://localhost:8000/api   | http://localhost:8000/api   |

**Nếu thấy giao diện website → ✅ THÀNH CÔNG!**

---

### **BƯỚC 12: Tạo Tài Khoản Admin (LẦN ĐẦU)**

Để vào trang admin quản lý dữ liệu:

1. **Mở PowerShell mới** (không dừng Docker lại)
   - Ấn `Ctrl + Shift + `` (backtick)

2. Chuyển vào thư mục project:

   ```powershell
   cd Desktop\qlycv
   ```

3. Tạo tài khoản admin:

   ```powershell
   docker-compose exec backend python manage.py createsuperuser
   ```

4. Điền thông tin khi hỏi:

   ```
   Username: admin
   Email address: admin@example.com
   Password: (gõ mật khẩu)
   Password (again): (gõ lại mật khẩu)
   ```

5. Nếu thấy "Superuser created successfully!" → ✅ OK

6. Vào http://localhost:8000/admin đăng nhập với username/password vừa tạo

---

## 📝 LỆNH HÀNG NGÀY

### **Lần sau muốn chạy project:**

```powershell
# Bước 1: Mở Docker Desktop (từ Start menu)

# Bước 2: Mở PowerShell, chuyển vào folder
cd Desktop\qlycv

# Bước 3: Chạy project
docker-compose up
```

### **Kết thúc project:**

Ấn **Ctrl + C** ở PowerShell

### **Khởi động lại từ đầu:**

```powershell
docker-compose down
docker-compose up
```

---

## ❌ TROUBLESHOOTING

### **Lỗi: "docker: The term 'docker' is not recognized"**

- Docker chưa được cài hoặc chưa khởi động
- **Giải pháp:** Mở Docker Desktop từ Start menu, chờ cho đến khi icon xanh

### **Lỗi: "Cannot connect to Docker daemon"**

- Docker Desktop chưa chạy
- **Giải pháp:** Mở Docker Desktop (Start → Docker)

### **Lỗi: "Port 5173 is already in use"**

- Cổng bị dùng bởi ứng dụng khác
- **Giải pháp:**
  ```powershell
  docker-compose down
  docker-compose up
  ```

### **Lỗi: "fatal: No remote repository specified"**

- Chưa clone project
- **Giải pháp:** Làm lại BƯỚC 8

### **Docker container bị lỗi liên tục**

```powershell
# Reset toàn bộ:
docker-compose down -v
docker system prune -a
docker-compose up --build
```

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Tải và cài Git → kiểm tra `git --version`
- [ ] Tải và cài Docker Desktop → kiểm tra `docker --version`
- [ ] Clone project từ GitHub → `git clone https://...`
- [ ] Chạy `docker-compose up` → thấy 3 container chạy
- [ ] Vào http://localhost:5173 → thấy giao diện
- [ ] Tạo tài khoản admin → vào http://localhost:8000/admin được
- [ ] ✨ PROJECT READY! ✨

---

## 💡 TIPS & TRICKS

1. **Nếu Docker tốn RAM:**
   - Docker Desktop → Settings → Resources
   - Giảm CPU/Memory xuống phù hợp

2. **Xem log lỗi:**

   ```powershell
   docker-compose logs backend
   docker-compose logs frontend
   docker-compose logs db
   ```

3. **Vào shell của container:**

   ```powershell
   docker-compose exec backend sh
   ```

4. **Xóa tất cả dữ liệu cũ:**

   ```powershell
   docker-compose down -v
   ```

5. **Cập nhật code từ GitHub:**
   ```powershell
   git pull
   docker-compose down
   docker-compose up --build
   ```

---

**🎉 Chúc bạn thành công! Nếu gặp vấn đề, hãy copy error message và hỏi!**

1. Mở PowerShell
2. Gõ:
   ```powershell
   docker --version
   ```
3. Nếu thấy phiên bản (ví dụ: `Docker version 24.0.0`) → OK ✅

4. Chạy thử lệnh này:
   ```powershell
   docker run hello-world
   ```
5. Nếu thấy dòng "Hello from Docker!" → Docker hoạt động ✅

---

## 🚀 CHẠY PROJECT VỚI DOCKER

### **Bước 4: Mở Terminal và Chạy Project**

1. Mở PowerShell hoặc cmd
2. Chuyển vào thư mục project:

   ```powershell
   cd C:\Users\dotie\OneDrive\Documents\gis\qlycv
   ```

3. Chạy Docker Compose:

   ```powershell
   docker-compose up
   ```

   **Lần đầu tiên sẽ mất 2-5 phút** (tải các image Docker)

4. Chờ đến khi thấy:
   ```
   ✔ Container gis_db is healthy
   ✔ Container gis_backend is running
   ✔ Container gis_frontend is running
   ```

---

### **Bước 5: Truy Cập Ứng Dụng**

Mở trình duyệt (Chrome, Edge, Firefox...):

| Thành phần            | URL                         | Mô tả                    |
| --------------------- | --------------------------- | ------------------------ |
| **Frontend**          | http://localhost:5173       | Giao diện chính          |
| **Backend Admin**     | http://localhost:8000/admin | Trang quản trị           |
| **API Documentation** | http://localhost:8000/api/  | API docs                 |
| **PostgreSQL**        | localhost:5432              | Database (không cần vào) |

---

## 🔧 CẤU HÌNH DATABASE (LẦN ĐẦU)

Khi backend chạy lần đầu, nó sẽ tự động:

- Tạo database
- Tạo tables
- Load sample data

**Để tạo tài khoản admin:**

Mở terminal **mới** (không dừng Docker):

```powershell
cd C:\Users\dotie\OneDrive\Documents\gis\qlycv
docker-compose exec backend python manage.py createsuperuser
```

Điền:

- Username: `admin`
- Email: `admin@example.com`
- Password: Gõ mật khẩu

Xong, vào http://localhost:8000/admin đăng nhập được!

---

## 📝 HƯỚNG DẪN NGỪNG / KHỞI ĐỘNG LẠI

### **Dừng Project**

```powershell
docker-compose down
```

(Ấn Ctrl+C cũng được)

### **Khởi động lại (lần sau)**

```powershell
docker-compose up
```

### **Xóa hết dữ liệu cũ (reset)**

```powershell
docker-compose down -v
docker-compose up
```

---

## 🗂️ CẤU TRÚC DOCKER

Project này sử dụng 3 container:

```
┌─────────────────────────────────────────┐
│         Docker Compose                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   Backend    │   │
│  │  (React)     │  │  (Django)    │   │
│  │  Port 5173   │  │  Port 8000   │   │
│  └──────────────┘  └──────────────┘   │
│         ↓              ↓               │
│  ┌──────────────────────────┐         │
│  │    PostgreSQL Database   │         │
│  │      Port 5432           │         │
│  └──────────────────────────┘         │
│                                         │
└─────────────────────────────────────────┘
```

---

## ❌ TROUBLESHOOTING

### **Lỗi: "docker: command not found"**

- Chưa cài Docker Desktop
- **Giải pháp:** Làm lại Bước 1-2

### **Lỗi: "Cannot connect to Docker daemon"**

- Docker Desktop chưa chạy
- **Giải pháp:**
  - Mở Docker Desktop (tìm trong Start menu)
  - Chờ cho đến khi icon ở taskbar thành xanh
  - Rồi chạy `docker-compose up` lại

### **Lỗi: "Port 5173 is already allocated"**

- Port đang bị dùng bởi ứng dụng khác
- **Giải pháp:**
  ```powershell
  docker-compose down
  # Rồi gõ lại:
  docker-compose up
  ```

### **Lỗi: "Bind for 0.0.0.0:5432 failed"**

- PostgreSQL khác đang chạy
- **Giải pháp:** Gỡ cài PostgreSQL khác hoặc dừng nó

### **Lỗi: WSL 2 not installed (trên Windows 10)**

- WSL 2 là một layer virtualization cần thiết
- **Giải pháp:**
  1. Vào: https://docs.microsoft.com/en-us/windows/wsl/install-win10
  2. Làm theo hướng dẫn cài WSL 2
  3. Rồi cài Docker Desktop lại

### **Container bị crash / lỗi liên tục**

```powershell
# Xóa container cũ:
docker-compose down

# Reset toàn bộ:
docker system prune -a

# Chạy lại:
docker-compose up --build
```

---

## 📊 KIỂM TRA LOG / DEBUG

Để xem log (nếu có lỗi):

```powershell
# Xem log backend:
docker-compose logs backend

# Xem log frontend:
docker-compose logs frontend

# Xem log database:
docker-compose logs db

# Xem log tất cả:
docker-compose logs
```

---

## 🆚 SO SÁNH: DOCKER vs CÀI TRỰC TIẾP

| Tiêu chí              | Docker     | Cài trực tiếp |
| --------------------- | ---------- | ------------- |
| **Thời gian cài**     | 10-15 phút | 1-2 giờ       |
| **Số bước**           | 2 bước     | 11+ bước      |
| **Đơn giản**          | ⭐⭐⭐⭐⭐ | ⭐⭐          |
| **Lỗi ít**            | ⭐⭐⭐⭐⭐ | ⭐⭐⭐        |
| **Dung lượng**        | ~2-3 GB    | ~500MB        |
| **Hiệu suất**         | 95% tốc độ | 100%          |
| **Dễ share với team** | ✅         | ❌            |

---

## ✅ CHECKLIST

- [ ] Tải Docker Desktop
- [ ] Cài Docker Desktop + Khởi động lại máy
- [ ] Kiểm tra `docker --version`
- [ ] Chạy `docker run hello-world`
- [ ] Vào thư mục project
- [ ] Chạy `docker-compose up`
- [ ] Vào http://localhost:5173 (frontend)
- [ ] Vào http://localhost:8000/admin (backend)
- [ ] Tạo tài khoản admin

**Khi hoàn thành hết → PROJECT READY! 🎉**

---

## 💡 TIPS

1. **Docker Desktop tốn RAM**: Nếu máy bị chậm, cấu hình lại Docker:
   - Settings → Resources → CPU, Memory
   - Giảm xuống phù hợp với máy bạn

2. **Lần chạy thứ 2 sẽ nhanh hơn** (vì không cần tải image lại)

3. **Dữ liệu lưu trong `postgres_data` volume** (không mất khi stop Docker)

4. **Muốn vào shell của container:**
   ```powershell
   docker-compose exec backend sh
   docker-compose exec frontend sh
   ```

---

## 📚 TÀI LIỆU THÊM

- Docker docs: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Hướng dẫn WSL 2: https://docs.microsoft.com/en-us/windows/wsl/

---

**Nếu vẫn có vấn đề, hãy:**

1. Copy toàn bộ error message
2. Chụp ảnh màn hình
3. Hỏi người biết lập trình hoặc tìm trên StackOverflow

**Chúc bạn thành công! 🚀**

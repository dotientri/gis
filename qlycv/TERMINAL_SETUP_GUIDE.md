# 🚀 TERMINAL SETUP & RUN GUIDE

## Prerequisites (Kiểm tra các yêu cầu)

Trước khi chạy, kiểm tra bạn đã có:

- ✅ Python 3.8+
- ✅ Node.js + npm
- ✅ Git (nếu cần)

---

## ⚙️ Environment Setup (1 lần duy nhất - chỉ lần đầu)

### Step 1: Activate Python Environment

```bash
# Nếu dùng Anaconda:
conda activate gis_backend

# Nếu dùng venv:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Step 4: Initialize Database (nếu chưa có)

```bash
python manage.py migrate
python manage.py init_data
```

---

## 🎯 RUN APPLICATION (Chạy ứng dụng)

### Option A: Platform Default (Khuyến nghị dành cho Windows)

#### Cách 1: Chạy batch file (Dễ nhất - 1 click)

```bash
# Windows: Double-click file này
start_desktop_app.bat
```

**Hoặc** chạy manual:

#### Cách 2: Terminal 1 - Backend (Django)

```bash
# Mở Terminal 1 (PowerShell hoặc Command Prompt)
python manage.py runserver
```

**Output sẽ hiển thị:**

```
Django version 4.2.0
Starting development server at http://127.0.0.1:8000/
```

✅ **Backend ready at:** `http://localhost:8000/`

---

#### Cách 3: Terminal 2 - Frontend (React/Vite)

```bash
# Mở Terminal 2 (PowerShell hoặc Command Prompt, cùng folder root)
cd frontend
npm run dev
```

**Output sẽ hiển thị:**

```
  VITE v7.3.1  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

✅ **Frontend ready at:** `http://localhost:5173/`

---

### Option B: Detailed Terminal Commands

#### Terminal 1 - Start Backend API Server

```bash
cd c:\Users\dotie\OneDrive\Documents\gis\qlycv
python manage.py runserver 0.0.0.0:8000
```

**Kiểm tra Backend:**

```bash
# Mở browser hoặc curl
curl http://localhost:8000/api/cong-vien/
```

Expected response: JSON list of parks

---

#### Terminal 2 - Start Frontend Development Server

```bash
cd c:\Users\dotie\OneDrive\Documents\gis\qlycv\frontend
npm run dev
```

**Access Frontend:**

- Open: `http://localhost:5173/`
- Login: Use any registered user account

---

#### Terminal 3 (Optional) - Desktop App

```bash
cd c:\Users\dotie\OneDrive\Documents\gis\qlycv
python gis_desktop_app_lite.py
```

vagy

```bash
python gis_desktop_app.py
```

---

## 📱 Access Points (Các điểm truy cập)

| Service          | URL                            | Purpose             |
| ---------------- | ------------------------------ | ------------------- |
| **Backend API**  | `http://localhost:8000/`       | REST API endpoints  |
| **Django Admin** | `http://localhost:8000/admin/` | Admin dashboard     |
| **Frontend Web** | `http://localhost:5173/`       | User web interface  |
| **Desktop App**  | Standalone                     | Desktop application |

---

## 🔑 Database & Admin

### Access Django Admin

```bash
# URL
http://localhost:8000/admin/

# Default credentials (from init_data command)
Username: admin
Password: admin123

Username: user
Password: user123
```

### Database Operations

```bash
# View all parks
python manage.py shell
>>> from parks.models import CongVien
>>> CongVien.objects.all().count()

# Reset database
python manage.py migrate zero
python manage.py migrate
python manage.py init_data
```

---

## 🧪 Testing API Endpoints

### Using PowerShell (curl built-in)

```bash
# Get all parks
curl http://localhost:8000/api/cong-vien/

# Get single park
curl http://localhost:8000/api/cong-vien/1/

# Get amenity types
curl http://localhost:8000/api/loai-tien-ich/

# Login
$body = @{username="admin";password="admin123"} | ConvertTo-Json
$response = curl -Method POST -Uri "http://localhost:8000/api/token/" -Body $body -ContentType "application/json"
$token = $response | ConvertFrom-Json | Select-Object -ExpandProperty access
```

### Using Python requests

```bash
python << 'EOF'
import requests

# Get parks
response = requests.get('http://localhost:8000/api/cong-vien/')
print(f"Parks: {response.status_code}")
print(response.json()[:1])  # Print first park

# Login
login_data = {'username': 'admin', 'password': 'admin123'}
response = requests.post('http://localhost:8000/api/token/', json=login_data)
print(f"Login: {response.status_code}")
if response.status_code == 200:
    token = response.json()['access']
    print(f"Token: {token[:20]}...")
EOF
```

---

## 🛑 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'django'"

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### Error: "Could not establish connection" (Browser console)

```bash
# Make sure backend is running
python manage.py runserver
```

### Error: "npm: command not found"

```bash
# Install Node.js from: https://nodejs.org/
# Then:
npm install
```

### Port already in use (8000 or 5173)

```bash
# Run on different port
# Backend:
python manage.py runserver 8001

# Frontend:
npm run dev -- --port 5174
```

---

## 📊 Development Workflow

### 1️⃣ Start Backend

```bash
python manage.py runserver
# Keep this terminal open - don't close!
```

### 2️⃣ Start Frontend (new terminal)

```bash
cd frontend
npm run dev
# Keep this terminal open too!
```

### 3️⃣ Open & Test

```bash
# Browser 1: Backend API
http://localhost:8000/api/cong-vien/

# Browser 2: Web Interface
http://localhost:5173/

# Browser 3: Django Admin
http://localhost:8000/admin/
```

### 4️⃣ Make Changes

- **Backend changes**: Save file → Django auto-reloads
- **Frontend changes**: Save file → Vite hot-reload (automatic)
- **Database changes**: Stop & run `python manage.py migrate`

### 5️⃣ Check Console for Errors

- **Python Terminal**: Check for server errors
- **Browser Console** (F12): Check for JavaScript errors
- **Network Tab**: Check API calls and responses

---

## 🚀 Production Build

### Build Frontend for Production

```bash
cd frontend
npm run build
```

This creates `dist/` folder with optimized files.

### Serve Production Build with Django

```bash
# After npm run build completes:
python manage.py collectstatic
python manage.py runserver

# Then access at http://localhost:8000/
```

---

## 📝 Quick Start Script (Windows)

Create file: `run_all.bat`

```batch
@echo off
REM Start Backend
start "Django Backend" cmd /k "python manage.py runserver"

REM Wait 3 seconds
timeout /t 3

REM Start Frontend
start "React Frontend" cmd /k "cd frontend && npm run dev"

REM Wait 2 seconds
timeout /t 2

REM Open browser
start http://localhost:5173/
start http://localhost:8000/admin/

echo.
echo ✅ Backend: http://localhost:8000/
echo ✅ Frontend: http://localhost:5173/
echo ✅ Admin: http://localhost:8000/admin/
echo.
pause
```

Then run: `run_all.bat`

---

## 📋 Checklist

- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Database initialized (`python manage.py init_data`)
- [ ] Backend running (`python manage.py runserver`)
- [ ] Frontend running (`npm run dev`)
- [ ] Can access `http://localhost:5173/`
- [ ] Can login with admin/admin123
- [ ] No console errors in browser (F12)
- [ ] API returns data: `http://localhost:8000/api/cong-vien/`

---

## 🎯 Next Steps

1. **Login**: `http://localhost:5173/` → Username: `admin` / Password: `admin123`
2. **View Parks**: Go to "Danh Sách Công Viên"
3. **Create Park**: Click "Thêm Công Viên Mới"
4. **Use Map**: Drag marker to set location
5. **View Admin**: `http://localhost:8000/admin/`

---

**Status**: ✅ Ready to develop!

For issues, check console errors and terminal output carefully.

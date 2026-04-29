# GIS Park Management System - Docker Deployment Guide

## 📋 Giới thiệu

Hướng dẫn hoàn chỉnh để triển khai hệ thống quản lý công viên GIS bằng Docker.

## 🚀 Yêu cầu hệ thống

- Docker >= 20.10
- Docker Compose >= 1.29
- Git (để clone project)

## 📁 Cấu trúc Docker

```
├── Dockerfile              # Production image
├── Dockerfile.dev          # Development backend image
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
├── nginx.conf              # Nginx configuration
├── entrypoint.sh           # Container startup script
├── Makefile                # Tiện ích lệnh
├── .dockerignore           # Files to ignore in Docker build
├── .env.example            # Environment variables template
└── frontend/
    └── Dockerfile.dev      # Development frontend image
```

## 🏗️ Kiến trúc dịch vụ

### Production Stack

- **PostgreSQL 15**: Database chính
- **Redis 7**: Cache & sessions
- **Django Backend**: API server (Gunicorn)
- **Nginx**: Reverse proxy & static files
- **Frontend**: Built React app

### Development Stack

- **PostgreSQL 15**: Database
- **Redis 7**: Cache
- **Django**: Development server (runserver)
- **React + Vite**: Frontend with hot reload

## 📦 Chuẩn bị

### 1. Clone và cấu hình

```bash
# Copy file môi trường
cp .env.example .env

# Chỉnh sửa .env với cài đặt thực tế của bạn
nano .env
```

### 2. Cấu hình .env quan trọng

```env
# Security
DEBUG=false
SECRET_KEY=your-very-secret-key-change-this

# Database
DB_NAME=gis_database
DB_USER=admin
DB_PASSWORD=your-secure-password

# Domain (nếu có)
ALLOWED_HOSTS=localhost,127.0.0.1,gis.example.com

# Email
EMAIL_HOST_USER=your-email@mailtrap.io
EMAIL_HOST_PASSWORD=your-password
```

## 🚀 Triển khai Production

### Cách 1: Sử dụng Makefile (được khuyến cáo)

```bash
# Build image
make build

# Khởi động dịch vụ
make up

# Xem logs
make logs

# Chạy migrations
make migrate

# Tạo superuser
make createsuperuser

# Dừng dịch vụ
make down
```

### Cách 2: Sử dụng Docker Compose trực tiếp

```bash
# Build
docker-compose build

# Khởi động
docker-compose up -d

# Migrations
docker-compose exec backend python manage.py migrate --noinput

# Static files
docker-compose exec backend python manage.py collectstatic --noinput

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# View logs
docker-compose logs -f
```

## 🛠️ Phát triển (Development)

### Khởi động môi trường phát triển

```bash
# Sử dụng Makefile
make dev-up

# Hoặc trực tiếp
docker-compose -f docker-compose.dev.yml up -d
```

### Truy cập ứng dụng

- Frontend: http://localhost:3000 (hoặc 5173)
- Backend API: http://localhost:8000
- Admin: http://localhost:8000/admin

### Làm việc trong container

```bash
# Bash shell
make bash
docker-compose exec backend bash

# Django shell
make shell
docker-compose exec backend python manage.py shell

# View logs
make dev-logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 📊 Quản lý Database

### Backup database

```bash
docker-compose exec db pg_dump -U admin gis_database > backup.sql
```

### Restore database

```bash
docker-compose exec -T db psql -U admin gis_database < backup.sql
```

### Truy cập PostgreSQL trực tiếp

```bash
make db-shell
# hoặc
docker-compose exec db psql -U admin -d gis_database
```

## 🔧 Các lệnh hữu ích

### Migrations

```bash
# Tạo migrations
make migrations
docker-compose exec backend python manage.py makemigrations

# Chạy migrations
make migrate
docker-compose exec backend python manage.py migrate
```

### Static & Media Files

```bash
# Thu thập static files
make static
docker-compose exec backend python manage.py collectstatic --noinput

# Xóa static cache
docker-compose exec backend python manage.py collectstatic --clear --noinput
```

### Testing

```bash
# Chạy tests
make test
docker-compose exec backend python manage.py test

# Chạy linting
make lint
docker-compose exec backend pylint parks
```

### Health Check

```bash
make health
```

## 📝 Cấu hình Nginx

File `nginx.conf` bao gồm:

- ✅ Gzip compression
- ✅ Rate limiting
- ✅ Security headers
- ✅ Cache control
- ✅ Upstream load balancing
- ✅ Static & Media file serving
- ✅ HTTPS support (commented)

## 🔒 Bảo mật

### Trước khi deploy lên production:

1. **Thay đổi SECRET_KEY**

   ```env
   SECRET_KEY=your-very-secret-key-here
   ```

2. **Đặt DEBUG=false**

   ```env
   DEBUG=false
   ```

3. **Đặt mật khẩu database mạnh**

   ```env
   DB_PASSWORD=very-strong-password-here
   ```

4. **Cấu hình ALLOWED_HOSTS**

   ```env
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   ```

5. **Cấu hình CORS đúng cách**

   ```env
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   ```

6. **Bật HTTPS**
   - Cấp SSL certificate
   - Uncomment HTTPS section trong nginx.conf
   - Cập nhật cấu hình ports (443)

## 🐛 Troubleshooting

### Backend không khởi động

```bash
# Xem logs
docker-compose logs backend

# Kiểm tra migrations
docker-compose exec backend python manage.py migrate --plan

# Kiểm tra dependencies
docker-compose exec backend pip check
```

### Database connection error

```bash
# Kiểm tra database
docker-compose exec db pg_isready -U admin

# Xem logs database
docker-compose logs db

# Restart database
docker-compose restart db
```

### Permission denied errors

```bash
# Fix permissions
docker-compose exec backend chown -R appuser:appuser /app

# Rebuild with correct permissions
make rebuild
```

### Port đã được sử dụng

```bash
# Tìm process sử dụng port
lsof -i :8000
lsof -i :80
lsof -i :5432

# Hoặc thay đổi port trong docker-compose.yml
```

## 📈 Performance Tuning

### Database

- Tăng `max_connections` nếu cần
- Thêm indexes cho các trường hay query
- Sử dụng connection pooling (PgBouncer)

### Django

- Cấu hình cache với Redis
- Sử dụng select_related/prefetch_related
- Enable query optimization

### Gunicorn

- Tăng số workers: `--workers 8`
- Điều chỉnh timeout: `--timeout 120`

### Nginx

- Enable HTTP/2
- Tăng buffer sizes
- Cấu hình caching

## 🔄 Các lệnh thường dùng

```bash
# Startup toàn bộ
make up

# Shutdown
make down

# Clean everything
make clean

# Rebuild từ đầu
make rebuild

# View all services status
make ps

# Restart all services
make restart
```

## 📚 Tài liệu bổ sung

- [Django Documentation](https://docs.djangoproject.com/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## ✅ Checklist Pre-Deployment

- [ ] .env file được cấu hình
- [ ] SECRET_KEY được thay đổi
- [ ] DEBUG=false
- [ ] Database password mạnh
- [ ] Nginx HTTPS được cấu hình (nếu cần)
- [ ] CORS settings chính xác
- [ ] Email configuration hoạt động
- [ ] Backup database được thực hiện
- [ ] Static files được collect
- [ ] Health check passes

## 🆘 Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra logs: `make logs`
2. Chạy health check: `make health`
3. Xem documentation các service
4. Check error messages trong container

---

**Mẹo**: Đọc tệp Makefile để xem tất cả các lệnh có sẵn và mô tả của chúng!

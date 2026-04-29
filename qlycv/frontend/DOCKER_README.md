# Frontend Docker Setup

## 📦 Build Frontend cho Production

### Dockerfile (Multi-stage)

Dockerfile chính trong project root xây dựng frontend thành image riêng:

```dockerfile
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend . .
RUN npm run build
```

### Development (Dockerfile.dev)

Chạy Vite dev server với hot reload:

```bash
docker-compose -f docker-compose.dev.yml up -d frontend
```

Truy cập: `http://localhost:3000` hoặc `http://localhost:5173`

## 🚀 Environment Variables

File `.env` tại root project:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=GIS Park Management
```

## 📝 Build Configuration

### Vite Config

- Entry: `src/main.jsx`
- Output: `dist/`
- CSS modules support
- Image optimization

## 🔗 API Integration

Frontend tự động sử dụng API backend:

```javascript
// src/api.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

## 📦 Package Management

### Installation

```bash
docker-compose -f docker-compose.dev.yml exec frontend npm install <package>
```

### Build

```bash
docker-compose -f docker-compose.dev.yml exec frontend npm run build
```

### Linting

```bash
docker-compose -f docker-compose.dev.yml exec frontend npm run lint
```

## 🐛 Troubleshooting Frontend

### Node modules issues

```bash
docker-compose -f docker-compose.dev.yml exec frontend rm -rf node_modules
docker-compose -f docker-compose.dev.yml exec frontend npm ci
```

### Port 3000 already in use

Thay đổi port trong docker-compose.dev.yml:

```yaml
ports:
  - "3001:3000" # Sử dụng 3001 thay vì 3000
```

### Hot reload không hoạt động

- Kiểm tra volume mounts trong docker-compose.dev.yml
- Restart container: `docker-compose -f docker-compose.dev.yml restart frontend`

## 📊 Production Build

Frontend được build như một phần của main Dockerfile:

```bash
# Build
docker-compose build

# Chạy
docker-compose up -d
```

Built files được serve bởi Nginx tại `/usr/share/nginx/html`

## 🔐 CSP & Security

Nginx.conf bao gồm security headers:

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

## ♻️ Caching Strategy

- Static assets: 30 days cache
- HTML: No cache (always fetch fresh)
- API responses: Phụ thuộc backend caching strategy

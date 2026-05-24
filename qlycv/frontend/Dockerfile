# ==========================================
# GIAI ĐOẠN 1: MÔI TRƯỜNG BUILD (Cài đặt & Dịch mã nguồn)
# ==========================================
FROM node:18.18-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# ==========================================
# GIAI ĐOẠN 2: MÔI TRƯỜNG RUN (Chạy web server Nginx)
# ==========================================
FROM nginx:alpine
# Copy thư mục đã build từ Giai đoạn 1 sang Giai đoạn 2
# Vite mặc định build ra `dist`, không phải `build`
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

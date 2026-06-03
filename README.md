# QLyCV — Hướng DevOps

Phiên bản README này tập trung vào các khía cạnh DevOps: cách build, chạy, deploy, cấu hình hạ tầng và quản lý vận hành cho dự án.

## Tổng quan
- Ứng dụng: Django backend + frontend (vite) + PostGIS DB + Nginx proxy.
- Cấu trúc chính:
	- `qlycv/backend/` — Django app (có `manage.py`).
	- `qlycv/frontend/` — frontend app (Vite).
	- `docker-compose.yml` — stack compose để phát triển và triển khai đơn giản.
	- `infra/terraform` — mã Terraform cho hạ tầng.
	- `infra/ansible` — playbook và inventory cho cấu hình máy chủ.

## Kiến trúc (ngắn gọn)
- Services (theo `docker-compose.yml`): `db` (PostGIS), `backend`, `frontend`, `webserver` (nginx).
- Volume: `postgres_data` để lưu dữ liệu Postgres.

## Yêu cầu trước khi bắt đầu
- Docker & Docker Compose (>= Docker Compose V2) hoặc `docker-compose`.
- Terraform (nếu dùng mã trong `infra/terraform`).
- Ansible (nếu dùng `infra/ansible`).

## Biến môi trường quan trọng
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`
- `IMAGE_TAG` — thẻ ảnh Docker cho backend/frontend
- `DEBUG` — chế độ debug cho Django

## Chạy nhanh (local / dev)
1. Build và khởi động stack:

```bash
docker compose build
docker compose up -d
```

2. Chạy migration (khi container backend đang chạy):

```bash
docker compose exec backend python manage.py migrate
```

3. Tạo superuser / loaddata / collectstatic:

```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py loaddata data/backup_data.json
docker compose exec backend python manage.py collectstatic --noinput
```

4. Logs (nhật ký dịch vụ):

```bash
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f webserver
```

## Xây dựng và đẩy ảnh Docker (CI/CD)
- Sử dụng Dockerfile trong `qlycv/backend` và `qlycv/frontend` để build ảnh.
- Ví dụ build thủ công và gắn thẻ:

```bash
docker build -t myregistry/qlycv_backend:latest qlycv/backend
docker push myregistry/qlycv_backend:latest
```

- Pipeline CI (ví dụ Jenkinsfile có sẵn) nên thực hiện:
	- Kiểm tra mã (linters, tests)
	- Build artifact / Docker images
	- Push lên registry
	- Triển khai xuống môi trường staging/production (ví dụ: remote `docker compose pull` + `docker compose up -d` hoặc Ansible playbook)

## Triển khai hạ tầng
- Terraform (thư mục `infra/terraform`):

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

- Ansible (thư mục `infra/ansible`):

```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/playbook.yml
```

Gợi ý: giữ file `inventory.ini` và các biến Ansible tách biệt cho mỗi môi trường (staging/production).

## Phục hồi cơ sở dữ liệu
- File `backup_full.sql` được mount vào container Postgres để khôi phục khi lần đầu init.
- Nếu cần phục hồi thủ công vào container đang chạy:

```bash
docker compose exec -T db psql -U $DB_USER -d $DB_NAME < backup_full.sql
```

## Giám sát & Logging
- Khuyến nghị tích hợp Prometheus + Grafana cho metrics và một giải pháp logs (ELK / Loki) cho logging tập trung.
- Expose healthcheck endpoints trên backend để load-balancer / k8s hoặc monitoring poll.

## Quản lý secrets
- Không lưu secrets trong mã nguồn. Dùng:
	- Environment variables trên host / container runtime
	- Secret manager (Vault, AWS Secrets Manager, Azure Key Vault) cho production

## Bảo mật và TLS
- `webserver` mount thư mục `/etc/letsencrypt` để phục vụ TLS. Quản lý certificate renewal bằng certbot hoặc tool phù hợp.

## CI/CD đề xuất nhanh
- Trên mỗi commit vào `main`:
	- Chạy test suite (`pytest`), linting
	- Build Docker images và push
	- Triển khai tự động tới staging
	- Sau smoke-tests, promote lên production (manual approval)

## Kiểm thử
- Backend tests: chạy trong container hoặc local:

```bash
docker compose exec backend pytest -q
```

## Tài liệu vận hành (OPs)
- Backup định kỳ: sao lưu Postgres `pg_dump` hoặc snapshot volume `postgres_data`.
- Healthchecks: setup endpoint `/healthz` và monitor.
- Rollback: giữ tag image cũ trong registry để rollback nhanh bằng `docker compose pull` + `docker compose up -d` với tag cũ.

## Liên hệ & đóng góp
- Để deploy/hỗ trợ: liên hệ team DevOps nội bộ.
- PR yêu cầu: follow branch strategy và include changelog + migration notes.

---

Nếu bạn muốn, tôi có thể:
- Tạo mẫu GitHub Actions hoặc Jenkins pipeline cụ thể.
- Viết Ansible playbook triển khai `docker compose` và service restart.
- Thêm healthcheck endpoint và Prometheus metrics cho backend.


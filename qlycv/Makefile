.PHONY: help build up down logs shell migrate static bash test lint clean

help:
	@echo "GIS Park Management System - Docker Commands"
	@echo ""
	@echo "Production:"
	@echo "  make build              Build production Docker image"
	@echo "  make up                 Start all services (production)"
	@echo "  make down               Stop all services"
	@echo "  make logs               View logs from all services"
	@echo "  make logs-backend       View backend logs only"
	@echo ""
	@echo "Development:"
	@echo "  make dev-up             Start development environment"
	@echo "  make dev-down           Stop development environment"
	@echo "  make dev-logs           View development logs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate            Run database migrations"
	@echo "  make migrations         Create migrations"
	@echo "  make static             Collect static files"
	@echo "  make db-shell           Access PostgreSQL database"
	@echo ""
	@echo "Management:"
	@echo "  make bash               Open bash in backend container"
	@echo "  make shell              Open Django shell"
	@echo "  make createsuperuser    Create Django superuser"
	@echo "  make test               Run tests"
	@echo "  make lint               Run linting"
	@echo "  make clean              Remove containers and volumes"
	@echo ""

# Production commands
build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Services started! Access at:"
	@echo "  - Frontend: http://localhost"
	@echo "  - API: http://localhost/api/"
	@echo "  - Admin: http://localhost/admin/"

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

# Development commands
dev-up:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "  - Frontend: http://localhost:3000 (or 5173)"
	@echo "  - Backend: http://localhost:8000"
	@echo "  - API: http://localhost:8000/api/"

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Database commands
migrate:
	docker-compose exec backend python manage.py migrate

migrations:
	docker-compose exec backend python manage.py makemigrations

static:
	docker-compose exec backend python manage.py collectstatic --noinput

db-shell:
	docker-compose exec db psql -U admin -d gis_database

# Container access
bash:
	docker-compose exec backend bash

shell:
	docker-compose exec backend python manage.py shell

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

# Testing and code quality
test:
	docker-compose exec backend python manage.py test

lint:
	docker-compose exec backend pylint parks

# Cleanup
clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name ".DS_Store" -delete

# Utility commands
ps:
	docker-compose ps

restart:
	docker-compose restart

rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

env-copy:
	cp .env.example .env
	@echo ".env file created. Please update with your settings."

# Health check
health:
	docker-compose ps
	@echo ""
	@echo "Checking service health..."
	docker-compose exec -T backend curl -f http://localhost:8000/api/ 2>/dev/null && echo "✓ Backend: OK" || echo "✗ Backend: FAILED"
	docker-compose exec -T db pg_isready -U admin 2>/dev/null && echo "✓ Database: OK" || echo "✗ Database: FAILED"
	docker-compose exec -T redis redis-cli ping 2>/dev/null && echo "✓ Redis: OK" || echo "✗ Redis: FAILED"

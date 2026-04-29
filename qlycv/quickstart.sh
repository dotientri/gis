#!/bin/bash
# Quick start script for GIS Park Management System

set -e

echo "🚀 GIS Park Management System - Quick Start"
echo "==========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your settings!"
    echo "   You can edit it now or continue with defaults."
fi

# Ask for mode
echo ""
echo "Select mode:"
echo "1) Production (with Nginx reverse proxy)"
echo "2) Development (with hot reload)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "🏭 Starting Production Environment..."
        docker-compose build
        docker-compose up -d
        echo ""
        echo "✅ Services started!"
        echo "   - Frontend: http://localhost"
        echo "   - API: http://localhost/api/"
        echo "   - Admin: http://localhost/admin/"
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 5
        docker-compose exec backend python manage.py migrate --noinput || true
        docker-compose exec backend python manage.py collectstatic --noinput || true
        echo ""
        echo "✅ Ready!"
        ;;
    2)
        echo ""
        echo "🛠️  Starting Development Environment..."
        docker-compose -f docker-compose.dev.yml build
        docker-compose -f docker-compose.dev.yml up -d
        echo ""
        echo "✅ Services started!"
        echo "   - Frontend: http://localhost:3000"
        echo "   - Backend API: http://localhost:8000"
        echo "   - Admin: http://localhost:8000/admin"
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 5
        docker-compose -f docker-compose.dev.yml exec -T backend python manage.py migrate --noinput || true
        echo ""
        echo "✅ Ready! Press Ctrl+C to stop, or use: make dev-logs"
        ;;
    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "📚 Useful commands:"
echo "   make help          - Show all available commands"
echo "   make logs          - View logs"
echo "   make bash          - Open container shell"
echo "   make shell         - Open Django shell"
echo "   make down          - Stop services"
echo ""

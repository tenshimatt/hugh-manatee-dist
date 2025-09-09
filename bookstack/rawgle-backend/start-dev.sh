#!/bin/bash

# RAWGLE Backend Development Environment Startup Script
set -e

echo "🚀 Starting RAWGLE Backend Development Environment"
echo "=================================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo "📊 Service Status:"
echo "=================="
docker-compose -f docker-compose.dev.yml ps

# Test endpoints
echo ""
echo "🧪 Testing Endpoints:"
echo "===================="

# Wait a bit more for backend to be ready
sleep 10

# Test health endpoint
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend Health: OK"
else
    echo "❌ Backend Health: FAILED"
fi

# Test detailed health endpoint
if curl -s http://localhost:8000/health/detailed >/dev/null 2>&1; then
    echo "✅ Detailed Health: OK"
else
    echo "❌ Detailed Health: FAILED"
fi

# Test readiness endpoint
if curl -s http://localhost:8000/health/ready >/dev/null 2>&1; then
    echo "✅ Readiness Check: OK"
else
    echo "❌ Readiness Check: FAILED"
fi

echo ""
echo "🎉 Development Environment Started!"
echo "=================================="
echo "Backend API: http://localhost:8000"
echo "Health Check: http://localhost:8000/health"
echo "API Documentation: http://localhost:8000/api/v1"
echo ""
echo "Database: postgresql://rawgle_user:rawgle_password@localhost:5432/rawgle_db"
echo "Redis: redis://localhost:6379"
echo ""
echo "📝 Available Commands:"
echo "docker-compose -f docker-compose.dev.yml logs -f backend    # View backend logs"
echo "docker-compose -f docker-compose.dev.yml logs -f postgres   # View database logs"
echo "docker-compose -f docker-compose.dev.yml logs -f redis      # View Redis logs"
echo "docker-compose -f docker-compose.dev.yml down              # Stop all services"
echo ""
echo "🔍 To connect to the database:"
echo "psql -h localhost -p 5432 -U rawgle_user -d rawgle_db"
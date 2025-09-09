#!/bin/bash

# RAWGLE Backend Quick Test Script
set -e

echo "🧪 Testing RAWGLE Backend Infrastructure"
echo "======================================="

# Copy test environment
cp .env.test .env
echo "✅ Using test environment configuration"

# Initialize database schema on existing Supabase instance
echo "🗄️ Initializing database schema..."
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/init-db.sql

# Start the backend server in background
echo "🚀 Starting backend server..."
npm run dev &
SERVER_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    kill $SERVER_PID 2>/dev/null || true
    cp .env.example .env 2>/dev/null || true
}
trap cleanup EXIT

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Test basic connectivity
echo "🔍 Testing endpoints..."
echo

# Test root endpoint
if curl -s http://localhost:8000 >/dev/null 2>&1; then
    echo "✅ Root endpoint: OK"
    curl -s http://localhost:8000 | jq .
else
    echo "❌ Root endpoint: FAILED"
fi

echo

# Test health endpoint
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Health endpoint: OK"
    curl -s http://localhost:8000/health | jq .
else
    echo "❌ Health endpoint: FAILED"
fi

echo

# Test readiness endpoint
if curl -s http://localhost:8000/health/ready >/dev/null 2>&1; then
    echo "✅ Readiness endpoint: OK"
    curl -s http://localhost:8000/health/ready | jq .
else
    echo "❌ Readiness endpoint: FAILED"
fi

echo
echo "🎉 Backend Infrastructure Test Complete!"
echo

# Keep server running for manual testing
echo "🖥️  Server running at: http://localhost:8000"
echo "📊 Health dashboard: http://localhost:8000/health"
echo "🔍 Detailed health: http://localhost:8000/health/detailed"
echo
echo "Press Ctrl+C to stop the server..."
wait $SERVER_PID
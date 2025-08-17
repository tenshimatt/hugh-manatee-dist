#!/bin/bash

# Rawgle Frontend Development Scripts
# This script provides common development tasks

set -e

echo "Rawgle Frontend Development Helper"
echo "=================================="

case "${1}" in
  "setup")
    echo "Setting up development environment..."
    npm install
    echo "✅ Dependencies installed successfully!"
    echo "Run 'npm run dev' to start development server"
    ;;
  
  "dev")
    echo "Starting development server..."
    npm run dev
    ;;
    
  "build")
    echo "Building for production..."
    npm run build
    echo "✅ Build completed! Files are in ./dist/"
    ;;
    
  "preview")
    echo "Previewing production build..."
    npm run preview
    ;;
    
  "clean")
    echo "Cleaning build artifacts..."
    rm -rf dist/
    rm -rf node_modules/.vite
    echo "✅ Clean completed!"
    ;;
    
  "health")
    echo "Running health checks..."
    echo "Checking API connection..."
    curl -f https://rawgle-api.findrawdogfood.workers.dev/health || echo "⚠️  API may be unavailable"
    echo "Checking dependencies..."
    npm audit --audit-level=moderate
    echo "✅ Health check completed!"
    ;;
    
  *)
    echo "Available commands:"
    echo "  setup   - Install dependencies"
    echo "  dev     - Start development server"
    echo "  build   - Build for production"
    echo "  preview - Preview production build"
    echo "  clean   - Clean build artifacts"
    echo "  health  - Run health checks"
    echo ""
    echo "Usage: ./package-scripts.sh [command]"
    ;;
esac
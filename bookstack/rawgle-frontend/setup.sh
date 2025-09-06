#!/bin/bash

# RAWGLE Frontend Setup Script
# This script sets up the RAWGLE frontend application

echo "🚀 RAWGLE Frontend Setup"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created. Please update it with your actual values."
else
    echo "✅ .env.local already exists"
fi

# Create necessary directories
echo ""
echo "📁 Creating directory structure..."
mkdir -p src/app/\(auth\)
mkdir -p src/app/\(dashboard\)
mkdir -p src/app/\(public\)
mkdir -p src/app/api
mkdir -p src/components/layout
mkdir -p src/components/dashboard
mkdir -p src/components/pets
mkdir -p src/components/feeding
mkdir -p src/components/health
mkdir -p src/components/community
mkdir -p src/components/shop
mkdir -p src/components/paws
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/types
mkdir -p src/data
mkdir -p src/utils
mkdir -p public/images
mkdir -p public/icons

echo "✅ Directory structure created"

# Build the project
echo ""
echo "🔨 Building the project..."
npm run build

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For deployment:"
echo "- Cloudflare Pages: npm run deploy"
echo "- Vercel: vercel"
echo ""
echo "Happy coding! 🐾"

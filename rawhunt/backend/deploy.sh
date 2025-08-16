#!/bin/bash

# Rawgle Backend Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Rawgle Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if we're logged in to Cloudflare
print_status "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_error "Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

print_success "Cloudflare authentication verified"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Run tests
print_status "Running tests..."
npm test

if [ $? -ne 0 ]; then
    print_error "Tests failed. Please fix the issues before deploying."
    exit 1
fi

print_success "All tests passed"

# Check environment
ENVIRONMENT=${1:-production}
print_status "Deploying to environment: $ENVIRONMENT"

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    print_error "Invalid environment. Use 'production' or 'staging'"
    exit 1
fi

# Check if database exists
print_status "Checking database configuration..."

# For production, ensure database is properly configured
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Validating production configuration..."
    
    # Check if wrangler.toml has required configuration
    if ! grep -q "database_id" wrangler.toml; then
        print_error "Database ID not configured in wrangler.toml"
        exit 1
    fi
    
    print_warning "Make sure you have:"
    echo "  1. Created the D1 database"
    echo "  2. Updated database_id in wrangler.toml"
    echo "  3. Set production JWT_SECRET"
    echo "  4. Configured CORS origins"
    
    read -p "Continue with production deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
fi

# Run database migrations
print_status "Running database migrations..."
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler d1 migrations apply rawgle-db --env production
else
    wrangler d1 migrations apply rawgle-db --env staging
fi

if [ $? -ne 0 ]; then
    print_error "Database migration failed"
    exit 1
fi

print_success "Database migrations completed"

# Deploy the worker
print_status "Deploying Cloudflare Worker..."
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler deploy --env production
else
    wrangler deploy --env staging
fi

if [ $? -ne 0 ]; then
    print_error "Worker deployment failed"
    exit 1
fi

print_success "Worker deployed successfully"

# Get the deployed URL
print_status "Getting deployment information..."
WORKER_URL=$(wrangler subdomain 2>/dev/null || echo "Unable to get subdomain")

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Worker URL: $WORKER_URL"
echo "  API Base: https://<your-worker-url>/api"
echo ""
echo "🔍 Next steps:"
echo "  1. Test the health endpoint: curl https://<your-worker-url>/health"
echo "  2. Verify API endpoints are working"
echo "  3. Update frontend configuration with new API URL"
echo "  4. Monitor logs: wrangler tail"
echo ""

# Test the deployment
print_status "Testing deployment..."
sleep 5  # Wait a moment for deployment to be ready

# Try to reach the health endpoint
if command -v curl &> /dev/null; then
    print_status "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$WORKER_URL/health" || echo "000")
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        print_success "Health check passed"
    else
        print_warning "Health check returned status: $HEALTH_RESPONSE"
    fi
else
    print_warning "curl not available, skipping health check"
fi

print_success "Deployment script completed!"

# Optional: Open the worker in browser
if command -v open &> /dev/null; then
    read -p "Open the deployed API in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://$WORKER_URL/api"
    fi
fi
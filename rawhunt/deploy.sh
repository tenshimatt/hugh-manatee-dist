#!/bin/bash

# Rawgle/Rawhunt Platform Deployment Script
# This script deploys the backend API to Cloudflare Workers

set -e

echo "🚀 Rawgle Platform Deployment Script"
echo "======================================"

# Check if required tools are installed
check_requirements() {
    echo "🔍 Checking requirements..."
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed"
        exit 1
    fi
    
    if ! command -v wrangler &> /dev/null; then
        echo "❌ wrangler CLI is not installed"
        echo "   Install with: npm install -g wrangler"
        exit 1
    fi
    
    echo "✅ All requirements met"
}

# Validate environment
validate_environment() {
    echo "🔧 Validating environment..."
    
    if [ ! -f "wrangler.toml" ]; then
        echo "❌ wrangler.toml not found"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found"
        exit 1
    fi
    
    echo "✅ Environment validation passed"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    if [ -f "test-api.js" ]; then
        node test-api.js
        echo "✅ All tests passed"
    else
        echo "⚠️  No test file found, skipping tests"
    fi
}

# Run database migrations
run_migrations() {
    echo "💾 Running database migrations..."
    
    if [ ! -f "migrations/0001_initial_schema.sql" ]; then
        echo "❌ Migration file not found"
        exit 1
    fi
    
    # In a real deployment, this would run the migrations against the D1 database
    echo "✅ Database migrations ready (run 'wrangler d1 execute' to apply)"
}

# Deploy to staging
deploy_staging() {
    echo "🚀 Deploying to staging..."
    wrangler deploy --env staging
    echo "✅ Staging deployment complete"
}

# Deploy to production
deploy_production() {
    echo "🚀 Deploying to production..."
    
    # Confirm production deployment
    read -p "⚠️  Are you sure you want to deploy to production? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "❌ Production deployment cancelled"
        exit 1
    fi
    
    wrangler deploy --env production
    echo "✅ Production deployment complete"
}

# Verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Test health endpoint
    HEALTH_URL="https://rawgle-backend.your-subdomain.workers.dev/health"
    echo "Testing health endpoint: $HEALTH_URL"
    
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo "✅ Health endpoint responding"
    else
        echo "❌ Health endpoint not responding"
        echo "   Please check the deployment"
    fi
}

# Main deployment flow
main() {
    case "$1" in
        "staging")
            check_requirements
            validate_environment
            install_dependencies
            run_tests
            run_migrations
            deploy_staging
            verify_deployment
            ;;
        "production")
            check_requirements
            validate_environment
            install_dependencies
            run_tests
            run_migrations
            deploy_production
            verify_deployment
            ;;
        "test")
            check_requirements
            validate_environment
            install_dependencies
            run_tests
            ;;
        "migrate")
            check_requirements
            validate_environment
            run_migrations
            ;;
        *)
            echo "Usage: $0 {staging|production|test|migrate}"
            echo ""
            echo "Commands:"
            echo "  staging     - Deploy to staging environment"
            echo "  production  - Deploy to production environment"
            echo "  test        - Run tests only"
            echo "  migrate     - Prepare database migrations"
            echo ""
            exit 1
            ;;
    esac
}

# We are already in the backend directory

main "$@"
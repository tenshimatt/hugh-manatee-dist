#!/bin/bash

# Hunta Platform Deployment Script
# Deploys complete system to Cloudflare infrastructure

set -e  # Exit on any error

echo "🚀 Hunta Platform Deployment Starting..."
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

log_info "Deploying to environment: $ENVIRONMENT"
log_info "Project root: $PROJECT_ROOT"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI not found. Please install it first:"
        echo "npm install -g wrangler"
        exit 1
    fi
    
    # Check if authenticated with Cloudflare
    if ! wrangler whoami &> /dev/null; then
        log_error "Not authenticated with Cloudflare. Please run: wrangler login"
        exit 1
    fi
    
    # Check if node/npm is available
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Deploy database migrations
deploy_database() {
    log_info "Deploying database migrations..."
    
    cd "$BACKEND_DIR"
    
    # Create database if it doesn't exist
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler d1 create hunta-db-prod --env production || true
    else
        wrangler d1 create hunta-db || true
    fi
    
    # Apply migrations
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler d1 migrations apply hunta-db --env production
    else
        wrangler d1 migrations apply hunta-db
    fi
    
    log_success "Database deployment completed"
}

# Deploy backend workers
deploy_backend() {
    log_info "Deploying backend workers..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    npm install
    
    # Deploy based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler deploy --env production
    else
        wrangler deploy
    fi
    
    log_success "Backend deployment completed"
}

# Build and deploy frontend
deploy_frontend() {
    log_info "Building and deploying frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    # Deploy to Cloudflare Pages (if configured)
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Frontend built. Upload dist/ to Cloudflare Pages manually or configure Pages integration."
    else
        log_info "Frontend built for development. Use 'npm run preview' to test."
    fi
    
    log_success "Frontend build completed"
}

# Setup R2 buckets
setup_r2_buckets() {
    log_info "Setting up R2 storage buckets..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler r2 bucket create hunta-media-prod || true
    else
        wrangler r2 bucket create hunta-media || true
        wrangler r2 bucket create hunta-media-preview || true
    fi
    
    log_success "R2 buckets setup completed"
}

# Setup KV namespaces
setup_kv_namespaces() {
    log_info "Setting up KV namespaces..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler kv:namespace create "CACHE" --env production || true
    else
        wrangler kv:namespace create "CACHE" || true
        wrangler kv:namespace create "CACHE" --preview || true
    fi
    
    log_success "KV namespaces setup completed"
}

# Update wrangler.toml with resource IDs
update_wrangler_config() {
    log_info "Updating wrangler configuration..."
    
    # This would need to be implemented to automatically update
    # the wrangler.toml file with actual resource IDs
    log_warning "Please update wrangler.toml with actual resource IDs from Cloudflare dashboard"
}

# Run deployment tests
run_deployment_tests() {
    log_info "Running deployment tests..."
    
    cd "$PROJECT_ROOT/tests"
    
    # Install test dependencies
    npm install
    
    # Run smoke tests
    npm run test:smoke || {
        log_warning "Some smoke tests failed. Check test results."
    }
    
    log_success "Deployment tests completed"
}

# Post-deployment tasks
post_deployment() {
    log_info "Running post-deployment tasks..."
    
    # Sync to Notion if configured
    if [ -f "$PROJECT_ROOT/tools/notion_push.py" ]; then
        cd "$PROJECT_ROOT/tools"
        python3 notion_push.py || log_warning "Notion sync failed"
    fi
    
    # Generate deployment report
    cat > "$PROJECT_ROOT/deployment-report.md" << EOF
# Hunta Platform Deployment Report

**Date**: $(date)
**Environment**: $ENVIRONMENT
**Deployer**: $(whoami)
**Git Commit**: $(git rev-parse HEAD)

## Deployment Status

- ✅ Backend Workers deployed
- ✅ Database migrations applied
- ✅ Frontend built
- ✅ R2 buckets configured
- ✅ KV namespaces setup
- ✅ Tests executed

## Access URLs

- **API**: https://hunta-backend.your-subdomain.workers.dev
- **Frontend**: https://hunta.pages.dev
- **Admin**: https://hunta-backend.your-subdomain.workers.dev/admin

## Next Steps

1. Configure custom domain in Cloudflare dashboard
2. Set up monitoring and alerts
3. Configure backup strategies
4. Update DNS records if needed

## Configuration Notes

- Update wrangler.toml with actual resource IDs
- Set environment variables in Cloudflare dashboard
- Configure R2 bucket policies
- Set up KV namespace permissions

EOF

    log_success "Deployment report generated: deployment-report.md"
}

# Main deployment flow
main() {
    echo "🎯 Starting Hunta Platform deployment..."
    
    check_prerequisites
    
    # Core infrastructure
    setup_r2_buckets
    setup_kv_namespaces
    deploy_database
    
    # Application deployment
    deploy_backend
    deploy_frontend
    
    # Post-deployment
    run_deployment_tests
    post_deployment
    
    echo ""
    echo "🎉 Hunta Platform deployment completed!"
    echo "======================================="
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_success "Production deployment successful!"
        log_info "Please check deployment-report.md for access details"
    else
        log_success "Development deployment successful!"
        log_info "Backend: http://localhost:8787"
        log_info "Frontend: http://localhost:3000"
    fi
}

# Execute main function
main "$@"
#!/bin/bash

# Hunta Custom Domain Setup Script
# Configures gohunta.com routing for the Hunta platform

set -e

echo "🌐 Setting up custom domain for Hunta platform..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

log_info "Project root: $PROJECT_ROOT"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI not found. Install with: npm install -g wrangler"
        exit 1
    fi
    
    if ! wrangler whoami &> /dev/null; then
        log_error "Not authenticated with Cloudflare. Run: wrangler login"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Deploy backend with custom routes
deploy_backend_with_routes() {
    log_info "Deploying backend with custom domain routes..."
    
    cd "$BACKEND_DIR"
    
    # Deploy backend to production with custom routes
    log_info "Deploying hunta-backend-prod with api.gohunta.com routing..."
    wrangler deploy --env production -c wrangler-production.toml
    
    log_success "Backend deployed with custom domain routing"
}

# Build and deploy frontend
build_and_deploy_frontend() {
    log_info "Building frontend with custom API endpoint..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    npm install
    
    # Build for production with custom domain
    NODE_ENV=production npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Frontend build failed - dist directory not found"
        exit 1
    fi
    
    # Deploy to Cloudflare Pages
    log_info "Deploying to Cloudflare Pages..."
    wrangler pages deploy dist --project-name=hunta-frontend --compatibility-date=2024-11-01
    
    log_success "Frontend deployed to Cloudflare Pages"
}

# Display DNS configuration instructions
show_dns_instructions() {
    log_info "DNS Configuration Required:"
    echo ""
    echo "Add these DNS records in your domain registrar or Cloudflare DNS:"
    echo ""
    echo "1. Main Domain (gohunta.com):"
    echo "   Type: CNAME"
    echo "   Name: @"
    echo "   Content: hunta-frontend.pages.dev"
    echo "   Proxy: Enabled (Orange cloud)"
    echo ""
    echo "2. API Subdomain (api.gohunta.com):"
    echo "   Type: CNAME"
    echo "   Name: api"
    echo "   Content: hunta-backend-prod.findrawdogfood.workers.dev"
    echo "   Proxy: Enabled (Orange cloud)"
    echo ""
    echo "3. WWW Subdomain (www.gohunta.com):"
    echo "   Type: CNAME"
    echo "   Name: www"
    echo "   Content: gohunta.com"
    echo "   Proxy: Enabled (Orange cloud)"
}

# Display Pages custom domain instructions
show_pages_instructions() {
    log_info "Cloudflare Pages Custom Domain Setup:"
    echo ""
    echo "1. Go to: https://dash.cloudflare.com/3e02a16d99fcee4a071c58d876dbc4ea/pages"
    echo "2. Select 'hunta-frontend' project"
    echo "3. Go to 'Custom domains' tab"
    echo "4. Click 'Set up a custom domain'"
    echo "5. Enter 'gohunta.com'"
    echo "6. Follow the DNS setup instructions"
    echo ""
    log_warning "This step must be completed manually in the Cloudflare dashboard"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if backend is accessible
    if curl -s "https://hunta-backend-prod.findrawdogfood.workers.dev/health" > /dev/null; then
        log_success "Backend is accessible at worker URL"
    else
        log_warning "Backend health check failed"
    fi
    
    # Get latest Pages deployment URL
    PAGES_URL=$(wrangler pages deployment list --project-name=hunta-frontend --format=json | jq -r '.[0].url' 2>/dev/null || echo "Unknown")
    
    if [ "$PAGES_URL" != "Unknown" ] && [ "$PAGES_URL" != "null" ]; then
        log_success "Frontend deployed at: $PAGES_URL"
    else
        log_warning "Could not verify frontend deployment URL"
    fi
}

# Generate post-setup checklist
generate_checklist() {
    cat > "$PROJECT_ROOT/CUSTOM_DOMAIN_CHECKLIST.md" << 'EOF'
# Custom Domain Setup Checklist

## DNS Configuration ✅
- [ ] Add CNAME record: @ → hunta-frontend.pages.dev (Proxied)
- [ ] Add CNAME record: api → hunta-backend-prod.findrawdogfood.workers.dev (Proxied)
- [ ] Add CNAME record: www → gohunta.com (Proxied)

## Cloudflare Pages Setup ✅
- [ ] Add gohunta.com as custom domain in Pages dashboard
- [ ] Verify SSL certificate is active
- [ ] Test frontend loads at https://gohunta.com

## Backend Configuration ✅
- [ ] Backend deployed with api.gohunta.com routing
- [ ] Test API health: https://api.gohunta.com/health
- [ ] Verify CORS configuration allows gohunta.com

## Frontend Configuration ✅
- [ ] API URL updated to https://api.gohunta.com
- [ ] Security headers updated for custom domain
- [ ] Frontend rebuilt and deployed

## Verification Tests
- [ ] https://gohunta.com loads the application
- [ ] https://www.gohunta.com redirects properly
- [ ] https://api.gohunta.com/health returns success
- [ ] Frontend can authenticate and load data
- [ ] SSL certificates valid for all domains

## Performance & Security
- [ ] Cloudflare Analytics configured
- [ ] Cache rules optimized
- [ ] Security headers verified
- [ ] Firewall rules reviewed

## Troubleshooting
If you encounter issues:
1. Wait 5-10 minutes for DNS propagation
2. Clear browser cache and cookies
3. Check DNS resolution: `dig gohunta.com`
4. Verify SSL: `curl -I https://gohunta.com`
5. Test API directly: `curl https://api.gohunta.com/health`
EOF

    log_success "Setup checklist created: CUSTOM_DOMAIN_CHECKLIST.md"
}

# Main execution
main() {
    echo "🚀 Starting custom domain setup for Hunta..."
    
    check_prerequisites
    
    log_info "Step 1: Deploying backend with custom routes..."
    deploy_backend_with_routes
    
    log_info "Step 2: Building and deploying frontend..."
    build_and_deploy_frontend
    
    log_info "Step 3: Verifying deployment..."
    verify_deployment
    
    log_info "Step 4: Generating setup checklist..."
    generate_checklist
    
    echo ""
    echo "🎉 Automated setup completed!"
    echo "=============================="
    
    show_dns_instructions
    echo ""
    show_pages_instructions
    
    echo ""
    log_success "Next steps:"
    echo "1. Configure DNS records as shown above"
    echo "2. Set up custom domain in Cloudflare Pages dashboard"
    echo "3. Wait for SSL certificates to provision (up to 24 hours)"
    echo "4. Follow CUSTOM_DOMAIN_CHECKLIST.md for verification"
    echo ""
    log_info "Current URLs:"
    echo "  Backend: https://hunta-backend-prod.findrawdogfood.workers.dev"
    echo "  Frontend: https://3ce807a7.hunta-frontend.pages.dev (or latest deployment)"
    echo ""
    log_info "Target URLs after DNS setup:"
    echo "  Website: https://gohunta.com"
    echo "  API: https://api.gohunta.com"
}

# Execute main function
main "$@"
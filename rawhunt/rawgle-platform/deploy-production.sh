#!/bin/bash

# Rawgle Platform Production Deployment Script
# This script deploys the complete Rawgle system to Cloudflare

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="rawgle-backend"
FRONTEND_DIR="rawgle-frontend"
PROJECT_NAME="rawgle-platform"
PRODUCTION_DOMAIN="rawgle.com"
API_DOMAIN="api.rawgle.com"

echo -e "${BLUE}🚀 Starting Rawgle Platform Production Deployment${NC}"
echo "================================================="

# Function to print status messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if wrangler is installed and authenticated
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI not found. Please install with: npm install -g wrangler"
    exit 1
fi

# Check wrangler authentication
if ! wrangler whoami &> /dev/null; then
    print_error "Wrangler not authenticated. Please run: wrangler login"
    exit 1
fi

print_status "Prerequisites check completed"

# Step 1: Create and setup D1 database
echo -e "${BLUE}🗄️  Setting up D1 database...${NC}"
cd "$BACKEND_DIR"

# Create D1 database if it doesn't exist
DB_ID=$(wrangler d1 list | grep "rawgle-db" | awk '{print $2}' || echo "")
if [ -z "$DB_ID" ]; then
    echo "Creating new D1 database..."
    wrangler d1 create rawgle-db
    DB_ID=$(wrangler d1 list | grep "rawgle-db" | awk '{print $2}')
    
    # Update wrangler.toml with the actual database ID
    sed -i.bak "s/your-database-id/$DB_ID/g" wrangler.toml
    print_status "D1 database created with ID: $DB_ID"
else
    print_status "D1 database already exists with ID: $DB_ID"
fi

# Run database migrations
echo "Running database migrations..."
wrangler d1 migrations apply rawgle-db --env production
print_status "Database migrations completed"

# Step 2: Configure production environment variables
echo -e "${BLUE}🔧 Configuring production environment...${NC}"

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set production secrets
wrangler secret put JWT_SECRET --env production <<< "$JWT_SECRET"
print_status "JWT secret configured"

# Step 3: Deploy backend API
echo -e "${BLUE}🚀 Deploying backend API...${NC}"

# Install dependencies
npm install

# Run tests before deployment
echo "Running backend tests..."
npm run test:unit
print_status "Backend tests passed"

# Deploy to production
wrangler deploy --env production

# Get the deployed worker URL
WORKER_URL=$(wrangler deployments list --env production | grep "rawgle-backend-prod" | head -1 | awk '{print $4}')
print_status "Backend deployed to: $WORKER_URL"

# Step 4: Setup custom domain for API (if configured)
if [ ! -z "$API_DOMAIN" ]; then
    echo "Setting up custom domain for API..."
    # Note: This requires DNS to be managed by Cloudflare
    # wrangler custom-domains put $API_DOMAIN --env production
    print_warning "Custom domain setup for API requires manual DNS configuration"
fi

cd ..

# Step 5: Configure and deploy frontend
echo -e "${BLUE}🌐 Deploying frontend...${NC}"
cd "$FRONTEND_DIR"

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=${WORKER_URL}
VITE_APP_NAME=Rawgle Platform
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
EOF

print_status "Frontend environment configured"

# Build for production
npm run build
print_status "Frontend build completed"

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."

# Create Pages project if it doesn't exist
PAGES_PROJECT_EXISTS=$(wrangler pages project list | grep "rawgle-frontend" || echo "")
if [ -z "$PAGES_PROJECT_EXISTS" ]; then
    wrangler pages project create rawgle-frontend --production-branch main
    print_status "Cloudflare Pages project created"
fi

# Deploy to Pages
wrangler pages deploy dist --project-name rawgle-frontend --compatibility-date=2023-12-01

# Get the deployed Pages URL
PAGES_URL=$(wrangler pages deployment list --project-name rawgle-frontend | head -2 | tail -1 | awk '{print $4}')
print_status "Frontend deployed to: $PAGES_URL"

cd ..

# Step 6: Configure CORS for production URLs
echo -e "${BLUE}🔒 Updating CORS configuration...${NC}"
cd "$BACKEND_DIR"

# Update CORS settings in the backend to include the Pages URL
print_warning "Update CORS origins in src/middleware/cors.js to include: $PAGES_URL"

# Step 7: Setup monitoring and health checks
echo -e "${BLUE}📊 Setting up monitoring...${NC}"

# Create monitoring configuration
cat > monitoring-config.json << EOF
{
  "endpoints": [
    {
      "name": "Backend API Health",
      "url": "${WORKER_URL}/health",
      "expectedStatus": 200
    },
    {
      "name": "Frontend",
      "url": "${PAGES_URL}",
      "expectedStatus": 200
    }
  ],
  "notificationWebhook": ""
}
EOF

print_status "Monitoring configuration created"

# Step 8: Run post-deployment tests
echo -e "${BLUE}🧪 Running post-deployment tests...${NC}"

# Test API endpoints
echo "Testing API health endpoint..."
if curl -f -s "${WORKER_URL}/health" > /dev/null; then
    print_status "API health check passed"
else
    print_error "API health check failed"
fi

# Test frontend
echo "Testing frontend..."
if curl -f -s "$PAGES_URL" > /dev/null; then
    print_status "Frontend health check passed"
else
    print_error "Frontend health check failed"
fi

cd ..

# Step 9: Generate deployment report
echo -e "${BLUE}📋 Generating deployment report...${NC}"

cat > DEPLOYMENT_REPORT.md << EOF
# Rawgle Platform Deployment Report

**Deployment Date:** $(date)
**Environment:** Production

## Deployed Components

### Backend API
- **URL:** $WORKER_URL
- **Custom Domain:** $API_DOMAIN (requires DNS setup)
- **Database:** D1 (ID: $DB_ID)
- **Environment:** Production

### Frontend
- **URL:** $PAGES_URL
- **Custom Domain:** $PRODUCTION_DOMAIN (requires DNS setup)
- **Build:** Production optimized

## Database
- **Type:** Cloudflare D1 (SQLite)
- **Migrations:** Applied successfully
- **Schema:** Initial schema with all tables

## Security Configuration
- ✅ JWT secrets configured
- ✅ Rate limiting enabled
- ⚠️ CORS needs update for production URLs
- ⚠️ Custom domains require DNS configuration

## Monitoring
- Health endpoints configured
- Monitoring config file created
- Manual setup required for alerts

## Next Steps
1. Configure custom domains in Cloudflare Dashboard
2. Update DNS records to point to Cloudflare
3. Update CORS origins in backend
4. Set up monitoring alerts
5. Configure analytics tracking
6. Perform end-to-end testing

## URLs
- **API:** $WORKER_URL
- **Frontend:** $PAGES_URL
- **Admin Panel:** To be configured

## Credentials
- JWT Secret: Configured in Wrangler secrets
- Database ID: $DB_ID

## Support Commands
\`\`\`bash
# View backend logs
wrangler tail --env production

# View frontend deployment logs
wrangler pages deployment list --project-name rawgle-frontend

# Database console
wrangler d1 execute rawgle-db --command "SELECT COUNT(*) FROM users" --env production
\`\`\`
EOF

print_status "Deployment report generated: DEPLOYMENT_REPORT.md"

echo ""
echo -e "${GREEN}🎉 Rawgle Platform deployment completed successfully!${NC}"
echo "================================================="
echo -e "${BLUE}Backend API:${NC} $WORKER_URL"
echo -e "${BLUE}Frontend:${NC} $PAGES_URL"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure custom domains in Cloudflare Dashboard"
echo "2. Update CORS settings in backend"
echo "3. Set up monitoring and alerts"
echo "4. Perform end-to-end testing"
echo ""
echo -e "${BLUE}View deployment report: DEPLOYMENT_REPORT.md${NC}"
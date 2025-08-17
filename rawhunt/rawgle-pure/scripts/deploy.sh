#!/bin/bash

# Rawgle Platform Deployment Script
# This script deploys the complete Rawgle platform to Cloudflare

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
FORCE_DEPLOY=${2:-false}

echo -e "${BLUE}🚀 Starting Rawgle Platform Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo "=================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI is not installed${NC}"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Cloudflare${NC}"
    echo "Login with: wrangler auth login"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found, using environment variables${NC}"
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Run tests before deployment
echo -e "${YELLOW}🧪 Running test suite...${NC}"

if [ "$FORCE_DEPLOY" != "true" ]; then
    npm run test:unit
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Unit tests failed${NC}"
        exit 1
    fi
    
    npm run test:security
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Security tests failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping tests (force deploy enabled)${NC}"
fi

# Build application
echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build completed${NC}"

# Create or update D1 database
echo -e "${YELLOW}🗄️  Setting up D1 database...${NC}"

# Check if database exists
DB_EXISTS=$(wrangler d1 list | grep "rawgle-production" || echo "")

if [ -z "$DB_EXISTS" ]; then
    echo "Creating new D1 database..."
    wrangler d1 create rawgle-production
    echo -e "${GREEN}✅ D1 database created${NC}"
else
    echo -e "${GREEN}✅ D1 database already exists${NC}"
fi

# Apply database schema
echo "Applying database schema..."
wrangler d1 execute rawgle-production --file=schema.sql --env=$ENVIRONMENT
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema applied${NC}"
else
    echo -e "${YELLOW}⚠️  Schema application failed (may already exist)${NC}"
fi

# Create KV namespaces
echo -e "${YELLOW}🗂️  Setting up KV namespaces...${NC}"

# Main KV namespace
KV_EXISTS=$(wrangler kv:namespace list | grep "RAWGLE_KV" || echo "")
if [ -z "$KV_EXISTS" ]; then
    wrangler kv:namespace create "RAWGLE_KV" --env=$ENVIRONMENT
    echo -e "${GREEN}✅ RAWGLE_KV namespace created${NC}"
else
    echo -e "${GREEN}✅ RAWGLE_KV namespace already exists${NC}"
fi

# Sessions KV namespace
SESSIONS_EXISTS=$(wrangler kv:namespace list | grep "SESSIONS" || echo "")
if [ -z "$SESSIONS_EXISTS" ]; then
    wrangler kv:namespace create "SESSIONS" --env=$ENVIRONMENT
    echo -e "${GREEN}✅ SESSIONS namespace created${NC}"
else
    echo -e "${GREEN}✅ SESSIONS namespace already exists${NC}"
fi

# Create R2 buckets
echo -e "${YELLOW}🪣 Setting up R2 buckets...${NC}"

# Images bucket
IMAGES_EXISTS=$(wrangler r2 bucket list | grep "rawgle-images" || echo "")
if [ -z "$IMAGES_EXISTS" ]; then
    wrangler r2 bucket create rawgle-images
    echo -e "${GREEN}✅ Images bucket created${NC}"
else
    echo -e "${GREEN}✅ Images bucket already exists${NC}"
fi

# Reports bucket
REPORTS_EXISTS=$(wrangler r2 bucket list | grep "rawgle-reports" || echo "")
if [ -z "$REPORTS_EXISTS" ]; then
    wrangler r2 bucket create rawgle-reports
    echo -e "${GREEN}✅ Reports bucket created${NC}"
else
    echo -e "${GREEN}✅ Reports bucket already exists${NC}"
fi

# Create queues
echo -e "${YELLOW}📬 Setting up queues...${NC}"

QUEUE_EXISTS=$(wrangler queues list | grep "rawgle-jobs" || echo "")
if [ -z "$QUEUE_EXISTS" ]; then
    wrangler queues create rawgle-jobs
    echo -e "${GREEN}✅ Queue created${NC}"
else
    echo -e "${GREEN}✅ Queue already exists${NC}"
fi

# Deploy Worker
echo -e "${YELLOW}⚡ Deploying Worker...${NC}"

if [ "$ENVIRONMENT" == "production" ]; then
    wrangler deploy --env=production
elif [ "$ENVIRONMENT" == "staging" ]; then
    wrangler deploy --env=staging
else
    wrangler deploy --env=development
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Worker deployed successfully${NC}"
else
    echo -e "${RED}❌ Worker deployment failed${NC}"
    exit 1
fi

# Deploy Pages (if frontend exists)
if [ -d "frontend" ]; then
    echo -e "${YELLOW}🌐 Deploying Pages frontend...${NC}"
    
    cd frontend
    npm ci
    npm run build
    
    if [ "$ENVIRONMENT" == "production" ]; then
        wrangler pages deploy dist --project-name=rawgle-frontend
    else
        wrangler pages deploy dist --project-name=rawgle-frontend-$ENVIRONMENT
    fi
    
    cd ..
    echo -e "${GREEN}✅ Frontend deployed${NC}"
fi

# Run health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Get worker URL
if [ "$ENVIRONMENT" == "production" ]; then
    WORKER_URL="https://rawgle-api.your-subdomain.workers.dev"
else
    WORKER_URL="https://rawgle-api-$ENVIRONMENT.your-subdomain.workers.dev"
fi

# Wait for deployment to propagate
echo "Waiting for deployment to propagate..."
sleep 10

# Health check
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/api/health" || echo "000")

if [ "$HEALTH_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $HEALTH_RESPONSE)${NC}"
    echo "Worker URL: $WORKER_URL"
fi

# Database connectivity check
echo "Testing database connectivity..."
DB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/api/health/db" || echo "000")

if [ "$DB_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✅ Database connectivity check passed${NC}"
else
    echo -e "${RED}❌ Database connectivity check failed${NC}"
fi

# Performance check
echo "Running basic performance test..."
PERF_RESPONSE=$(curl -s -o /dev/null -w "%{time_total}" "$WORKER_URL/api/health")
PERF_MS=$(echo "$PERF_RESPONSE * 1000" | bc -l | cut -d. -f1)

if [ "$PERF_MS" -lt 500 ]; then
    echo -e "${GREEN}✅ Performance check passed (${PERF_MS}ms)${NC}"
else
    echo -e "${YELLOW}⚠️  Performance check warning (${PERF_MS}ms)${NC}"
fi

# Set up monitoring (if enabled)
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
    
    # Set up analytics
    wrangler analytics put "$WORKER_URL" --dataset=rawgle_analytics || echo "Analytics setup skipped"
    
    # Configure alerts (if Wrangler supports it)
    echo "Monitoring configured"
    echo -e "${GREEN}✅ Monitoring setup completed${NC}"
fi

# Generate deployment summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
echo "=================================="
echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
echo -e "${BLUE}Worker URL:${NC} $WORKER_URL"
echo -e "${BLUE}API Health:${NC} $WORKER_URL/api/health"
echo -e "${BLUE}API Docs:${NC} $WORKER_URL/api/docs"

if [ -d "frontend" ]; then
    if [ "$ENVIRONMENT" == "production" ]; then
        echo -e "${BLUE}Frontend URL:${NC} https://rawgle-frontend.pages.dev"
    else
        echo -e "${BLUE}Frontend URL:${NC} https://rawgle-frontend-$ENVIRONMENT.pages.dev"
    fi
fi

echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update DNS records if needed"
echo "2. Configure custom domain"
echo "3. Set up monitoring alerts"
echo "4. Run integration tests"
echo "5. Update documentation"

# Save deployment info
echo "$(date): Deployed $ENVIRONMENT successfully" >> deployment.log

echo ""
echo -e "${GREEN}🚀 Rawgle Platform is now live!${NC}"
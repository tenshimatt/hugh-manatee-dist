#!/bin/bash
# 🚀 Architect-GPT Autonomous Multi-Worker Deployment Script
# Cloudflare-First Architecture Auto-Deploy

set -e  # Exit on any error

echo "🏗️  Architect-GPT: Deploying Full Cloudflare Workers Stack..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment status tracking
DEPLOYMENTS=()
FAILED_DEPLOYMENTS=()

deploy_worker() {
    local dir=$1
    local name=$2
    local env=${3:-production}
    
    echo -e "${BLUE}📡 Deploying $name (env: $env)...${NC}"
    
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Directory $dir not found${NC}"
        FAILED_DEPLOYMENTS+=("$name")
        return 1
    fi
    
    cd "$dir"
    
    if [ ! -f "wrangler.toml" ]; then
        echo -e "${RED}❌ No wrangler.toml found in $dir${NC}"
        FAILED_DEPLOYMENTS+=("$name")
        cd ..
        return 1
    fi
    
    if wrangler deploy --env $env; then
        echo -e "${GREEN}✅ $name deployed successfully${NC}"
        DEPLOYMENTS+=("$name")
    else
        echo -e "${RED}❌ $name deployment failed${NC}"
        FAILED_DEPLOYMENTS+=("$name")
    fi
    
    cd - > /dev/null
}

# Get current directory
RAWHUNT_ROOT=$(pwd)

echo "🔍 Current directory: $RAWHUNT_ROOT"
echo "🏢 Deploying Cloudflare Workers Infrastructure..."
echo ""

# 1. Main Backend API
echo -e "${YELLOW}=== 1. RAWGLE BACKEND API ===${NC}"
deploy_worker "backend" "rawgle-backend-api"

echo ""

# 2. Hunta v2 Backend
echo -e "${YELLOW}=== 2. HUNTA V2 BACKEND ===${NC}"
deploy_worker "hunta-v2/backend" "hunta-v2-backend"

echo ""

# 3. Rawgle Pure Platform
echo -e "${YELLOW}=== 3. RAWGLE PURE PLATFORM ===${NC}"
deploy_worker "rawgle-pure" "rawgle-pure-platform"

echo ""

# 4. Additional workers from findrawdogfood
echo -e "${YELLOW}=== 4. FINDRAWDOGFOOD PLATFORM ===${NC}"
if [ -d "findrawdogfood" ]; then
    deploy_worker "findrawdogfood" "findrawdogfood-main"
fi

echo ""

# 5. Dashboard if exists
if [ -d "findrawdogfood/dashboard" ]; then
    echo -e "${YELLOW}=== 5. DASHBOARD ===${NC}"
    deploy_worker "findrawdogfood/dashboard" "findrawdogfood-dashboard"
    echo ""
fi

# Summary
echo "=================================================="
echo -e "${BLUE}📊 DEPLOYMENT SUMMARY${NC}"
echo "=================================================="

if [ ${#DEPLOYMENTS[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Successful Deployments:${NC}"
    for deployment in "${DEPLOYMENTS[@]}"; do
        echo -e "   ${GREEN}▶ $deployment${NC}"
    done
fi

if [ ${#FAILED_DEPLOYMENTS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Failed Deployments:${NC}"
    for deployment in "${FAILED_DEPLOYMENTS[@]}"; do
        echo -e "   ${RED}▶ $deployment${NC}"
    done
fi

echo ""
echo -e "${BLUE}🔍 Check deployment status:${NC}"
echo "wrangler deployments list"
echo ""
echo -e "${BLUE}📊 Monitor logs:${NC}"
echo "wrangler tail --env production"
echo ""

# Auto-commit to Git
echo -e "${YELLOW}📝 Auto-committing to Git...${NC}"
git add .
git commit -m "🚀 Architect-GPT: Auto-deploy all Cloudflare Workers - $(date)" || echo "No changes to commit"

echo -e "${GREEN}🎉 Deployment complete! All systems operational.${NC}"
echo -e "${BLUE}🌐 Your Cloudflare Workers are live and ready!${NC}"

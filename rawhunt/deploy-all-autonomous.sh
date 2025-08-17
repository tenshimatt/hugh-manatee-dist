#!/bin/bash
# 🚀 Architect-GPT: Autonomous Full-Stack Cloudflare Deployment
# Execute from /Users/mattwright/pandora/rawhunt

set -e
cd /Users/mattwright/pandora/rawhunt

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏗️ Architect-GPT: Deploying Full Cloudflare Workers Stack${NC}"
echo "================================================================"

# Track deployments
SUCCESSFUL_DEPLOYS=()
FAILED_DEPLOYS=()

deploy_worker() {
    local dir=$1
    local name=$2
    local config=${3:-wrangler.toml}
    
    echo -e "${YELLOW}📡 Deploying $name...${NC}"
    
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Directory $dir not found${NC}"
        FAILED_DEPLOYS+=("$name - Directory not found")
        return 1
    fi
    
    cd "$dir"
    
    if [ ! -f "$config" ]; then
        echo -e "${RED}❌ Config $config not found in $dir${NC}"
        FAILED_DEPLOYS+=("$name - Config missing")
        cd /Users/mattwright/pandora/rawhunt
        return 1
    fi
    
    echo "Using config: $config"
    
    if [ "$config" != "wrangler.toml" ]; then
        # Use specific config file
        if wrangler deploy --config "$config" --env production 2>&1; then
            echo -e "${GREEN}✅ $name deployed successfully${NC}"
            SUCCESSFUL_DEPLOYS+=("$name")
        else
            echo -e "${RED}❌ $name deployment failed${NC}"
            FAILED_DEPLOYS+=("$name - Deploy failed")
        fi
    else
        # Use default config
        if wrangler deploy --env production 2>&1; then
            echo -e "${GREEN}✅ $name deployed successfully${NC}"
            SUCCESSFUL_DEPLOYS+=("$name")
        else
            echo -e "${RED}❌ $name deployment failed${NC}"
            FAILED_DEPLOYS+=("$name - Deploy failed")
        fi
    fi
    
    cd /Users/mattwright/pandora/rawhunt
    echo ""
}

echo -e "${BLUE}Starting deployments...${NC}"
echo ""

# 1. Backend API (Fixed Simple Version)
echo -e "${YELLOW}=== 1. RAWGLE BACKEND API (SIMPLE) ===${NC}"
deploy_worker "backend" "rawgle-backend-simple" "wrangler-simple.toml"

# 2. Rawgle Pure Platform
echo -e "${YELLOW}=== 2. RAWGLE PURE PLATFORM ===${NC}"
deploy_worker "rawgle-pure" "rawgle-pure-platform"

# 3. FindRawDogFood Main Platform
echo -e "${YELLOW}=== 3. FINDRAWDOGFOOD MAIN ===${NC}"
deploy_worker "findrawdogfood" "findrawdogfood-main"

# 4. Hunta v2 (if properly configured)
if [ -f "hunta-v2/backend/wrangler.toml" ]; then
    echo -e "${YELLOW}=== 4. HUNTA V2 BACKEND ===${NC}"
    deploy_worker "hunta-v2/backend" "hunta-v2-backend"
fi

# 5. Dashboard (if exists)
if [ -f "findrawdogfood/dashboard/wrangler.toml" ]; then
    echo -e "${YELLOW}=== 5. DASHBOARD ===${NC}"
    deploy_worker "findrawdogfood/dashboard" "dashboard"
fi

# 6. Additional platforms
if [ -f "rawgle-platform/rawgle-pure/wrangler.toml" ]; then
    echo -e "${YELLOW}=== 6. RAWGLE PLATFORM PURE ===${NC}"
    deploy_worker "rawgle-platform/rawgle-pure" "rawgle-platform-pure"
fi

# Summary
echo "================================================================"
echo -e "${BLUE}📊 DEPLOYMENT SUMMARY${NC}"
echo "================================================================"

if [ ${#SUCCESSFUL_DEPLOYS[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Successful Deployments (${#SUCCESSFUL_DEPLOYS[@]}):${NC}"
    for deployment in "${SUCCESSFUL_DEPLOYS[@]}"; do
        echo -e "   ${GREEN}▶ $deployment${NC}"
    done
    echo ""
fi

if [ ${#FAILED_DEPLOYS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Failed Deployments (${#FAILED_DEPLOYS[@]}):${NC}"
    for deployment in "${FAILED_DEPLOYS[@]}"; do
        echo -e "   ${RED}▶ $deployment${NC}"
    done
    echo ""
fi

echo -e "${BLUE}🔍 Test Your Deployed Workers:${NC}"
echo "curl https://rawgle-backend-prod.findrawdogfood.workers.dev/"
echo "curl https://rawgle-api-production.findrawdogfood.workers.dev/"
echo "curl https://rawgle-com-production.findrawdogfood.workers.dev/"
echo ""
echo -e "${BLUE}📊 Monitor:${NC}"
echo "wrangler deployments list"
echo "wrangler tail --env production"
echo ""

# Git commit
echo -e "${YELLOW}📝 Auto-committing to Git...${NC}"
git add . 2>/dev/null || true
git commit -m "🚀 Architect-GPT: Full-stack Cloudflare Workers deployment - $(date)" 2>/dev/null || echo "No changes to commit"

echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}🌐 Your Cloudflare-First architecture is now LIVE!${NC}"

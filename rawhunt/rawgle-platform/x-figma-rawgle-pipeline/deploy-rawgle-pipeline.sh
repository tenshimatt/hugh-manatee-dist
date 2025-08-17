#!/bin/bash

# Deploy Rawgle Figma-to-React Pipeline
# This script deploys all workers needed for the conversion pipeline

set -e

echo "🚀 Deploying Rawgle Figma-to-React Conversion Pipeline"
echo "======================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deploy CF Orchestrator
echo -e "${BLUE}Deploying CF Orchestrator...${NC}"
cd workers/cf-orchestrator
wrangler deploy --compatibility-date 2024-01-15
echo -e "${GREEN}✓ CF Orchestrator deployed${NC}"

# Deploy Figma Extractor
echo -e "${BLUE}Deploying Figma Extractor...${NC}"
cd ../figma-extractor
cat > wrangler.toml << EOF
name = "figma-extractor"
main = "index.js"
compatibility_date = "2024-01-15"
workers_dev = true

[vars]
ENVIRONMENT = "production"
EOF
wrangler deploy
echo -e "${GREEN}✓ Figma Extractor deployed${NC}"

# Deploy React Transformer
echo -e "${BLUE}Deploying React Transformer...${NC}"
cd ../react-transformer
wrangler deploy --compatibility-date 2024-01-15
echo -e "${GREEN}✓ React Transformer deployed${NC}"

# Deploy Rawgle Deployer
echo -e "${BLUE}Deploying Rawgle Deployer...${NC}"
cd ../rawgle-deployer
cat > wrangler.toml << EOF
name = "rawgle-deployer"
main = "index.js"
compatibility_date = "2024-01-15"
workers_dev = true

[vars]
ENVIRONMENT = "production"
EOF
wrangler deploy
echo -e "${GREEN}✓ Rawgle Deployer deployed${NC}"

# Deploy GPT Reporter
echo -e "${BLUE}Deploying GPT Reporter...${NC}"
cd ../gpt-reporter
cat > wrangler.toml << EOF
name = "gpt-reporter"
main = "index.js"
compatibility_date = "2024-01-15"
workers_dev = true

[vars]
ENVIRONMENT = "production"
EOF
wrangler deploy
echo -e "${GREEN}✓ GPT Reporter deployed${NC}"

cd ../..

echo ""
echo "======================================================="
echo -e "${GREEN}✅ All workers deployed successfully!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Get your deployed worker URLs from the Cloudflare dashboard"
echo "2. Use the orchestrator URL to trigger Figma imports"
echo ""
echo "Example conversion command:"
echo -e "${YELLOW}curl -X POST https://cf-pipeline-orchestrator.[your-subdomain].workers.dev/webhook/figma-import \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"figmaUrl\": \"https://www.figma.com/community/file/1428057852629350205\",
    \"targetPlatform\": \"rawgle\",
    \"extractionMode\": \"full\"
  }'${NC}"
echo ""
echo "Check your workers at: https://dash.cloudflare.com/?to=/:account/workers-and-pages"
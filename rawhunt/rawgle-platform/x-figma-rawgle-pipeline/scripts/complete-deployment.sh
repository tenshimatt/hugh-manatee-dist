#!/bin/bash
# complete-deployment.sh - Autonomous Cloudflare-first Figma-to-Rawgle pipeline
# Run as: ./complete-deployment.sh

set -e

echo "🏗️  Starting Architect-GPT Autonomous Deployment Pipeline"
echo "🎯  Target: Cloudflare-first Figma → React → Rawgle.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed."; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "git is required but not installed."; exit 1; }
    command -v curl >/dev/null 2>&1 || { log_error "curl is required but not installed."; exit 1; }
    
    log_success "Prerequisites checked"
}

# Install and configure Cloudflare Wrangler
setup_cloudflare() {
    log_info "Setting up Cloudflare Wrangler..."
    
    npm install -g wrangler@latest
    
    # Check if already authenticated
    if ! wrangler whoami >/dev/null 2>&1; then
        log_warning "Please authenticate with Cloudflare:"
        wrangler login
    fi
    
    log_success "Cloudflare Wrangler configured"
}

# Deploy Cloudflare Workers (CF-native orchestration instead of n8n)
deploy_workers() {
    log_info "Deploying Cloudflare Workers..."
    
    # Deploy each worker
    cd workers/figma-extractor && wrangler deploy
    cd ../react-transformer && wrangler deploy  
    cd ../rawgle-deployer && wrangler deploy
    cd ../gpt-reporter && wrangler deploy
    cd ../cf-orchestrator && wrangler deploy
    
    log_success "All Cloudflare Workers deployed"
    cd ../../
}

# Main execution flow
main() {
    echo "🚀 Starting Architect-GPT Autonomous Pipeline Deployment"
    echo "=================================================="
    
    check_prerequisites
    setup_cloudflare
    deploy_workers
    
    echo "=================================================="
    log_success "🎉 Complete Figma-to-Rawgle pipeline deployed!"
    echo ""
    echo "🔧 Cloudflare-Native Orchestration deployed!"
    echo "📋 Check workers at: https://dash.cloudflare.com"
    echo ""
    echo "🎯 Ready to convert Figma templates to React components!"
}

# Execute main function
main "$@"

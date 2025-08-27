#!/bin/bash
# 🎯 Architect-GPT: Individual Worker Deployment Commands

echo "🎯 Individual Cloudflare Worker Deployment Commands"
echo "=================================================="

# Function to deploy individual worker with error handling
deploy_individual() {
    local dir=$1
    local name=$2
    local config=${3:-wrangler.toml}
    
    echo ""
    echo "🚀 Deploying $name..."
    echo "Directory: $dir"
    echo "Config: $config"
    echo "Command: cd $dir && wrangler deploy --config $config --env production"
    echo "----------------------------------------"
    
    if [ -d "$dir" ]; then
        cd "$dir"
        
        if [ -f "$config" ]; then
            echo "✅ Config found, deploying..."
            if [ "$config" != "wrangler.toml" ]; then
                wrangler deploy --config "$config" --env production
            else
                wrangler deploy --env production
            fi
            echo "📊 Deployment result: $?"
        else
            echo "❌ Config file $config not found!"
            echo "Available configs:"
            ls -la *.toml 2>/dev/null || echo "No .toml files found"
        fi
        
        cd /Users/mattwright/pandora/rawhunt
    else
        echo "❌ Directory $dir not found!"
    fi
}

echo "Starting individual deployments..."

# 1. Backend (Simple Version)
deploy_individual "backend" "Rawgle Backend Simple" "wrangler-simple.toml"

# 2. Backend (Full Version) - if simple works
# deploy_individual "backend" "Rawgle Backend Full" "wrangler.toml"

# 3. Rawgle Pure Platform
deploy_individual "rawgle-pure" "Rawgle Pure Platform" "wrangler.toml"

# 4. FindRawDogFood Main
deploy_individual "findrawdogfood" "FindRawDogFood Main" "wrangler.toml"

# 5. Hunta v2 (if config exists)
if [ -f "hunta-v2/backend/wrangler.toml" ]; then
    deploy_individual "hunta-v2/backend" "Hunta v2 Backend" "wrangler.toml"
else
    echo "⚠️ Hunta v2 config not found, skipping..."
fi

echo ""
echo "🎉 Individual deployments complete!"
echo "📊 Check status with: wrangler deployments list"
echo "🧪 Test endpoints with: ./test-deployments.sh"

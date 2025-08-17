#!/bin/bash

# Cloudflare Authentication Troubleshooting Script

echo "🔐 Cloudflare Authentication Troubleshooting"
echo "============================================="
echo ""

echo "Current authentication status:"
echo "-----------------------------"
wrangler whoami 2>&1

echo ""
echo "Available authentication options:"
echo "1. Interactive OAuth Login (recommended)"
echo "2. API Token (requires complete token)"
echo ""

read -p "Choose option (1 or 2): " auth_choice

case $auth_choice in
    1)
        echo ""
        echo "🌐 Starting OAuth authentication..."
        echo "This will open your browser for Cloudflare login."
        read -p "Press Enter to continue..."
        
        # Clear any existing token
        unset CLOUDFLARE_API_TOKEN
        
        # Start OAuth flow
        wrangler login
        
        if [ $? -eq 0 ]; then
            echo "✅ OAuth authentication successful!"
            echo "Testing deployment..."
            wrangler deploy --dry-run
        else
            echo "❌ OAuth authentication failed"
        fi
        ;;
    2)
        echo ""
        echo "📝 API Token Setup"
        echo "Generate a token at: https://dash.cloudflare.com/profile/api-tokens"
        echo "Template: Edit Cloudflare Workers"
        echo ""
        echo "Required permissions:"
        echo "- Account: read"
        echo "- Zone: read"
        echo "- Workers KV: edit"
        echo "- Workers Scripts: edit"
        echo ""
        read -p "Enter your complete API token: " api_token
        
        if [ ${#api_token} -lt 40 ]; then
            echo "⚠️  Warning: Token seems short (${#api_token} characters)"
            echo "   Standard tokens are 40+ characters"
        fi
        
        # Update .env file
        sed -i.bak "s/CLOUDFLARE_API_TOKEN=.*/CLOUDFLARE_API_TOKEN=\"$api_token\"/" .env
        
        echo "✅ Token updated in .env file"
        echo "Testing authentication..."
        
        export CLOUDFLARE_API_TOKEN="$api_token"
        wrangler whoami
        
        if [ $? -eq 0 ]; then
            echo "✅ API token authentication successful!"
            echo "Testing deployment..."
            wrangler deploy --dry-run
        else
            echo "❌ API token authentication failed"
            echo "Check token permissions and try again"
        fi
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Once authentication is working, run:"
echo "./deploy-rawgle-production.sh"
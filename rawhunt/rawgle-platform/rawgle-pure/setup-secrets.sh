#!/bin/bash

# Setup Cloudflare Secrets for Rawgle Platform
# This keeps sensitive data out of wrangler.toml

echo "🔐 Setting up Cloudflare Secrets for Rawgle Platform"
echo "====================================================="
echo ""
echo "This script will help you securely store sensitive API keys and credentials."
echo "These will NOT be visible in your code or configuration files."
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    
    echo ""
    echo "📝 $secret_description"
    echo -n "Enter value for $secret_name (or press Enter to skip): "
    read -s secret_value
    echo ""
    
    if [ ! -z "$secret_value" ]; then
        echo "$secret_value" | wrangler secret put $secret_name
        echo "✅ $secret_name configured"
    else
        echo "⏭️  Skipped $secret_name"
    fi
}

echo "Starting secret configuration..."
echo "================================"

# API Keys
set_secret "OPENAI_API_KEY" "OpenAI API Key (for AI features)"
set_secret "ANTHROPIC_API_KEY" "Anthropic Claude API Key"
set_secret "GOOGLE_PLACES_API_KEY" "Google Places API Key"

# Solana/Blockchain
set_secret "SOLANA_PRIVATE_KEY" "Solana Wallet Private Key (VERY SENSITIVE!)"
set_secret "NFT_COLLECTION_SECRET" "NFT Collection Secret Key"

# JWT and Security
set_secret "JWT_SECRET" "JWT Secret for authentication (32+ characters)"
set_secret "ENCRYPTION_KEY" "Encryption key for sensitive data"

# Payment Processing (if needed)
set_secret "STRIPE_SECRET_KEY" "Stripe Secret Key (if using payments)"
set_secret "STRIPE_WEBHOOK_SECRET" "Stripe Webhook Secret"

# Database URLs (if using external DB)
set_secret "DATABASE_URL" "Database connection string (if applicable)"

# Email Service (if needed)
set_secret "SENDGRID_API_KEY" "SendGrid API Key for emails"
set_secret "EMAIL_FROM" "From email address"

echo ""
echo "================================"
echo "✅ Secret configuration complete!"
echo ""
echo "To verify your secrets are set, run:"
echo "  wrangler secret list"
echo ""
echo "To update a secret later, run:"
echo "  wrangler secret put SECRET_NAME"
echo ""
echo "To delete a secret, run:"
echo "  wrangler secret delete SECRET_NAME"
echo ""
echo "📝 Note: Secrets are accessed in your Worker code as:"
echo "  env.SECRET_NAME"
echo ""
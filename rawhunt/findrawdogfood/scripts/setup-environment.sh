#!/bin/bash

# Setup Environment Variables for FindRawDogFood
# This script helps configure all required API keys and environment variables

set -e

echo "🔧 FindRawDogFood Environment Setup"
echo "=================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your API keys."
    echo ""
fi

# Function to set Wrangler secrets
setup_wrangler_secrets() {
    echo "🔐 Setting up Wrangler secrets..."
    
    if [ -f ".env" ]; then
        # Source the .env file
        source .env
        
        # Set secrets in Wrangler
        if [ ! -z "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your_openai_api_key_here" ]; then
            echo "Setting OPENAI_API_KEY..."
            echo "$OPENAI_API_KEY" | wrangler secret put OPENAI_API_KEY
        fi
        
        if [ ! -z "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "your_anthropic_api_key_here" ]; then
            echo "Setting ANTHROPIC_API_KEY..."
            echo "$ANTHROPIC_API_KEY" | wrangler secret put ANTHROPIC_API_KEY
        fi
        
        if [ ! -z "$ELEVENLABS_API_KEY" ] && [ "$ELEVENLABS_API_KEY" != "your_elevenlabs_api_key_here" ]; then
            echo "Setting ELEVENLABS_API_KEY..."
            echo "$ELEVENLABS_API_KEY" | wrangler secret put ELEVENLABS_API_KEY
        fi
        
        if [ ! -z "$GOOGLE_PLACES_API_KEYS" ] && [ "$GOOGLE_PLACES_API_KEYS" != "your_google_api_key_1,your_google_api_key_2" ]; then
            echo "Setting GOOGLE_PLACES_API_KEYS..."
            echo "$GOOGLE_PLACES_API_KEYS" | wrangler secret put GOOGLE_PLACES_API_KEYS
        fi
        
        echo "✅ Wrangler secrets configured"
    else
        echo "❌ .env file not found. Please create it first."
        exit 1
    fi
}

# Function to validate API keys
validate_keys() {
    echo "🔍 Validating API keys..."
    
    # Load environment variables
    if [ -f ".env" ]; then
        source .env
    fi
    
    # Check each key
    local errors=0
    
    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
        echo "❌ OPENAI_API_KEY not set or using default value"
        errors=$((errors + 1))
    else
        echo "✅ OPENAI_API_KEY configured"
    fi
    
    if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your_anthropic_api_key_here" ]; then
        echo "❌ ANTHROPIC_API_KEY not set or using default value"
        errors=$((errors + 1))
    else
        echo "✅ ANTHROPIC_API_KEY configured"
    fi
    
    if [ -z "$ELEVENLABS_API_KEY" ] || [ "$ELEVENLABS_API_KEY" = "your_elevenlabs_api_key_here" ]; then
        echo "❌ ELEVENLABS_API_KEY not set or using default value"
        errors=$((errors + 1))
    else
        echo "✅ ELEVENLABS_API_KEY configured"
    fi
    
    if [ -z "$GOOGLE_PLACES_API_KEYS" ] || [ "$GOOGLE_PLACES_API_KEYS" = "your_google_api_key_1,your_google_api_key_2" ]; then
        echo "❌ GOOGLE_PLACES_API_KEYS not set or using default value"
        errors=$((errors + 1))
    else
        echo "✅ GOOGLE_PLACES_API_KEYS configured"
    fi
    
    if [ $errors -gt 0 ]; then
        echo ""
        echo "❌ Please update your .env file with valid API keys"
        echo "📖 See documentation/README.md for information on obtaining API keys"
        exit 1
    else
        echo "✅ All API keys validated"
    fi
}

# Main menu
echo "Select an option:"
echo "1) Validate API keys in .env file"
echo "2) Set up Wrangler secrets from .env file"
echo "3) Both validate and setup"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        validate_keys
        ;;
    2)
        setup_wrangler_secrets
        ;;
    3)
        validate_keys
        setup_wrangler_secrets
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Environment setup complete!"
echo "💡 Next steps:"
echo "   1. Test the Google Places scraper: npm run scrape"
echo "   2. Test the voice interface: wrangler dev"
echo "   3. Deploy to production: npm run deploy"
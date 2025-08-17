#!/bin/bash
# setup-environment.sh - Configure all environment variables and secrets

set -e

echo "🔧 Setting up Architect-GPT Environment Configuration"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[INPUT REQUIRED]${NC} $1"
}

# Create .env.example template
create_env_template() {
    log_info "Creating environment template..."
    
    cat > .env.example << 'EOF'
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CUSTOM_DOMAIN=your-domain.com

# KV Namespace IDs (auto-generated)
FIGMA_CACHE_ID=
RAWGLE_TEMPLATES_ID=
REACT_COMPONENTS_ID=
DEPLOYMENT_ARTIFACTS_ID=

# Figma API
FIGMA_ACCESS_TOKEN=your_figma_personal_access_token

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_ACCESS_TOKEN=your_supabase_access_token

# Rawgle.com API
RAWGLE_API_BASE=https://api.rawgle.com/v1
RAWGLE_API_KEY=your_rawgle_api_key

# Slack Notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
EOF

    log_success "Environment template created (.env.example)"
}

# Interactive setup for required variables
interactive_setup() {
    log_info "Starting interactive environment setup..."
    
    # Check if .env already exists
    if [ -f .env ]; then
        log_warning ".env file already exists. Backing up to .env.backup"
        cp .env .env.backup
    fi
    
    echo "# Auto-generated environment configuration" > .env
    echo "# Generated on: $(date)" >> .env
    echo "" >> .env
    
    # Cloudflare setup
    echo "🔵 Cloudflare Configuration"
    echo "================================"
    
    read -p "Enter your Cloudflare API Token: " CLOUDFLARE_API_TOKEN
    echo "CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN" >> .env
    
    read -p "Enter your Cloudflare Zone ID: " CLOUDFLARE_ZONE_ID
    echo "CLOUDFLARE_ZONE_ID=$CLOUDFLARE_ZONE_ID" >> .env
    
    read -p "Enter your custom domain (e.g., mydomain.com): " CUSTOM_DOMAIN
    echo "CUSTOM_DOMAIN=$CUSTOM_DOMAIN" >> .env
    
    echo "" >> .env
    
    # Figma API setup
    echo "🎨 Figma API Configuration"
    echo "================================"
    echo "Get your Figma Personal Access Token from: https://www.figma.com/developers/api#access-tokens"
    read -p "Enter your Figma Access Token: " FIGMA_ACCESS_TOKEN
    echo "FIGMA_ACCESS_TOKEN=$FIGMA_ACCESS_TOKEN" >> .env
    echo "" >> .env
    
    # OpenAI API setup
    echo "🤖 OpenAI API Configuration"
    echo "================================"
    echo "Get your OpenAI API key from: https://platform.openai.com/api-keys"
    read -p "Enter your OpenAI API Key: " OPENAI_API_KEY
    echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> .env
    echo "" >> .env
    
    # Rawgle setup
    echo "🚀 Rawgle.com Configuration"
    echo "================================"
    echo "Sign up at rawgle.com and get your API key"
    read -p "Enter your Rawgle API Key: " RAWGLE_API_KEY
    echo "RAWGLE_API_BASE=https://api.rawgle.com/v1" >> .env
    echo "RAWGLE_API_KEY=$RAWGLE_API_KEY" >> .env
    echo "" >> .env
    
    log_success "Environment configuration completed!"
}

# Main execution
main() {
    case "${1:-setup}" in
        "setup")
            create_env_template
            interactive_setup
            ;;
        *)
            echo "Usage: $0 [setup]"
            echo "  setup    - Full interactive setup (default)"
            exit 1
            ;;
    esac
}

main "$@"

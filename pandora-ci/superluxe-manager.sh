#!/bin/bash

# ============================================================================
# SUPERLUXE ENVIRONMENT MANAGER
# ============================================================================
# Management utility for SUPERLUXE company infrastructure
# Separate from Pandora/Beyond Pandora/Tenshimatt stack
# Usage: ./superluxe-manager.sh [load|validate|backup|restore|status]
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.superluxe"
BACKUP_DIR="${SCRIPT_DIR}/superluxe-backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[SUPERLUXE]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Load SUPERLUXE environment variables
load_env() {
    log "Loading SUPERLUXE environment variables..."

    if [ ! -f "$ENV_FILE" ]; then
        error "SUPERLUXE environment file not found: $ENV_FILE"
        return 1
    fi

    set -a
    source "$ENV_FILE"
    set +a

    success "SUPERLUXE environment variables loaded from $ENV_FILE"

    log "Key SUPERLUXE variables loaded:"
    echo "  🏢 COMPANY: $COMPANY"
    echo "  🌐 GITHUB_REPO: $GITHUB_REPO"
    echo "  ☁️ CLOUDFLARE: API token configured"
    echo "  🚀 VERCEL: API token configured"
    echo "  📦 DEPLOYMENT_TARGET: $DEPLOYMENT_TARGET"
}

# Validate SUPERLUXE environment
validate_env() {
    log "Validating SUPERLUXE environment configuration..."

    local required_vars=("COMPANY" "CLOUDFLARE_API_TOKEN" "VERCEL_API_TOKEN" "GITHUB_PAT" "GITHUB_REPO")
    local missing_count=0

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required SUPERLUXE variable $var is not set"
            ((missing_count++))
        else
            success "Required variable $var is set"
        fi
    done

    if [ $missing_count -eq 0 ]; then
        success "All required SUPERLUXE variables are configured"
    else
        error "$missing_count required variables are missing"
        return 1
    fi

    # Test API connectivity
    log "Testing SUPERLUXE service connectivity..."

    # Test GitHub API
    if command -v curl &> /dev/null; then
        if curl -s -H "Authorization: token $GITHUB_PAT" "https://api.github.com/repos/SUPERLUXE/tradeart" >/dev/null; then
            success "GitHub API (SUPERLUXE/tradeart) is accessible"
        else
            error "GitHub API is not accessible or repository not found"
        fi

        # Test Vercel API
        if curl -s -H "Authorization: Bearer $VERCEL_API_TOKEN" "https://api.vercel.com/v2/user" >/dev/null; then
            success "Vercel API is accessible"
        else
            error "Vercel API is not accessible"
        fi

        # Test Cloudflare API
        if curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/user/tokens/verify" >/dev/null; then
            success "Cloudflare API is accessible"
        else
            error "Cloudflare API is not accessible"
        fi
    else
        warning "curl not available - skipping connectivity tests"
    fi
}

# Backup SUPERLUXE environment
backup_env() {
    log "Creating SUPERLUXE environment backup..."

    if [ ! -f "$ENV_FILE" ]; then
        error "SUPERLUXE environment file not found: $ENV_FILE"
        return 1
    fi

    mkdir -p "$BACKUP_DIR"

    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/.env.superluxe.${timestamp}.bak"

    cp "$ENV_FILE" "$backup_file"
    chmod 600 "$backup_file"

    success "SUPERLUXE environment backed up to: $backup_file"

    # Backup retention - keep last 10 backups
    log "Backup retention: Keeping last 10 SUPERLUXE backups"
    find "$BACKUP_DIR" -name ".env.superluxe.*.bak" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
}

# Restore SUPERLUXE environment
restore_env() {
    log "Restoring SUPERLUXE environment from backup..."

    if [ ! -d "$BACKUP_DIR" ]; then
        error "SUPERLUXE backup directory not found: $BACKUP_DIR"
        return 1
    fi

    local latest_backup=$(find "$BACKUP_DIR" -name ".env.superluxe.*.bak" -type f | sort -r | head -n 1)

    if [ -z "$latest_backup" ]; then
        error "No SUPERLUXE backup files found"
        return 1
    fi

    log "Latest SUPERLUXE backup: $(basename "$latest_backup")"
    read -p "Restore from this backup? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "$latest_backup" "$ENV_FILE"
        chmod 600 "$ENV_FILE"
        success "SUPERLUXE environment restored from: $latest_backup"
    else
        log "SUPERLUXE restore cancelled"
    fi
}

# Show SUPERLUXE environment status
show_status() {
    log "SUPERLUXE Environment Status Report"
    echo "=========================="

    if [ -f "$ENV_FILE" ]; then
        local mod_date=$(date -r "$ENV_FILE" '+%Y-%m-%d %H:%M:%S')
        local var_count=$(grep -c "^[A-Z]" "$ENV_FILE" 2>/dev/null || echo "0")
        success "SUPERLUXE environment file exists: $ENV_FILE"
        echo "  📅 Last modified: $mod_date"
        echo "  📊 Variables defined: $var_count"

        if [ -d "$BACKUP_DIR" ]; then
            local backup_count=$(find "$BACKUP_DIR" -name ".env.superluxe.*.bak" | wc -l)
            echo "  💾 Backups available: $backup_count"

            local latest_backup=$(find "$BACKUP_DIR" -name ".env.superluxe.*.bak" -type f | sort -r | head -n 1)
            if [ -n "$latest_backup" ]; then
                local backup_name=$(basename "$latest_backup" .bak | sed 's/.env.superluxe.//')
                echo "  📅 Latest backup: $backup_name"
            fi
        fi
    else
        error "SUPERLUXE environment file not found: $ENV_FILE"
    fi

    # Quick connectivity check
    log "Quick SUPERLUXE connectivity check:"
    if command -v curl &> /dev/null && [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
        if curl -s --connect-timeout 5 "https://api.github.com" >/dev/null; then
            success "GitHub API is reachable"
        else
            warning "GitHub API connectivity issue"
        fi
    fi
}

# Main execution
case "${1:-status}" in
    "load")
        load_env
        ;;
    "validate")
        load_env
        validate_env
        ;;
    "backup")
        backup_env
        ;;
    "restore")
        restore_env
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help")
        echo "SUPERLUXE Environment Manager"
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  load      - Load SUPERLUXE environment variables"
        echo "  validate  - Validate SUPERLUXE configuration and test connectivity"
        echo "  backup    - Create SUPERLUXE environment backup"
        echo "  restore   - Restore SUPERLUXE environment from backup"
        echo "  status    - Show SUPERLUXE environment status"
        echo "  help      - Show this help message"
        echo
        echo "Examples:"
        echo "  $0 validate   # Check SUPERLUXE configuration"
        echo "  $0 backup     # Create SUPERLUXE backup"
        echo "  $0 status     # Show SUPERLUXE status"
        ;;
    *)
        error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
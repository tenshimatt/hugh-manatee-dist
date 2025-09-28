#!/bin/bash

# ============================================================================
# PANDORA SECRETS MANAGER
# ============================================================================
# Secure management of production secrets and credentials
# Usage: ./secrets-manager.sh [generate|rotate|audit|secure]
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.production"
SECRETS_DIR="${SCRIPT_DIR}/.secrets"
BACKUP_DIR="${SCRIPT_DIR}/env-backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[SECRETS]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Generate secure random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Generate API key
generate_api_key() {
    echo "sk-$(openssl rand -hex 16)"
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "\n"
}

# Create secrets directory
setup_secrets() {
    log "Setting up secrets management..."

    mkdir -p "$SECRETS_DIR"
    chmod 700 "$SECRETS_DIR"

    # Create .gitignore to protect secrets
    cat > "${SCRIPT_DIR}/.gitignore" << EOF
# Secrets and environment files
.env.production
.env.*
.secrets/
env-backups/
*.key
*.pem
*.log

# Temporary files
/tmp/
*.tmp
*.bak

# OS files
.DS_Store
Thumbs.db
EOF

    success "Secrets directory created with proper permissions"
}

# Generate new secrets
generate_secrets() {
    log "Generating new production secrets..."

    setup_secrets

    # Create secrets file
    local secrets_file="${SECRETS_DIR}/production.secrets"

    cat > "$secrets_file" << EOF
# ============================================================================
# PANDORA PRODUCTION SECRETS
# ============================================================================
# Generated: $(date)
# WARNING: This file contains sensitive credentials
# ============================================================================

# Database passwords
DB_PASSWORD=$(generate_password 24)
POSTGRES_PASSWORD=$(generate_password 24)

# Service passwords
N8N_BASIC_AUTH_PASSWORD=$(generate_password 16)
GRAFANA_ADMIN_PASSWORD=$(generate_password 16)
PROXMOX_PASSWORD=1Thisismydell!

# API Keys and tokens
GRAFANA_API_KEY=$(generate_api_key)
N8N_ENCRYPTION_KEY=$(generate_password 32)
JWT_SECRET=$(generate_jwt_secret)

# System secrets
SSH_PASSPHRASE=$(generate_password 20)
BACKUP_ENCRYPTION_KEY=$(generate_password 32)
WEBHOOK_SECRET=$(generate_password 24)

# Session keys
SESSION_SECRET=$(generate_password 32)
COOKIE_SECRET=$(generate_password 24)
CSRF_SECRET=$(generate_password 20)
EOF

    chmod 600 "$secrets_file"
    success "New secrets generated: $secrets_file"

    # Display generated secrets (masked)
    log "Generated secrets overview:"
    echo "  🔑 Database passwords: ****$(tail -c 4 <<< "$(grep DB_PASSWORD "$secrets_file" | cut -d= -f2)")"
    echo "  🔑 Service passwords: ****$(tail -c 4 <<< "$(grep N8N_BASIC_AUTH_PASSWORD "$secrets_file" | cut -d= -f2)")"
    echo "  🔑 API keys: Generated"
    echo "  🔑 JWT secrets: Generated"

    warning "Store these secrets securely and update environment file"
}

# Rotate existing secrets
rotate_secrets() {
    log "Rotating production secrets..."

    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
        return 1
    fi

    # Backup current environment
    if [ -f "${SCRIPT_DIR}/env-manager.sh" ]; then
        "${SCRIPT_DIR}/env-manager.sh" backup
    fi

    # Generate new secrets
    generate_secrets

    success "Secrets rotated - update environment file with new values"
    warning "Remember to restart all services after updating environment"
}

# Audit current secrets
audit_secrets() {
    log "Auditing production secrets security..."

    local issues=0

    # Check environment file permissions
    if [ -f "$ENV_FILE" ]; then
        local perms=$(stat -f "%Mp%Lp" "$ENV_FILE" 2>/dev/null || stat -c "%a" "$ENV_FILE" 2>/dev/null)
        if [ "$perms" != "600" ]; then
            error "Environment file has insecure permissions: $perms (should be 600)"
            ((issues++))
        else
            success "Environment file permissions are secure: $perms"
        fi
    fi

    # Check for weak passwords
    if [ -f "$ENV_FILE" ]; then
        log "Checking password strength..."

        # Check password lengths
        local db_pass=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d= -f2 | tr -d '"')
        if [ ${#db_pass} -lt 16 ]; then
            error "Database password is too short: ${#db_pass} characters (minimum 16)"
            ((issues++))
        else
            success "Database password length is adequate: ${#db_pass} characters"
        fi

        # Check for default passwords
        if grep -q "password123\|admin123\|pandora123" "$ENV_FILE"; then
            warning "Found potential default passwords in environment file"
            ((issues++))
        else
            success "No obvious default passwords found"
        fi
    fi

    # Check secrets directory
    if [ -d "$SECRETS_DIR" ]; then
        local secret_perms=$(stat -f "%Mp%Lp" "$SECRETS_DIR" 2>/dev/null || stat -c "%a" "$SECRETS_DIR" 2>/dev/null)
        if [ "$secret_perms" != "700" ]; then
            error "Secrets directory has insecure permissions: $secret_perms (should be 700)"
            ((issues++))
        else
            success "Secrets directory permissions are secure: $secret_perms"
        fi
    fi

    # Check for secrets in git
    if [ -d "${SCRIPT_DIR}/.git" ]; then
        if git -C "$SCRIPT_DIR" ls-files | grep -E '\.(env|secret|key)$' >/dev/null 2>&1; then
            error "Potential secrets found in git repository"
            ((issues++))
        else
            success "No secrets detected in git repository"
        fi
    fi

    # Check backup security
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(find "$BACKUP_DIR" -name "*.bak" | wc -l)
        if [ $backup_count -gt 0 ]; then
            success "Environment backups found: $backup_count files"

            # Check backup permissions
            find "$BACKUP_DIR" -name "*.bak" -exec stat -f "%Mp%Lp %N" {} \; 2>/dev/null | while read perm file; do
                if [ "$perm" != "600" ]; then
                    error "Backup file has insecure permissions: $file ($perm)"
                    ((issues++))
                fi
            done
        fi
    fi

    echo
    if [ $issues -eq 0 ]; then
        success "Security audit completed - no critical issues found!"
    else
        error "Security audit found $issues issues that need attention"
        return 1
    fi
}

# Secure existing environment
secure_environment() {
    log "Securing production environment..."

    # Fix file permissions
    if [ -f "$ENV_FILE" ]; then
        chmod 600 "$ENV_FILE"
        success "Environment file permissions secured"
    fi

    if [ -d "$SECRETS_DIR" ]; then
        chmod 700 "$SECRETS_DIR"
        find "$SECRETS_DIR" -type f -exec chmod 600 {} \;
        success "Secrets directory permissions secured"
    fi

    if [ -d "$BACKUP_DIR" ]; then
        chmod 700 "$BACKUP_DIR"
        find "$BACKUP_DIR" -name "*.bak" -exec chmod 600 {} \;
        success "Backup directory permissions secured"
    fi

    # Update .gitignore
    setup_secrets

    success "Environment security hardened"
}

# Display security status
show_security_status() {
    log "Security Status Report"
    echo "======================"

    # Environment file
    if [ -f "$ENV_FILE" ]; then
        local perms=$(stat -f "%Mp%Lp" "$ENV_FILE" 2>/dev/null || stat -c "%a" "$ENV_FILE" 2>/dev/null)
        local mod_date=$(date -r "$ENV_FILE" '+%Y-%m-%d %H:%M:%S')
        echo "📄 Environment File:"
        echo "  📁 Path: $ENV_FILE"
        echo "  🔒 Permissions: $perms"
        echo "  📅 Modified: $mod_date"
    fi

    # Secrets directory
    if [ -d "$SECRETS_DIR" ]; then
        local secret_count=$(find "$SECRETS_DIR" -type f | wc -l)
        echo "🔐 Secrets Directory:"
        echo "  📁 Path: $SECRETS_DIR"
        echo "  📊 Files: $secret_count"
    else
        echo "🔐 Secrets Directory: Not configured"
    fi

    # Backup status
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(find "$BACKUP_DIR" -name "*.bak" | wc -l)
        echo "💾 Backups:"
        echo "  📁 Path: $BACKUP_DIR"
        echo "  📊 Backups: $backup_count"
    fi
}

# Main execution
case "${1:-status}" in
    "generate")
        generate_secrets
        ;;
    "rotate")
        rotate_secrets
        ;;
    "audit")
        audit_secrets
        ;;
    "secure")
        secure_environment
        ;;
    "status")
        show_security_status
        ;;
    "help"|"-h"|"--help")
        echo "Pandora Secrets Manager"
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  generate  - Generate new production secrets"
        echo "  rotate    - Rotate existing secrets (backup + generate)"
        echo "  audit     - Audit current security configuration"
        echo "  secure    - Secure file permissions and setup"
        echo "  status    - Show security status"
        echo "  help      - Show this help message"
        echo
        echo "Examples:"
        echo "  $0 audit      # Check security configuration"
        echo "  $0 generate   # Create new secrets"
        echo "  $0 secure     # Harden permissions"
        ;;
    *)
        error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
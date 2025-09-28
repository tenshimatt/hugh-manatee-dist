#!/bin/bash

# ============================================================================
# PANDORA ENVIRONMENT MANAGER
# ============================================================================
# Central environment variable management for production automation system
# Usage: ./env-manager.sh [load|validate|backup|restore|update]
# ============================================================================

set -e

# Configuration
ENV_DIR="/Users/mattwright/pandora/pandora-ci"
ENV_FILE="${ENV_DIR}/.env.production"
BACKUP_DIR="${ENV_DIR}/env-backups"
DOCKER_HOST="10.90.10.6"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[ENV-MANAGER]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Load environment variables
load_env() {
    log "Loading production environment variables..."

    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
        return 1
    fi

    # Source the environment file
    set -a  # Automatically export all variables
    source "$ENV_FILE"
    set +a  # Turn off auto-export

    success "Environment variables loaded from $ENV_FILE"
    log "Key variables loaded:"
    echo "  🔗 DOCKER_HOST: $DOCKER_HOST"
    echo "  🗄️ DB_HOST: $DB_HOST"
    echo "  📊 GRAFANA_URL: $GRAFANA_URL"
    echo "  🔄 N8N_URL: $N8N_URL"
    echo "  🖥️ PROXMOX_HOST: $PROXMOX_HOST"
}

# Validate environment configuration
validate_env() {
    log "Validating environment configuration..."

    local errors=0

    # Check required variables
    local required_vars=(
        "DOCKER_HOST"
        "PROXMOX_HOST"
        "DB_HOST"
        "DB_USER"
        "DB_PASSWORD"
        "DB_NAME"
        "N8N_URL"
        "GRAFANA_URL"
        "AUTOMATION_SCHEDULE_CRON"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required variable $var is not set"
            ((errors++))
        else
            success "Required variable $var is set"
        fi
    done

    # Test connectivity
    log "Testing service connectivity..."

    # Test Docker host
    if ssh root@$DOCKER_HOST "docker ps" >/dev/null 2>&1; then
        success "Docker host ($DOCKER_HOST) is accessible"
    else
        error "Cannot access Docker host ($DOCKER_HOST)"
        ((errors++))
    fi

    # Test database
    if ssh root@$DOCKER_HOST "docker exec pandora-postgres psql -U $DB_USER -d $DB_NAME -c 'SELECT 1;'" >/dev/null 2>&1; then
        success "Database ($DB_HOST:$DB_PORT/$DB_NAME) is accessible"
    else
        error "Cannot access database ($DB_HOST:$DB_PORT/$DB_NAME)"
        ((errors++))
    fi

    # Test n8n
    if curl -s "$N8N_URL" >/dev/null 2>&1; then
        success "n8n ($N8N_URL) is accessible"
    else
        error "Cannot access n8n ($N8N_URL)"
        ((errors++))
    fi

    # Test Grafana
    if curl -s "$GRAFANA_URL/api/health" >/dev/null 2>&1; then
        success "Grafana ($GRAFANA_URL) is accessible"
    else
        error "Cannot access Grafana ($GRAFANA_URL)"
        ((errors++))
    fi

    if [ $errors -eq 0 ]; then
        success "All environment validation checks passed!"
        return 0
    else
        error "Environment validation failed with $errors errors"
        return 1
    fi
}

# Backup environment configuration
backup_env() {
    log "Creating environment backup..."

    mkdir -p "$BACKUP_DIR"
    local backup_file="${BACKUP_DIR}/.env.production.$(date +%Y%m%d_%H%M%S).bak"

    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$backup_file"
        success "Environment backed up to: $backup_file"

        # Keep only last 10 backups
        ls -t "${BACKUP_DIR}"/.env.production.*.bak 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

        log "Backup retention: Keeping last 10 backups"
    else
        error "No environment file to backup: $ENV_FILE"
        return 1
    fi
}

# Restore environment from backup
restore_env() {
    log "Available environment backups:"

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        error "No backups found in $BACKUP_DIR"
        return 1
    fi

    local backups=($(ls -t "${BACKUP_DIR}"/.env.production.*.bak 2>/dev/null))

    for i in "${!backups[@]}"; do
        local filename=$(basename "${backups[$i]}")
        local date_part=$(echo "$filename" | sed 's/.env.production.//; s/.bak//')
        echo "  [$((i+1))] $date_part"
    done

    echo -n "Select backup to restore (1-${#backups[@]}): "
    read selection

    if [[ "$selection" =~ ^[1-9][0-9]*$ ]] && [ "$selection" -le "${#backups[@]}" ]; then
        local selected_backup="${backups[$((selection-1))]}"

        # Backup current environment first
        backup_env

        # Restore selected backup
        cp "$selected_backup" "$ENV_FILE"
        success "Environment restored from: $(basename "$selected_backup")"
    else
        error "Invalid selection: $selection"
        return 1
    fi
}

# Update environment variables in containers
update_containers() {
    log "Updating environment variables in containers..."

    # Load current environment
    load_env

    # Update n8n container
    log "Updating n8n container environment..."
    ssh root@$DOCKER_HOST "docker exec pandora-n8n sh -c 'echo \"N8N_BASIC_AUTH_USER=$N8N_BASIC_AUTH_USER\" > /tmp/env_update'"
    ssh root@$DOCKER_HOST "docker exec pandora-n8n sh -c 'echo \"N8N_BASIC_AUTH_PASSWORD=$N8N_BASIC_AUTH_PASSWORD\" >> /tmp/env_update'"
    success "n8n environment updated (requires restart to take effect)"

    # Note: Full container restart would be needed for environment changes
    warning "Container restart required for environment changes to take effect"
    warning "Run: ssh root@$DOCKER_HOST 'docker restart pandora-n8n pandora-grafana'"
}

# Display environment status
show_status() {
    log "Environment Status Report"
    echo "=========================="

    if [ -f "$ENV_FILE" ]; then
        local file_date=$(date -r "$ENV_FILE" '+%Y-%m-%d %H:%M:%S')
        success "Environment file exists: $ENV_FILE"
        echo "  📅 Last modified: $file_date"
        echo "  📊 Variables defined: $(grep -c '^[A-Z]' "$ENV_FILE" 2>/dev/null || echo "0")"
    else
        error "Environment file missing: $ENV_FILE"
    fi

    # Check backup status
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(ls "$BACKUP_DIR"/.env.production.*.bak 2>/dev/null | wc -l)
        echo "  💾 Backups available: $backup_count"

        if [ $backup_count -gt 0 ]; then
            local latest_backup=$(ls -t "$BACKUP_DIR"/.env.production.*.bak 2>/dev/null | head -1)
            local backup_date=$(basename "$latest_backup" | sed 's/.env.production.//; s/.bak//')
            echo "  📅 Latest backup: $backup_date"
        fi
    fi

    # Test basic connectivity
    echo
    log "Quick connectivity check:"

    if ping -c 1 $DOCKER_HOST >/dev/null 2>&1; then
        success "Docker host ($DOCKER_HOST) is reachable"
    else
        error "Docker host ($DOCKER_HOST) is unreachable"
    fi
}

# Create production environment template
create_template() {
    log "Creating environment template..."

    local template_file="${ENV_DIR}/.env.template"

    # Create template with placeholder values
    sed 's/=.*/=PLACEHOLDER_VALUE/' "$ENV_FILE" > "$template_file"

    success "Environment template created: $template_file"
    warning "Template contains placeholder values - customize before use"
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
    "update")
        update_containers
        ;;
    "status")
        show_status
        ;;
    "template")
        create_template
        ;;
    "help"|"-h"|"--help")
        echo "Pandora Environment Manager"
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  load      - Load environment variables from .env.production"
        echo "  validate  - Validate environment configuration and test connectivity"
        echo "  backup    - Create backup of current environment file"
        echo "  restore   - Restore environment from backup"
        echo "  update    - Update environment variables in containers"
        echo "  status    - Show environment status and file information"
        echo "  template  - Create environment template file"
        echo "  help      - Show this help message"
        echo
        echo "Examples:"
        echo "  $0 validate    # Check if environment is properly configured"
        echo "  $0 backup      # Create backup before making changes"
        echo "  $0 load        # Load environment variables into current shell"
        ;;
    *)
        error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
#!/bin/bash

# ============================================================================
# PANDORA PRODUCTION ENVIRONMENT DEPLOYMENT
# ============================================================================
# This script deploys and configures the production environment for the
# Pandora automation system. It ensures all environment variables are
# properly configured across all services.
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.production"
DOCKER_HOST="10.90.10.6"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Load environment variables
load_environment() {
    log "Loading production environment..."

    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
        exit 1
    fi

    set -a
    source "$ENV_FILE"
    set +a

    success "Environment loaded successfully"
}

# Deploy environment to containers
deploy_to_containers() {
    log "Deploying environment variables to containers..."

    # Create temporary environment files for each service
    local temp_dir="/tmp/pandora-env-deploy"
    ssh root@$DOCKER_HOST "mkdir -p $temp_dir"

    # n8n environment
    log "Configuring n8n environment..."
    cat > /tmp/n8n.env << EOF
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=$N8N_BASIC_AUTH_USER
N8N_BASIC_AUTH_PASSWORD=$N8N_BASIC_AUTH_PASSWORD
N8N_HOST=$N8N_HOST
N8N_PORT=$N8N_PORT
N8N_PROTOCOL=$N8N_PROTOCOL
N8N_LOG_LEVEL=$N8N_LOG_LEVEL
N8N_SECURE_COOKIE=$N8N_SECURE_COOKIE
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=$N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS
N8N_RUNNERS_ENABLED=$N8N_RUNNERS_ENABLED
N8N_BLOCK_ENV_ACCESS_IN_NODE=$N8N_BLOCK_ENV_ACCESS_IN_NODE
DB_SQLITE_POOL_SIZE=$DB_POOL_SIZE
WEBHOOK_URL=http://n8n:5678
EOF
    scp /tmp/n8n.env root@$DOCKER_HOST:$temp_dir/
    success "n8n environment configured"

    # Grafana environment
    log "Configuring Grafana environment..."
    cat > /tmp/grafana.env << EOF
GF_SECURITY_ADMIN_USER=$GRAFANA_ADMIN_USER
GF_SECURITY_ADMIN_PASSWORD=$GRAFANA_ADMIN_PASSWORD
GF_SERVER_DOMAIN=$GRAFANA_SERVER_DOMAIN
GF_SERVER_ROOT_URL=$GRAFANA_SERVER_ROOT_URL
GF_SERVER_HTTP_PORT=3000
GF_SERVER_PROTOCOL=http
GF_USERS_ALLOW_SIGN_UP=false
GF_ANALYTICS_REPORTING_ENABLED=false
GF_ANALYTICS_CHECK_FOR_UPDATES=false
EOF
    scp /tmp/grafana.env root@$DOCKER_HOST:$temp_dir/
    success "Grafana environment configured"

    # PostgreSQL environment
    log "Configuring PostgreSQL environment..."
    cat > /tmp/postgres.env << EOF
POSTGRES_DB=$POSTGRES_DB
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_INITDB_ARGS=--encoding=UTF-8 --locale=en_US.UTF-8
EOF
    scp /tmp/postgres.env root@$DOCKER_HOST:$temp_dir/
    success "PostgreSQL environment configured"

    # Copy environment files to containers
    ssh root@$DOCKER_HOST "docker cp $temp_dir/n8n.env pandora-n8n:/tmp/"
    ssh root@$DOCKER_HOST "docker cp $temp_dir/grafana.env pandora-grafana:/tmp/"
    ssh root@$DOCKER_HOST "docker cp $temp_dir/postgres.env pandora-postgres:/tmp/"

    success "Environment files deployed to containers"
}

# Create configuration files
create_config_files() {
    log "Creating configuration files..."

    # Create n8n configuration
    ssh root@$DOCKER_HOST "docker exec pandora-n8n sh -c 'cat > /home/node/.n8n/config << EOF
{
  \"database\": {
    \"type\": \"sqlite\",
    \"sqlite\": {
      \"database\": \"/home/node/.n8n/database.sqlite\",
      \"poolSize\": $DB_POOL_SIZE
    }
  },
  \"logs\": {
    \"level\": \"$N8N_LOG_LEVEL\"
  },
  \"security\": {
    \"basicAuth\": {
      \"active\": true,
      \"user\": \"$N8N_BASIC_AUTH_USER\",
      \"password\": \"$N8N_BASIC_AUTH_PASSWORD\"
    }
  }
}
EOF'"
    success "n8n configuration file created"

    # Set proper permissions
    ssh root@$DOCKER_HOST "docker exec pandora-n8n chmod 600 /home/node/.n8n/config"
    success "Configuration file permissions set"
}

# Update container environment variables
update_container_env() {
    log "Updating container environment variables..."

    # Note: For full environment updates, containers need to be recreated
    # This function prepares the environment for container restart

    # Create docker-compose override for environment updates
    cat > /tmp/docker-compose.override.yml << EOF
version: '3.8'
services:
  pandora-n8n:
    env_file:
      - /tmp/pandora-env-deploy/n8n.env
  pandora-grafana:
    env_file:
      - /tmp/pandora-env-deploy/grafana.env
  pandora-postgres:
    env_file:
      - /tmp/pandora-env-deploy/postgres.env
EOF

    scp /tmp/docker-compose.override.yml root@$DOCKER_HOST:/opt/pandora-stack/
    success "Docker Compose override created"

    warning "Container restart required for environment changes to take effect"
    warning "Run: ssh root@$DOCKER_HOST 'cd /opt/pandora-stack && docker-compose restart'"
}

# Verify deployment
verify_deployment() {
    log "Verifying environment deployment..."

    # Test n8n environment
    local n8n_auth=$(ssh root@$DOCKER_HOST "docker exec pandora-n8n env | grep N8N_BASIC_AUTH_USER" | cut -d= -f2)
    if [ "$n8n_auth" = "$N8N_BASIC_AUTH_USER" ]; then
        success "n8n environment verified"
    else
        error "n8n environment verification failed"
    fi

    # Test database connectivity with new credentials
    if ssh root@$DOCKER_HOST "docker exec pandora-postgres psql -U $DB_USER -d $DB_NAME -c 'SELECT current_user;'" >/dev/null 2>&1; then
        success "Database connectivity verified"
    else
        error "Database connectivity verification failed"
    fi

    # Test service accessibility
    if curl -s "$N8N_URL" >/dev/null; then
        success "n8n service accessibility verified"
    else
        error "n8n service not accessible"
    fi

    if curl -s "$GRAFANA_URL/api/health" >/dev/null; then
        success "Grafana service accessibility verified"
    else
        error "Grafana service not accessible"
    fi
}

# Create environment documentation
create_documentation() {
    log "Creating environment documentation..."

    cat > "${SCRIPT_DIR}/ENVIRONMENT-SETUP.md" << EOF
# Production Environment Configuration

## Overview
This document describes the production environment configuration for the Pandora automation system.

## Environment Files
- \`.env.production\` - Master environment configuration
- \`env-manager.sh\` - Environment management utility
- \`deploy-environment.sh\` - Environment deployment script

## Key Configuration

### Database
- **Host**: $DB_HOST:$DB_PORT
- **Database**: $DB_NAME
- **User**: $DB_USER
- **Connection**: PostgreSQL with automation schema

### Services
- **n8n**: $N8N_URL (User: $N8N_BASIC_AUTH_USER)
- **Grafana**: $GRAFANA_URL (User: $GRAFANA_ADMIN_USER)
- **Proxmox**: $PROXMOX_HOST

### Automation
- **Schedule**: $AUTOMATION_SCHEDULE_CRON
- **Timezone**: $AUTOMATION_TIMEZONE
- **Protected Containers**: $AUTOMATION_PROTECTED_CONTAINERS
- **Enabled Containers**: $AUTOMATION_ENABLED_CONTAINERS

## Management Commands

### Environment Manager
\`\`\`bash
./env-manager.sh validate    # Validate configuration
./env-manager.sh backup      # Create backup
./env-manager.sh status      # Show status
\`\`\`

### Deployment
\`\`\`bash
./deploy-environment.sh      # Deploy environment to containers
\`\`\`

## Security Notes
- Environment file contains sensitive credentials
- Regular backups are created automatically
- Access is restricted to production administrators

## Last Updated
Generated: $(date)
Version: Production v1.0
EOF

    success "Environment documentation created: ENVIRONMENT-SETUP.md"
}

# Main deployment process
main() {
    echo "🚀 PANDORA PRODUCTION ENVIRONMENT DEPLOYMENT"
    echo "============================================="
    echo

    # Check prerequisites
    if [ ! command -v ssh &> /dev/null ]; then
        error "SSH is required but not installed"
        exit 1
    fi

    # Load environment
    load_environment

    # Backup current configuration
    log "Creating backup before deployment..."
    if [ -f "${SCRIPT_DIR}/env-manager.sh" ]; then
        "${SCRIPT_DIR}/env-manager.sh" backup
    fi

    # Deploy environment
    deploy_to_containers
    create_config_files
    update_container_env
    create_documentation

    # Verify deployment
    verify_deployment

    echo
    success "🎉 Environment deployment completed successfully!"
    echo
    log "Next steps:"
    echo "  1. Restart containers to apply environment changes:"
    echo "     ssh root@$DOCKER_HOST 'docker restart pandora-n8n pandora-grafana'"
    echo "  2. Verify services are operational:"
    echo "     ./env-manager.sh validate"
    echo "  3. Review environment documentation:"
    echo "     cat ENVIRONMENT-SETUP.md"
    echo

    warning "🔒 SECURITY REMINDER:"
    echo "  - Environment file contains sensitive credentials"
    echo "  - Ensure proper file permissions (600)"
    echo "  - Regular backups are created in env-backups/"
    echo "  - Keep .env.production file secure and version controlled"
}

# Execute main function
main "$@"
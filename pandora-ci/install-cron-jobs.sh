#!/bin/bash

# ============================================================================
# PANDORA CONTINUOUS AI CRON JOBS INSTALLER
# ============================================================================
# Installs scheduled jobs for Continuous AI pipeline monitoring
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[CRON-INSTALL]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

log "Installing Pandora Continuous AI cron jobs..."

# Create cron jobs
CRON_JOBS="
# Pandora Continuous AI Monitoring
# Spec monitoring every 5 minutes
*/5 * * * * cd $SCRIPT_DIR && node spec-validation-engine.js process >> /tmp/pandora-spec-monitor.log 2>&1

# Environment validation every hour
0 * * * * cd $SCRIPT_DIR && ./env-manager.sh validate >> /tmp/pandora-env-check.log 2>&1

# Security audit every 6 hours
0 */6 * * * cd $SCRIPT_DIR && ./secrets-manager.sh audit >> /tmp/pandora-security-audit.log 2>&1

# Daily full system validation (3 AM)
0 3 * * * cd $SCRIPT_DIR && ./env-manager.sh validate && node spec-validation-engine.js process >> /tmp/pandora-daily-validation.log 2>&1

# Weekly backup cleanup (Sunday 2 AM)
0 2 * * 0 find $SCRIPT_DIR/env-backups -name '*.bak' -mtime +30 -delete && find $SCRIPT_DIR/superluxe-backups -name '*.bak' -mtime +30 -delete

# AI agent health check (every 2 hours)
0 */2 * * * curl -s http://10.90.10.6:5678/api/v1/workflows/continuous-ai-pipeline > /tmp/n8n-health.log 2>&1
"

# Install cron jobs
echo "$CRON_JOBS" | crontab -

success "Cron jobs installed successfully"

# Display installed jobs
log "Installed cron jobs:"
crontab -l | grep -A 20 "Pandora Continuous AI"

# Create log directory if needed
mkdir -p /tmp/pandora-logs
chmod 755 /tmp/pandora-logs

success "Continuous AI monitoring is now scheduled"
warning "Logs will be written to /tmp/pandora-*.log files"
#!/bin/bash

# TDD Pipeline - Install Actual Cron Job
# This script installs the 30-minute test automation cron job

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER=${1:-$(whoami)}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Installing TDD Automation Cron Job${NC}"
echo "Project Root: $PROJECT_ROOT"
echo "User: $USER"

# Create necessary directories
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/reports" 
mkdir -p "$PROJECT_ROOT/coverage"

# Make sure scripts are executable
chmod +x "$PROJECT_ROOT/scripts/test-automation.sh"

# Create environment file for cron
cat > "$PROJECT_ROOT/scripts/cron-env.sh" << EOF
#!/bin/bash
# Environment setup for cron jobs

# Change to project directory
cd "$PROJECT_ROOT"

# Export PATH to include node and npm
export PATH="/usr/local/bin:/usr/bin:/bin:\$PATH"
export NODE_ENV="test"

# Export Archon integration variables
export ARCHON_TASK_ID="a6f60267-ebed-4018-a1ae-c4a7fa59ccc7"
export ARCHON_PROJECT_ID="12b025a5-f1ee-4901-98c1-b088e35d91de"

# Source any additional environment files
if [ -f ".env.test" ]; then
  source .env.test
fi
EOF

chmod +x "$PROJECT_ROOT/scripts/cron-env.sh"

# Create the actual cron job command
CRON_COMMAND="*/30 * * * * cd $PROJECT_ROOT && source scripts/cron-env.sh && ./scripts/test-automation.sh --coverage >> logs/cron.log 2>&1"

echo -e "${BLUE}Installing cron job:${NC}"
echo "$CRON_COMMAND"

# Backup existing crontab
echo -e "${BLUE}Backing up existing crontab...${NC}"
crontab -l > "$PROJECT_ROOT/crontab.backup" 2>/dev/null || echo "# No existing crontab" > "$PROJECT_ROOT/crontab.backup"

# Check if our job already exists
if crontab -l 2>/dev/null | grep -q "test-automation.sh"; then
    echo -e "${YELLOW}TDD automation cron job already exists. Updating...${NC}"
    # Remove existing job and add new one
    (crontab -l 2>/dev/null | grep -v "test-automation.sh"; echo "$CRON_COMMAND") | crontab -
else
    echo -e "${BLUE}Adding new TDD automation cron job...${NC}"
    # Add new job to existing crontab
    (crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -
fi

# Verify installation
echo -e "${BLUE}Verifying cron job installation...${NC}"
if crontab -l | grep -q "test-automation.sh"; then
    echo -e "${GREEN}✅ Cron job installed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to install cron job${NC}"
    exit 1
fi

# Test the environment
echo -e "${BLUE}Testing automation script...${NC}"
cd "$PROJECT_ROOT"
timeout 30 ./scripts/test-automation.sh --report-only || echo -e "${YELLOW}Test completed (this is normal for initial setup)${NC}"

# Display current crontab
echo -e "${BLUE}Current cron jobs:${NC}"
crontab -l | grep -v "^#" || echo "No cron jobs found"

echo
echo -e "${GREEN}🎉 TDD Automation Cron Job Installed Successfully!${NC}"
echo
echo "Cron Schedule: Every 30 minutes"
echo "Command: $CRON_COMMAND"
echo "Logs: $PROJECT_ROOT/logs/cron.log"
echo "Reports: $PROJECT_ROOT/reports/"
echo
echo "To monitor: tail -f logs/cron.log"
echo "To remove: crontab -e (delete the test-automation.sh line)"
echo "To restore backup: crontab $PROJECT_ROOT/crontab.backup"
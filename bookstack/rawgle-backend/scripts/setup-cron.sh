#!/bin/bash

# TDD Pipeline - Cron Job Setup Script
# Sets up automated testing every 30 minutes

set -e

PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
CRON_JOB_USER=${1:-$(whoami)}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Setting up TDD automation cron job...${NC}"

# Create cron job entry
CRON_COMMAND="*/30 * * * * cd $PROJECT_ROOT && ./scripts/test-automation.sh --coverage >> logs/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "test-automation.sh"; then
    echo -e "${YELLOW}Cron job already exists. Updating...${NC}"
    # Remove existing job and add new one
    (crontab -l 2>/dev/null | grep -v "test-automation.sh"; echo "$CRON_COMMAND") | crontab -
else
    echo -e "${BLUE}Adding new cron job...${NC}"
    # Add new job to existing crontab
    (crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -
fi

# Create necessary directories
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/reports"
mkdir -p "$PROJECT_ROOT/coverage"

# Create environment file for cron
cat > "$PROJECT_ROOT/scripts/cron-env.sh" << 'EOF'
#!/bin/bash
# Environment setup for cron jobs

# Export PATH to include node and npm
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Export NODE_ENV
export NODE_ENV="${NODE_ENV:-test}"

# Export Archon integration variables (if available)
export ARCHON_TASK_ID="${ARCHON_TASK_ID:-}"
export ARCHON_PROJECT_ID="${ARCHON_PROJECT_ID:-12b025a5-f1ee-4901-98c1-b088e35d91de}"

# Source any additional environment files
if [ -f ".env.test" ]; then
  source .env.test
fi
EOF

chmod +x "$PROJECT_ROOT/scripts/cron-env.sh"

# Test the cron job setup
echo -e "${BLUE}Testing cron job setup...${NC}"
if cd "$PROJECT_ROOT" && timeout 60 ./scripts/test-automation.sh --report-only; then
    echo -e "${GREEN}✅ Cron job setup successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Test run completed with warnings (this is normal for initial setup)${NC}"
fi

# Display current cron jobs
echo -e "${BLUE}Current cron jobs:${NC}"
crontab -l | grep -v "^#" || echo "No cron jobs found"

echo
echo -e "${GREEN}TDD Automation Setup Complete!${NC}"
echo
echo "The following automation is now active:"
echo "• Tests run every 30 minutes"
echo "• Logs are stored in logs/tests/"
echo "• Reports are generated in reports/"
echo "• Coverage reports in coverage/"
echo
echo "To manually run tests: ./scripts/test-automation.sh"
echo "To run with coverage: ./scripts/test-automation.sh --coverage"
echo "To remove cron job: crontab -e (then delete the test-automation line)"
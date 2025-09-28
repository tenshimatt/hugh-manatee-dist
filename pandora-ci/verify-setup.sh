#!/bin/bash
#
# PANDORA-CI Pre-flight Verification Script
# Run this before starting to ensure everything is configured correctly
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "   PANDORA-CI Pre-flight Check"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to check requirement
check() {
    if eval "$2"; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

warn() {
    if eval "$2"; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $1 (warning)"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo "System Requirements:"
echo "-------------------"
check "Ubuntu 24.04 detected" "grep -q 'Ubuntu 24' /etc/os-release 2>/dev/null"
check "Running as root" "[ $EUID -eq 0 ]"
check "Minimum 32GB RAM" "[ $(free -g | awk '/^Mem:/{print $2}') -ge 30 ]"
check "Minimum 500GB storage" "[ $(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//') -ge 400 ]"
check "Docker installed" "command -v docker >/dev/null 2>&1"
check "Docker Compose installed" "docker compose version >/dev/null 2>&1"
check "Node.js installed" "command -v node >/dev/null 2>&1"
check "npm installed" "command -v npm >/dev/null 2>&1"
check "Python 3 installed" "command -v python3 >/dev/null 2>&1"
check "Git installed" "command -v git >/dev/null 2>&1"
check "Ollama installed" "command -v ollama >/dev/null 2>&1"

echo ""
echo "Configuration Files:"
echo "-------------------"
check "Installation directory exists" "[ -d /opt/pandora-ci ]"
check "Docker Compose file exists" "[ -f /opt/pandora-ci/docker-compose.yml ]"
check "Scripts directory exists" "[ -d /opt/pandora-ci/scripts ]"
check "Config directory exists" "[ -d /opt/pandora-ci/config ]"
warn "Environment file configured" "[ -f /opt/pandora-ci/.env ]"

echo ""
echo "API Keys (from .env):"
echo "--------------------"
if [ -f /opt/pandora-ci/.env ]; then
    source /opt/pandora-ci/.env
    warn "Anthropic API key set" "[ ! -z '$ANTHROPIC_API_KEY' ] && [ '$ANTHROPIC_API_KEY' != 'sk-ant-api03-YOUR-KEY-HERE' ]"
    warn "GitLab PAT set" "[ ! -z '$GITLAB_PAT' ] && [ '$GITLAB_PAT' != 'glpat-YOUR-TOKEN-HERE' ]"
    warn "GitHub PAT set" "[ ! -z '$GITHUB_PAT' ] && [ '$GITHUB_PAT' != 'ghp-YOUR-TOKEN-HERE' ]"
else
    echo -e "${YELLOW}⚠${NC} No .env file found - copy from .env.template"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "AI Models:"
echo "---------"
if command -v ollama >/dev/null 2>&1; then
    warn "Qwen 2.5 Coder model" "ollama list 2>/dev/null | grep -q 'qwen2.5-coder'"
    warn "CodeLlama model" "ollama list 2>/dev/null | grep -q 'codellama'"
    warn "DeepSeek Coder model" "ollama list 2>/dev/null | grep -q 'deepseek-coder'"
fi

echo ""
echo "Network Ports:"
echo "-------------"
check "Port 3000 available (GitLab)" "! netstat -tln | grep -q ':3000 '"
check "Port 3001 available (Jenkins)" "! netstat -tln | grep -q ':3001 '"
check "Port 3002 available (OpenProject)" "! netstat -tln | grep -q ':3002 '"
check "Port 3003 available (Backstage)" "! netstat -tln | grep -q ':3003 '"
check "Port 3004 available (SonarQube)" "! netstat -tln | grep -q ':3004 '"
check "Port 3005 available (Grafana)" "! netstat -tln | grep -q ':3005 '"
check "Port 3006 available (Prometheus)" "! netstat -tln | grep -q ':3006 '"

echo ""
echo "Repository:"
echo "----------"
warn "Repository cloned" "[ -d /opt/pandora-ci/repos/main/.git ]"
if [ -d /opt/pandora-ci/repos/main ]; then
    cd /opt/pandora-ci/repos/main
    warn "package.json exists" "[ -f package.json ]"
    warn "Test script defined" "grep -q '\"test\"' package.json 2>/dev/null"
fi

echo ""
echo "Docker Services:"
echo "---------------"
if [ -f /opt/pandora-ci/docker-compose.yml ]; then
    cd /opt/pandora-ci
    RUNNING=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l)
    TOTAL=$(docker compose config --services 2>/dev/null | wc -l)
    if [ $RUNNING -gt 0 ]; then
        echo -e "${GREEN}✓${NC} $RUNNING/$TOTAL services running"
    else
        echo -e "${YELLOW}⚠${NC} No services running yet"
    fi
fi

echo ""
echo "======================================"
echo "           Summary"
echo "======================================"

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed! System ready to start.${NC}"
        echo ""
        echo "Start with:"
        echo "  cd /opt/pandora-ci"
        echo "  docker compose up -d"
        echo "  systemctl start pandora-ai-developer.service"
    else
        echo -e "${YELLOW}⚠ $WARNINGS warnings found.${NC}"
        echo ""
        echo "System can start but some features may not work."
        echo "Review warnings above and:"
        echo "1. Configure /opt/pandora-ci/.env with API keys"
        echo "2. Clone your repository to /opt/pandora-ci/repos/main"
        echo "3. Pull AI models with: ollama pull qwen2.5-coder:32b-instruct"
    fi
else
    echo -e "${RED}❌ $ERRORS errors found. Please fix before starting.${NC}"
    echo ""
    echo "Run the installation script first:"
    echo "  cd /opt/pandora-ci"
    echo "  sudo ./install-pandora-ci.sh"
fi

echo ""
echo "For detailed setup, see: /opt/pandora-ci/PANDORA-CI.MD"
echo "======================================"

exit $ERRORS

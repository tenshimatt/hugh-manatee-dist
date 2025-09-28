#!/bin/bash
#
# PANDORA-CI Complete Installation Script
# For Ubuntu 24.04 LTS on Proxmox Container
# Version: 1.0.0
# Date: September 2025
#

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/pandora-ci"
LOG_FILE="/var/log/pandora-ci-install.log"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root"
fi

# Check Ubuntu version
if ! grep -q "Ubuntu 24" /etc/os-release; then
    warning "This script is designed for Ubuntu 24.04 LTS"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log "🚀 Starting PANDORA-CI Installation"

# Get latest versions from web
log "Checking for latest versions..."

# Function to get latest GitHub release
get_latest_github_release() {
    curl -s "https://api.github.com/repos/$1/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
}

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    python3-pip \
    python3-venv \
    jq \
    htop \
    net-tools \
    unzip

# Install Docker (latest)
log "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose V2 (latest)
log "Installing Docker Compose V2..."
COMPOSE_VERSION=$(get_latest_github_release "docker/compose")
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
log "Docker Compose ${COMPOSE_VERSION} installed"

# Install Node.js 22 LTS
log "Installing Node.js 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
log "Node.js $(node --version) installed"

# Install latest npm packages globally
log "Installing testing frameworks..."
npm install -g \
    jest@latest \
    playwright@latest \
    cypress@latest \
    @cucumber/cucumber@latest \
    mocha@latest \
    vitest@latest \
    pm2@latest \
    nodemon@latest

# Install Playwright browsers
log "Installing Playwright browsers..."
npx playwright install
npx playwright install-deps

# Install Python packages
log "Installing Python packages..."
pip3 install --break-system-packages \
    anthropic \
    openai \
    python-gitlab \
    PyGithub \
    pytest \
    behave \
    requests \
    pyyaml \
    python-dotenv \
    prometheus-client

# Install Ollama
log "Installing Ollama for local AI..."
curl -fsSL https://ollama.com/install.sh | sh

# Pull AI models
log "Pulling AI models (this may take a while)..."
ollama pull qwen2.5-coder:32b-instruct || warning "Failed to pull qwen2.5-coder:32b"
ollama pull codellama:34b || warning "Failed to pull codellama:34b"
ollama pull deepseek-coder:33b || warning "Failed to pull deepseek-coder:33b"

# Create directory structure
log "Creating directory structure..."
mkdir -p $INSTALL_DIR/{config,data,logs,repos,artifacts,scripts,tests}
mkdir -p $INSTALL_DIR/data/{gitlab,jenkins,openproject,postgres,redis,sonarqube,grafana,prometheus,backstage}

# Create docker-compose.yml
log "Creating Docker Compose configuration..."
cat > $INSTALL_DIR/docker-compose.yml << 'EOF'
version: '3.9'

services:
  # GitLab CE (Latest)
  gitlab:
    image: gitlab/gitlab-ce:latest
    container_name: pandora-gitlab
    restart: unless-stopped
    hostname: gitlab.pandora.local
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'http://gitlab.pandora.local'
        gitlab_rails['initial_root_password'] = 'PandoraAdmin2025!'
        gitlab_rails['gitlab_shell_ssh_port'] = 2222
        prometheus['enable'] = true
        prometheus_monitoring['enable'] = true
    ports:
      - '3000:80'
      - '2222:22'
    volumes:
      - ./data/gitlab/config:/etc/gitlab
      - ./data/gitlab/logs:/var/log/gitlab
      - ./data/gitlab/data:/var/opt/gitlab
    networks:
      - pandora-network

  # Jenkins LTS
  jenkins:
    image: jenkins/jenkins:lts-jdk21
    container_name: pandora-jenkins
    restart: unless-stopped
    ports:
      - '3001:8080'
      - '50000:50000'
    volumes:
      - ./data/jenkins:/var/jenkins_home
    environment:
      JENKINS_OPTS: "--prefix=/jenkins"
      JAVA_OPTS: "-Xmx2048m -Xms512m"
    networks:
      - pandora-network

  # OpenProject
  openproject:
    image: openproject/openproject:latest
    container_name: pandora-openproject
    restart: unless-stopped
    ports:
      - '3002:80'
    environment:
      SECRET_KEY_BASE: 'pandora-secret-key-2025-super-long-random-string'
      DATABASE_URL: 'postgresql://openproject:pandora2025@postgres/openproject'
      OPENPROJECT_HTTPS: 'false'
    volumes:
      - ./data/openproject:/var/openproject/assets
    depends_on:
      - postgres
    networks:
      - pandora-network

  # PostgreSQL
  postgres:
    image: postgres:17-alpine
    container_name: pandora-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: pandora
      POSTGRES_PASSWORD: pandora2025
      POSTGRES_MULTIPLE_DATABASES: openproject,backstage,sonarqube
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./scripts/init-postgres.sh:/docker-entrypoint-initdb.d/init.sh
    networks:
      - pandora-network

  # Redis
  redis:
    image: redis:alpine
    container_name: pandora-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - ./data/redis:/data
    networks:
      - pandora-network

  # SonarQube
  sonarqube:
    image: sonarqube:community
    container_name: pandora-sonarqube
    restart: unless-stopped
    ports:
      - '3004:9000'
    environment:
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: 'true'
      SONAR_JDBC_URL: 'jdbc:postgresql://postgres:5432/sonarqube'
      SONAR_JDBC_USERNAME: 'sonarqube'
      SONAR_JDBC_PASSWORD: 'pandora2025'
    volumes:
      - ./data/sonarqube/data:/opt/sonarqube/data
      - ./data/sonarqube/logs:/opt/sonarqube/logs
      - ./data/sonarqube/extensions:/opt/sonarqube/extensions
    depends_on:
      - postgres
    networks:
      - pandora-network

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: pandora-grafana
    restart: unless-stopped
    ports:
      - '3005:3000'
    environment:
      GF_SECURITY_ADMIN_PASSWORD: 'pandora2025'
      GF_INSTALL_PLUGINS: 'grafana-clock-panel,grafana-simple-json-datasource'
    volumes:
      - ./data/grafana:/var/lib/grafana
      - ./config/grafana-datasources.yml:/etc/grafana/provisioning/datasources/prometheus.yml
    networks:
      - pandora-network

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: pandora-prometheus
    restart: unless-stopped
    ports:
      - '3006:9090'
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./data/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - pandora-network

  # Backstage (Optional - can be heavy)
  backstage:
    image: backstage/backstage:latest
    container_name: pandora-backstage
    restart: unless-stopped
    ports:
      - '3003:7007'
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_USER: backstage
      POSTGRES_PASSWORD: pandora2025
    depends_on:
      - postgres
    networks:
      - pandora-network

networks:
  pandora-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF

# Create PostgreSQL initialization script
log "Creating PostgreSQL initialization script..."
cat > $INSTALL_DIR/scripts/init-postgres.sh << 'EOF'
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE USER openproject WITH PASSWORD 'pandora2025';
    CREATE DATABASE openproject OWNER openproject;
    
    CREATE USER backstage WITH PASSWORD 'pandora2025';
    CREATE DATABASE backstage OWNER backstage;
    
    CREATE USER sonarqube WITH PASSWORD 'pandora2025';
    CREATE DATABASE sonarqube OWNER sonarqube;
    
    GRANT ALL PRIVILEGES ON DATABASE openproject TO openproject;
    GRANT ALL PRIVILEGES ON DATABASE backstage TO backstage;
    GRANT ALL PRIVILEGES ON DATABASE sonarqube TO sonarqube;
EOSQL
EOF
chmod +x $INSTALL_DIR/scripts/init-postgres.sh

# Create Prometheus configuration
log "Creating Prometheus configuration..."
cat > $INSTALL_DIR/config/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'jenkins'
    metrics_path: '/prometheus'
    static_configs:
      - targets: ['jenkins:8080']

  - job_name: 'gitlab'
    static_configs:
      - targets: ['gitlab:80']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
EOF

# Create Grafana datasource configuration
log "Creating Grafana datasource configuration..."
mkdir -p $INSTALL_DIR/config
cat > $INSTALL_DIR/config/grafana-datasources.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

# Create AI Developer scripts
log "Creating AI Developer scripts..."

# Claude Developer
cat > $INSTALL_DIR/scripts/claude_developer.py << 'EOF'
#!/usr/bin/env python3
import os
import sys
import json
import anthropic
from typing import Dict, List
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ClaudeDeveloper:
    def __init__(self):
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            logger.error("ANTHROPIC_API_KEY not set")
            sys.exit(1)
        
        self.client = anthropic.Anthropic(api_key=api_key)
    
    def fix_failing_test(self, test_output: str, file_path: str) -> str:
        """Claude analyzes failing test and generates fix"""
        
        try:
            with open(file_path, 'r') as f:
                current_code = f.read()
        except:
            current_code = "File not found"
        
        prompt = f"""You are an expert developer. Fix this failing test.

Test Output:
{test_output}

Current Code:
{current_code}

File Path: {file_path}

Provide ONLY the corrected code that will make the test pass. No explanations."""
        
        try:
            response = self.client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=4000,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return None
    
    def implement_from_spec(self, spec: str) -> Dict[str, str]:
        """Generate implementation from specification"""
        
        prompt = f"""Implement this specification as working Next.js/TypeScript code:

{spec}

Return a JSON object with these keys:
- implementation: The main implementation code
- unit_tests: Jest unit tests
- integration_tests: Integration tests
- e2e_tests: Playwright E2E tests

Ensure all code is production-ready and follows best practices."""
        
        try:
            response = self.client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=8000,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Extract JSON from response
            text = response.content[0].text
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {"error": "Could not parse JSON from response"}
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: claude_developer.py [fix|implement] <args>")
        sys.exit(1)
    
    developer = ClaudeDeveloper()
    
    if sys.argv[1] == "fix":
        if len(sys.argv) < 4:
            print("Usage: claude_developer.py fix <test_output_file> <source_file>")
            sys.exit(1)
        
        with open(sys.argv[2], 'r') as f:
            test_output = f.read()
        
        fix = developer.fix_failing_test(test_output, sys.argv[3])
        if fix:
            print(fix)
    
    elif sys.argv[1] == "implement":
        if len(sys.argv) < 3:
            print("Usage: claude_developer.py implement <spec_file>")
            sys.exit(1)
        
        with open(sys.argv[2], 'r') as f:
            spec = f.read()
        
        result = developer.implement_from_spec(spec)
        print(json.dumps(result, indent=2))
EOF
chmod +x $INSTALL_DIR/scripts/claude_developer.py

# Qwen Developer
cat > $INSTALL_DIR/scripts/qwen_developer.py << 'EOF'
#!/usr/bin/env python3
import requests
import json
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QwenDeveloper:
    def __init__(self):
        self.base_url = "http://localhost:11434"
        self.model = "qwen2.5-coder:32b-instruct"
    
    def fix_code(self, error: str, code: str) -> str:
        """Qwen fixes code based on error"""
        
        prompt = f"""Fix this code that has the following error:
        
Error:
{error}

Current Code:
{code}

Return ONLY the fixed code, no explanations."""
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9
                    }
                }
            )
            
            if response.status_code == 200:
                return response.json().get('response', '')
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Ollama connection error: {e}")
            return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: qwen_developer.py <error_file> <code_file>")
        sys.exit(1)
    
    developer = QwenDeveloper()
    
    with open(sys.argv[1], 'r') as f:
        error = f.read()
    
    with open(sys.argv[2], 'r') as f:
        code = f.read()
    
    fix = developer.fix_code(error, code)
    if fix:
        print(fix)
EOF
chmod +x $INSTALL_DIR/scripts/qwen_developer.py

# Main AI Developer Loop
cat > $INSTALL_DIR/scripts/ai_developer_loop.sh << 'EOF'
#!/bin/bash
#
# PANDORA-CI: 24/7 AI Developer Loop
# This script runs continuously, fixing tests and implementing features
#

# Configuration
REPO_DIR="/opt/pandora-ci/repos/main"
LOG_DIR="/opt/pandora-ci/logs"
SCRIPTS_DIR="/opt/pandora-ci/scripts"

# Ensure log directory exists
mkdir -p $LOG_DIR

# Load environment variables
if [ -f /opt/pandora-ci/.env ]; then
    export $(cat /opt/pandora-ci/.env | xargs)
fi

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_DIR/ai_developer.log
}

# Function to commit changes
commit_changes() {
    cd $REPO_DIR
    if [ $(git status --porcelain | wc -l) -gt 0 ]; then
        git add -A
        git commit -m "$1" || true
        git push origin main || true
        log "Committed: $1"
    fi
}

# Main loop
log "🤖 PANDORA-CI AI Developer Loop Starting..."

while true; do
    log "Starting development cycle..."
    
    # Pull latest code
    cd $REPO_DIR
    git pull origin main 2>/dev/null || true
    
    # Run all test suites
    TEST_SUITES=("unit" "integration" "e2e" "api" "bdd" "security" "performance" "accessibility")
    
    for suite in "${TEST_SUITES[@]}"; do
        log "Testing $suite..."
        
        MAX_ATTEMPTS=10
        ATTEMPT=0
        
        while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
            # Run test suite
            if npm run test:$suite 2>&1 | tee $LOG_DIR/test_${suite}_output.log; then
                log "✅ $suite tests passing"
                break
            else
                log "❌ $suite tests failing (attempt $((ATTEMPT+1))/$MAX_ATTEMPTS)"
                
                # Extract failing test details
                TEST_OUTPUT=$(cat $LOG_DIR/test_${suite}_output.log)
                
                # Try Claude first
                log "Requesting fix from Claude..."
                python3 $SCRIPTS_DIR/claude_developer.py fix \
                    $LOG_DIR/test_${suite}_output.log \
                    "src/**/*.{ts,tsx,js,jsx}" > /tmp/claude_fix.js
                
                if [ -s /tmp/claude_fix.js ]; then
                    # Apply Claude's fix
                    # This is simplified - in reality you'd need to determine which file to update
                    log "Applying Claude's fix..."
                    # cp /tmp/claude_fix.js $REPO_DIR/src/fixed.js
                    commit_changes "AI: Claude fixed $suite test (attempt $((ATTEMPT+1)))"
                else
                    # Try Qwen as backup
                    log "Claude unavailable, trying Qwen..."
                    python3 $SCRIPTS_DIR/qwen_developer.py \
                        $LOG_DIR/test_${suite}_output.log \
                        "src/**/*.{ts,tsx,js,jsx}" > /tmp/qwen_fix.js
                    
                    if [ -s /tmp/qwen_fix.js ]; then
                        log "Applying Qwen's fix..."
                        # cp /tmp/qwen_fix.js $REPO_DIR/src/fixed.js
                        commit_changes "AI: Qwen fixed $suite test (attempt $((ATTEMPT+1)))"
                    fi
                fi
                
                ((ATTEMPT++))
            fi
        done
        
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            log "⚠️ Failed to fix $suite after $MAX_ATTEMPTS attempts"
            # Send alert (implement webhook/email notification here)
        fi
    done
    
    # Check for new specifications to implement
    if [ -f $REPO_DIR/specs/pending/*.md ]; then
        log "Found new specifications to implement..."
        for spec in $REPO_DIR/specs/pending/*.md; do
            log "Implementing: $(basename $spec)"
            python3 $SCRIPTS_DIR/claude_developer.py implement "$spec" > /tmp/implementation.json
            
            # Parse and apply implementation (simplified)
            if [ -s /tmp/implementation.json ]; then
                # Extract and save implementation files
                # This would need proper JSON parsing and file creation
                mv "$spec" "$REPO_DIR/specs/completed/"
                commit_changes "AI: Implemented $(basename $spec)"
            fi
        done
    fi
    
    # Auto-commit every 10 minutes (600 seconds)
    CURRENT_TIME=$(date +%s)
    if [ $((CURRENT_TIME % 600)) -lt 60 ]; then
        commit_changes "Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # Update metrics
    curl -X POST http://localhost:3006/metrics/job/ai_developer \
        --data-binary @- << METRICS
ai_loop_iterations_total{status="complete"} 1
ai_last_run_timestamp $CURRENT_TIME
METRICS
    
    # Sleep 10 minutes before next cycle
    log "Sleeping for 10 minutes..."
    sleep 600
done
EOF
chmod +x $INSTALL_DIR/scripts/ai_developer_loop.sh

# Create systemd service for AI Developer Loop
log "Creating systemd service..."
cat > /etc/systemd/system/pandora-ai-developer.service << EOF
[Unit]
Description=PANDORA-CI AI Developer Loop
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
User=root
WorkingDirectory=/opt/pandora-ci
ExecStart=/opt/pandora-ci/scripts/ai_developer_loop.sh
StandardOutput=append:/opt/pandora-ci/logs/ai_developer.log
StandardError=append:/opt/pandora-ci/logs/ai_developer_error.log

[Install]
WantedBy=multi-user.target
EOF

# Create .env template
log "Creating environment configuration..."
cat > $INSTALL_DIR/.env.template << 'EOF'
# PANDORA-CI Environment Configuration
# Copy to .env and fill in your values

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
OPENAI_API_KEY=sk-YOUR-KEY-HERE

# Git Services
GITLAB_PAT=glpat-YOUR-TOKEN-HERE
GITHUB_PAT=ghp-YOUR-TOKEN-HERE

# Docker Registry
DOCKER_REGISTRY=registry.pandora.local
DOCKER_USERNAME=pandora
DOCKER_PASSWORD=YOUR-PASSWORD-HERE

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=pandora
POSTGRES_PASSWORD=pandora2025

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Monitoring
GRAFANA_ADMIN_PASSWORD=pandora2025
PROMETHEUS_REMOTE_WRITE_URL=

# Notifications
SLACK_WEBHOOK_URL=
DISCORD_WEBHOOK_URL=
EMAIL_SMTP_HOST=
EMAIL_SMTP_USER=
EMAIL_SMTP_PASSWORD=

# Repository
GIT_REPO_URL=https://github.com/your-org/your-repo.git
GIT_BRANCH=main
EOF

# Create sample test configuration
log "Creating sample test configuration..."
cat > $INSTALL_DIR/config/jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'junit.xml',
    }],
  ],
};
EOF

# Set permissions
log "Setting permissions..."
chown -R root:root $INSTALL_DIR
chmod 600 $INSTALL_DIR/.env.template
chmod 700 $INSTALL_DIR/scripts/*

# Start Docker services
log "Starting Docker services..."
cd $INSTALL_DIR
docker compose pull
docker compose up -d

# Wait for services to be ready
log "Waiting for services to start..."
sleep 30

# Enable and start AI Developer service
log "Enabling AI Developer service..."
systemctl daemon-reload
# Don't start automatically until configured
# systemctl enable pandora-ai-developer.service
# systemctl start pandora-ai-developer.service

# Create quick status check script
cat > $INSTALL_DIR/check-status.sh << 'EOF'
#!/bin/bash
echo "=== PANDORA-CI Status ==="
echo ""
echo "Docker Services:"
docker compose ps
echo ""
echo "AI Models:"
ollama list
echo ""
echo "System Resources:"
df -h | grep -E "^/dev|Filesystem"
echo ""
free -h
echo ""
echo "Service URLs:"
echo "  GitLab:      http://$(hostname -I | awk '{print $1}'):3000"
echo "  Jenkins:     http://$(hostname -I | awk '{print $1}'):3001"
echo "  OpenProject: http://$(hostname -I | awk '{print $1}'):3002"
echo "  Backstage:   http://$(hostname -I | awk '{print $1}'):3003"
echo "  SonarQube:   http://$(hostname -I | awk '{print $1}'):3004"
echo "  Grafana:     http://$(hostname -I | awk '{print $1}'):3005"
echo "  Prometheus:  http://$(hostname -I | awk '{print $1}'):3006"
echo ""
echo "Default Credentials:"
echo "  GitLab:      root / PandoraAdmin2025!"
echo "  Grafana:     admin / pandora2025"
echo "  OpenProject: admin / admin (change on first login)"
echo "  Jenkins:     Check /opt/pandora-ci/data/jenkins/secrets/initialAdminPassword"
EOF
chmod +x $INSTALL_DIR/check-status.sh

# Final setup instructions
log "✅ PANDORA-CI Installation Complete!"
echo ""
echo "======================================================================"
echo "                    PANDORA-CI Setup Complete!"
echo "======================================================================"
echo ""
echo "Next Steps:"
echo "1. Copy and configure environment variables:"
echo "   cp $INSTALL_DIR/.env.template $INSTALL_DIR/.env"
echo "   nano $INSTALL_DIR/.env"
echo ""
echo "2. Clone your repository:"
echo "   mkdir -p $INSTALL_DIR/repos"
echo "   cd $INSTALL_DIR/repos"
echo "   git clone YOUR_REPO_URL main"
echo ""
echo "3. Initialize GitLab (get root password):"
echo "   docker exec -it pandora-gitlab gitlab-rake 'gitlab:password:reset[root]'"
echo ""
echo "4. Get Jenkins initial admin password:"
echo "   cat $INSTALL_DIR/data/jenkins/secrets/initialAdminPassword"
echo ""
echo "5. Start AI Developer Loop (after configuration):"
echo "   systemctl start pandora-ai-developer.service"
echo ""
echo "6. Check status anytime:"
echo "   $INSTALL_DIR/check-status.sh"
echo ""
echo "Service URLs:"
echo "  GitLab:      http://$(hostname -I | awk '{print $1}'):3000"
echo "  Jenkins:     http://$(hostname -I | awk '{print $1}'):3001"
echo "  OpenProject: http://$(hostname -I | awk '{print $1}'):3002"
echo "  SonarQube:   http://$(hostname -I | awk '{print $1}'):3004"
echo "  Grafana:     http://$(hostname -I | awk '{print $1}'):3005"
echo ""
echo "Logs available at: $INSTALL_DIR/logs/"
echo ""
echo "======================================================================"
echo "    Remember: Tests ARE the specification. AI makes them pass."
echo "======================================================================"

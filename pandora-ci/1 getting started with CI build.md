Proxmox Infrastructure Automation - Complete Technical Summary for Claude Code
Existing Services Inventory (32 Containers)
AI/LLM Stack

200 openwebui (10.90.11.161): Web UI for LLMs, currently v0.6.26, needs update to v0.6.31, located at /opt/open-webui
201 ollama (10.90.10.124): Local LLM runner, Ubuntu 25.04, port 11434
202 litellm (10.90.11.219): LLM proxy/router for multiple models, port 4000
203 vllm (STOPPED): Vector LLM server
204 n8n (10.90.11.189): Workflow automation, port 5678, empty workflows directory
205 flowiseai (10.90.11.57): Visual AI workflow builder, port 3000

Media Management Stack (*arr ecosystem)

210 radarr (10.90.10.189): Movie management, port 7878
211 sonarr (10.90.10.220): TV show management, port 8989
212 prowlarr (10.90.10.218): Indexer manager, port 9696
213 overseerr (10.90.11.194): Media request management, port 5055
214 tautulli (10.90.10.172): Plex monitoring
230 sabnzbd (10.90.10.239): Usenet downloader

Document Management Stack

220 documenso (10.90.11.14): Digital signatures, port 3000
221 paperless-ngx (10.90.10.52): Document management, port 8000
222 paperless-ai (10.90.11.155): AI-enhanced paperless
223 paperless-gpt (10.90.11.252): GPT-enhanced paperless
224 pdf (10.90.11.115): PDF processing

Infrastructure Services

100 postoffice (10.90.10.4): Mail server, Docker-enabled
102 pbs (10.90.10.2): Proxmox Backup Server, Debian 13
105 authentik-proxy (10.90.10.5): Authentication proxy, Docker-enabled
106 docker (10.90.10.6): Docker host #1
107 npmplus (10.90.10.x): Nginx Proxy Manager, Alpine, Docker-enabled
108 bookstack (10.90.10.8): Documentation wiki
109 wazuh (10.90.10.9): SIEM/monitoring, running but not collecting from containers

Development/Tools

115 stream (10.90.10.15): Streaming server, Ubuntu 24.04
117 dev1rawgle (10.90.10.17): Development environment
118 test-stack (10.90.10.18): Test environment
119 jupyter-notebook (10.90.10.19): Jupyter notebooks
150 apt-cacher (10.90.10.50): APT package cache
207 excalidraw (10.90.11.5): Collaborative whiteboard
208 alpine-it-tools (10.90.10.x): Alpine tools container

Additional Services

206 git (STOPPED): Git server
209 enter-vlan90 (STOPPED): VLAN entry point
240 immich (STOPPED, has snapshot): Photo management
888 docker (10.90.11.78): Docker host #2

Network Layout

Primary subnet: 10.90.10.0/24
Secondary subnet: 10.90.11.0/24
Docker hosts: 100, 105, 106, 107, 888
Non-Docker containers: Most services run directly on Debian/Ubuntu

Automation Requirements
Primary Goals

Automated updates for all containers with rollback capability
Service integration (AI stack components need to communicate)
Centralized monitoring and log aggregation
n8n workflow orchestration
Health checks and alerting

Current Gaps

n8n has no configured workflows
Wazuh not collecting from containers
No service discovery mechanism
No centralized monitoring dashboard
OpenWebUI outdated (v0.6.26 → v0.6.31)

Deployment Steps for Claude Code
Step 1: Update OpenWebUI
bashssh root@<proxmox-ip>
pct exec 200 -- bash -c "cd /opt/open-webui && git stash && git pull && systemctl restart open-webui"
pct exec 200 -- curl -s http://localhost:8080/api/version  # Should show 0.6.31
Step 2: Create Monitoring Infrastructure
bash# Create Grafana/Prometheus container
pct create 250 /var/lib/vz/template/cache/debian-12-standard_12.2-1_amd64.tar.zst \
  --hostname monitoring \
  --memory 4096 \
  --cores 2 \
  --net0 name=eth0,bridge=vmbr0,ip=10.90.11.250/24,gw=10.90.11.1 \
  --storage local-lvm \
  --rootfs local-lvm:8

pct start 250
pct exec 250 -- bash -c "
  apt update
  apt install -y prometheus grafana prometheus-node-exporter
  
  # Configure Prometheus to scrape all containers
  cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'containers'
    static_configs:
$(for ip in 10.90.10.{2..250} 10.90.11.{1..250}; do echo "      - targets: ['$ip:9100']"; done)
EOF
  
  systemctl enable --now prometheus grafana-server
"

# Install node exporters on all containers
for vmid in $(pct list | grep running | awk '{print $1}'); do
  echo "Installing exporter on $vmid"
  pct exec $vmid -- bash -c "apt update && apt install -y prometheus-node-exporter && systemctl enable --now prometheus-node-exporter" 2>/dev/null || \
  pct exec $vmid -- bash -c "apk add --no-cache prometheus-node-exporter && rc-update add node-exporter && rc-service node-exporter start" 2>/dev/null
done
Step 3: Configure n8n Automation Workflows
bash# Create n8n configuration
pct exec 204 -- bash -c "
mkdir -p /root/.n8n/workflows

# Create container update workflow
cat > /root/.n8n/update-workflow.json << 'EOF'
{
  \"name\": \"Container Update Automation\",
  \"nodes\": [
    {
      \"id\": \"1\",
      \"type\": \"n8n-nodes-base.cron\",
      \"typeVersion\": 1,
      \"position\": [250, 300],
      \"parameters\": {
        \"cronExpression\": \"0 3 * * 0\"
      }
    },
    {
      \"id\": \"2\",
      \"type\": \"n8n-nodes-base.ssh\",
      \"typeVersion\": 1,
      \"position\": [450, 300],
      \"credentials\": {
        \"sshPassword\": {
          \"id\": \"1\",
          \"name\": \"Proxmox SSH\"
        }
      },
      \"parameters\": {
        \"host\": \"10.90.10.1\",
        \"command\": \"for vmid in \$(pct list | grep running | awk '{print \$1}'); do pct exec \$vmid -- bash -c 'apt update && apt upgrade -y' || pct exec \$vmid -- apk upgrade; done\"
      }
    }
  ],
  \"connections\": {
    \"1\": {
      \"main\": [[{\"node\": \"2\", \"type\": \"main\", \"index\": 0}]]
    }
  }
}
EOF
"
Step 4: Service Integration Configuration
bash# Create service registry for cross-container communication
cat > /root/service-registry.sh << 'EOF'
#!/bin/bash

# AI Stack Integration
pct exec 200 -- bash -c "
  # OpenWebUI → Ollama connection
  sed -i '/OLLAMA_BASE_URL/d' /opt/open-webui/.env
  echo 'OLLAMA_BASE_URL=http://10.90.10.124:11434' >> /opt/open-webui/.env
  
  # OpenWebUI → LiteLLM connection  
  echo 'LITELLM_PROXY_URL=http://10.90.11.219:4000' >> /opt/open-webui/.env
  systemctl restart open-webui
"

# LiteLLM → Ollama configuration
pct exec 202 -- bash -c "
  cat > /etc/litellm/config.yaml << 'EEOF'
model_list:
  - model_name: ollama/*
    litellm_params:
      model: ollama/*
      api_base: http://10.90.10.124:11434
EEOF
  systemctl restart litellm
"

# Configure n8n to access all services
pct exec 204 -- bash -c "
  cat > /root/services.json << 'EEOF'
{
  \"ai\": {
    \"openwebui\": \"http://10.90.11.161:8080\",
    \"ollama\": \"http://10.90.10.124:11434\",
    \"litellm\": \"http://10.90.11.219:4000\",
    \"flowise\": \"http://10.90.11.57:3000\"
  },
  \"media\": {
    \"radarr\": \"http://10.90.10.189:7878\",
    \"sonarr\": \"http://10.90.10.220:8989\",
    \"prowlarr\": \"http://10.90.10.218:9696\",
    \"overseerr\": \"http://10.90.11.194:5055\"
  },
  \"docs\": {
    \"paperless\": \"http://10.90.10.52:8000\",
    \"documenso\": \"http://10.90.11.14:3000\"
  },
  \"monitoring\": {
    \"grafana\": \"http://10.90.11.250:3000\",
    \"prometheus\": \"http://10.90.11.250:9090\",
    \"wazuh\": \"https://10.90.10.9:443\"
  }
}
EEOF
"
EOF
chmod +x /root/service-registry.sh
/root/service-registry.sh
Step 5: Wazuh Agent Deployment
bash# Deploy Wazuh agents to all containers for log collection
for vmid in $(pct list | grep running | awk '{print $1}'); do
  [ "$vmid" = "109" ] && continue  # Skip Wazuh manager itself
  
  echo "Installing Wazuh agent on container $vmid"
  pct exec $vmid -- bash -c "
    curl -so wazuh-agent.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.9.0-1_amd64.deb && \
    dpkg -i wazuh-agent.deb && \
    sed -i 's/MANAGER_IP/10.90.10.9/' /var/ossec/etc/ossec.conf && \
    systemctl enable --now wazuh-agent
  " 2>/dev/null
done
Step 6: Automated Update System with Rollback
bashcat > /root/smart-updater.sh << 'EOF'
#!/bin/bash
LOG="/var/log/container-updates-$(date +%Y%m%d).log"

update_container() {
  local vmid=$1
  local hostname=$(pct config $vmid | grep hostname | cut -d' ' -f2)
  
  echo "[$(date)] Starting update for $hostname ($vmid)" >> $LOG
  
  # Create snapshot before update
  pct snapshot $vmid auto-update-$(date +%Y%m%d)
  
  # Perform update
  if pct exec $vmid -- bash -c "apt update && apt upgrade -y" 2>&1 >> $LOG; then
    # Health check
    sleep 10
    if pct exec $vmid -- systemctl is-system-running | grep -q "running\|degraded"; then
      echo "[$(date)] $hostname updated successfully" >> $LOG
    else
      echo "[$(date)] $hostname health check failed, rolling back" >> $LOG
      pct rollback $vmid auto-update-$(date +%Y%m%d)
    fi
  else
    echo "[$(date)] $hostname update failed" >> $LOG
  fi
}

# Update by priority: AI stack, then infrastructure, then others
for vmid in 200 201 202 204 205; do update_container $vmid; done  # AI
for vmid in 107 109 150; do update_container $vmid; done  # Infrastructure  
for vmid in $(pct list | grep running | awk '{print $1}' | grep -v -E "200|201|202|204|205|107|109|150"); do
  update_container $vmid
done
EOF
chmod +x /root/smart-updater.sh

# Add to cron
echo "0 2 * * 0 /root/smart-updater.sh" >> /etc/crontab
Access URLs After Deployment

n8n: http://10.90.11.189:5678
Grafana: http://10.90.11.250:3000 (admin/admin)
Prometheus: http://10.90.11.250:9090
OpenWebUI: http://10.90.11.161:8080
Wazuh: https://10.90.10.9:443

Critical Integration Points

OpenWebUI needs OLLAMA_BASE_URL environment variable
LiteLLM needs Ollama endpoint configuration
Media stack (*arr apps) need shared volumes for media
Paperless variants may conflict on ports - verify isolation
Docker hosts (100,105,106,107,888) need docker-compose management

Testing Commands
bash# Test AI stack connectivity
curl http://10.90.10.124:11434/api/tags  # Ollama models
curl http://10.90.11.219:4000/v1/models  # LiteLLM proxy
curl http://10.90.11.161:8080/api/version  # OpenWebUI

# Verify monitoring
curl http://10.90.11.250:9090/api/v1/targets  # Prometheus targets
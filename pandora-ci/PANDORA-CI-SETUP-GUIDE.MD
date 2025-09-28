# PANDORA CI/CD Stack - Complete Setup Guide

## Overview
Complete setup and configuration guide for all 34 services in the Pandora CI/CD stack.
Created: September 16, 2025

## URGENT: Fix Jenkins First

```bash
# Jenkins is in restart loop - fix it NOW
docker stop pandora-jenkins
docker rm pandora-jenkins
docker volume rm jenkins_data

# Start Jenkins with proper permissions
docker run -d \
  --name pandora-jenkins \
  --network pandora-network \
  -p 3001:8080 -p 50000:50000 \
  --user root \
  -v jenkins_data:/var/jenkins_home \
  jenkins/jenkins:lts-jdk21

# Wait 60 seconds then get password
sleep 60
docker exec pandora-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

## All 34 Services Status & URLs

### Web-Accessible Services (20)

| Service | URL | Default Credentials | Purpose |
|---------|-----|-------------------|----------|
| **Jenkins** | http://10.90.10.6:3001 | admin / (see setup) | CI/CD Hub |
| **GitLab** | http://10.90.10.6:3000 | root / PandoraGitLab2025! | Source Control |
| **OpenProject** | http://10.90.10.6:3002 | admin / admin | Project Management |
| **SonarQube** | http://10.90.10.6:3004 | admin / admin | Code Quality |
| **Grafana** | http://10.90.10.6:3005 | admin / PandoraGrafana2025! | Monitoring Dashboard |
| **Prometheus** | http://10.90.10.6:3006 | No auth | Metrics Collection |
| **Nexus** | http://10.90.10.6:8081 | admin / (see setup) | Artifact Repository |
| **Vault** | http://10.90.10.6:8200 | Token: pandora-vault-token-2025 | Secrets Management |
| **MinIO Console** | http://10.90.10.6:9002 | pandora / PandoraMinio2025! | Object Storage |
| **RabbitMQ** | http://10.90.10.6:15672 | pandora / PandoraRabbit2025! | Message Queue |
| **Elasticsearch** | http://10.90.10.6:9200 | No auth | Search & Analytics |
| **Kibana** | http://10.90.10.6:5601 | No auth | Log Visualization |
| **Jaeger** | http://10.90.10.6:16686 | No auth | Distributed Tracing |
| **Trivy** | http://10.90.10.6:8084 | No auth | Security Scanner |
| **Docker Registry** | http://10.90.10.6:5001 | No auth | Container Registry |
| **Selenium Hub** | http://10.90.10.6:4444 | No auth | Test Automation |
| **Open WebUI** | http://10.90.10.6:3007 | Create on first login | AI Interface |
| **Node Exporter** | http://10.90.10.6:9100/metrics | No auth | Node Metrics |
| **cAdvisor** | http://10.90.10.6:8088 | No auth | Container Metrics |
| **Loki** | http://10.90.10.6:3100 | No auth | Log Aggregation |

### Backend Services (14)

| Service | Port | Credentials | Purpose |
|---------|------|------------|----------|
| **PostgreSQL** | 5432 | pandora / PandoraDB2025! | Primary Database |
| **MySQL** | 3306 | pandora / PandoraMySQL2025! | Secondary Database |
| **MongoDB** | 27017 | pandora / PandoraMongo2025! | NoSQL Database |
| **Redis** | 6379 | Password: PandoraRedis2025! | Cache & Queue |
| **GitLab Runner** | - | Auto-configured | CI/CD Runner |
| **Ollama** | 11434 | No auth | AI Model Server |
| **Promtail** | - | No auth | Log Shipper |
| **Selenium Chrome** | - | Via Hub | Browser Testing |
| **Selenium Firefox** | - | Via Hub | Browser Testing |
| **MinIO API** | 9001 | pandora / PandoraMinio2025! | S3 API |
| **RabbitMQ AMQP** | 5672 | pandora / PandoraRabbit2025! | Message Protocol |
| **GitLab SSH** | 2222 | SSH keys | Git SSH |
| **Jenkins Agent** | 50000 | Auto-configured | Build Agents |
| **Portainer** | 9000 | (existing) | Container Management |

---

## PART 1: Core Services Setup (Priority Order)

### 1.1 Jenkins (CI/CD Hub) - MUST FIX FIRST
```bash
# Already fixed above, now configure:
```
**Access:** http://10.90.10.6:3001
1. Enter initial password from command above
2. Install suggested plugins
3. Create admin user:
   - Username: `admin`
   - Password: `PandoraJenkins2025!`
4. Set Jenkins URL: `http://10.90.10.6:3001`

### 1.2 GitLab (Source Control)
```bash
# Check if ready (takes 5-10 min)
docker exec pandora-gitlab gitlab-ctl status

# Set/Reset root password
docker exec -it pandora-gitlab gitlab-rails console << 'EOF'
user = User.find_by(username: 'root')
user.password = 'PandoraGitLab2025!'
user.password_confirmation = 'PandoraGitLab2025!'
user.save!
exit
EOF
```

### 1.3 OpenProject (Project Management)
**Access:** http://10.90.10.6:3002
- Login: admin/admin
- Change password on first login to: `PandoraOP2025!`

### 1.4 SonarQube (Code Quality)
**Access:** http://10.90.10.6:3004
- Login: admin/admin
- Will force password change to: `PandoraSonar2025!`

### 1.5 Nexus (Artifacts)
```bash
# Get initial admin password
docker exec pandora-nexus cat /nexus-data/admin.password
```
**Access:** http://10.90.10.6:8081
- Change to: `PandoraNexus2025!`

---

## PART 2: Monitoring Stack Configuration

### 2.1 Grafana Setup
**Access:** http://10.90.10.6:3005 (admin/PandoraGrafana2025!)

**Add Data Sources:**
1. Configuration → Data Sources → Add
2. Add Prometheus:
   - URL: `http://pandora-prometheus:9090`
3. Add Loki:
   - URL: `http://pandora-loki:3100`
4. Add Elasticsearch:
   - URL: `http://pandora-elasticsearch:9200`

**Import Dashboards:**
- 11159 - Jenkins Performance
- 1860 - Node Exporter
- 893 - Docker Containers

### 2.2 Prometheus Targets
```bash
# Verify all targets are up
curl http://10.90.10.6:3006/targets
```

### 2.3 Kibana Setup
**Access:** http://10.90.10.6:5601
1. Create index pattern: `logstash-*`
2. Set time field: `@timestamp`

---

## PART 3: Storage & Artifacts

### 3.1 MinIO (S3 Storage)
**Access:** http://10.90.10.6:9002
1. Login: pandora/PandoraMinio2025!
2. Create buckets:
   - `artifacts`
   - `backups`
   - `logs`

### 3.2 Docker Registry
```bash
# Configure Docker to use registry
echo '{"insecure-registries":["10.90.10.6:5001"]}' > /etc/docker/daemon.json
systemctl restart docker

# Test push
docker tag alpine:latest 10.90.10.6:5001/test:latest
docker push 10.90.10.6:5001/test:latest
```

### 3.3 Nexus Repository
Create repositories:
- Docker hosted: `pandora-docker`
- Maven hosted: `pandora-maven`  
- NPM hosted: `pandora-npm`

---

## PART 4: Testing Infrastructure

### 4.1 Selenium Grid
**Hub:** http://10.90.10.6:4444/ui/index.html#/

Test with Python:
```python
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

driver = webdriver.Remote(
    command_executor='http://10.90.10.6:4444/wd/hub',
    desired_capabilities=DesiredCapabilities.CHROME)
driver.get('http://10.90.10.6:3001')
print(driver.title)
driver.quit()
```

---

## PART 5: Security & Secrets

### 5.1 Vault Configuration
**Access:** http://10.90.10.6:8200
```bash
# Enable KV secrets
docker exec pandora-vault vault secrets enable -version=2 -path=pandora kv

# Store Jenkins token
docker exec pandora-vault vault kv put pandora/ci jenkins_api_token=your_token_here
```

### 5.2 Trivy Scanner
```bash
# Test scan an image
docker run --rm --network pandora-network \
  aquasec/trivy:latest image alpine:latest
```

---

## PART 6: Message Queue & AI

### 6.1 RabbitMQ
**Access:** http://10.90.10.6:15672
1. Create Virtual Host: `/pandora`
2. Create Exchange: `pandora.events`
3. Create Queue: `ci.builds`

### 6.2 AI Stack (Ollama + Open WebUI)
```bash
# Pull AI model
docker exec pandora-ollama ollama pull llama2

# Access UI at http://10.90.10.6:3007
```

---

## PART 7: Jenkins Pipeline Integration

### Complete CI/CD Pipeline Example
```groovy
pipeline {
    agent any
    
    environment {
        REGISTRY = '10.90.10.6:5001'
        SONAR_HOST = 'http://10.90.10.6:3004'
        GITLAB_URL = 'http://10.90.10.6:3000'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: "${GITLAB_URL}/root/pandora-app.git"
            }
        }
        
        stage('Build') {
            steps {
                sh 'docker build -t ${REGISTRY}/pandora-app:${BUILD_NUMBER} .'
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                    docker run --rm --network pandora-network \
                        ${REGISTRY}/pandora-app:${BUILD_NUMBER} npm test
                '''
            }
        }
        
        stage('Security Scan') {
            steps {
                sh '''
                    docker run --rm --network pandora-network \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy image ${REGISTRY}/pandora-app:${BUILD_NUMBER}
                '''
            }
        }
        
        stage('Code Quality') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'sonar-scanner'
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                sh 'docker push ${REGISTRY}/pandora-app:${BUILD_NUMBER}'
            }
        }
        
        stage('Store in Nexus') {
            steps {
                nexusArtifactUploader(
                    nexusVersion: 'nexus3',
                    protocol: 'http',
                    nexusUrl: '10.90.10.6:8081',
                    groupId: 'com.pandora',
                    version: '${BUILD_NUMBER}',
                    repository: 'pandora-maven',
                    credentialsId: 'nexus-creds',
                    artifacts: [
                        [artifactId: 'pandora-app',
                         classifier: '',
                         file: 'target/pandora-app.jar',
                         type: 'jar']
                    ]
                )
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                    docker service update \
                        --image ${REGISTRY}/pandora-app:${BUILD_NUMBER} \
                        pandora-app || \
                    docker service create \
                        --name pandora-app \
                        --network pandora-network \
                        ${REGISTRY}/pandora-app:${BUILD_NUMBER}
                '''
            }
        }
    }
    
    post {
        always {
            // Send to RabbitMQ
            sh '''
                curl -X POST http://10.90.10.6:15672/api/exchanges/%2F/pandora.events/publish \
                    -u pandora:PandoraRabbit2025! \
                    -H "content-type:application/json" \
                    -d'{"properties":{},"routing_key":"ci.builds","payload":"Build ${BUILD_NUMBER} ${currentBuild.result}","payload_encoding":"string"}'
            '''
            
            // Store in MinIO
            sh '''
                docker run --rm --network pandora-network \
                    -v ${WORKSPACE}:/data \
                    minio/mc alias set minio http://pandora-minio:9000 pandora PandoraMinio2025!
                docker run --rm --network pandora-network \
                    -v ${WORKSPACE}:/data \
                    minio/mc cp /data/build.log minio/artifacts/build-${BUILD_NUMBER}.log
            '''
        }
    }
}
```

---

## PART 8: Health Check Scripts

### Create Health Check Script
```bash
cat > /root/pandora/health-check.sh << 'SCRIPT'
#!/bin/bash

echo "=== PANDORA STACK HEALTH CHECK ==="
echo "==================================="
echo ""

# Define all services
declare -A services=(
    ["3000"]="GitLab"
    ["3001"]="Jenkins"
    ["3002"]="OpenProject"
    ["3004"]="SonarQube"
    ["3005"]="Grafana"
    ["3006"]="Prometheus"
    ["3007"]="Open-WebUI"
    ["3100"]="Loki"
    ["4444"]="Selenium-Hub"
    ["5001"]="Docker-Registry"
    ["5432"]="PostgreSQL"
    ["5601"]="Kibana"
    ["5672"]="RabbitMQ-AMQP"
    ["6379"]="Redis"
    ["8081"]="Nexus"
    ["8084"]="Trivy"
    ["8088"]="cAdvisor"
    ["8200"]="Vault"
    ["9001"]="MinIO-API"
    ["9002"]="MinIO-Console"
    ["9100"]="Node-Exporter"
    ["9200"]="Elasticsearch"
    ["11434"]="Ollama"
    ["15672"]="RabbitMQ-UI"
    ["16686"]="Jaeger"
    ["27017"]="MongoDB"
    ["3306"]="MySQL"
)

# Check each service
for port in "${!services[@]}"; do
    service_name="${services[$port]}"
    if timeout 2 bash -c "echo > /dev/tcp/10.90.10.6/$port" 2>/dev/null; then
        echo "✅ $service_name (port $port) - ONLINE"
    else
        echo "❌ $service_name (port $port) - OFFLINE"
    fi
done | sort -t: -k2

echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | head -20
SCRIPT

chmod +x /root/pandora/health-check.sh
```

---

## PART 9: Troubleshooting Guide

### Jenkins Issues
```bash
# Fix permissions
docker exec -u root pandora-jenkins chown -R 1000:1000 /var/jenkins_home
docker restart pandora-jenkins

# View logs
docker logs pandora-jenkins --tail 50
```

### GitLab Slow Start
```bash
# Check status
docker exec pandora-gitlab gitlab-ctl status

# Reconfigure
docker exec pandora-gitlab gitlab-ctl reconfigure

# Tail logs
docker exec pandora-gitlab gitlab-ctl tail
```

### Container Won't Start
```bash
# Check logs
docker logs pandora-SERVICE_NAME --tail 50

# Recreate container
docker stop pandora-SERVICE_NAME
docker rm pandora-SERVICE_NAME
# Then recreate with original docker run command
```

### Port Conflicts
```bash
netstat -tulpn | grep PORT_NUMBER
lsof -i :PORT_NUMBER
```

---

## PART 10: Quick Commands

```bash
# Check all services
/root/pandora/health-check.sh

# Restart all Pandora services
docker restart $(docker ps -aq --filter "name=pandora")

# View all logs
docker ps --filter "name=pandora" --format "{{.Names}}" | xargs -I {} docker logs {} --tail 5

# Stop all services
docker stop $(docker ps -aq --filter "name=pandora")

# Start all services  
docker start $(docker ps -aq --filter "name=pandora")

# Remove all services (DANGER!)
docker rm -f $(docker ps -aq --filter "name=pandora")
```

---

## Service Dependencies Map

```
Databases (PostgreSQL, MySQL, MongoDB, Redis)
    ↓
GitLab & Jenkins (Core CI/CD)
    ↓
SonarQube & Trivy (Quality & Security)
    ↓
Nexus & Registry (Artifacts)
    ↓
OpenProject (Management)
    ↓
Monitoring (Prometheus → Grafana)
    ↓
Logs (Promtail → Loki → Grafana)
    ↓
Testing (Selenium Grid)
```

---

## Credentials Summary

| Service | Username | Password |
|---------|----------|----------|
| Jenkins | admin | PandoraJenkins2025! |
| GitLab | root | PandoraGitLab2025! |
| OpenProject | admin | PandoraOP2025! |
| SonarQube | admin | PandoraSonar2025! |
| Grafana | admin | PandoraGrafana2025! |
| Nexus | admin | PandoraNexus2025! |
| MinIO | pandora | PandoraMinio2025! |
| RabbitMQ | pandora | PandoraRabbit2025! |
| PostgreSQL | pandora | PandoraDB2025! |
| MySQL | pandora | PandoraMySQL2025! |
| MongoDB | pandora | PandoraMongo2025! |
| Redis | - | PandoraRedis2025! |
| Vault | Token | pandora-vault-token-2025 |

---

**Created:** September 16, 2025
**Version:** 1.0
**Total Services:** 34
**Author:** Pandora CI/CD Platform Team

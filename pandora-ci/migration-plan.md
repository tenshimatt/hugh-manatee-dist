# Migration Plan: Custom v6 Stack → Standardized Portainer Stack

## Current Situation ❌
- **Running**: Custom v6 deployment with mixed containers
- **Problem**: Not standardized, has custom code dependencies
- **Status**: ~34 containers running, but non-standard setup

## Target Goal ✅
- **Standardized Portainer Stack**: Docker Compose v6 format
- **No Custom Code**: Only official Docker images
- **Centralized Management**: Single Portainer stack
- **Latest Versions**: All services updated

## Migration Strategy

### Option 1: Clean Slate Deployment (Recommended)
**Pros**: Clean, standardized, no legacy issues
**Cons**: Temporary downtime

#### Steps:
1. **Backup Current Data**
   ```bash
   # Backup critical data volumes
   docker run --rm -v pandora_postgres_data:/source -v /backup:/backup alpine tar czf /backup/postgres_backup.tar.gz -C /source .
   docker run --rm -v pandora_grafana_data:/source -v /backup:/backup alpine tar czf /backup/grafana_backup.tar.gz -C /source .
   ```

2. **Stop and Remove Custom Stack**
   ```bash
   # Stop all pandora containers
   docker stop $(docker ps -q --filter "name=pandora-*")
   docker rm $(docker ps -aq --filter "name=pandora-*")
   ```

3. **Deploy Standardized Stack via Portainer**
   - Use Portainer Web UI: `http://10.90.10.6:9000`
   - Create new stack with our YAML
   - Deploy with proper v6 formatting

4. **Restore Data**
   ```bash
   # Restore critical data
   docker run --rm -v pandora_postgres_data:/target -v /backup:/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /target
   ```

### Option 2: Gradual Migration (Safer)
**Pros**: No downtime, gradual testing
**Cons**: More complex, temporary port conflicts

#### Steps:
1. **Deploy standardized stack on different ports**
2. **Test each service migration individually**
3. **Switch traffic once verified**
4. **Remove old containers**

## Recommended: Clean Slate Approach

### Phase 1: Pre-Migration (5 minutes)
```bash
# Create backup directory
ssh root@10.90.10.6 "mkdir -p /backup/pandora-migration"

# Backup critical volumes
docker run --rm -v pandora_postgres_data:/source -v /backup/pandora-migration:/backup alpine tar czf /backup/postgres.tar.gz -C /source .
docker run --rm -v pandora_grafana_data:/source -v /backup/pandora-migration:/backup alpine tar czf /backup/grafana.tar.gz -C /source .
docker run --rm -v pandora_n8n_data:/source -v /backup/pandora-migration:/backup alpine tar czf /backup/n8n.tar.gz -C /source .
```

### Phase 2: Clean Deployment (10 minutes)
```bash
# Stop and remove all custom containers
docker stop $(docker ps -q --filter "name=pandora-*")
docker rm $(docker ps -aq --filter "name=pandora-*")

# Clean up custom networks (keep default)
docker network prune -f

# Remove unused volumes (BE CAREFUL)
docker volume ls | grep pandora | awk '{print $2}' | grep -v -E "(postgres|grafana|n8n)" | xargs docker volume rm
```

### Phase 3: Portainer Deployment (5 minutes)
1. **Access Portainer**: `http://10.90.10.6:9000`
2. **Create Stack**: Name: `pandora-standardized`
3. **Upload our standardized YAML**
4. **Deploy and verify**

### Phase 4: Data Restoration (5 minutes)
```bash
# Restore backed up data
docker run --rm -v pandora_postgres_data:/target -v /backup/pandora-migration:/backup alpine tar xzf /backup/postgres.tar.gz -C /target
docker run --rm -v pandora_grafana_data:/target -v /backup/pandora-migration:/backup alpine tar xzf /backup/grafana.tar.gz -C /target
docker run --rm -v pandora_n8n_data:/target -v /backup/pandora-migration:/backup alpine tar xzf /backup/n8n.tar.gz -C /target

# Restart containers to pick up restored data
docker compose -f /opt/pandora-stack/docker-compose.yml restart
```

## Updated Standardized Stack Features

### ✅ What We'll Have After Migration:
- **Portainer v6 Stack**: Modern stack management
- **Latest Images**: All services on current versions
- **Standard Ports**: No custom port conflicts
- **Volume Management**: Proper Docker volume handling
- **Network Isolation**: Clean internal networking
- **Health Checks**: Proper container health monitoring
- **Auto-Restart**: Resilient container policies

### 🔧 Services in Standardized Stack:
1. **Core Infrastructure**: PostgreSQL, Redis, Monitoring
2. **AI Stack**: OpenWebUI v0.6.31, Ollama, LiteLLM
3. **Automation**: n8n (fixed deprecations)
4. **Management**: OpenProject, Grafana, Prometheus
5. **Development**: Jupyter, Documentation tools
6. **Media**: Radarr, Sonarr, Prowlarr stack

## Execution Decision

**Should we proceed with Clean Slate migration?**
- ✅ 25 minutes total migration time
- ✅ Clean standardized deployment
- ✅ No legacy custom code
- ✅ Proper Portainer v6 management
- ⚠️ Brief service interruption during migration

**Alternative**: Keep current custom stack and just update versions?
- ❌ Still has custom code dependencies
- ❌ Not standardized for future management
- ❌ Harder to maintain long-term
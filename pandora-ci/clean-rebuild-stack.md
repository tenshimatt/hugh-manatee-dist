# Pandora Stack Clean Rebuild Guide

## Issue Identified
The "dashboard-service" database errors were caused by **Grafana** trying to access configuration files that didn't exist in the `/config` directory.

## Files Created
✅ `/config/grafana-datasources.yml` - Prometheus, Loki, and Jaeger datasource configurations
✅ `/config/grafana-dashboards.yml` - Dashboard provisioning configuration
✅ `/config/prometheus.yml` - Prometheus scraping configuration
✅ `/config/loki.yml` - Loki logging service configuration
✅ `/config/promtail.yml` - Log shipping configuration

## Clean Rebuild Strategy

### Option 1: Fix Current Stack (Recommended)
Since the missing config files have been created, restart just the affected services:

```bash
# In your Portainer web interface:
1. Go to Stacks → pandora
2. Restart the following containers:
   - pandora-grafana
   - pandora-prometheus
   - pandora-loki
   - pandora-promtail

# Or via CLI if you have docker access:
docker restart pandora-grafana pandora-prometheus pandora-loki pandora-promtail
```

### Option 2: Complete Stack Rebuild
If you want a completely fresh start:

```bash
# 1. Stop all services
docker-compose -f docker-compose-complete.yml down

# 2. Remove volumes (WARNING: This deletes all data)
docker volume prune -f

# 3. Remove containers
docker container prune -f

# 4. Start services in phases
docker-compose -f docker-compose-complete.yml up -d postgres redis
sleep 30  # Wait for databases

docker-compose -f docker-compose-complete.yml up -d gitlab openproject prometheus grafana loki
sleep 60  # Wait for core services

docker-compose -f docker-compose-complete.yml up -d  # Start remaining services
```

### Option 3: Selective Service Rebuild
Rebuild only problematic services:

```bash
# Stop monitoring stack
docker stop pandora-grafana pandora-prometheus pandora-loki pandora-promtail

# Remove their containers
docker rm pandora-grafana pandora-prometheus pandora-loki pandora-promtail

# Start them fresh
docker-compose -f docker-compose-complete.yml up -d prometheus grafana loki promtail
```

## Health Checks After Rebuild

### Verify Services are Running
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Test Key Services
- **Grafana**: http://localhost:3005 (admin/PandoraAdmin2025!)
- **Prometheus**: http://localhost:3006
- **OpenProject**: http://localhost:3002
- **GitLab**: http://localhost:3000

### Check Logs for Errors
```bash
# No more dashboard-service errors expected
docker logs pandora-grafana --tail 50
docker logs pandora-prometheus --tail 50
```

## Stack Architecture Overview

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| GitLab CE | 3000 | DevOps Platform | http://localhost:3000/-/health |
| Jenkins | 3001 | CI/CD | http://localhost:3001 |
| OpenProject | 3002 | Project Management | http://localhost:3002 |
| Backstage | 3003 | Developer Portal | http://localhost:3003 |
| SonarQube | 3004 | Code Quality | http://localhost:3004 |
| **Grafana** | 3005 | **Monitoring Dashboards** | http://localhost:3005 |
| **Prometheus** | 3006 | **Metrics Collection** | http://localhost:3006 |
| Open WebUI | 3007 | AI Chat | http://localhost:3007 |
| Postgres | 5432 | Primary Database | `pg_isready` |
| Redis | 6379 | Caching | `redis-cli ping` |

## Next Steps

1. **Immediate**: Restart the monitoring services with new configs
2. **Monitor**: Watch logs for the next 10 minutes to ensure no more database errors
3. **Configure**: Set up Grafana dashboards for your stack monitoring
4. **Document**: Add any custom configurations to version control

## Maintenance Tips

- Always create config files before mounting volumes
- Use `docker-compose config` to validate YAML before deployment
- Keep configuration files in version control
- Regular health checks prevent cascading failures
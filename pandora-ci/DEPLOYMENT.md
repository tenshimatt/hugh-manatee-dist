# Pandora Stack - Production Ready Deployment Guide

## 🔧 What Was Fixed

**Original Issues:**
- ❌ No health checks
- ❌ Missing database initialization
- ❌ Services not properly connected
- ❌ No restart policies
- ❌ Weak security configurations
- ❌ Missing monitoring integration

**Fixed Version:**
- ✅ Comprehensive health checks for all services
- ✅ Centralized PostgreSQL with proper database initialization
- ✅ Redis caching layer integration
- ✅ Production-ready security settings
- ✅ Full monitoring stack (Prometheus + Grafana + Loki)
- ✅ Proper service dependencies and startup order
- ✅ Container resource management

## 🚀 Quick Deployment

### 1. Deploy in Portainer

1. **Copy the new stack definition**: Use `docker-compose-fixed.yml`
2. **Create the stack in Portainer**:
   - Name: `pandora-v2`
   - Stack file: Copy contents of `docker-compose-fixed.yml`
3. **Deploy**: Click "Deploy the stack"

### 2. Directory Structure Required

Ensure these directories exist relative to your stack:

```
/config/
  ├── grafana/
  │   ├── datasources/prometheus.yml
  │   └── dashboards/dashboard.yml
  ├── prometheus.yml
  ├── loki.yml
  └── promtail.yml
/scripts/
  └── init-postgres.sql
/dags/
/claude_scripts/
/logs/
/plugins/
/n8n/workflows/
```

## 📋 Service Overview

| Service | Port | Credentials | Purpose |
|---------|------|-------------|---------|
| **PostgreSQL** | 5432 | `pandora/pandora123` | Central database |
| **Redis** | 6379 | No auth | Caching layer |
| **N8N** | 5678 | `admin/pandora123` | Workflow automation |
| **Airflow** | 8090 | `admin/pandora123` | Data orchestration |
| **GitLab** | 3000 | `root/pandora123` | Code management |
| **OpenProject** | 3002 | Auto-setup | Project management |
| **Grafana** | 3005 | `admin/pandora123` | Monitoring dashboards |
| **Prometheus** | 9090 | No auth | Metrics collection |
| **Loki** | 3100 | No auth | Log aggregation |
| **Node Exporter** | 9100 | No auth | System metrics |
| **cAdvisor** | 8080 | No auth | Container metrics |

## 🏥 Health Monitoring

### Automated Health Checks
All services now have health checks that will:
- Restart unhealthy containers automatically
- Show service status in Portainer
- Prevent dependent services from starting until dependencies are healthy

### Manual Health Verification

```bash
# Check all service health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test specific services
curl http://localhost:3005/api/health    # Grafana
curl http://localhost:9090/-/healthy     # Prometheus
curl http://localhost:3100/ready         # Loki
curl http://localhost:5678/healthz       # n8n
```

## 🔒 Security Features

### Database Security
- Isolated user accounts for each service
- Encrypted passwords
- Database-level permissions

### Application Security
- Basic authentication where supported
- Secret key management
- Network isolation via Docker networks

### Monitoring Security
- Admin access controls
- Secure metric collection
- Log access restrictions

## 📊 Monitoring Setup

### Grafana Dashboards
After deployment, Grafana will automatically:
- Connect to Prometheus and Loki
- Import system and container dashboards
- Show real-time metrics for all services

### Key Metrics Tracked
- **System**: CPU, Memory, Disk, Network
- **Containers**: Resource usage, restart counts
- **Applications**: Response times, error rates
- **Database**: Connection pools, query performance

## 🔄 Startup Sequence

The stack starts services in the correct order:

1. **Infrastructure**: PostgreSQL, Redis
2. **Applications**: GitLab, OpenProject, N8N, Airflow
3. **Monitoring**: Prometheus, Node Exporter, cAdvisor
4. **Visualization**: Grafana (waits for Prometheus)
5. **Logging**: Loki, Promtail

## 🛠 Maintenance

### Regular Tasks
- **Daily**: Check Grafana dashboards for anomalies
- **Weekly**: Review container resource usage
- **Monthly**: Update container images
- **Quarterly**: Review and rotate passwords

### Backup Strategy
```bash
# Database backups
docker exec pandora-postgres pg_dumpall -U pandora > backup.sql

# Volume backups
docker run --rm -v pandora-v2_grafana_data:/data -v $(pwd):/backup busybox tar czf /backup/grafana_backup.tar.gz /data
```

### Troubleshooting Common Issues

**Service won't start:**
1. Check health status: `docker ps`
2. View logs: `docker logs [container_name]`
3. Verify dependencies are healthy

**Database connection issues:**
1. Ensure PostgreSQL is healthy
2. Check database user permissions
3. Verify network connectivity

**Monitoring not working:**
1. Check Prometheus targets: http://localhost:9090/targets
2. Verify Grafana datasource: Settings → Data Sources
3. Check configuration file mounts

## 🚀 Next Steps

1. **Deploy the stack** using the fixed docker-compose
2. **Verify all services** are healthy (green status)
3. **Access Grafana** at http://localhost:3005 (admin/pandora123)
4. **Configure dashboards** for your specific needs
5. **Set up alerts** for critical metrics

This fixed version eliminates the dashboard-service database errors and provides a robust, production-ready platform for your development needs.
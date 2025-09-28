# Full Stack Fixes - 32 Container Infrastructure

## Definition of Done
- ✅ All software at latest recommended stable versions
- ✅ Secure configuration for development environment
- ✅ Standardized Portainer YAML deployment
- ✅ No custom code dependencies

## Current Issues & Fixes Required

### 🤖 AI/LLM Stack (Priority 1)

#### 1. OpenWebUI (Container 200 - 10.90.11.161)
- **Current**: v0.6.26
- **Target**: v0.6.31
- **Fix**: `cd /opt/open-webui && git pull && systemctl restart open-webui`
- **Security**: Add HTTPS, proper auth configuration
- **Dependencies**: Ollama, LiteLLM integration

#### 2. Ollama (Container 201 - 10.90.10.124)
- **Current**: Unknown version
- **Target**: Latest stable
- **Fix**: `curl -fsSL https://ollama.ai/install.sh | sh`
- **Security**: Bind to internal network only
- **Config**: GPU acceleration if available

#### 3. LiteLLM (Container 202 - 10.90.11.219)
- **Current**: Unknown version
- **Target**: Latest stable
- **Fix**: Update Docker image, reconfigure endpoints
- **Security**: API key authentication
- **Integration**: Connect to Ollama backend

#### 4. n8n (Container 204 - 10.90.11.189)
- **Current**: v1.111.0
- **Target**: Latest stable
- **Fix**: Docker image update
- **Security**: Disable env var access, enable auth
- **Config**: Fix deprecation warnings (task runners, SQLite pool)

#### 5. FlowiseAI (Container 205 - 10.90.11.57)
- **Current**: Unknown version
- **Target**: Latest stable
- **Fix**: Docker image update
- **Security**: Authentication setup
- **Integration**: Connect to LLM stack

### 📁 Document Management Stack (Priority 2)

#### 6. Paperless-NGX (Container 221 - 10.90.10.52)
- **Current**: Unknown version
- **Target**: Latest stable
- **Fix**: Docker image update
- **Security**: User authentication, HTTPS
- **Storage**: Secure document storage

#### 7. DocuMenso (Container 220 - 10.90.11.14)
- **Current**: Unknown version
- **Target**: Latest stable
- **Fix**: Docker image update
- **Security**: E-signature security compliance

#### 8. Paperless-AI & Paperless-GPT (222, 223)
- **Issue**: Potential port conflicts
- **Fix**: Consolidate or isolate services
- **Security**: AI model access controls

### 🎬 Media Management Stack (Priority 3)

#### 9. Radarr (Container 210 - 10.90.10.189)
- **Fix**: Update to latest version
- **Security**: API key rotation, user auth
- **Integration**: Shared volume configuration

#### 10. Sonarr (Container 211 - 10.90.10.220)
- **Fix**: Update to latest version
- **Security**: API key rotation, user auth
- **Integration**: Shared volume configuration

#### 11. Prowlarr (Container 212 - 10.90.10.218)
- **Fix**: Update to latest version
- **Security**: Indexer security, VPN integration

#### 12. Overseerr (Container 213 - 10.90.11.194)
- **Fix**: Update to latest version
- **Security**: User authentication, request limits

### 🔧 Infrastructure Services (Priority 4)

#### 13. Authentik (Container 105 - 10.90.10.5)
- **Critical**: SSO authentication provider
- **Fix**: Update, configure for all services
- **Security**: SAML/OIDC setup, MFA
- **Integration**: Connect all web services

#### 14. Nginx Proxy Manager (Container 107)
- **Fix**: Update to latest version
- **Security**: SSL certificate automation
- **Config**: Reverse proxy for all services

#### 15. Bookstack (Container 108 - 10.90.10.8)
- **Fix**: Update to latest version
- **Security**: User auth via Authentik
- **Integration**: Documentation hub

#### 16. Wazuh (Container 109 - 10.90.10.9)
- **Issue**: Not collecting from containers
- **Fix**: Deploy agents to all containers
- **Security**: Log aggregation, alerting

### 📊 Missing Services (Priority 5)

#### 17. Monitoring Stack
- **Need**: Grafana + Prometheus container
- **Purpose**: Centralized monitoring dashboard
- **Metrics**: All 32 containers health/performance

#### 18. Backup System
- **Current**: PBS (Container 102)
- **Fix**: Automated backup schedules
- **Security**: Encrypted backups, retention

## Execution Order

### Phase 1: Core Infrastructure
1. **Authentik SSO** - Enable authentication for all services
2. **Nginx Proxy Manager** - Centralized reverse proxy
3. **Monitoring** - Deploy Grafana/Prometheus
4. **Wazuh Agents** - Security monitoring

### Phase 2: AI Stack Updates
1. **OpenWebUI** - v0.6.26 → v0.6.31
2. **Ollama** - Latest version + GPU config
3. **LiteLLM** - Latest + Ollama integration
4. **n8n** - Fix deprecations + workflows
5. **FlowiseAI** - Latest + integrations

### Phase 3: Application Updates
1. **Document Management** - Paperless stack
2. **Media Management** - *arr stack
3. **Development Tools** - Jupyter, Git server

### Phase 4: Portainer Migration
1. **Export Configurations** - All current containers
2. **Create Stack YAMLs** - Docker Compose format
3. **Test Deployment** - Staging environment
4. **Production Migration** - Zero-downtime switch

## Security Hardening Checklist

### Network Security
- [ ] Internal network isolation
- [ ] HTTPS for all web services
- [ ] VPN access for external connectivity
- [ ] Firewall rules per service

### Authentication
- [ ] Authentik SSO for all services
- [ ] Multi-factor authentication
- [ ] API key rotation schedule
- [ ] Service account isolation

### Monitoring & Logging
- [ ] Wazuh agents on all containers
- [ ] Grafana dashboards for all services
- [ ] Alert rules for security events
- [ ] Log retention policies

### Backup & Recovery
- [ ] Automated daily backups
- [ ] Recovery testing procedures
- [ ] Configuration backup
- [ ] Disaster recovery plan

## Estimated Timeline
- **Phase 1**: 2-3 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 4-6 hours
- **Phase 4**: 2-4 hours
- **Total**: 11-17 hours

## Success Metrics
1. All services accessible via HTTPS
2. Single sign-on working across stack
3. Monitoring dashboard showing all services
4. Security alerts functioning
5. Portainer stack deployment working
6. Zero custom code dependencies
# Ubuntu LXC Container Development Setup

## Container Information
- **IP**: 10.90.10.17
- **Hostname**: dev1rawgle
- **OS**: Ubuntu 24.04
- **User**: claude

## Development Stack to Install

### Core Tools
- Git, Vim, Nano, Htop, Tree, Curl, Wget
- Build essentials (gcc, make, etc.)
- JQ for JSON processing

### Runtime Environments
- **Node.js**: v20 LTS
- **Python**: 3.x with pip
- **Docker**: Latest CE with Docker Compose

### Database Clients
- PostgreSQL client
- Redis tools

### Development Ports (Firewall Configured)
- 22: SSH
- 3000: React development server
- 8000: Backend API server
- 5432: PostgreSQL
- 6379: Redis
- 9200: Elasticsearch

## Deployment Pattern for "Facebook Grade" Test Server

This container will be the first of many following this pattern:

### 1. Base Container Template
- Ubuntu 24.04 LTS
- Docker + Docker Compose
- Node.js + Python runtime
- Database clients
- Monitoring tools

### 2. Service Architecture
```
┌─────────────────────────────────────┐
│ Proxmox Host (Local Infrastructure) │
├─────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────┐ │
│ │ LXC: Web    │ │ LXC: Database   │ │
│ │ - Frontend  │ │ - PostgreSQL    │ │
│ │ - Backend   │ │ - Redis         │ │
│ │ - Nginx     │ │ - Elasticsearch │ │
│ └─────────────┘ └─────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ LXC: Testing & CI/CD            │ │
│ │ - Jest/Vitest runners           │ │
│ │ - Playwright E2E tests          │ │
│ │ - Load testing tools            │ │
│ │ - Monitoring/metrics            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3. Container Roles
1. **dev1rawgle** (Current): Primary development container
2. **db1rawgle**: Database services (PostgreSQL, Redis, Elasticsearch)
3. **test1rawgle**: Testing infrastructure (CI/CD, load testing)
4. **monitor1rawgle**: Metrics, logging, monitoring

### 4. Development Workflow
1. Code on local machine
2. Deploy to dev1rawgle for testing
3. Run integration tests against service containers
4. Load test using dedicated test container
5. Monitor performance and metrics

## Next Steps After Container Setup

1. **Clone repositories**: Set up project code in ~/projects/
2. **Configure environment**: Set up .env files for different services
3. **Docker services**: Set up local service stack (PostgreSQL, Redis, etc.)
4. **CI/CD pipeline**: Automate deployments between containers
5. **Monitoring**: Set up logging and metrics collection

## Security Considerations
- Containers are isolated on private network (10.90.10.x)
- Firewall rules restrict external access
- SSH key authentication (to be configured)
- Non-root user with sudo access
- Docker security best practices

## Scaling Pattern
Each new project follows this template:
- Create new LXC containers with standardized setup
- Use infrastructure as code (Terraform/Ansible) 
- Consistent networking and security policies
- Centralized monitoring and logging

<!-- OPENCLAW_TRELLO_CONTEXT:START -->
## Trello Integration Context
- Last inject: 2026-02-17 00:02 GMT+2
- Trello crawl status: pending valid API key+token (current key returned `invalid key`)
- Master sync note: [[openclaw/TRELLO_SYNC]]
<!-- OPENCLAW_TRELLO_CONTEXT:END -->


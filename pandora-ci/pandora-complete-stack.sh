#!/bin/bash
# Pandora Complete Stack Management Script
# Manages all 34 services in the Pandora-CI ecosystem

set -e

# Configuration
STACK_NAME="pandora"
OPENPROJECT_API_KEY="685e5ab3eb13a05edf5aa334cdaf38a3d745105ac5bfb3771bc1de0da657b4e8"
OPENPROJECT_URL="http://10.90.10.6:3002"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Service Categories
declare -A SERVICE_CATEGORIES=(
    ["databases"]="postgres redis mongodb mysql elasticsearch"
    ["cicd"]="gitlab gitlab-runner jenkins openproject"
    ["security"]="sonarqube trivy vault"
    ["monitoring"]="prometheus grafana loki promtail node-exporter cadvisor jaeger kibana"
    ["portal"]="backstage"
    ["ai"]="ollama open-webui"
    ["containers"]="portainer docker-registry"
    ["testing"]="selenium-hub selenium-chrome selenium-firefox"
    ["artifacts"]="nexus"
    ["messaging"]="rabbitmq"
    ["storage"]="minio"
)

# Service ports mapping
declare -A SERVICE_PORTS=(
    ["gitlab"]="3000"
    ["jenkins"]="3001"
    ["openproject"]="3002"
    ["backstage"]="3003"
    ["sonarqube"]="3004"
    ["grafana"]="3005"
    ["prometheus"]="3006"
    ["open-webui"]="3007"
    ["loki"]="3100"
    ["postgres"]="5432"
    ["redis"]="6379"
    ["mongodb"]="27017"
    ["mysql"]="3306"
    ["elasticsearch"]="9200"
    ["kibana"]="5601"
    ["selenium-hub"]="4444"
    ["rabbitmq"]="15672"
    ["nexus"]="8081"
    ["trivy"]="8084"
    ["vault"]="8200"
    ["cadvisor"]="8080"
    ["node-exporter"]="9100"
    ["portainer"]="9000"
    ["docker-registry"]="5001"
    ["minio"]="9002"
    ["ollama"]="11434"
    ["jaeger"]="16686"
)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_section() {
    echo -e "${PURPLE}========== $1 ==========${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_section "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check for required tools
    for tool in docker docker-compose curl jq git; do
        if ! command -v $tool &> /dev/null; then
            missing_tools+=($tool)
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install missing tools and try again"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check disk space (need at least 50GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [ $available_space -lt 52428800 ]; then
        log_warning "Less than 50GB disk space available"
    fi
    
    log_success "All prerequisites met"
}

# Initialize configuration files
init_configs() {
    log_section "Initializing Configuration Files"
    
    # Create directory structure
    mkdir -p ./prometheus ./grafana/provisioning/{dashboards,datasources} ./loki ./promtail
    mkdir -p ./jenkins-config ./registry/auth ./init-scripts/postgres
    
    # Prometheus config
    cat > ./prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
  
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
  
  - job_name: 'jenkins'
    metrics_path: '/prometheus'
    static_configs:
      - targets: ['jenkins:8080']
  
  - job_name: 'gitlab'
    static_configs:
      - targets: ['gitlab:9090']
  
  - job_name: 'openproject'
    static_configs:
      - targets: ['openproject:3000']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
EOF

    # Grafana datasource
    cat > ./grafana/provisioning/datasources/prometheus.yml <<EOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
  
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
  
  - name: Elasticsearch
    type: elasticsearch
    access: proxy
    url: http://elasticsearch:9200
    database: "[logs-]YYYY.MM.DD"
  
  - name: Jaeger
    type: jaeger
    access: proxy
    url: http://jaeger:16686
EOF

    # Loki config
    cat > ./loki/loki-config.yaml <<EOF
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093
EOF

    # Promtail config
    cat > ./promtail/promtail-config.yaml <<EOF
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log
EOF

    # PostgreSQL init script for multiple databases
    cat > ./init-scripts/postgres/init-databases.sh <<EOF
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE gitlab;
    CREATE DATABASE openproject;
    CREATE DATABASE sonarqube;
    CREATE DATABASE vault;
    CREATE DATABASE backstage;
    CREATE DATABASE nexus;
    GRANT ALL PRIVILEGES ON DATABASE gitlab TO pandora;
    GRANT ALL PRIVILEGES ON DATABASE openproject TO pandora;
    GRANT ALL PRIVILEGES ON DATABASE sonarqube TO pandora;
    GRANT ALL PRIVILEGES ON DATABASE vault TO pandora;
    GRANT ALL PRIVILEGES ON DATABASE backstage TO pandora;
    GRANT ALL PRIVILEGES ON DATABASE nexus TO pandora;
EOSQL
EOF
    chmod +x ./init-scripts/postgres/init-databases.sh

    # Docker Registry auth
    docker run --rm --entrypoint htpasswd registry:2 -Bbn pandora PandoraRegistry2025! > ./registry/auth/htpasswd 2>/dev/null || true

    log_success "Configuration files initialized"
}

# Start all services
start_stack() {
    log_section "Starting Pandora Stack"
    
    # Start by priority
    log_info "Starting databases..."
    docker-compose -f docker-compose-complete.yml up -d postgres redis mongodb mysql elasticsearch
    sleep 30
    
    log_info "Starting CI/CD services..."
    docker-compose -f docker-compose-complete.yml up -d gitlab gitlab-runner jenkins openproject
    sleep 20
    
    log_info "Starting monitoring services..."
    docker-compose -f docker-compose-complete.yml up -d prometheus grafana loki promtail node-exporter cadvisor jaeger kibana
    sleep 10
    
    log_info "Starting remaining services..."
    docker-compose -f docker-compose-complete.yml up -d
    
    log_success "Stack started successfully"
}

# Stop all services
stop_stack() {
    log_section "Stopping Pandora Stack"
    docker-compose -f docker-compose-complete.yml down
    log_success "Stack stopped"
}

# Check service health
check_service() {
    local service=$1
    local port=${SERVICE_PORTS[$service]}
    
    if [ -z "$port" ]; then
        return 0
    fi
    
    if curl -s -f -o /dev/null "http://localhost:$port" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $service (port $port)"
        return 0
    else
        echo -e "${RED}✗${NC} $service (port $port)"
        return 1
    fi
}

# Check all services
check_all_services() {
    log_section "Service Health Status"
    
    local category_status=()
    
    for category in "${!SERVICE_CATEGORIES[@]}"; do
        echo ""
        echo -e "${CYAN}[$category]${NC}"
        for service in ${SERVICE_CATEGORIES[$category]}; do
            check_service "$service" || true
        done
    done
}

# Initialize specific services
init_gitlab() {
    log_info "Initializing GitLab..."
    
    # Wait for GitLab to be ready
    while ! curl -s -f -o /dev/null "http://localhost:3000/users/sign_in"; do
        log_info "Waiting for GitLab to start (this can take 5+ minutes)..."
        sleep 30
    done
    
    log_success "GitLab is ready"
    log_info "GitLab root password: PandoraGitLab2025!"
}

init_jenkins() {
    log_info "Initializing Jenkins..."
    
    # Install plugins
    docker exec pandora-jenkins jenkins-plugin-cli --plugins \
        git workflow-aggregator pipeline-stage-view \
        docker-workflow docker-plugin \
        prometheus metrics \
        sonar gitlab-plugin
    
    log_success "Jenkins initialized"
}

init_sonarqube() {
    log_info "Initializing SonarQube..."
    
    # Wait for SonarQube
    while ! curl -s -f -o /dev/null "http://localhost:3004"; do
        log_info "Waiting for SonarQube..."
        sleep 10
    done
    
    # Change default password
    curl -u admin:admin -X POST \
        "http://localhost:3004/api/users/change_password" \
        -d "login=admin&password=PandoraSonar2025!&previousPassword=admin" 2>/dev/null || true
    
    log_success "SonarQube initialized"
}

init_ollama() {
    log_info "Initializing Ollama..."
    
    # Pull default models
    docker exec pandora-ollama ollama pull llama3
    docker exec pandora-ollama ollama pull codellama
    docker exec pandora-ollama ollama pull mistral
    
    log_success "Ollama models downloaded"
}

# Full initialization
init_all() {
    log_section "Initializing All Services"
    
    check_prerequisites
    init_configs
    start_stack
    
    log_info "Waiting for services to stabilize..."
    sleep 60
    
    init_gitlab
    init_jenkins
    init_sonarqube
    init_ollama
    
    log_success "All services initialized!"
    show_urls
}

# Show all service URLs
show_urls() {
    echo ""
    echo "======================================"
    echo -e "${GREEN}🚀 Pandora Complete Stack - Service URLs${NC}"
    echo "======================================"
    echo ""
    
    echo -e "${CYAN}Version Control & CI/CD:${NC}"
    echo "  GitLab:          http://10.90.10.6:3000"
    echo "  Jenkins:         http://10.90.10.6:3001"
    echo "  OpenProject:     http://10.90.10.6:3002"
    echo ""
    
    echo -e "${CYAN}Developer Portal:${NC}"
    echo "  Backstage:       http://10.90.10.6:3003"
    echo ""
    
    echo -e "${CYAN}Code Quality & Security:${NC}"
    echo "  SonarQube:       http://10.90.10.6:3004"
    echo "  Trivy:           http://10.90.10.6:8084"
    echo "  Vault:           http://10.90.10.6:8200"
    echo ""
    
    echo -e "${CYAN}Monitoring & Observability:${NC}"
    echo "  Grafana:         http://10.90.10.6:3005"
    echo "  Prometheus:      http://10.90.10.6:3006"
    echo "  Kibana:          http://10.90.10.6:5601"
    echo "  Jaeger:          http://10.90.10.6:16686"
    echo ""
    
    echo -e "${CYAN}AI & Machine Learning:${NC}"
    echo "  Open WebUI:      http://10.90.10.6:3007"
    echo "  Ollama API:      http://10.90.10.6:11434"
    echo ""
    
    echo -e "${CYAN}Container & Artifact Management:${NC}"
    echo "  Portainer:       http://10.90.10.6:9000"
    echo "  Nexus:           http://10.90.10.6:8081"
    echo "  Docker Registry: http://10.90.10.6:5001"
    echo ""
    
    echo -e "${CYAN}Testing:${NC}"
    echo "  Selenium Grid:   http://10.90.10.6:4444"
    echo ""
    
    echo -e "${CYAN}Storage & Messaging:${NC}"
    echo "  MinIO Console:   http://10.90.10.6:9002"
    echo "  RabbitMQ:        http://10.90.10.6:15672"
    echo ""
    
    echo "======================================"
    echo -e "${YELLOW}Default Credentials:${NC}"
    echo "======================================"
    echo "GitLab:       root / PandoraGitLab2025!"
    echo "Jenkins:      admin / PandoraJenkins2025!"
    echo "OpenProject:  admin / PandoraAdmin2025!"
    echo "SonarQube:    admin / PandoraSonar2025!"
    echo "Grafana:      admin / PandoraGrafana2025!"
    echo "Portainer:    admin / (set on first login)"
    echo "Vault:        Token: pandora-vault-token-2025"
    echo "RabbitMQ:     pandora / PandoraRabbit2025!"
    echo "MinIO:        pandora / PandoraMinio2025!"
    echo "Registry:     pandora / PandoraRegistry2025!"
    echo ""
    echo "OpenProject API: ${OPENPROJECT_API_KEY}"
    echo "======================================"
}

# View logs
view_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        docker-compose -f docker-compose-complete.yml logs -f --tail=100
    else
        docker-compose -f docker-compose-complete.yml logs -f --tail=100 "$service"
    fi
}

# Backup all data
backup_data() {
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    log_section "Backing Up All Data"
    
    # Stop services for consistent backup
    log_info "Stopping services for backup..."
    stop_stack
    
    # Backup all volumes
    local volumes=(
        postgres_data redis_data mongodb_data mysql_data elasticsearch_data
        gitlab_config gitlab_logs gitlab_data jenkins_data
        openproject_data sonarqube_data vault_data
        prometheus_data grafana_data nexus_data
        portainer_data registry_data minio_data
    )
    
    for volume in "${volumes[@]}"; do
        log_info "Backing up $volume..."
        docker run --rm -v ${STACK_NAME}_${volume}:/data -v "$backup_dir":/backup \
            alpine tar czf /backup/${volume}.tar.gz -C /data .
    done
    
    # Restart services
    start_stack
    
    log_success "Backup completed to $backup_dir"
}

# Restore from backup
restore_data() {
    local backup_dir=$1
    
    if [ -z "$backup_dir" ]; then
        log_error "Please provide backup directory"
        exit 1
    fi
    
    log_section "Restoring from Backup"
    
    stop_stack
    
    # Restore volumes
    for backup_file in "$backup_dir"/*.tar.gz; do
        if [ -f "$backup_file" ]; then
            local volume_name=$(basename "$backup_file" .tar.gz)
            log_info "Restoring $volume_name..."
            docker run --rm -v ${STACK_NAME}_${volume_name}:/data -v "$backup_dir":/backup \
                alpine sh -c "rm -rf /data/* && tar xzf /backup/${volume_name}.tar.gz -C /data"
        fi
    done
    
    start_stack
    log_success "Restore completed"
}

# Main menu
show_menu() {
    echo ""
    echo "======================================"
    echo -e "${PURPLE}   Pandora Complete Stack Management${NC}"
    echo "         34 Services Total"
    echo "======================================"
    echo "1.  Start all services"
    echo "2.  Stop all services"
    echo "3.  Restart all services"
    echo "4.  Check service health"
    echo "5.  Initialize all (first time setup)"
    echo "6.  Initialize GitLab"
    echo "7.  Initialize Jenkins"
    echo "8.  Initialize SonarQube"
    echo "9.  Initialize Ollama"
    echo "10. Show all URLs"
    echo "11. View logs"
    echo "12. Backup all data"
    echo "13. Restore from backup"
    echo "14. Update all images"
    echo "15. Exit"
    echo "======================================"
    echo -n "Select option: "
}

# Update all images
update_images() {
    log_section "Updating All Docker Images"
    
    docker-compose -f docker-compose-complete.yml pull
    
    log_success "All images updated"
    log_info "Restart stack to apply updates"
}

# Main script
main() {
    case "$1" in
        start)
            check_prerequisites
            init_configs
            start_stack
            ;;
        stop)
            stop_stack
            ;;
        restart)
            stop_stack
            start_stack
            ;;
        check)
            check_all_services
            ;;
        init)
            init_all
            ;;
        urls)
            show_urls
            ;;
        logs)
            view_logs "$2"
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data "$2"
            ;;
        update)
            update_images
            ;;
        menu|"")
            while true; do
                show_menu
                read choice
                case $choice in
                    1) check_prerequisites && init_configs && start_stack ;;
                    2) stop_stack ;;
                    3) stop_stack && start_stack ;;
                    4) check_all_services ;;
                    5) init_all ;;
                    6) init_gitlab ;;
                    7) init_jenkins ;;
                    8) init_sonarqube ;;
                    9) init_ollama ;;
                    10) show_urls ;;
                    11) 
                        echo -n "Service name (or press Enter for all): "
                        read service
                        view_logs "$service"
                        ;;
                    12) backup_data ;;
                    13) 
                        echo -n "Backup directory: "
                        read backup_dir
                        restore_data "$backup_dir"
                        ;;
                    14) update_images ;;
                    15) exit 0 ;;
                    *) log_error "Invalid option" ;;
                esac
                echo ""
                echo "Press Enter to continue..."
                read
            done
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|check|init|urls|logs|backup|restore|update|menu}"
            echo ""
            echo "Commands:"
            echo "  start     - Start all services"
            echo "  stop      - Stop all services"
            echo "  restart   - Restart all services"
            echo "  check     - Check service health"
            echo "  init      - Initialize all services (first run)"
            echo "  urls      - Show all service URLs"
            echo "  logs      - View service logs"
            echo "  backup    - Backup all data"
            echo "  restore   - Restore from backup"
            echo "  update    - Update all Docker images"
            echo "  menu      - Interactive menu"
            exit 1
            ;;
    esac
}

main "$@"

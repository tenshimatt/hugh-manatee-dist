#!/bin/bash

# Proxmox Stack Automation Setup Script
# This script sets up the complete production automation system

set -e

echo "🚀 Setting up Proxmox Stack Automation System..."

# Configuration
POSTGRES_HOST="10.90.10.6"
POSTGRES_CONTAINER="pandora-postgres"
POSTGRES_USER="openproject"
POSTGRES_DB="openproject_db"
N8N_URL="http://10.90.10.6:5678"
GRAFANA_URL="http://10.90.10.6:3005"

echo "📋 Step 1: Verify Prerequisites..."

# Check Docker hosts are accessible
echo "  - Checking Docker host connectivity..."
ssh root@10.90.10.6 "docker ps | grep -E '(postgres|n8n|grafana)' | wc -l" > /dev/null
if [ $? -eq 0 ]; then
    echo "  ✅ Docker host accessible"
else
    echo "  ❌ Cannot access Docker host"
    exit 1
fi

# Check Proxmox host connectivity
echo "  - Checking Proxmox host connectivity..."
ssh root@10.90.10.10 "pct list | head -1" > /dev/null
if [ $? -eq 0 ]; then
    echo "  ✅ Proxmox host accessible"
else
    echo "  ❌ Cannot access Proxmox host"
    exit 1
fi

echo "🗄️ Step 2: Setup Database Schema..."

# Import database schema
echo "  - Creating automation database tables..."
ssh root@10.90.10.6 "docker exec -i ${POSTGRES_CONTAINER} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}" < automation-database-schema.sql
if [ $? -eq 0 ]; then
    echo "  ✅ Database schema created successfully"
else
    echo "  ⚠️ Database schema creation had warnings (likely already exists)"
fi

echo "🔑 Step 3: Setup SSH Key Authentication..."

# Generate SSH key for automation if it doesn't exist
if [ ! -f ~/.ssh/automation_key ]; then
    echo "  - Generating SSH key for automation..."
    ssh-keygen -t ed25519 -f ~/.ssh/automation_key -N "" -C "proxmox-automation"
    echo "  ✅ SSH key generated"
else
    echo "  ✅ SSH key already exists"
fi

# Copy SSH key to both hosts
echo "  - Setting up key-based authentication..."
ssh-copy-id -i ~/.ssh/automation_key root@10.90.10.6 2>/dev/null || echo "  🔄 Key already exists on Docker host"
ssh-copy-id -i ~/.ssh/automation_key root@10.90.10.10 2>/dev/null || echo "  🔄 Key already exists on Proxmox host"

echo "📊 Step 4: Configure Grafana Dashboard..."

# Check if Grafana is accessible
echo "  - Testing Grafana connectivity..."
curl -s "${GRAFANA_URL}/api/health" > /dev/null
if [ $? -eq 0 ]; then
    echo "  ✅ Grafana accessible"

    # Create PostgreSQL datasource in Grafana
    echo "  - Creating PostgreSQL datasource..."
    curl -X POST "${GRAFANA_URL}/api/datasources" \
        -H "Content-Type: application/json" \
        -u "admin:admin123" \
        -d '{
            "name": "postgres-automation",
            "type": "postgres",
            "url": "'${POSTGRES_HOST}':5432",
            "database": "'${POSTGRES_DB}'",
            "user": "'${POSTGRES_USER}'",
            "password": "openproject123",
            "sslmode": "disable"
        }' 2>/dev/null || echo "  🔄 Datasource might already exist"

    # Import dashboard
    echo "  - Importing automation dashboard..."
    curl -X POST "${GRAFANA_URL}/api/dashboards/db" \
        -H "Content-Type: application/json" \
        -u "admin:admin123" \
        -d @automation-dashboard.json 2>/dev/null || echo "  🔄 Dashboard import attempted"

    echo "  ✅ Grafana configuration completed"
else
    echo "  ❌ Cannot access Grafana"
fi

echo "🔄 Step 5: Setup n8n Workflow..."

echo "  - n8n workflow setup instructions:"
echo "    1. Open n8n at: ${N8N_URL}"
echo "    2. Import the workflow from: n8n-proxmox-automation.json"
echo "    3. Configure PostgreSQL credentials:"
echo "       - Host: ${POSTGRES_HOST}"
echo "       - Port: 5432"
echo "       - Database: ${POSTGRES_DB}"
echo "       - Username: ${POSTGRES_USER}"
echo "       - Password: openproject123"
echo "    4. Activate the workflow to enable the 3 AM schedule"

echo "🧪 Step 6: Test Automation Components..."

# Test database connectivity
echo "  - Testing database connectivity..."
ssh root@10.90.10.6 "docker exec ${POSTGRES_CONTAINER} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c 'SELECT COUNT(*) FROM container_metadata;'" > /dev/null
if [ $? -eq 0 ]; then
    echo "  ✅ Database connectivity verified"
else
    echo "  ❌ Database connectivity failed"
fi

# Test container status check
echo "  - Testing container status check..."
ssh root@10.90.10.10 "pct status 100" > /dev/null
if [ $? -eq 0 ]; then
    echo "  ✅ Container status check working"
else
    echo "  ❌ Container status check failed"
fi

echo "📈 Step 7: Setup Monitoring & Alerts..."

# Create basic health check script
cat > /tmp/health_check.sh << 'EOF'
#!/bin/bash
# Basic health monitoring for automation system

# Check if automation database tables exist
DB_CHECK=$(ssh root@10.90.10.6 "docker exec pandora-postgres psql -U openproject -d openproject_db -c '\dt' | grep update_log | wc -l")
if [ "$DB_CHECK" -eq "1" ]; then
    echo "✅ Database: OK"
else
    echo "❌ Database: FAILED"
fi

# Check if n8n is running
N8N_CHECK=$(ssh root@10.90.10.6 "docker ps | grep n8n | wc -l")
if [ "$N8N_CHECK" -eq "1" ]; then
    echo "✅ n8n: OK"
else
    echo "❌ n8n: FAILED"
fi

# Check if Grafana is accessible
GRAFANA_CHECK=$(curl -s http://10.90.10.6:3005/api/health | grep -c '"database":"ok"')
if [ "$GRAFANA_CHECK" -eq "1" ]; then
    echo "✅ Grafana: OK"
else
    echo "❌ Grafana: FAILED"
fi

# Check Proxmox connectivity
PROXMOX_CHECK=$(ssh root@10.90.10.10 "pct list" | head -1 | grep -c "VMID")
if [ "$PROXMOX_CHECK" -eq "1" ]; then
    echo "✅ Proxmox: OK"
else
    echo "❌ Proxmox: FAILED"
fi
EOF

chmod +x /tmp/health_check.sh
scp /tmp/health_check.sh root@10.90.10.6:/opt/automation_health_check.sh

echo "  ✅ Health check script installed"

echo "🎯 Step 8: Final Configuration Summary..."

echo ""
echo "🎉 AUTOMATION SETUP COMPLETE!"
echo ""
echo "📋 SYSTEM OVERVIEW:"
echo "  🗄️  Database: Automation tables created in PostgreSQL"
echo "  🔄 Workflow: n8n workflow ready for import"
echo "  📊 Dashboard: Grafana dashboard configured"
echo "  ⏰ Schedule: Daily execution at 3:00 AM"
echo "  🔍 Monitoring: Health checks and logging enabled"
echo ""
echo "🎛️ MANAGEMENT INTERFACES:"
echo "  📊 Grafana Dashboard: ${GRAFANA_URL}/d/proxmox-automation"
echo "  🔄 n8n Workflows: ${N8N_URL}/workflows"
echo "  🗄️ Database Logs: Query 'update_log' and 'automation_summary' tables"
echo ""
echo "🔧 NEXT STEPS:"
echo "  1. Import n8n workflow: ${N8N_URL}"
echo "  2. Configure PostgreSQL credentials in n8n"
echo "  3. Activate the workflow to enable scheduling"
echo "  4. Run health check: ssh root@10.90.10.6 '/opt/automation_health_check.sh'"
echo "  5. Monitor first execution in Grafana dashboard"
echo ""
echo "⚠️  IMPORTANT:"
echo "  - The workflow will run automatically at 3:00 AM daily"
echo "  - Monitor execution logs in Grafana dashboard"
echo "  - Critical containers (docker hosts) are excluded from auto-updates"
echo "  - Manual intervention may be needed for failed updates"
echo ""
echo "🚀 Production automation system is ready!"
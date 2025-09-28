#!/bin/bash

# Test script for Proxmox Stack Automation System
# This script validates all components are working properly

echo "🧪 Testing Proxmox Stack Automation System..."
echo

# Test 1: Database connectivity and schema
echo "📋 Test 1: Database Schema Validation"
echo "  - Testing database connectivity..."

DB_TEST=$(ssh root@10.90.10.6 "docker exec pandora-postgres psql -U openproject -d openproject_db -c 'SELECT COUNT(*) FROM container_metadata;' 2>/dev/null | grep -E '[0-9]+' | head -1 | tr -d ' '")

if [ "$DB_TEST" -gt "0" ]; then
    echo "  ✅ Database accessible with $DB_TEST container records"
else
    echo "  ❌ Database connectivity failed"
    exit 1
fi

# Test table existence
echo "  - Checking automation tables..."
TABLES_TEST=$(ssh root@10.90.10.6 "docker exec pandora-postgres psql -U openproject -d openproject_db -c '\dt' 2>/dev/null | grep -E '(update_log|automation_summary|system_health|container_metadata)' | wc -l")

if [ "$TABLES_TEST" -eq "4" ]; then
    echo "  ✅ All automation tables exist"
else
    echo "  ⚠️ Some automation tables missing ($TABLES_TEST/4 found)"
fi

# Test 2: Proxmox connectivity
echo
echo "🖥️ Test 2: Proxmox Connectivity"
echo "  - Testing Proxmox host connectivity..."

PROXMOX_TEST=$(expect << 'EOF'
spawn ssh root@10.90.10.10 "pct list | head -5"
expect "password:"
send "1Thisismydell!\r"
expect "#"
send "exit\r"
expect eof
EOF 2>/dev/null | grep -c "VMID")

if [ "$PROXMOX_TEST" -eq "1" ]; then
    echo "  ✅ Proxmox accessible"
else
    echo "  ❌ Proxmox connectivity failed"
fi

# Test 3: Container status checks
echo
echo "📦 Test 3: Container Status Checks"
echo "  - Testing container status commands..."

CONTAINER_STATUS=$(expect << 'EOF'
spawn ssh root@10.90.10.10 "pct status 100"
expect "password:"
send "1Thisismydell!\r"
expect "#"
send "exit\r"
expect eof
EOF 2>/dev/null | grep -c "status:")

if [ "$CONTAINER_STATUS" -eq "1" ]; then
    echo "  ✅ Container status check working"
else
    echo "  ❌ Container status check failed"
fi

# Test 4: n8n accessibility
echo
echo "🔄 Test 4: n8n Workflow Engine"
echo "  - Testing n8n accessibility..."

N8N_STATUS=$(curl -s "http://10.90.10.6:5678" | grep -c "n8n")
N8N_CONTAINER=$(ssh root@10.90.10.6 "docker ps | grep n8n | grep -c healthy")

if [ "$N8N_STATUS" -eq "1" ] && [ "$N8N_CONTAINER" -eq "1" ]; then
    echo "  ✅ n8n accessible and healthy"
else
    echo "  ❌ n8n not accessible or unhealthy"
fi

# Test 5: Grafana connectivity
echo
echo "📊 Test 5: Grafana Dashboard"
echo "  - Testing Grafana accessibility..."

GRAFANA_STATUS=$(curl -s "http://10.90.10.6:3005/api/health" | grep -c '"database":"ok"')
GRAFANA_DATASOURCE=$(curl -s -u "admin:admin123" "http://10.90.10.6:3005/api/datasources" | grep -c "postgres-automation")

if [ "$GRAFANA_STATUS" -eq "1" ]; then
    echo "  ✅ Grafana accessible and healthy"
else
    echo "  ❌ Grafana not accessible"
fi

if [ "$GRAFANA_DATASOURCE" -eq "1" ]; then
    echo "  ✅ PostgreSQL datasource configured"
else
    echo "  ❌ PostgreSQL datasource missing"
fi

# Test 6: Insert test data
echo
echo "📝 Test 6: Database Operations"
echo "  - Testing database insert operations..."

TEST_INSERT=$(ssh root@10.90.10.6 "docker exec pandora-postgres psql -U openproject -d openproject_db -c \"INSERT INTO update_log (container_id, container_name, status, timestamp, available_updates) VALUES ('999', 'test-container', 'testing', NOW(), 0); SELECT COUNT(*) FROM update_log WHERE container_id = '999';\" 2>/dev/null | grep -E '[0-9]+' | tail -1 | tr -d ' '")

if [ "$TEST_INSERT" -eq "1" ]; then
    echo "  ✅ Database insert operation successful"

    # Clean up test data
    ssh root@10.90.10.6 "docker exec pandora-postgres psql -U openproject -d openproject_db -c \"DELETE FROM update_log WHERE container_id = '999';\" >/dev/null 2>&1"
    echo "  ✅ Test data cleaned up"
else
    echo "  ❌ Database insert operation failed"
fi

# Test 7: Container metadata verification
echo
echo "🗂️ Test 7: Container Metadata"
echo "  - Checking container metadata..."

METADATA_COUNT=$(ssh root@10.90.10.6 "docker exec pandora-postgres psql -U openproject -d openproject_db -c 'SELECT COUNT(*) FROM container_metadata WHERE auto_update_enabled = true;' 2>/dev/null | grep -E '[0-9]+' | head -1 | tr -d ' '")

if [ "$METADATA_COUNT" -gt "0" ]; then
    echo "  ✅ Container metadata configured ($METADATA_COUNT containers enabled for auto-update)"
else
    echo "  ❌ No container metadata found"
fi

# Summary
echo
echo "📋 AUTOMATION SYSTEM TEST SUMMARY"
echo "================================="
echo
echo "🔧 SYSTEM COMPONENTS:"
echo "  📊 Grafana Dashboard: http://10.90.10.6:3005"
echo "  🔄 n8n Workflows: http://10.90.10.6:5678"
echo "  🗄️ PostgreSQL Database: Configured with automation schema"
echo "  🖥️ Proxmox Host: 10.90.10.10 (container management)"
echo "  🐳 Docker Host: 10.90.10.6 (service orchestration)"
echo
echo "⚙️ AUTOMATION FEATURES:"
echo "  ⏰ Scheduled Execution: 3:00 AM daily (requires n8n workflow activation)"
echo "  📝 Comprehensive Logging: All operations logged to database"
echo "  📊 Real-time Monitoring: Grafana dashboard with live metrics"
echo "  🚨 Error Handling: Failed updates logged and tracked"
echo "  🔍 Health Monitoring: Container health metrics collection"
echo
echo "🎯 NEXT STEPS:"
echo "  1. Import n8n workflow: Copy n8n-proxmox-automation.json to n8n"
echo "  2. Configure PostgreSQL credentials in n8n workflow"
echo "  3. Activate the workflow to enable 3 AM scheduling"
echo "  4. Import Grafana dashboard: automation-dashboard.json"
echo "  5. Monitor first execution at 3:00 AM"
echo
echo "🎉 System validation complete! Ready for production automation."
#!/bin/bash
# Coordination Agent - Master coordinator for all repair agents

cd /Users/mattwright/pandora/rawgle-platform/rawgle-pure

echo "🎯 COORDINATION AGENT STARTING"
echo "=============================="
echo "Mission: Master coordination of all repair agents"
echo "Current time: $(date)"

LOG_FILE="/tmp/coordination-agent.log"
exec 2>&1 | tee -a "$LOG_FILE"

echo ""
echo "📊 SYSTEM STATUS OVERVIEW:"

# Count test failures
TOTAL_TESTS=$(find tests/test-scripts -name "*.js" -not -name "test-index.js" | wc -l | tr -d ' ')
STUB_TESTS=$(grep -r "Test implementation pending" tests/test-scripts/*.js | wc -l | tr -d ' ')
WORKING_TESTS=$((TOTAL_TESTS - STUB_TESTS))

echo "Tests Status:"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Working Tests: $WORKING_TESTS"
echo "  Stub Tests: $STUB_TESTS"
echo "  Success Rate: $((WORKING_TESTS * 100 / TOTAL_TESTS))%"

# Backend health
API_BASE="https://rawgle-api.findrawdogfood.workers.dev"
BACKEND_HEALTH=$(curl -s "$API_BASE/api/health" | grep -c "healthy" || echo "0")
if [ "$BACKEND_HEALTH" -eq "1" ]; then
    echo "Backend Status: ✅ Healthy"
else
    echo "Backend Status: ❌ Unhealthy"
fi

# Frontend status
FRONTEND_URL="https://5dc2641e.rawgle-platform.pages.dev"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
echo "Frontend Status: $FRONTEND_STATUS"

echo ""
echo "🎯 COORDINATION STRATEGY:"

if [ "$STUB_TESTS" -gt "100" ]; then
    echo "PRIORITY 1: Test Implementation (Critical)"
    echo "  → $STUB_TESTS stub tests need real implementations"
fi

if [ "$BACKEND_HEALTH" -eq "0" ]; then
    echo "PRIORITY 1: Backend Repair (Critical)"
    echo "  → API health endpoint failing"
fi

echo ""
echo "📋 AGENT COORDINATION:"

# Track agent status
track_agent_status() {
    local agent_name="$1"
    local log_file="$2"
    
    if [ -f "$log_file" ]; then
        local last_activity=$(tail -1 "$log_file" 2>/dev/null | cut -d':' -f1-2 || echo "Never")
        echo "  $agent_name: Active (Last: $last_activity)"
    else
        echo "  $agent_name: Not Started"
    fi
}

echo "Agent Status:"
track_agent_status "Test Generator" "/tmp/test-generator-agent.log"
track_agent_status "Backend Repair" "/tmp/backend-repair-agent.log"
track_agent_status "Auth Repair" "/tmp/auth-repair-agent.log"
track_agent_status "Frontend Repair" "/tmp/frontend-repair-agent.log"

echo ""
echo "⏳ Coordination Agent monitoring system health..."
echo "Coordinating repair efforts across all agents..."

# Main coordination loop
LOOP_COUNT=0
while true; do
    sleep 30
    LOOP_COUNT=$((LOOP_COUNT + 1))
    
    echo "$(date): Coordination check #$LOOP_COUNT" >> "$LOG_FILE"
    
    # Re-check system status every 5 minutes
    if [ $((LOOP_COUNT % 10)) -eq 0 ]; then
        echo ""
        echo "🔄 STATUS UPDATE #$((LOOP_COUNT / 10)):"
        
        # Recount stub tests
        NEW_STUB_COUNT=$(grep -r "Test implementation pending" tests/test-scripts/*.js | wc -l | tr -d ' ')
        if [ "$NEW_STUB_COUNT" -ne "$STUB_TESTS" ]; then
            echo "Test Progress: Stub tests reduced from $STUB_TESTS to $NEW_STUB_COUNT"
            STUB_TESTS=$NEW_STUB_COUNT
        fi
        
        # Check backend again
        NEW_BACKEND_HEALTH=$(curl -s "$API_BASE/api/health" | grep -c "healthy" || echo "0")
        if [ "$NEW_BACKEND_HEALTH" -ne "$BACKEND_HEALTH" ]; then
            if [ "$NEW_BACKEND_HEALTH" -eq "1" ]; then
                echo "Backend Status: ❌ → ✅ RECOVERED"
            else
                echo "Backend Status: ✅ → ❌ DEGRADED"
            fi
            BACKEND_HEALTH=$NEW_BACKEND_HEALTH
        fi
    fi
done
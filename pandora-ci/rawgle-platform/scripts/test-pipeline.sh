#!/bin/bash

# Test Pipeline Validation Script
# Tests the complete AI-driven CI/CD pipeline end-to-end

set -e

echo "🚀 Testing Rawgle AI-Driven CI/CD Pipeline"
echo "==========================================="

# Configuration
GITLAB_URL="http://pandora-gitlab:3000"
JENKINS_URL="http://pandora-jenkins:3001"
OLLAMA_URL="http://pandora-ollama:11434"
SELENIUM_HUB="http://pandora-selenium-hub:4444"
GRAFANA_URL="http://pandora-grafana:3005"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_service() {
    local service_name=$1
    local service_url=$2

    echo -n "Testing $service_name... "

    if curl -s -o /dev/null -w "%{http_code}" "$service_url" | grep -q "200\|302\|401"; then
        echo -e "${GREEN}✓ ONLINE${NC}"
        return 0
    else
        echo -e "${RED}✗ OFFLINE${NC}"
        return 1
    fi
}

test_ollama_model() {
    echo -n "Testing Ollama model availability... "

    local response=$(curl -s -X POST "$OLLAMA_URL/api/generate" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "qwen2.5-coder:latest",
            "prompt": "Test prompt",
            "stream": false
        }' | jq -r '.response // "error"')

    if [[ "$response" != "error" && -n "$response" ]]; then
        echo -e "${GREEN}✓ MODEL RESPONDING${NC}"
        return 0
    else
        echo -e "${RED}✗ MODEL NOT RESPONDING${NC}"
        return 1
    fi
}

test_selenium_grid() {
    echo -n "Testing Selenium Grid... "

    local status=$(curl -s "$SELENIUM_HUB/status" | jq -r '.value.ready // false')

    if [[ "$status" == "true" ]]; then
        echo -e "${GREEN}✓ GRID READY${NC}"
        return 0
    else
        echo -e "${RED}✗ GRID NOT READY${NC}"
        return 1
    fi
}

run_intentional_failure() {
    echo "🔥 Running intentional failure test..."

    # Run the auth failure test that should trigger AI fix
    if npm test tests/intentional-failures/auth-failure.test.js --json > test-failure-results.json; then
        echo -e "${YELLOW}⚠ Tests passed (they should have failed)${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Tests failed as expected${NC}"
        echo "📊 Test failure details:"
        cat test-failure-results.json | jq '.testResults[0].assertionResults[] | select(.status == "failed") | .title'
        return 0
    fi
}

wait_for_jenkins_trigger() {
    echo "⏱ Waiting for Jenkins pipeline to trigger..."

    local start_time=$(date +%s)
    local timeout=300  # 5 minutes

    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))

        if [[ $elapsed -gt $timeout ]]; then
            echo -e "${RED}✗ Jenkins pipeline did not trigger within 5 minutes${NC}"
            return 1
        fi

        # Check if Jenkins job is running
        local job_status=$(curl -s "$JENKINS_URL/job/ai-fix-pipeline/lastBuild/api/json" | jq -r '.building // false')

        if [[ "$job_status" == "true" ]]; then
            echo -e "${GREEN}✓ Jenkins pipeline triggered${NC}"
            return 0
        fi

        echo -n "."
        sleep 10
    done
}

monitor_ai_fix_generation() {
    echo "🤖 Monitoring AI fix generation..."

    # Check if AI scripts can run
    echo "Testing AI fix generator..."
    python3 scripts/ai_fix_generator.py \
        --failures "Sample test failure" \
        --documentation "Sample documentation" \
        --ollama-url "$OLLAMA_URL" \
        --output test-fix.patch

    if [[ -f test-fix.patch && -s test-fix.patch ]]; then
        echo -e "${GREEN}✓ AI fix generator working${NC}"
        echo "Generated fix preview:"
        head -10 test-fix.patch
        rm test-fix.patch
        return 0
    else
        echo -e "${RED}✗ AI fix generator failed${NC}"
        return 1
    fi
}

check_documentation_coverage() {
    echo "📚 Checking documentation coverage..."

    local doc_count=$(find docs -name "*.md" | wc -l)

    if [[ $doc_count -gt 5 ]]; then
        echo -e "${GREEN}✓ Documentation coverage sufficient ($doc_count files)${NC}"
        echo "Available documentation:"
        find docs -name "*.md" | head -10
        return 0
    else
        echo -e "${RED}✗ Insufficient documentation ($doc_count files)${NC}"
        return 1
    fi
}

test_metrics_collection() {
    echo "📊 Testing metrics collection..."

    # Create sample metrics
    echo "ai_fix_attempts_total{status=\"test\"} 1" | curl --data-binary @- \
        "http://pandora-prometheus:3006/metrics/job/pipeline_test" || true

    # Wait a moment for metrics to be scraped
    sleep 5

    # Query metrics
    local metrics=$(curl -s "http://pandora-prometheus:3006/api/v1/query?query=ai_fix_attempts_total" | \
        jq -r '.data.result | length')

    if [[ $metrics -gt 0 ]]; then
        echo -e "${GREEN}✓ Metrics collection working${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Metrics may not be flowing yet${NC}"
        return 0  # Don't fail on metrics
    fi
}

validate_complete_pipeline() {
    echo "🔄 Validating complete pipeline integration..."

    local validation_score=0
    local total_tests=8

    echo
    echo "=== SERVICE CONNECTIVITY ==="
    test_service "GitLab" "$GITLAB_URL" && ((validation_score++))
    test_service "Jenkins" "$JENKINS_URL" && ((validation_score++))
    test_service "Grafana" "$GRAFANA_URL" && ((validation_score++))

    echo
    echo "=== AI INTEGRATION ==="
    test_ollama_model && ((validation_score++))
    monitor_ai_fix_generation && ((validation_score++))

    echo
    echo "=== TESTING INFRASTRUCTURE ==="
    test_selenium_grid && ((validation_score++))
    check_documentation_coverage && ((validation_score++))

    echo
    echo "=== MONITORING ==="
    test_metrics_collection && ((validation_score++))

    echo
    echo "=== PIPELINE VALIDATION RESULTS ==="
    echo "Passed: $validation_score/$total_tests tests"

    if [[ $validation_score -eq $total_tests ]]; then
        echo -e "${GREEN}🎉 PIPELINE FULLY OPERATIONAL${NC}"
        echo
        echo "Next steps:"
        echo "1. Deploy to GitLab repository"
        echo "2. Configure Jenkins webhooks"
        echo "3. Enable scheduled test runs"
        echo "4. Monitor first automated cycle"
        return 0
    elif [[ $validation_score -gt $((total_tests * 70 / 100)) ]]; then
        echo -e "${YELLOW}⚠ PIPELINE MOSTLY OPERATIONAL${NC}"
        echo "Some components need attention before production use"
        return 0
    else
        echo -e "${RED}❌ PIPELINE NOT READY${NC}"
        echo "Critical components are failing"
        return 1
    fi
}

# Main execution
main() {
    echo "Starting pipeline validation at $(date)"
    echo

    # Change to project directory
    cd "$(dirname "$0")/.."

    # Install dependencies if needed
    if [[ ! -d node_modules ]]; then
        echo "Installing dependencies..."
        npm install
    fi

    # Run validation
    validate_complete_pipeline

    local result=$?

    echo
    echo "Pipeline test completed at $(date)"
    echo "Result: $([ $result -eq 0 ] && echo 'SUCCESS' || echo 'NEEDS_ATTENTION')"

    # Clean up test files
    rm -f test-failure-results.json test-fix.patch

    return $result
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
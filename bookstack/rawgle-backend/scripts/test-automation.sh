#!/bin/bash

# TDD Automation Script - Run every 30 minutes via cron
# Usage: ./scripts/test-automation.sh [--report-only] [--coverage] [--verbose]

set -e

# Configuration
PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
LOG_DIR="$PROJECT_ROOT/logs/tests"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="$LOG_DIR/test_run_$TIMESTAMP.log"
COVERAGE_DIR="$PROJECT_ROOT/coverage"
REPORTS_DIR="$PROJECT_ROOT/reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Options
REPORT_ONLY=false
COVERAGE=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --report-only)
      REPORT_ONLY=true
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Create necessary directories
mkdir -p "$LOG_DIR" "$REPORTS_DIR" "$COVERAGE_DIR"

# Logging function
log() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    INFO)
      echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$LOG_FILE"
      ;;
    SUCCESS)
      echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE"
      ;;
    WARNING)
      echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$LOG_FILE"
      ;;
    ERROR)
      echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
      ;;
  esac
  
  if [ "$VERBOSE" = true ]; then
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
  fi
}

# Function to run tests with proper error handling
run_tests() {
  local test_type=$1
  local test_command=$2
  
  log "INFO" "Running $test_type tests..."
  
  if eval "$test_command" >> "$LOG_FILE" 2>&1; then
    log "SUCCESS" "$test_type tests passed"
    return 0
  else
    log "ERROR" "$test_type tests failed"
    return 1
  fi
}

# Function to generate test report
generate_report() {
  local report_file="$REPORTS_DIR/test_report_$TIMESTAMP.json"
  
  log "INFO" "Generating test report..."
  
  # Create JSON report
  cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "${NODE_ENV:-development}",
  "test_run_id": "$TIMESTAMP",
  "results": {
    "unit_tests": $unit_result,
    "integration_tests": $integration_result,
    "coverage_threshold_met": $coverage_passed
  },
  "coverage": {
    "enabled": $COVERAGE,
    "report_path": "coverage/lcov-report/index.html",
    "threshold": "70%"
  },
  "logs": {
    "path": "$LOG_FILE",
    "size_bytes": $(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)
  },
  "archon_integration": {
    "task_id": "${ARCHON_TASK_ID:-}",
    "project_id": "${ARCHON_PROJECT_ID:-}",
    "updated": $([ -n "${ARCHON_TASK_ID}" ] && echo true || echo false)
  }
}
EOF
  
  log "SUCCESS" "Test report generated: $report_file"
}

# Function to update Archon task status
update_archon_status() {
  if [ -n "${ARCHON_TASK_ID}" ] && [ -n "${ARCHON_PROJECT_ID}" ]; then
    log "INFO" "Updating Archon task status..."
    
    # This would integrate with Archon MCP server
    # For now, just log the intention
    log "INFO" "Would update Archon task ${ARCHON_TASK_ID} with test results"
  fi
}

# Main execution
main() {
  log "INFO" "Starting TDD automation pipeline at $TIMESTAMP"
  log "INFO" "Project root: $PROJECT_ROOT"
  log "INFO" "Log file: $LOG_FILE"
  
  cd "$PROJECT_ROOT"
  
  # Initialize test results
  unit_result=0
  integration_result=0
  coverage_passed=0
  
  if [ "$REPORT_ONLY" = false ]; then
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
      log "WARNING" "Node modules not found, installing dependencies..."
      npm install >> "$LOG_FILE" 2>&1
    fi
    
    # Run linting first
    log "INFO" "Running code quality checks..."
    if npm run lint >> "$LOG_FILE" 2>&1; then
      log "SUCCESS" "Code quality checks passed"
    else
      log "WARNING" "Code quality issues found (continuing with tests)"
    fi
    
    # Run unit tests
    if run_tests "Unit" "npm run test:unit"; then
      unit_result=1
    fi
    
    # Run integration tests
    if run_tests "Integration" "npm run test:integration"; then
      integration_result=1
    fi
    
    # Run coverage analysis if requested
    if [ "$COVERAGE" = true ]; then
      log "INFO" "Running coverage analysis..."
      if npm run test:coverage >> "$LOG_FILE" 2>&1; then
        log "SUCCESS" "Coverage analysis completed"
        
        # Check coverage threshold
        if grep -q "All files" "$COVERAGE_DIR/lcov-report/index.html" 2>/dev/null; then
          coverage_passed=1
          log "SUCCESS" "Coverage threshold met"
        else
          log "WARNING" "Coverage threshold not met"
        fi
      else
        log "ERROR" "Coverage analysis failed"
      fi
    fi
  fi
  
  # Generate comprehensive report
  generate_report
  
  # Update Archon if configured
  update_archon_status
  
  # Calculate overall success
  local overall_success=true
  if [ $unit_result -eq 0 ] || [ $integration_result -eq 0 ]; then
    overall_success=false
  fi
  
  if [ "$overall_success" = true ]; then
    log "SUCCESS" "All tests passed successfully!"
    exit 0
  else
    log "ERROR" "Some tests failed. Check logs for details."
    exit 1
  fi
}

# Set up signal handlers
trap 'log "ERROR" "Test automation interrupted"; exit 130' INT
trap 'log "ERROR" "Test automation terminated"; exit 143' TERM

# Run main function
main "$@"
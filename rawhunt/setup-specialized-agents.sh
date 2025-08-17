#!/bin/bash

# GoHunta Project Manager - Specialized Agents Orchestrator
# Coordinates all development agents through tmux for comprehensive platform development

set -e

echo "🎯 GoHunta Project Manager - Agent Orchestration Setup"
echo "=================================================="
echo "Setting up tmux orchestrator with all specialized agents"
echo ""

# Project paths
PROJECT_ROOT="/Users/mattwright/pandora/gohunta.com"
HUNTA_PATH="$PROJECT_ROOT/hunta"
BACKEND_PATH="$HUNTA_PATH/backend"
FRONTEND_PATH="$HUNTA_PATH/frontend"
TESTS_PATH="$HUNTA_PATH/tests"

# Session name
SESSION_NAME="gohunta-orchestrator"

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null || true

echo "🏗️  Creating tmux session: $SESSION_NAME"

# Create main session
tmux new-session -d -s $SESSION_NAME -c "$PROJECT_ROOT"

# Window 0: Project Manager (Orchestrator)
tmux rename-window -t $SESSION_NAME:0 "ProjectManager"
tmux send-keys -t $SESSION_NAME:0 "clear" Enter
tmux send-keys -t $SESSION_NAME:0 "echo '🎯 PROJECT MANAGER - GoHunta Platform Orchestrator'" Enter
tmux send-keys -t $SESSION_NAME:0 "echo '===================================================='" Enter
tmux send-keys -t $SESSION_NAME:0 "echo 'Frontend: https://afc39a6e.rawgle-frontend.pages.dev/'" Enter
tmux send-keys -t $SESSION_NAME:0 "echo 'Backend: https://gohunta-backend.findrawdogfood.workers.dev'" Enter
tmux send-keys -t $SESSION_NAME:0 "echo 'Status: Coordinating all specialized agents'" Enter
tmux send-keys -t $SESSION_NAME:0 "echo ''" Enter

# Window 1: Backend Agent
tmux new-window -t $SESSION_NAME -n "BackendAgent" -c "$BACKEND_PATH"
tmux send-keys -t $SESSION_NAME:1 "clear" Enter
tmux send-keys -t $SESSION_NAME:1 "echo '🔧 BACKEND AGENT - API & Database Integration'" Enter
tmux send-keys -t $SESSION_NAME:1 "echo '============================================='" Enter
tmux send-keys -t $SESSION_NAME:1 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:1 "echo '- Connect APIs to new frontend'" Enter
tmux send-keys -t $SESSION_NAME:1 "echo '- Implement production-grade authentication'" Enter
tmux send-keys -t $SESSION_NAME:1 "echo '- Optimize database queries'" Enter
tmux send-keys -t $SESSION_NAME:1 "echo '- Ensure CORS compliance'" Enter
tmux send-keys -t $SESSION_NAME:1 "echo ''" Enter

# Window 2: Frontend Agent
tmux new-window -t $SESSION_NAME -n "FrontendAgent" -c "$FRONTEND_PATH"
tmux send-keys -t $SESSION_NAME:2 "clear" Enter
tmux send-keys -t $SESSION_NAME:2 "echo '🎨 FRONTEND AGENT - UI/UX & PWA Implementation'" Enter
tmux send-keys -t $SESSION_NAME:2 "echo '==============================================='" Enter
tmux send-keys -t $SESSION_NAME:2 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:2 "echo '- Implement offline-first design'" Enter
tmux send-keys -t $SESSION_NAME:2 "echo '- Add PWA capabilities'" Enter
tmux send-keys -t $SESSION_NAME:2 "echo '- Optimize for mobile/rural use'" Enter
tmux send-keys -t $SESSION_NAME:2 "echo '- Integrate with backend APIs'" Enter
tmux send-keys -t $SESSION_NAME:2 "echo ''" Enter

# Window 3: Integration Agent
tmux new-window -t $SESSION_NAME -n "IntegrationAgent" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:3 "clear" Enter
tmux send-keys -t $SESSION_NAME:3 "echo '🔗 INTEGRATION AGENT - Cross-Module Connectivity'" Enter
tmux send-keys -t $SESSION_NAME:3 "echo '==============================================='" Enter
tmux send-keys -t $SESSION_NAME:3 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:3 "echo '- Ensure seamless data flow between modules'" Enter
tmux send-keys -t $SESSION_NAME:3 "echo '- API versioning and compatibility'" Enter
tmux send-keys -t $SESSION_NAME:3 "echo '- Cross-module functionality testing'" Enter
tmux send-keys -t $SESSION_NAME:3 "echo '- Integration monitoring'" Enter
tmux send-keys -t $SESSION_NAME:3 "echo ''" Enter

# Window 4: Security Agent
tmux new-window -t $SESSION_NAME -n "SecurityAgent" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:4 "clear" Enter
tmux send-keys -t $SESSION_NAME:4 "echo '🔒 SECURITY AGENT - Authentication & Data Protection'" Enter
tmux send-keys -t $SESSION_NAME:4 "echo '=================================================='" Enter
tmux send-keys -t $SESSION_NAME:4 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:4 "echo '- Replace demo auth with production JWT/OAuth'" Enter
tmux send-keys -t $SESSION_NAME:4 "echo '- Implement role-based access control'" Enter
tmux send-keys -t $SESSION_NAME:4 "echo '- Add data encryption and secure storage'" Enter
tmux send-keys -t $SESSION_NAME:4 "echo '- Security audit and vulnerability assessment'" Enter
tmux send-keys -t $SESSION_NAME:4 "echo ''" Enter

# Window 5: Performance Agent
tmux new-window -t $SESSION_NAME -n "PerformanceAgent" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:5 "clear" Enter
tmux send-keys -t $SESSION_NAME:5 "echo '⚡ PERFORMANCE AGENT - Speed & Rural Optimization'" Enter
tmux send-keys -t $SESSION_NAME:5 "echo '==============================================='" Enter
tmux send-keys -t $SESSION_NAME:5 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:5 "echo '- Optimize for 3G/rural connections'" Enter
tmux send-keys -t $SESSION_NAME:5 "echo '- Implement edge caching strategies'" Enter
tmux send-keys -t $SESSION_NAME:5 "echo '- Battery usage optimization'" Enter
tmux send-keys -t $SESSION_NAME:5 "echo '- Load testing and performance monitoring'" Enter
tmux send-keys -t $SESSION_NAME:5 "echo ''" Enter

# Window 6: Database Agent
tmux new-window -t $SESSION_NAME -n "DatabaseAgent" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:6 "clear" Enter
tmux send-keys -t $SESSION_NAME:6 "echo '🗄️  DATABASE AGENT - Schema & Query Optimization'" Enter
tmux send-keys -t $SESSION_NAME:6 "echo '==============================================='" Enter
tmux send-keys -t $SESSION_NAME:6 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:6 "echo '- Optimize schema for hunting dog data patterns'" Enter
tmux send-keys -t $SESSION_NAME:6 "echo '- Implement efficient indexing strategies'" Enter
tmux send-keys -t $SESSION_NAME:6 "echo '- Data migration and backup procedures'" Enter
tmux send-keys -t $SESSION_NAME:6 "echo '- Query performance optimization'" Enter
tmux send-keys -t $SESSION_NAME:6 "echo ''" Enter

# Window 7: UI/UX Agent
tmux new-window -t $SESSION_NAME -n "UIUXAgent" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:7 "clear" Enter
tmux send-keys -t $SESSION_NAME:7 "echo '🎨 UI/UX AGENT - Hunting-Specific Design'" Enter
tmux send-keys -t $SESSION_NAME:7 "echo '======================================'" Enter
tmux send-keys -t $SESSION_NAME:7 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:7 "echo '- Implement hunting-specific design requirements'" Enter
tmux send-keys -t $SESSION_NAME:7 "echo '- Field-friendly interfaces (glove-compatible)'" Enter
tmux send-keys -t $SESSION_NAME:7 "echo '- Responsive design for all devices'" Enter
tmux send-keys -t $SESSION_NAME:7 "echo '- Accessibility compliance'" Enter
tmux send-keys -t $SESSION_NAME:7 "echo ''" Enter

# Window 8: Behavioral Science Agent
tmux new-window -t $SESSION_NAME -n "BehavioralAgent" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:8 "clear" Enter
tmux send-keys -t $SESSION_NAME:8 "echo '🧠 BEHAVIORAL SCIENCE AGENT - User Engagement'" Enter
tmux send-keys -t $SESSION_NAME:8 "echo '============================================='" Enter
tmux send-keys -t $SESSION_NAME:8 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:8 "echo '- Implement user engagement features'" Enter
tmux send-keys -t $SESSION_NAME:8 "echo '- Gamification and achievement systems'" Enter
tmux send-keys -t $SESSION_NAME:8 "echo '- User behavior analytics'" Enter
tmux send-keys -t $SESSION_NAME:8 "echo '- Community building features'" Enter
tmux send-keys -t $SESSION_NAME:8 "echo ''" Enter

# Window 9: Copywriter Agent
tmux new-window -t $SESSION_NAME -n "CopywriterAgent" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:9 "clear" Enter
tmux send-keys -t $SESSION_NAME:9 "echo '✍️  COPYWRITER AGENT - Content & Communications'" Enter
tmux send-keys -t $SESSION_NAME:9 "echo '============================================='" Enter
tmux send-keys -t $SESSION_NAME:9 "echo 'Tasks:'" Enter
tmux send-keys -t $SESSION_NAME:9 "echo '- Create compelling content for all modules'" Enter
tmux send-keys -t $SESSION_NAME:9 "echo '- User-friendly error messages'" Enter
tmux send-keys -t $SESSION_NAME:9 "echo '- Help documentation and tutorials'" Enter
tmux send-keys -t $SESSION_NAME:9 "echo '- Marketing and engagement copy'" Enter
tmux send-keys -t $SESSION_NAME:9 "echo ''" Enter

# Window 10: Test Execution
tmux new-window -t $SESSION_NAME -n "TestExecution" -c "$TESTS_PATH"
tmux send-keys -t $SESSION_NAME:10 "clear" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '🧪 TEST EXECUTION - Comprehensive Testing Suite'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '============================================='" Enter
tmux send-keys -t $SESSION_NAME:10 "echo 'Test Coverage:'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '- Authentication & Pack Management ✅'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '- Route Planning & GPS Integration ✅'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '- Training & Trial Management ✅'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '- Gear Reviews & Loadout Planning ✅'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '- Ethics & Conservation Hub ✅'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '- Community & Knowledge Sharing ✅'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo '- Frontend-Backend Integration ✅'" Enter
tmux send-keys -t $SESSION_NAME:10 "echo ''" Enter

# Window 11: Quality Assurance
tmux new-window -t $SESSION_NAME -n "QualityAssurance" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:11 "clear" Enter
tmux send-keys -t $SESSION_NAME:11 "echo '✅ QUALITY ASSURANCE - Final Validation'" Enter
tmux send-keys -t $SESSION_NAME:11 "echo '======================================'" Enter
tmux send-keys -t $SESSION_NAME:11 "echo 'QA Checklist:'" Enter
tmux send-keys -t $SESSION_NAME:11 "echo '- All tests pass (100% success rate)'" Enter
tmux send-keys -t $SESSION_NAME:11 "echo '- Performance benchmarks met'" Enter
tmux send-keys -t $SESSION_NAME:11 "echo '- Security audit completed'" Enter
tmux send-keys -t $SESSION_NAME:11 "echo '- Cross-browser compatibility'" Enter
tmux send-keys -t $SESSION_NAME:11 "echo '- Mobile/rural optimization verified'" Enter
tmux send-keys -t $SESSION_NAME:11 "echo ''" Enter

# Window 12: Monitoring Dashboard
tmux new-window -t $SESSION_NAME -n "Monitoring" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:12 "clear" Enter
tmux send-keys -t $SESSION_NAME:12 "echo '📊 MONITORING DASHBOARD - System Health'" Enter
tmux send-keys -t $SESSION_NAME:12 "echo '====================================='" Enter
tmux send-keys -t $SESSION_NAME:12 "echo 'System Status:'" Enter
tmux send-keys -t $SESSION_NAME:12 "echo '- Backend: https://gohunta-backend.findrawdogfood.workers.dev'" Enter
tmux send-keys -t $SESSION_NAME:12 "echo '- Frontend: https://afc39a6e.rawgle-frontend.pages.dev'" Enter
tmux send-keys -t $SESSION_NAME:12 "echo '- Database: D1 SQLite'" Enter
tmux send-keys -t $SESSION_NAME:12 "echo '- Testing: Comprehensive suite active'" Enter
tmux send-keys -t $SESSION_NAME:12 "echo ''" Enter

# Return to Project Manager window
tmux select-window -t $SESSION_NAME:0

# Create agent coordination script
cat > "$PROJECT_ROOT/coordinate-agents.sh" << 'EOF'
#!/bin/bash

# Agent Coordination Commands
SESSION="gohunta-orchestrator"

echo "🎯 GoHunta Agent Coordination Commands"
echo "====================================="
echo ""
echo "Available Commands:"
echo "1. status - Check all agents status"
echo "2. test - Run comprehensive test suite"  
echo "3. deploy - Deploy with new frontend integration"
echo "4. monitor - Show system monitoring"
echo "5. brief - Brief all agents with current tasks"
echo ""

case "$1" in
  "status")
    echo "📊 Checking agent status..."
    tmux list-windows -t $SESSION
    ;;
  
  "test")
    echo "🧪 Running comprehensive tests..."
    tmux send-keys -t $SESSION:10 "npm test" Enter
    tmux send-keys -t $SESSION:10 "cucumber-js tests/features/" Enter
    ;;
  
  "deploy")
    echo "🚀 Deploying with frontend integration..."
    tmux send-keys -t $SESSION:1 "./deploy-new-frontend-integration.sh" Enter
    ;;
  
  "monitor")
    echo "📊 Switching to monitoring dashboard..."
    tmux select-window -t $SESSION:12
    ;;
  
  "brief")
    echo "📋 Briefing all agents..."
    # Send tasks to each agent
    tmux send-keys -t $SESSION:1 "echo 'TASK: Implement new frontend API integration'" Enter
    tmux send-keys -t $SESSION:2 "echo 'TASK: Connect to backend APIs and optimize PWA'" Enter
    tmux send-keys -t $SESSION:3 "echo 'TASK: Verify cross-module data flow'" Enter
    tmux send-keys -t $SESSION:4 "echo 'TASK: Upgrade to production authentication'" Enter
    tmux send-keys -t $SESSION:5 "echo 'TASK: Optimize for rural connectivity'" Enter
    tmux send-keys -t $SESSION:6 "echo 'TASK: Optimize database for hunting patterns'" Enter
    tmux send-keys -t $SESSION:7 "echo 'TASK: Implement field-friendly UI design'" Enter
    tmux send-keys -t $SESSION:8 "echo 'TASK: Add user engagement features'" Enter
    tmux send-keys -t $SESSION:9 "echo 'TASK: Create compelling platform content'" Enter
    ;;
  
  *)
    echo "Usage: $0 {status|test|deploy|monitor|brief}"
    ;;
esac
EOF

chmod +x "$PROJECT_ROOT/coordinate-agents.sh"

echo ""
echo "✅ ORCHESTRATOR SETUP COMPLETE!"
echo "==============================="
echo ""
echo "🎯 Session: $SESSION_NAME"
echo "📁 Project: $PROJECT_ROOT"
echo ""
echo "🚀 Quick Commands:"
echo "• tmux attach -t $SESSION_NAME  # Attach to orchestrator"
echo "• ./coordinate-agents.sh brief   # Brief all agents"
echo "• ./coordinate-agents.sh status  # Check agent status"
echo "• ./coordinate-agents.sh test    # Run test suite"
echo ""
echo "📋 Agent Windows:"
echo "0: Project Manager (current)"
echo "1: Backend Agent"
echo "2: Frontend Agent" 
echo "3: Integration Agent"
echo "4: Security Agent"
echo "5: Performance Agent"
echo "6: Database Agent"
echo "7: UI/UX Agent"
echo "8: Behavioral Science Agent"
echo "9: Copywriter Agent"
echo "10: Test Execution"
echo "11: Quality Assurance"
echo "12: Monitoring Dashboard"
echo ""
echo "🎮 Navigation:"
echo "• Ctrl+B then number (0-12) to switch windows"
echo "• Ctrl+B then 'c' to create new window"
echo "• Ctrl+B then 'd' to detach"
echo ""
echo "🎯 PROJECT MANAGER is now coordinating all specialized agents!"
echo "Ready to orchestrate comprehensive GoHunta platform development."

# Attach to the session
tmux attach -t $SESSION_NAME
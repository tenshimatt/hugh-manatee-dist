#!/bin/bash
# Example Tmux Orchestrator Launcher Script
# Generated for: fix-search-project
# Type: Fix Project

PROJECT_PATH="/Users/mattwright/pandora/rawhunt"
SESSION_NAME="fix-search-project"

# Check if session exists
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? != 0 ]; then
    echo "Creating new tmux session: $SESSION_NAME"
    
    # Create main session
    tmux new-session -d -s $SESSION_NAME -c "$PROJECT_PATH"
    
    # Create window for Orchestrator
    tmux rename-window -t $SESSION_NAME:0 "Orchestrator"
    
    # Split pane for even-horizontal layout
    tmux split-window -t $SESSION_NAME:0 -h -c "$PROJECT_PATH"
    
    # Start Claude agent in first pane
    tmux send-keys -t $SESSION_NAME:0.0 "claude --dangerously-skip-permissions" Enter
    sleep 2
    
    # Send agent briefing
    tmux send-keys -t $SESSION_NAME:0.0 "You are the Orchestrator for fix-search-project. Your role: High-level coordination WITHOUT implementation details. Monitor all agents, make architectural decisions, resolve cross-project dependencies. Stay high-level - don't get pulled into code. Focus on: Fix search functionality to properly filter 9000+ suppliers when users search for locations like 'chicago'. Schedule check-ins every 15 minutes." Enter
    
    # Create window for Project Manager
    tmux new-window -t $SESSION_NAME -n "Project-Manager" -c "$PROJECT_PATH"
    
    # Split pane for even-horizontal layout
    tmux split-window -t $SESSION_NAME:1 -h -c "$PROJECT_PATH"
    
    # Start Claude agent in first pane
    tmux send-keys -t $SESSION_NAME:1.0 "claude --dangerously-skip-permissions" Enter
    sleep 2
    
    # Send agent briefing
    tmux send-keys -t $SESSION_NAME:1.0 "You are the Project Manager for fix-search-project. Be meticulous about testing and verification - NO shortcuts, NO compromises. Quality standards are non-negotiable. Coordinate team communication using hub-and-spoke model. Trust but verify all work. Create test plans for every feature. Deliverables: Working search that filters by location, Fixed API endpoint integration, Comprehensive test suite, Documentation updates. Report to Orchestrator only." Enter
    
    # Create window for Developer
    tmux new-window -t $SESSION_NAME -n "Developer" -c "$PROJECT_PATH"
    
    # Split pane for even-horizontal layout
    tmux split-window -t $SESSION_NAME:2 -h -c "$PROJECT_PATH"
    
    # Start Claude agent in first pane
    tmux send-keys -t $SESSION_NAME:2.0 "claude --dangerously-skip-permissions" Enter
    sleep 2
    
    # Send agent briefing
    tmux send-keys -t $SESSION_NAME:2.0 "You are a Developer for fix-search-project. Handle implementation and technical decisions. Follow existing code patterns. Report progress to Project Manager. Auto-commit every 30 minutes. Focus on: Fix search functionality to properly filter 9000+ suppliers when users search for locations like 'chicago'. Constraints: Use existing database schema, Follow current code patterns, Maintain 65% test coverage, Commit every 30 minutes." Enter
    
    # Setup auto-commit
    echo "Setting up auto-commit every 30 minutes..."
    nohup bash -c "while true; do sleep 1800; cd $PROJECT_PATH && git add -A && git commit -m 'feat: Auto-commit: $(date)' 2>/dev/null; done" > /dev/null 2>&1 &
    
    # Setup check-in schedule
    ./schedule_with_note.sh 15 "Regular check-in for fix-search-project" "fix-search-project:0"
    
    echo "Session created successfully!"
else
    echo "Session $SESSION_NAME already exists"
fi

# Attach to session
tmux attach-session -t $SESSION_NAME
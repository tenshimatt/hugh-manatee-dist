#!/bin/bash

# Hunta Tmux Orchestrator Setup Script
# This script sets up the complete tmux environment for Hunta development

PROJECT_ROOT="/Users/mattwright/pandora/gohunta.com/hunta-v2"
SESSION_NAME="hunta"

echo "🚀 Setting up Hunta Tmux Orchestrator..."

# Check if session already exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "❌ Session '$SESSION_NAME' already exists. Attaching..."
    tmux attach-session -t $SESSION_NAME
    exit 0
fi

# Create the main session
echo "📦 Creating tmux session: $SESSION_NAME"
tmux new-session -d -s $SESSION_NAME -c "$PROJECT_ROOT"

# Window 0: Orchestrator
tmux rename-window -t $SESSION_NAME:0 "Orchestrator"
tmux send-keys -t $SESSION_NAME:0 "echo '🎯 Hunta Orchestrator Ready'" Enter
tmux send-keys -t $SESSION_NAME:0 "echo 'Use ./check-status.sh to monitor project'" Enter

# Window 1: Frontend Development (Cursor)
echo "🎨 Setting up Frontend Dev window..."
tmux new-window -t $SESSION_NAME -n "Frontend-Dev" -c "$PROJECT_ROOT/frontend"
tmux send-keys -t $SESSION_NAME:1 "echo '🎨 Frontend Development Window'" Enter
tmux send-keys -t $SESSION_NAME:1 "echo 'Run: cursor . to open in Cursor app'" Enter
tmux send-keys -t $SESSION_NAME:1 "echo 'Key files: src/App.jsx, src/pages/*, src/components/*'" Enter

# Window 2: Backend Development (Cursor)
echo "🔧 Setting up Backend Dev window..."
tmux new-window -t $SESSION_NAME -n "Backend-Dev" -c "$PROJECT_ROOT/backend"
tmux send-keys -t $SESSION_NAME:2 "echo '🔧 Backend Development Window'" Enter
tmux send-keys -t $SESSION_NAME:2 "echo 'Run: cursor . to open in Cursor app'" Enter
tmux send-keys -t $SESSION_NAME:2 "echo 'Key files: src/index.js, src/handlers/*'" Enter

# Window 3: Frontend Server
echo "🌐 Setting up Frontend Server..."
tmux new-window -t $SESSION_NAME -n "Frontend-Server" -c "$PROJECT_ROOT/frontend"
tmux send-keys -t $SESSION_NAME:3 "echo '🌐 Frontend Dev Server (Vite)'" Enter
tmux send-keys -t $SESSION_NAME:3 "echo 'Starting in 3 seconds...'" Enter
tmux send-keys -t $SESSION_NAME:3 "sleep 3 && npm run dev" Enter

# Window 4: Backend Server
echo "⚡ Setting up Backend Server..."
tmux new-window -t $SESSION_NAME -n "Backend-Server" -c "$PROJECT_ROOT/backend"
tmux send-keys -t $SESSION_NAME:4 "echo '⚡ Backend Dev Server (Wrangler)'" Enter
tmux send-keys -t $SESSION_NAME:4 "echo 'Starting in 3 seconds...'" Enter
tmux send-keys -t $SESSION_NAME:4 "sleep 3 && npx wrangler dev" Enter

# Window 5: Git & Deploy
echo "📝 Setting up Git & Deploy window..."
tmux new-window -t $SESSION_NAME -n "Git-Deploy" -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:5 "echo '📝 Git & Deployment Window'" Enter
tmux send-keys -t $SESSION_NAME:5 "git status" Enter

# Create helper scripts
echo "📄 Creating helper scripts..."

# Create check-status.sh
cat > "$PROJECT_ROOT/check-status.sh" << 'EOF'
#!/bin/bash
echo "=== 🎯 Hunta Project Status ==="
echo "Time: $(date)"
echo ""

# Check Frontend Server
echo "🎨 Frontend Server:"
if tmux capture-pane -t hunta:3 -p | grep -q "VITE"; then
    echo "  ✅ Running on http://localhost:5173"
    tmux capture-pane -t hunta:3 -p | grep -E "(Local|Network)" | tail -2
else
    echo "  ❌ Not running"
fi
echo ""

# Check Backend Server
echo "⚡ Backend Server:"
if tmux capture-pane -t hunta:4 -p | grep -q "Ready on"; then
    echo "  ✅ Running"
    tmux capture-pane -t hunta:4 -p | grep "Ready on" | tail -1
else
    echo "  ❌ Not running"
fi
echo ""

# Git Status
echo "📝 Git Status:"
cd /Users/mattwright/pandora/gohunta.com/hunta-v2
git status --short
echo ""

# Recent commits
echo "📊 Recent Commits:"
git log --oneline -3
EOF

chmod +x "$PROJECT_ROOT/check-status.sh"

# Create quick-deploy.sh
cat > "$PROJECT_ROOT/quick-deploy.sh" << 'EOF'
#!/bin/bash
echo "🚀 Quick Deploy to Production"
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Uncommitted changes detected!"
    echo "Commit your changes first:"
    echo "  git add -A"
    echo "  git commit -m 'your message'"
    exit 1
fi

echo "📦 Building frontend..."
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/frontend
npm run build

echo ""
echo "⚡ Deploying backend..."
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/backend
npx wrangler deploy --config wrangler-gohunta.toml

echo ""
echo "🎨 Deploying frontend..."
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/frontend
npx wrangler pages deploy dist --project-name gohunta

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend: https://gohunta.pages.dev"
echo "⚡ Backend: https://gohunta-backend.findrawdogfood.workers.dev"
EOF

chmod +x "$PROJECT_ROOT/quick-deploy.sh"

# Create monitor-agents.sh
cat > "$PROJECT_ROOT/monitor-agents.sh" << 'EOF'
#!/bin/bash
# Monitor what agents are doing

while true; do
    clear
    echo "=== 🎯 HUNTA AGENT MONITOR ==="
    echo "Time: $(date)"
    echo "Press Ctrl+C to exit"
    echo ""
    
    echo "🎨 Frontend Agent Activity:"
    echo "------------------------"
    tmux capture-pane -t hunta:1 -p | tail -10
    echo ""
    
    echo "⚡ Backend Agent Activity:"
    echo "------------------------"
    tmux capture-pane -t hunta:2 -p | tail -10
    echo ""
    
    echo "📝 Recent File Changes:"
    echo "------------------------"
    cd /Users/mattwright/pandora/gohunta.com/hunta-v2
    find . -name "*.js" -o -name "*.jsx" -mmin -5 2>/dev/null | head -5
    
    sleep 10
done
EOF

chmod +x "$PROJECT_ROOT/monitor-agents.sh"

echo ""
echo "✅ Tmux Orchestrator Setup Complete!"
echo ""
echo "📋 Quick Reference:"
echo "  Attach to session:     tmux attach -t hunta"
echo "  Check status:          ./check-status.sh"
echo "  Monitor agents:        ./monitor-agents.sh"
echo "  Deploy to production:  ./quick-deploy.sh"
echo ""
echo "🎯 Windows:"
echo "  0: Orchestrator"
echo "  1: Frontend Dev (open with Cursor)"
echo "  2: Backend Dev (open with Cursor)"
echo "  3: Frontend Server (Vite)"
echo "  4: Backend Server (Wrangler)"
echo "  5: Git & Deploy"
echo ""
echo "💡 Tip: Use Ctrl+B then window number to switch between windows"
echo ""

# Attach to the session
tmux attach-session -t $SESSION_NAME
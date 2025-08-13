# 🚀 Tmux Orchestrator Setup for Hunta Project in Cursor

## Overview
This guide will help you set up the Hunta project with Tmux Orchestrator for continuous development using Cursor app.

## Step 1: Create Tmux Session Structure

```bash
# Create the main Hunta session
tmux new-session -d -s hunta -c "/Users/mattwright/pandora/gohunta.com/hunta-v2"

# Window 0: Orchestrator
tmux rename-window -t hunta:0 "Orchestrator"

# Window 1: Frontend Development
tmux new-window -t hunta -n "Frontend-Dev" -c "/Users/mattwright/pandora/gohunta.com/hunta-v2/frontend"

# Window 2: Backend Development  
tmux new-window -t hunta -n "Backend-Dev" -c "/Users/mattwright/pandora/gohunta.com/hunta-v2/backend"

# Window 3: Frontend Server
tmux new-window -t hunta -n "Frontend-Server" -c "/Users/mattwright/pandora/gohunta.com/hunta-v2/frontend"

# Window 4: Backend Server
tmux new-window -t hunta -n "Backend-Server" -c "/Users/mattwright/pandora/gohunta.com/hunta-v2/backend"

# Window 5: Git & Deploy
tmux new-window -t hunta -n "Git-Deploy" -c "/Users/mattwright/pandora/gohunta.com/hunta-v2"
```

## Step 2: Start Development Servers

```bash
# Start frontend dev server
tmux send-keys -t hunta:3 "npm run dev" Enter

# Start backend dev server (using wrangler)
tmux send-keys -t hunta:4 "npx wrangler dev" Enter
```

## Step 3: Create Agent Briefings

### Frontend Agent (Window 1)
```bash
tmux send-keys -t hunta:1 "cursor ." Enter
# Then brief the agent:
```

**Frontend Agent Brief:**
```
You are responsible for the Hunta frontend codebase. Your tasks:
1. Maintain and improve the React/Vite application
2. Implement new features for the 6 core modules
3. Ensure responsive design and accessibility
4. Optimize performance and user experience
5. Keep API integration working smoothly

Key files:
- /frontend/src/App.jsx - Main app component
- /frontend/src/pages/* - All page components
- /frontend/src/components/* - Shared components

Current status: All 6 modules implemented with demo data integration
```

### Backend Agent (Window 2)
```bash
tmux send-keys -t hunta:2 "cursor ." Enter
# Then brief the agent:
```

**Backend Agent Brief:**
```
You are responsible for the Hunta backend codebase. Your tasks:
1. Maintain Cloudflare Workers backend
2. Implement database integration when ready
3. Ensure all API endpoints work correctly
4. Handle authentication and security
5. Optimize for performance and scalability

Key files:
- /backend/src/index.js - Main worker entry
- /backend/src/handlers/* - All API handlers
- /backend/db/schema.sql - Database schema

Current status: Demo data working, ready for real database integration
```

## Step 4: Orchestrator Commands

Save these as shell scripts in the project:

### check-status.sh
```bash
#!/bin/bash
echo "=== Hunta Project Status ==="
echo ""
echo "Frontend Server:"
tmux capture-pane -t hunta:3 -p | tail -5
echo ""
echo "Backend Server:"
tmux capture-pane -t hunta:4 -p | tail -5
echo ""
echo "Git Status:"
cd /Users/mattwright/pandora/gohunta.com/hunta-v2 && git status --short
```

### deploy-production.sh
```bash
#!/bin/bash
echo "🚀 Deploying Hunta to Production"

# Build frontend
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/frontend
npm run build

# Deploy backend
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/backend
npx wrangler deploy --config wrangler-gohunta.toml

# Deploy frontend
cd /Users/mattwright/pandora/gohunta.com/hunta-v2/frontend
npx wrangler pages deploy dist --project-name gohunta

echo "✅ Deployment complete!"
```

## Step 5: Cursor App Integration

1. **Open Cursor in each development window:**
   ```bash
   # Frontend window
   tmux send-keys -t hunta:1 "cursor /Users/mattwright/pandora/gohunta.com/hunta-v2/frontend" Enter
   
   # Backend window  
   tmux send-keys -t hunta:2 "cursor /Users/mattwright/pandora/gohunta.com/hunta-v2/backend" Enter
   ```

2. **Set up Cursor AI Rules** (create `.cursorrules` in each directory):

### Frontend .cursorrules
```
You are working on the Hunta frontend - a React/Vite application for dog hunting enthusiasts.

Key principles:
- Use Tailwind CSS for styling
- Maintain responsive design
- Follow React best practices
- Keep API calls in page components
- Use loading states for all async operations

Current API base: https://gohunta-backend.findrawdogfood.workers.dev
```

### Backend .cursorrules
```
You are working on the Hunta backend - a Cloudflare Workers application.

Key principles:
- Use async/await for all handlers
- Return consistent JSON responses
- Include try/catch error handling
- Provide demo data fallbacks
- Maintain CORS headers

Database: D1 (SQLite)
Auth: JWT tokens
```

## Step 6: Monitoring & Orchestration

### Create monitoring script (monitor.sh):
```bash
#!/bin/bash
while true; do
  clear
  echo "=== HUNTA PROJECT MONITOR ==="
  echo "Time: $(date)"
  echo ""
  
  # Check if servers are running
  if tmux capture-pane -t hunta:3 -p | grep -q "VITE"; then
    echo "✅ Frontend: Running"
  else
    echo "❌ Frontend: Stopped"
  fi
  
  if tmux capture-pane -t hunta:4 -p | grep -q "Ready on"; then
    echo "✅ Backend: Running"
  else
    echo "❌ Backend: Stopped"
  fi
  
  echo ""
  echo "Recent Git Commits:"
  cd /Users/mattwright/pandora/gohunta.com/hunta-v2
  git log --oneline -5
  
  sleep 30
done
```

## Step 7: Task Management

### Create TODO.md in project root:
```markdown
# Hunta Development Tasks

## High Priority
- [ ] Implement real user authentication
- [ ] Connect to production D1 database
- [ ] Add image upload for dog profiles
- [ ] Implement route GPS tracking

## Medium Priority  
- [ ] Add user profile pages
- [ ] Implement commenting system
- [ ] Add email notifications
- [ ] Create admin dashboard

## Future Features
- [ ] Mobile app wrapper
- [ ] Offline mode with service workers
- [ ] Advanced search filters
- [ ] Social sharing features
```

## Quick Commands Reference

```bash
# Attach to orchestrator
tmux attach -t hunta:0

# Check all windows
tmux list-windows -t hunta

# Send command to agent
tmux send-keys -t hunta:1 "npm test" Enter

# View frontend logs
tmux capture-pane -t hunta:3 -p

# Switch between windows
# Ctrl+B then window number (0-5)
```

## Recommended Workflow

1. **Orchestrator** monitors overall progress
2. **Agents** work on specific tasks in Cursor
3. **Servers** run continuously for testing
4. **Git** commits every 30 minutes
5. **Deploy** when features are complete

This setup allows continuous development with AI assistance while maintaining code quality and project organization.
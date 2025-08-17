# Claude Code Agent Guide: Tmux Orchestrator Setup

## 🎯 Purpose
This guide helps Claude Code agents automatically set up Tmux Orchestrator systems with zero manual copy-pasting.

## 🤖 Agent Workflow

### Step 1: User Configuration
1. **User completes the wizard** at: https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev
2. **User provides session name** (e.g., "rawgle-and-gohunta")
3. **Agent receives setup request** from user

### Step 2: Automated Setup Command
```bash
# Claude Code agent executes this single command:
curl -s https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev/api/setup/SESSION_NAME | bash
```

**Replace SESSION_NAME with the actual session name provided by user**

### Step 3: What the Script Does Automatically
✅ **Fetches configuration** from the wizard<br/>
✅ **Creates all required files** (launcher, utilities, specs)<br/>
✅ **Makes scripts executable** with proper permissions<br/>
✅ **Offers to launch immediately** or save for later<br/>
✅ **No manual copy-pasting required**<br/>

## 🛠️ Prerequisites Check
Before running, agent should verify:

```bash
# Check for required tools
command -v jq >/dev/null 2>&1 || echo "Install jq: brew install jq"
command -v tmux >/dev/null 2>&1 || echo "Install tmux: brew install tmux"
command -v claude >/dev/null 2>&1 || echo "Claude CLI required"
```

## 📁 Generated Files
The setup script creates:
- `launch_SESSION_NAME.sh` - Main orchestrator launcher
- `project_spec.md` - Project specification and requirements
- `send-claude-message.sh` - Communication utility for agents
- `schedule_with_note.sh` - Automated check-in scheduling
- `quick_commands.txt` - Reference commands for management

## 🚀 Launch Process
After setup, agent can launch with:
```bash
./launch_SESSION_NAME.sh
```

This creates the tmux session with all agents and starts the orchestrator.

## 🔧 Troubleshooting

### Configuration Not Found
```bash
# If setup fails with "No configuration found"
echo "User needs to complete wizard first at:"
echo "https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev"
```

### Missing Dependencies
```bash
# Install missing tools
brew install jq tmux  # macOS
apt-get install jq tmux  # Ubuntu
```

### Permission Issues
```bash
# Fix script permissions
chmod +x *.sh
```

## 🎯 Agent Best Practices

### 1. Always Navigate to Project Directory First
```bash
cd /path/to/user/project
# Then run setup command
```

### 2. Verify Prerequisites
```bash
# Check tools before setup
if ! command -v jq &> /dev/null; then
    echo "Installing jq..."
    brew install jq
fi
```

### 3. Confirm Setup Success
```bash
# Verify files were created
if [[ -f "./launch_SESSION_NAME.sh" ]]; then
    echo "✅ Setup successful!"
    echo "Ready to launch orchestrator"
else
    echo "❌ Setup failed - check error messages above"
fi
```

### 4. Handle Launch Decision
```bash
# Ask user if they want to launch immediately
echo "Setup complete. Launch orchestrator now? (y/n)"
# If yes: ./launch_SESSION_NAME.sh
# If no: Provide instructions for later launch
```

## 📋 Example Agent Conversation

**User:** "Set up tmux orchestrator for my project using session 'my-api-project'"

**Agent Response:**
```
I'll set up the Tmux Orchestrator for your project. Let me run the automated setup:

[Executes: curl -s https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev/api/setup/my-api-project | bash]

✅ Setup complete! Created:
- launch_my-api-project.sh
- project_spec.md  
- send-claude-message.sh
- schedule_with_note.sh
- quick_commands.txt

Would you like me to launch the orchestrator now?
```

## 🔄 Advanced Usage

### Check Configuration
```bash
# Agent can verify stored configuration
curl -s https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev/api/config/SESSION_NAME
```

### Custom Setup Commands
```bash
# Get agent-specific commands
curl -s -X POST https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev/api/agent-setup \
  -H "Content-Type: application/json" \
  -d '{"projectName":"my-project","projectType":"fix",...}'
```

## 🎉 Success Criteria
- ✅ No manual file creation or copy-pasting
- ✅ All scripts generated and made executable
- ✅ Configuration retrieved from wizard
- ✅ Orchestrator ready to launch
- ✅ User can start working immediately

---

**Remember:** The goal is complete automation. Users configure via wizard, agents execute one command, orchestrator launches. No manual steps!
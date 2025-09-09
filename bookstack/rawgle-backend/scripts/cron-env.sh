#!/bin/bash
# Environment setup for cron jobs

# Change to project directory
cd "/Users/mattwright/pandora/bookstack/rawgle-backend"

# Export PATH to include node and npm
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
export NODE_ENV="test"

# Export Archon integration variables
export ARCHON_TASK_ID="a6f60267-ebed-4018-a1ae-c4a7fa59ccc7"
export ARCHON_PROJECT_ID="12b025a5-f1ee-4901-98c1-b088e35d91de"

# Source any additional environment files
if [ -f ".env.test" ]; then
  source .env.test
fi

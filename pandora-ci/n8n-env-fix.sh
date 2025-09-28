#!/bin/bash
# Environment variables to fix n8n deprecation warnings

# Fix file permissions warning
export N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true

# Enable SQLite connection pooling for better performance
export DB_SQLITE_POOL_SIZE=10

# Enable task runners (will be default in future)
export N8N_RUNNERS_ENABLED=true

# Keep environment variable access if needed for your workflows
# Set to true if you don't need env var access in Code nodes
export N8N_BLOCK_ENV_ACCESS_IN_NODE=false

echo "n8n environment variables configured to address deprecation warnings"
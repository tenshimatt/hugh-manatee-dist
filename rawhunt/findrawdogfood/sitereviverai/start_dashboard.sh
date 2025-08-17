#!/bin/bash
# Start SiteReviverAI Dashboard - No External Dependencies

echo "🚀 Starting SiteReviverAI Dashboard..."
echo "📦 Using built-in Python HTTP server (no Flask needed)"

# Change to project directory
cd /Users/mattwright/pandora/findrawdogfood/sitereviverai

echo "🎨 Starting dashboard server..."
echo "📊 Dashboard will open at: http://localhost:5001"
echo "🔄 Use Ctrl+C to stop"

# Run the simple dashboard server
python3 simple_dashboard_server.py

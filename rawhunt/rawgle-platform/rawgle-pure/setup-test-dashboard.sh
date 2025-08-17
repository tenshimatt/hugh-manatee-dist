#!/bin/bash

# Test Dashboard Setup Script

echo "🧪 Rawgle Test Dashboard Setup"
echo "==============================="
echo ""

echo "Setting up local test dashboard server..."
echo ""

# Start local server if not already running
if ! pgrep -f "python.*http.server.*8080" > /dev/null; then
    echo "🌐 Starting local web server on port 8080..."
    python3 -m http.server 8080 &
    SERVER_PID=$!
    echo "   Server PID: $SERVER_PID"
    
    # Wait for server to start
    sleep 2
    
    echo "✅ Server started successfully"
else
    echo "✅ Server already running on port 8080"
fi

echo ""
echo "📊 Dashboard Access Information:"
echo "================================"
echo ""
echo "🔗 Dashboard URL: http://localhost:8080/test-management-ui.html"
echo "🔑 Admin Token:   rawgle-admin-2025"
echo ""
echo "📋 Instructions:"
echo "1. Open the dashboard URL in your browser"
echo "2. When prompted, enter the admin token: rawgle-admin-2025"
echo "3. The dashboard will connect to the live API for real-time data"
echo ""
echo "🔧 API Endpoints Available:"
echo "• Live API: https://rawgle-api.findrawdogfood.workers.dev"
echo "• Test Management: /api/test-management/"
echo "• Health Check: /api/health"
echo ""
echo "🧪 Testing connection first..."
echo ""

# Try to open connection test first
if command -v open &> /dev/null; then
    open "http://localhost:8080/test-dashboard-connection.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8080/test-dashboard-connection.html"
else
    echo "   Please manually open: http://localhost:8080/test-dashboard-connection.html"
fi

echo "✅ Connection test opened. If all tests pass, proceed to main dashboard:"
echo "🚀 Main Dashboard: http://localhost:8080/test-management-ui.html"

echo ""
echo "✨ Dashboard setup complete!"
echo ""
echo "💡 To stop the server later, run:"
echo "   pkill -f 'python.*http.server.*8080'"
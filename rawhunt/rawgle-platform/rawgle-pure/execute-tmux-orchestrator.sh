#!/bin/bash
# RAWGLE PLATFORM - TMUX TEST ORCHESTRATION EXECUTOR
# Systematic fix for 109/125 failing tests (87% failure rate)

set -e

echo "🚨 CRITICAL: RAWGLE PLATFORM TEST REPAIR ORCHESTRATION"
echo "📊 Status: 109/125 tests failing (87% failure rate)"
echo "🎯 Objective: Systematic repair of all failing components"
echo "=================================================="

# Ensure we're in the right directory
cd /Users/mattwright/pandora/rawgle-platform/rawgle-pure

# Create coordination log
touch /tmp/tmux-coordination.log
echo "$(date): Starting tmux orchestration for test repairs" >> /tmp/tmux-coordination.log

# Check if tmuxinator is installed
if ! command -v tmuxinator &> /dev/null; then
    echo "⚠️  tmuxinator not found, using tmux directly"
    
    # Create tmux session manually
    tmux new-session -d -s rawgle-test-fix
    
    # Create all windows as defined in the yml
    tmux new-window -t rawgle-test-fix -n coordination
    tmux new-window -t rawgle-test-fix -n backend-agents  
    tmux new-window -t rawgle-test-fix -n feature-agents
    tmux new-window -t rawgle-test-fix -n test-generators
    tmux new-window -t rawgle-test-fix -n security-performance
    tmux new-window -t rawgle-test-fix -n frontend-repair
    tmux new-window -t rawgle-test-fix -n deployment-validation
    tmux new-window -t rawgle-test-fix -n live-monitoring
    
    echo "✅ tmux session 'rawgle-test-fix' created with 8 agent windows"
    echo "🔄 To attach: tmux attach-session -t rawgle-test-fix"
else
    echo "🚀 Using tmuxinator to start orchestration..."
    tmuxinator start -p tmux-test-orchestrator.yml
fi

echo ""
echo "🎯 MULTI-AGENT SYSTEM LAUNCHED"
echo "==============================================="
echo "CRITICAL REPAIR AGENTS ACTIVE:"
echo ""
echo "🔐 AUTH REPAIR AGENT - Fixing authentication (Tests 003, 011-020, 024, 084-089)"
echo "🔧 API REPAIR AGENT - Fixing core endpoints (Tests 001-007, 025-043, 079-083)"
echo "🗄️ DATABASE REPAIR AGENT - Fixing D1 schema issues"
echo "💰 PAWS REPAIR AGENT - Fixing PAWS system (Tests 008-043)"
echo "🏥 AI MEDICAL AGENT - Fixing AI endpoints (Tests 044-058, 107)"
echo "🎨 NFT REPAIR AGENT - Fixing NFT system (Tests 059-078, 108)"
echo "📝 TEST GENERATOR AGENT - Creating 64+ missing test files"
echo "🔒 SECURITY AGENT - Fixing security tests (Tests 079-102)"
echo "⚡ PERFORMANCE AGENT - Fixing performance tests (Tests 113-125)"
echo "🌐 FRONTEND AGENT - Fixing frontend connectivity"
echo "🚀 DEPLOYMENT AGENT - Coordinating deployments"
echo ""
echo "📊 TARGET: Fix 109/125 failing tests → 0 failures"
echo "⏱️ Expected Duration: 2-4 hours for systematic repairs"
echo ""
echo "🔄 To monitor progress:"
echo "   tmux attach-session -t rawgle-test-fix"
echo "   Use Ctrl+B then arrow keys to switch between agent windows"
echo ""
echo "📋 Coordination log: /tmp/tmux-coordination.log"
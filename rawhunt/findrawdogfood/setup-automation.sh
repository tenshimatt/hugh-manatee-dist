#!/bin/bash
# Setup script for automated daily scraping

echo "⚙️  Setting up automated daily scraping workflow..."

# Make scripts executable
chmod +x daily-workflow.sh
chmod +x auto-import.sh

# Create logs directory
mkdir -p logs

# Test the workflow once
echo "🧪 Testing workflow (this may take a few minutes)..."
echo "Press Ctrl+C to skip test and go straight to scheduling"
sleep 3

# Quick test run (with timeout)
timeout 60 ./daily-workflow.sh

echo ""
echo "📅 Setting up cron job..."

# Backup existing crontab
crontab -l > crontab_backup.txt 2>/dev/null || echo "# No existing crontab" > crontab_backup.txt
echo "💾 Backed up existing crontab to crontab_backup.txt"

# Add our cron job
echo "Adding daily scraping job to crontab..."
(crontab -l 2>/dev/null; echo "# FindRawDogFood daily scraper"; echo "0 2 * * * cd /Users/mattwright/pandora/findrawdogfood && ./daily-workflow.sh") | crontab -

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Current crontab:"
crontab -l
echo ""
echo "🎯 Your scraper will now run daily at 2:00 AM"
echo ""
echo "📊 Manual commands:"
echo "  Start scraper now: ./daily-workflow.sh"
echo "  View logs: ls logs/"
echo "  Check cron jobs: crontab -l"
echo "  Edit schedule: crontab -e"
echo ""
echo "🔍 Monitor with:"
echo "  tail -f logs/scraper_*.log"
echo "  ps aux | grep google-places-scraper"
echo ""
echo "📈 Expected daily results:"
echo "  • 1,000-1,200 new suppliers per day"
echo "  • 30,000+ suppliers per month"
echo "  • Automatic deduplication"
echo "  • Live API updates"

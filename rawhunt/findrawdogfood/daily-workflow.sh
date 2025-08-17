#!/bin/bash
# Daily automated scraping and import workflow

# Set working directory
cd /Users/mattwright/pandora/findrawdogfood

# Create log directory
mkdir -p logs

# Generate timestamp for logs
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
log_file="logs/scraper_${timestamp}.log"

echo "🚀 Starting daily scraping workflow at $(date)" | tee $log_file

# Check if another scraper is running
if pgrep -f "google-places-scraper.js" > /dev/null; then
    echo "⚠️  Scraper already running, exiting" | tee -a $log_file
    exit 1
fi

# Step 1: Run Google Places scraper
echo "📊 Phase 1: Starting Google Places scraper..." | tee -a $log_file
timeout 7200 node google-places-scraper.js >> $log_file 2>&1

scraper_exit_code=$?
if [ $scraper_exit_code -eq 0 ]; then
    echo "✅ Scraper completed successfully" | tee -a $log_file
elif [ $scraper_exit_code -eq 124 ]; then
    echo "⏰ Scraper timed out (2 hours), proceeding with import" | tee -a $log_file
else
    echo "❌ Scraper failed with exit code $scraper_exit_code" | tee -a $log_file
fi

# Step 2: Import scraped data to D1
echo "📥 Phase 2: Importing data to D1..." | tee -a $log_file
node d1-importer.js >> $log_file 2>&1

import_exit_code=$?
if [ $import_exit_code -eq 0 ]; then
    echo "✅ Import completed successfully" | tee -a $log_file
else
    echo "❌ Import failed with exit code $import_exit_code" | tee -a $log_file
fi

# Step 3: Get final statistics
echo "📈 Phase 3: Collecting statistics..." | tee -a $log_file

# Count CSV files created today
today=$(date +"%Y-%m-%d")
csv_count=$(ls scraped_places_${today}*.csv 2>/dev/null | wc -l)
echo "📁 CSV files created today: $csv_count" | tee -a $log_file

# Test API
echo "🧪 Testing API..." | tee -a $log_file
api_response=$(curl -s "https://findrawdogfood.findrawdogfood.workers.dev/api/stats" | head -n 1)
echo "API response: $api_response" | tee -a $log_file

# Step 4: Cleanup old files (keep last 7 days)
echo "🧹 Cleaning up old files..." | tee -a $log_file
find . -name "scraped_places_*.csv" -mtime +7 -delete
find logs -name "scraper_*.log" -mtime +30 -delete

# Step 5: Summary
echo "📊 Daily workflow completed at $(date)" | tee -a $log_file
echo "Log saved to: $log_file" | tee -a $log_file

# Send summary to console
echo ""
echo "=== DAILY SUMMARY ==="
echo "Scraper exit code: $scraper_exit_code"
echo "Import exit code: $import_exit_code"
echo "CSV files today: $csv_count"
echo "Log file: $log_file"
echo "======================"

#!/bin/bash

echo "🔄 Auto-import workflow for scraped data"

# Wait for scraper to finish if it's running
if pgrep -f "google-places-scraper.js" > /dev/null; then
    echo "⏳ Scraper is still running, waiting for completion..."
    while pgrep -f "google-places-scraper.js" > /dev/null; do
        sleep 30
        echo "   Still scraping..."
    done
    echo "✅ Scraper completed"
fi

# Check if we have new CSV files
csv_files=$(ls scraped_places_*.csv 2>/dev/null | wc -l)

if [ $csv_files -eq 0 ]; then
    echo "❌ No CSV files found to import"
    exit 1
fi

echo "📁 Found $csv_files CSV file(s)"

# Import the latest CSV
echo "🚀 Starting import to D1..."
node d1-importer.js

# Test API to verify data is accessible
echo "🧪 Testing API with new data..."
curl -s "https://findrawdogfood.findrawdogfood.workers.dev/api/stats" | head -n 20

echo ""
echo "✅ Import workflow completed!"
echo "🌐 API available at: https://findrawdogfood.findrawdogfood.workers.dev"

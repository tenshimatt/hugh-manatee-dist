#!/bin/bash

# Complete automation setup for Proxmox
# SSH into your Proxmox server and run these commands

# 1. Create automation directory
sudo mkdir -p /opt/findrawdogfood
cd /opt/findrawdogfood

# 2. Create enhanced scraper that rotates API keys
cat > smart-scraper.js << 'EOF'
const fs = require('fs');
const fetch = require('node-fetch');

const API_KEYS = [
    'AIzaSyAaitGKLzY7PuyYYWLNifeQEqxfaWzncfg', // Personal
    'AIzaSyBnvRVRCE8ixANqhHCS99MQtlUBmlFr7Mk'  // Business
];

const SEARCH_TERMS = [
    'raw dog food',
    'BARF diet',
    'raw pet food',
    'natural dog food',
    'raw dog food supplier',
    'pet food store',
    'dog food shop',
    'raw feeding',
    'natural pet nutrition'
];

let currentKeyIndex = 0;
let requestCount = 0;
const MAX_REQUESTS_PER_KEY = 100; // Stay under daily limit

function getNextApiKey() {
    if (requestCount >= MAX_REQUESTS_PER_KEY) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        requestCount = 0;
        console.log(`Switched to API key ${currentKeyIndex + 1}`);
    }
    requestCount++;
    return API_KEYS[currentKeyIndex];
}

async function searchPlaces(query, location = 'United Kingdom') {
    const apiKey = getNextApiKey();
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' in ' + location)}&key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            return data.results || [];
        } else {
            console.log(`API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            return [];
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

async function getPlaceDetails(placeId) {
    const apiKey = getNextApiKey();
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,business_status&key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            return data.result;
        }
        return null;
    } catch (error) {
        console.error('Details fetch error:', error);
        return null;
    }
}

async function dailyScrape() {
    const today = new Date().toISOString().split('T')[0];
    const filename = `new-suppliers-${today}.csv`;
    
    const csvHeader = 'business_name,address,phone,website,city,state,country\n';
    fs.writeFileSync(filename, csvHeader);
    
    let totalFound = 0;
    const processedPlaces = new Set();
    
    // Rotate through search terms
    for (const term of SEARCH_TERMS) {
        console.log(`Searching for: ${term}`);
        
        const places = await searchPlaces(term);
        
        for (const place of places) {
            if (processedPlaces.has(place.place_id)) continue;
            processedPlaces.add(place.place_id);
            
            const details = await getPlaceDetails(place.place_id);
            if (!details) continue;
            
            // Extract city from address
            const addressParts = details.formatted_address.split(',');
            const city = addressParts.length > 1 ? addressParts[addressParts.length - 3]?.trim() : '';
            
            const csvRow = [
                `"${(details.name || '').replace(/"/g, '""')}"`,
                `"${(details.formatted_address || '').replace(/"/g, '""')}"`,
                `"${details.formatted_phone_number || ''}"`,
                `"${details.website || ''}"`,
                `"${city}"`,
                `"${addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : ''}"`,
                '"United Kingdom"'
            ].join(',') + '\n';
            
            fs.appendFileSync(filename, csvRow);
            totalFound++;
            
            // Delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Longer delay between search terms
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`Found ${totalFound} new suppliers`);
    return totalFound > 0 ? filename : null;
}

// Run the scraper
dailyScrape().then(filename => {
    if (filename) {
        console.log(`Scraping completed. Data saved to: ${filename}`);
    } else {
        console.log('No new data collected today');
    }
}).catch(error => {
    console.error('Scraping failed:', error);
    process.exit(1);
});
EOF

# 3. Create D1 importer
cat > d1-importer.js << 'EOF'
const fs = require('fs');
const csv = require('csv-parser');
const { execSync } = require('child_process');

async function importToD1(csvFile) {
    const tempSqlFile = 'temp-import.sql';
    let sqlStatements = '';
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFile)
            .pipe(csv())
            .on('data', (row) => {
                const stmt = `INSERT OR IGNORE INTO suppliers (business_name, address, phone, website, city, state, country) VALUES (
                    ${JSON.stringify(row.business_name)},
                    ${JSON.stringify(row.address)},
                    ${JSON.stringify(row.phone)},
                    ${JSON.stringify(row.website)},
                    ${JSON.stringify(row.city)},
                    ${JSON.stringify(row.state)},
                    ${JSON.stringify(row.country)}
                );\n`;
                sqlStatements += stmt;
            })
            .on('end', () => {
                fs.writeFileSync(tempSqlFile, sqlStatements);
                
                try {
                    // Execute D1 import
                    const output = execSync(`wrangler d1 execute findrawdogfood-db --file=${tempSqlFile}`, 
                        { encoding: 'utf8', cwd: '/Users/mattwright/pandora/findrawdogfood' });
                    
                    console.log('D1 import completed:', output);
                    
                    // Cleanup
                    fs.unlinkSync(tempSqlFile);
                    resolve();
                } catch (error) {
                    console.error('D1 import failed:', error);
                    reject(error);
                }
            })
            .on('error', reject);
    });
}

// Import the file passed as argument
const csvFile = process.argv[2];
if (!csvFile || !fs.existsSync(csvFile)) {
    console.error('Please provide a valid CSV file path');
    process.exit(1);
}

importToD1(csvFile).then(() => {
    console.log('Import completed successfully');
}).catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
});
EOF

# 4. Create monitoring script
cat > daily-automation.sh << 'EOF'
#!/bin/bash

# FindRawDogFood Daily Automation
# Runs at 2 AM daily via cron

cd /opt/findrawdogfood
DATE=$(date +%Y-%m-%d)
LOG_FILE="logs/automation-$DATE.log"

mkdir -p logs archive

echo "=== FindRawDogFood Daily Automation Started at $(date) ===" >> $LOG_FILE

# Install/update dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..." >> $LOG_FILE
    npm init -y >> $LOG_FILE 2>&1
    npm install node-fetch csv-parser >> $LOG_FILE 2>&1
fi

# Run smart scraper
echo "Starting intelligent scraping..." >> $LOG_FILE
timeout 30m node smart-scraper.js >> $LOG_FILE 2>&1

# Check if new data was collected
NEW_FILE=$(ls new-suppliers-$DATE.csv 2>/dev/null)
if [ -n "$NEW_FILE" ]; then
    echo "New data found: $NEW_FILE" >> $LOG_FILE
    
    # Count new records
    NEW_COUNT=$(tail -n +2 "$NEW_FILE" | wc -l)
    echo "New suppliers collected: $NEW_COUNT" >> $LOG_FILE
    
    if [ $NEW_COUNT -gt 0 ]; then
        # Import to D1 database
        echo "Importing to D1 database..." >> $LOG_FILE
        node d1-importer.js "$NEW_FILE" >> $LOG_FILE 2>&1
        
        if [ $? -eq 0 ]; then
            echo "Successfully imported $NEW_COUNT new suppliers" >> $LOG_FILE
            
            # Archive the file
            mv "$NEW_FILE" "archive/"
            echo "File archived to archive/$NEW_FILE" >> $LOG_FILE
        else
            echo "Import failed, keeping file for manual review" >> $LOG_FILE
        fi
    else
        echo "Empty file, removing..." >> $LOG_FILE
        rm "$NEW_FILE"
    fi
else
    echo "No new data collected today" >> $LOG_FILE
fi

# Cleanup old logs (keep 30 days)
find logs/ -name "*.log" -mtime +30 -delete 2>/dev/null

# Send status email (optional)
echo "Daily automation completed at $(date)" >> $LOG_FILE
echo "=== End of automation ===" >> $LOG_FILE

# Simple status notification
TOTAL_LINES=$(wc -l < $LOG_FILE)
if [ $TOTAL_LINES -gt 20 ]; then
    echo "Automation completed with detailed logs" | mail -s "FindRawDogFood Daily Update" tenshimatt@gmail.com 2>/dev/null
fi
EOF

# 5. Make scripts executable
chmod +x daily-automation.sh
chmod +x smart-scraper.js
chmod +x d1-importer.js

# 6. Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 7. Setup cron job (2 AM daily)
(crontab -l 2>/dev/null | grep -v "findrawdogfood"; echo "0 2 * * * /opt/findrawdogfood/daily-automation.sh") | crontab -

echo "✅ Automation setup complete!"
echo "📅 Daily scraping will run at 2 AM"
echo "📊 Logs will be stored in /opt/findrawdogfood/logs/"
echo "📁 Data archives in /opt/findrawdogfood/archive/"
echo ""
echo "To test manually: /opt/findrawdogfood/daily-automation.sh"
echo "To check cron: crontab -l"
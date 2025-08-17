// Import scraped data to Cloudflare D1 with deduplication
const fs = require('fs');
const { execSync } = require('child_process');

class D1Importer {
  constructor() {
    this.databaseName = 'findrawdogfood-db';
    this.batchSize = 100; // Safe batch size for D1
  }

  async importCSV(csvFileName) {
    console.log(`📥 Starting import of ${csvFileName} to D1 database...`);
    
    // Step 1: Read CSV and parse
    const csvData = this.parseCSV(csvFileName);
    console.log(`📊 Parsed ${csvData.length} records from CSV`);
    
    // Step 2: Check for duplicates against existing D1 data
    const newRecords = await this.filterDuplicates(csvData);
    console.log(`🆕 Found ${newRecords.length} new records (${csvData.length - newRecords.length} duplicates skipped)`);
    
    if (newRecords.length === 0) {
      console.log('✅ No new records to import');
      return;
    }
    
    // Step 3: Create SQL import files
    await this.createImportFiles(newRecords);
    
    // Step 4: Import to D1
    await this.executeImport(newRecords.length);
    
    console.log(`🎉 Import completed! Added ${newRecords.length} new suppliers`);
  }

  parseCSV(fileName) {
    const csvContent = fs.readFileSync(fileName, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Parse CSV row (handle quoted fields)
      const row = this.parseCSVRow(lines[i]);
      if (row.length !== headers.length) continue;
      
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] || '';
      });
      
      records.push(record);
    }
    
    return records;
  }

  parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  async filterDuplicates(csvData) {
    console.log('🔍 Checking for duplicates against existing database...');
    
    // Get existing place_ids from D1
    try {
      const result = execSync(
        `npx wrangler d1 execute ${this.databaseName} --remote --command="SELECT place_id FROM suppliers WHERE place_id IS NOT NULL"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      // Parse existing place_ids from wrangler output
      const existingPlaceIds = this.parseWranglerOutput(result);
      const existingSet = new Set(existingPlaceIds);
      
      console.log(`📋 Found ${existingSet.size} existing place_ids in database`);
      
      // Filter out duplicates
      const newRecords = csvData.filter(record => {
        const placeId = record.place_id;
        if (!placeId || existingSet.has(placeId)) {
          return false;
        }
        return true;
      });
      
      return newRecords;
      
    } catch (error) {
      console.log('⚠️  Could not check existing data, importing all records');
      console.log('Error:', error.message);
      return csvData;
    }
  }

  parseWranglerOutput(output) {
    const lines = output.split('\n');
    const placeIds = [];
    
    // Look for lines that contain place_id values
    for (const line of lines) {
      if (line.includes('ChIJ') || line.includes('ChEJ')) { // Google place_id format
        const match = line.match(/│\s*(ChI[A-Za-z0-9_-]+)\s*│/);
        if (match) {
          placeIds.push(match[1]);
        }
      }
    }
    
    return placeIds;
  }

  async createImportFiles(records) {
    console.log(`📝 Creating import SQL files for ${records.length} records...`);
    
    const batches = this.chunkArray(records, this.batchSize);
    
    // Clear any existing import files
    const existingFiles = fs.readdirSync('.').filter(f => f.startsWith('import_new_'));
    existingFiles.forEach(f => fs.unlinkSync(f));
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const fileName = `import_new_batch_${i + 1}.sql`;
      
      let sqlContent = `-- New suppliers import batch ${i + 1}\n`;
      
      for (const record of batch) {
        const values = this.recordToSQLValues(record);
        sqlContent += `INSERT OR IGNORE INTO suppliers (${Object.keys(record).join(', ')}) VALUES (${values});\n`;
      }
      
      fs.writeFileSync(fileName, sqlContent);
      console.log(`📄 Created ${fileName} with ${batch.length} records`);
    }
    
    return batches.length;
  }

  recordToSQLValues(record) {
    return Object.values(record).map(value => {
      if (value === null || value === undefined || value === '') {
        return 'NULL';
      }
      
      // Escape SQL and wrap in quotes
      const escaped = String(value).replace(/'/g, "''");
      return `'${escaped}'`;
    }).join(', ');
  }

  async executeImport(totalRecords) {
    console.log(`🚀 Importing ${totalRecords} records to D1...`);
    
    const importFiles = fs.readdirSync('.').filter(f => f.startsWith('import_new_batch_'));
    
    for (let i = 0; i < importFiles.length; i++) {
      const fileName = importFiles[i];
      console.log(`📤 Importing batch ${i + 1}/${importFiles.length}...`);
      
      try {
        execSync(
          `npx wrangler d1 execute ${this.databaseName} --remote --file="${fileName}"`,
          { stdio: 'inherit' }
        );
        console.log(`✅ Batch ${i + 1} imported successfully`);
        
        // Delete imported file
        fs.unlinkSync(fileName);
        
      } catch (error) {
        console.log(`❌ Error importing batch ${i + 1}:`, error.message);
      }
      
      // Small delay between batches
      await this.sleep(2000);
    }
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Verify import results
  async verifyImport() {
    console.log('🔍 Verifying import results...');
    
    try {
      console.log('\nTotal suppliers in database:');
      execSync(
        `npx wrangler d1 execute ${this.databaseName} --remote --command="SELECT COUNT(*) as total FROM suppliers"`,
        { stdio: 'inherit' }
      );
      
      console.log('\nLatest imported suppliers:');
      execSync(
        `npx wrangler d1 execute ${this.databaseName} --remote --command="SELECT name, city, state, rating FROM suppliers ORDER BY created_at DESC LIMIT 5"`,
        { stdio: 'inherit' }
      );
      
    } catch (error) {
      console.log('Error verifying:', error.message);
    }
  }
}

// Usage function
async function importLatestScrapeData() {
  const importer = new D1Importer();
  
  // Find the latest CSV file
  const csvFiles = fs.readdirSync('.').filter(f => f.startsWith('scraped_places_') && f.endsWith('.csv'));
  
  if (csvFiles.length === 0) {
    console.log('❌ No scraped CSV files found');
    return;
  }
  
  // Sort by date and get latest
  csvFiles.sort().reverse();
  const latestFile = csvFiles[0];
  
  console.log(`📁 Found latest CSV: ${latestFile}`);
  
  await importer.importCSV(latestFile);
  await importer.verifyImport();
}

// Run if called directly
if (require.main === module) {
  importLatestScrapeData().catch(console.error);
}

module.exports = D1Importer;

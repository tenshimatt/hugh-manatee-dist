// Enhanced D1 Importer for Complete Google Places Data
// Handles ALL Google Places API fields with proper data types

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CompleteD1Importer {
  constructor() {
    this.databaseName = 'findrawdogfood-db';
    this.tableName = 'suppliers_complete';
    this.batchSize = 50; // Smaller batches for complex data
  }

  async importCompleteCSV(csvFilePath) {
    console.log(`🚀 Starting complete import from ${csvFilePath}`);
    
    try {
      // Step 1: Create/update table schema
      await this.updateDatabaseSchema();
      
      // Step 2: Read and parse CSV
      const csvData = this.parseCSV(csvFilePath);
      console.log(`📊 Parsed ${csvData.length} complete supplier records`);
      
      // Step 3: Deduplicate against existing data
      const newRecords = await this.deduplicateRecords(csvData);
      console.log(`🔍 Found ${newRecords.length} new suppliers after deduplication`);
      
      if (newRecords.length === 0) {
        console.log('✅ No new records to import');
        return { success: true, imported: 0, duplicates: csvData.length };
      }
      
      // Step 4: Validate and clean data
      const validRecords = this.validateRecords(newRecords);
      console.log(`✅ Validated ${validRecords.length} records for import`);
      
      // Step 5: Import in batches
      const importResult = await this.batchImport(validRecords);
      
      console.log(`🎉 Import completed: ${importResult.imported} new suppliers added`);
      return importResult;
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  async updateDatabaseSchema() {
    console.log('🏗️  Updating database schema...');
    
    try {
      // Read and execute schema
      const schemaSQL = fs.readFileSync('d1-schema-complete.sql', 'utf8');
      
      // Split into individual statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const command = `npx wrangler d1 execute ${this.databaseName} --remote --command="${statement.replace(/"/g, '\\"')}"`;
            execSync(command, { stdio: 'pipe' });
          } catch (error) {
            // Ignore errors for existing indexes/tables
            if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
              console.warn(`Schema warning: ${error.message.slice(0, 100)}...`);
            }
          }
        }
      }
      
      console.log('✅ Database schema updated');
    } catch (error) {
      console.error('❌ Schema update failed:', error);
      throw error;
    }
  }

  parseCSV(csvFilePath) {
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain header and at least one data row');
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(header => 
      header.replace(/^"/, '').replace(/"$/, '').trim()
    );
    
    // Parse data rows
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          console.warn(`⚠️  Row ${i} has ${values.length} values but ${headers.length} headers, skipping`);
          continue;
        }
        
        const record = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || null;
        });
        
        records.push(record);
      } catch (error) {
        console.warn(`⚠️  Error parsing row ${i}: ${error.message}`);
      }
    }
    
    return records;
  }
  
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
          continue;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      
      i++;
    }
    
    // Add final field
    values.push(current.trim());
    
    return values;
  }

  async deduplicateRecords(csvData) {
    console.log('🔍 Deduplicating against existing database...');
    
    try {
      // Get existing place_ids from database
      const command = `npx wrangler d1 execute ${this.databaseName} --remote --command="SELECT place_id FROM ${this.tableName} WHERE place_id IS NOT NULL"`;
      const result = execSync(command, { encoding: 'utf8' });
      
      // Parse existing place_ids
      const existingPlaceIds = new Set();
      const lines = result.split('\n');
      
      for (const line of lines) {
        if (line.includes('│') && !line.includes('place_id') && !line.includes('─')) {
          const placeId = line.split('│')[1]?.trim();
          if (placeId && placeId !== 'place_id') {
            existingPlaceIds.add(placeId);
          }
        }
      }
      
      console.log(`📋 Found ${existingPlaceIds.size} existing place_ids in database`);
      
      // Filter out duplicates
      const newRecords = csvData.filter(record => {
        const placeId = record.place_id;
        return placeId && !existingPlaceIds.has(placeId);
      });
      
      const duplicateCount = csvData.length - newRecords.length;
      console.log(`🚫 Filtered out ${duplicateCount} duplicates`);
      
      return newRecords;
    } catch (error) {
      console.warn('⚠️  Deduplication failed, proceeding with all records:', error.message);
      return csvData;
    }
  }

  validateRecords(records) {
    const validRecords = [];
    
    for (const record of records) {
      try {
        // Required fields validation
        if (!record.place_id || !record.name) {
          console.warn(`⚠️  Skipping record without place_id or name`);
          continue;
        }
        
        // Clean and validate data types
        const cleanRecord = this.cleanRecord(record);
        validRecords.push(cleanRecord);
        
      } catch (error) {
        console.warn(`⚠️  Validation error for ${record.name}: ${error.message}`);
      }
    }
    
    return validRecords;
  }

  cleanRecord(record) {
    const cleaned = { ...record };
    
    // Clean numeric fields
    const numericFields = ['latitude', 'longitude', 'rating', 'user_ratings_total', 'price_level', 'utc_offset'];
    numericFields.forEach(field => {
      if (cleaned[field] !== null && cleaned[field] !== '') {
        const num = parseFloat(cleaned[field]);
        cleaned[field] = isNaN(num) ? null : num;
      } else {
        cleaned[field] = null;
      }
    });
    
    // Clean boolean fields
    const booleanFields = [
      'delivery', 'dine_in', 'takeout', 'reservable', 'curbside_pickup',
      'wheelchair_accessible_entrance', 'serves_breakfast', 'serves_lunch',
      'serves_dinner', 'serves_brunch', 'serves_beer', 'serves_wine', 'serves_vegetarian_food'
    ];
    booleanFields.forEach(field => {
      if (cleaned[field] !== null && cleaned[field] !== '') {
        const value = cleaned[field].toString().toLowerCase();
        cleaned[field] = value === 'true' || value === '1' || value === 'yes';
      } else {
        cleaned[field] = null;
      }
    });
    
    // Validate JSON fields
    const jsonFields = [
      'types', 'address_components', 'geometry', 'plus_code', 'opening_hours',
      'current_opening_hours', 'secondary_opening_hours', 'reviews', 'photos'
    ];
    jsonFields.forEach(field => {
      if (cleaned[field] && cleaned[field] !== 'null') {
        try {
          // Validate JSON by parsing
          JSON.parse(cleaned[field]);
        } catch (error) {
          console.warn(`⚠️  Invalid JSON in ${field}, setting to null`);
          cleaned[field] = null;
        }
      } else {
        cleaned[field] = null;
      }
    });
    
    // Clean text fields (remove extra quotes, trim)
    const textFields = [
      'name', 'formatted_address', 'adr_address', 'vicinity', 'postal_code',
      'city', 'state', 'country', 'formatted_phone_number', 'international_phone_number',
      'website', 'url', 'business_status', 'editorial_summary', 'icon',
      'icon_mask_base_uri', 'icon_background_color', 'keyword', 'place_type'
    ];
    textFields.forEach(field => {
      if (cleaned[field]) {
        cleaned[field] = cleaned[field].toString().trim();
        // Remove surrounding quotes if present
        if (cleaned[field].startsWith('"') && cleaned[field].endsWith('"')) {
          cleaned[field] = cleaned[field].slice(1, -1);
        }
      }
    });
    
    // Ensure required timestamps
    if (!cleaned.created_at) {
      cleaned.created_at = new Date().toISOString();
    }
    if (!cleaned.updated_at) {
      cleaned.updated_at = new Date().toISOString();
    }
    
    return cleaned;
  }

  async batchImport(records) {
    console.log(`📦 Importing ${records.length} records in batches of ${this.batchSize}...`);
    
    let imported = 0;
    let errors = 0;
    
    for (let i = 0; i < records.length; i += this.batchSize) {
      const batch = records.slice(i, i + this.batchSize);
      
      try {
        const result = await this.importBatch(batch);
        imported += result.success;
        errors += result.errors;
        
        const progress = Math.round(((i + batch.length) / records.length) * 100);
        console.log(`📈 Progress: ${progress}% (${imported} imported, ${errors} errors)`);
        
      } catch (error) {
        console.error(`❌ Batch import failed at records ${i}-${i + batch.length - 1}:`, error.message);
        errors += batch.length;
      }
    }
    
    return { imported, errors, total: records.length };
  }

  async importBatch(batch) {
    const columns = Object.keys(batch[0]);
    const placeholders = '(' + columns.map(() => '?').join(', ') + ')';
    
    const sql = `INSERT OR IGNORE INTO ${this.tableName} (${columns.join(', ')}) VALUES ${batch.map(() => placeholders).join(', ')}`;
    
    // Flatten values for batch insert
    const values = batch.flatMap(record => columns.map(col => record[col]));
    
    // Escape SQL for command line
    const escapedSQL = sql.replace(/"/g, '\\"');
    const escapedValues = values.map(val => {
      if (val === null || val === undefined) return 'NULL';
      return `"${val.toString().replace(/"/g, '""')}"`;
    }).join(', ');
    
    const command = `npx wrangler d1 execute ${this.databaseName} --remote --command="${escapedSQL}" --params="${escapedValues}"`;
    
    try {
      execSync(command, { stdio: 'pipe' });
      return { success: batch.length, errors: 0 };
    } catch (error) {
      console.error(`❌ Batch SQL error:`, error.message.slice(0, 200));
      
      // Try individual inserts for this batch
      let individualSuccess = 0;
      for (const record of batch) {
        try {
          await this.importSingleRecord(record);
          individualSuccess++;
        } catch (singleError) {
          console.warn(`⚠️  Failed to import ${record.name}: ${singleError.message.slice(0, 100)}`);
        }
      }
      
      return { success: individualSuccess, errors: batch.length - individualSuccess };
    }
  }

  async importSingleRecord(record) {
    const columns = Object.keys(record);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => record[col]);
    
    const sql = `INSERT OR IGNORE INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const escapedSQL = sql.replace(/"/g, '\\"');
    const escapedValues = values.map(val => {
      if (val === null || val === undefined) return 'NULL';
      return `"${val.toString().replace(/"/g, '""')}"`;
    }).join(', ');
    
    const command = `npx wrangler d1 execute ${this.databaseName} --remote --command="${escapedSQL}" --params="${escapedValues}"`;
    
    execSync(command, { stdio: 'pipe' });
  }

  // Utility method to find latest CSV file
  findLatestCSV() {
    const files = fs.readdirSync('.')
      .filter(file => file.includes('complete_raw_dog_food_suppliers_') && file.endsWith('.csv'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      throw new Error('No complete CSV files found. Run the scraper first.');
    }
    
    return files[0];
  }
}

// CLI usage
async function main() {
  const importer = new CompleteD1Importer();
  
  // Get CSV file from command line or find latest
  let csvFile = process.argv[2];
  if (!csvFile) {
    csvFile = importer.findLatestCSV();
    console.log(`📁 Using latest CSV file: ${csvFile}`);
  }
  
  if (!fs.existsSync(csvFile)) {
    console.error(`❌ CSV file not found: ${csvFile}`);
    process.exit(1);
  }
  
  try {
    const result = await importer.importCompleteCSV(csvFile);
    console.log(`\n🎉 Import Summary:`);
    console.log(`   ✅ Imported: ${result.imported} new suppliers`);
    console.log(`   🚫 Duplicates: ${result.duplicates || 0}`);
    console.log(`   ❌ Errors: ${result.errors || 0}`);
    
    // Show final database stats
    console.log(`\n📊 Database Statistics:`);
    const command = `npx wrangler d1 execute findrawdogfood-db --remote --command="SELECT COUNT(*) as total, COUNT(CASE WHEN photos IS NOT NULL THEN 1 END) as with_photos, COUNT(CASE WHEN reviews IS NOT NULL THEN 1 END) as with_reviews FROM suppliers_complete"`;
    const stats = execSync(command, { encoding: 'utf8' });
    console.log(stats);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CompleteD1Importer;

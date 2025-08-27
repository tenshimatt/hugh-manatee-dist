#!/usr/bin/env node

/**
 * Direct Supplier Import Script
 * Imports suppliers directly from CSV to match existing production schema
 * 
 * Usage: node scripts/import-suppliers-direct.js [options]
 * Options:
 *   --dry-run     Show what would be imported without actually importing
 *   --batch-size=N   Number of records to process at once (default: 100)
 *   --remote      Import to remote database instead of local
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DirectSupplierImporter {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.batchSize = options.batchSize || 100;
    this.useRemote = options.remote || false;
    this.sourceFile = path.join(__dirname, '../../findrawdogfood/suppliers.csv');
    this.importedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
  }

  async importSuppliers() {
    console.log('🚀 Direct Supplier Import to Production Database');
    console.log('================================================');
    console.log(`📊 Configuration:`);
    console.log(`   Dry Run: ${this.dryRun}`);
    console.log(`   Batch Size: ${this.batchSize}`);
    console.log(`   Database: ${this.useRemote ? 'Remote (production)' : 'Local'}`);
    console.log(`   Source: ${path.relative(process.cwd(), this.sourceFile)}`);
    console.log('');

    try {
      await this.validateDatabase();
      
      const suppliers = await this.loadSuppliersFromCSV();
      console.log(`📋 Found ${suppliers.length} suppliers to import`);
      
      if (this.dryRun) {
        await this.performDryRun(suppliers);
        return;
      }

      await this.processBatches(suppliers);
      
      console.log('\n🎉 Import Summary:');
      console.log(`   ✅ Imported: ${this.importedCount} suppliers`);
      console.log(`   ❌ Errors: ${this.errorCount} suppliers`);
      console.log(`   📊 Success Rate: ${((this.importedCount / suppliers.length) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    }
  }

  async validateDatabase() {
    console.log('🔍 Validating database connection and schema...');
    
    try {
      const remoteFlag = this.useRemote ? '--remote' : '--local';
      const command = `cd "${path.dirname(__dirname)}" && wrangler d1 execute rawgle-production-db ${remoteFlag} --command="SELECT COUNT(*) as count FROM suppliers;"`;
      
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      const currentCount = this.parseCountFromResult(result);
      
      console.log(`   ✅ Database connected successfully`);
      console.log(`   📊 Current suppliers in database: ${currentCount}`);
      
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async loadSuppliersFromCSV() {
    if (!fs.existsSync(this.sourceFile)) {
      throw new Error(`Source file not found: ${this.sourceFile}`);
    }

    console.log('📖 Reading CSV data...');
    const csvContent = fs.readFileSync(this.sourceFile, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    console.log(`   📄 Headers: ${headers.join(', ')}`);
    console.log(`   📑 Data rows: ${lines.length - 1} suppliers`);

    const suppliers = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const supplier = this.parseCSVRow(line, headers);
        if (supplier) {
          suppliers.push(supplier);
        }
      } catch (error) {
        console.warn(`   ⚠️  Row ${i + 1}: ${error.message}`);
        this.errorCount++;
      }
    }

    console.log(`   ✅ Successfully parsed ${suppliers.length} suppliers`);
    return suppliers;
  }

  parseCSVRow(line, headers) {
    // Enhanced CSV parsing to handle quoted fields with commas
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',' || inQuotes)) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);

    if (fields.length !== headers.length) {
      throw new Error(`Field count mismatch: expected ${headers.length}, got ${fields.length}`);
    }

    const rowData = {};
    headers.forEach((header, index) => {
      let value = fields[index] || '';
      // Clean up quoted values
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      rowData[header] = value;
    });

    // Validate essential fields
    if (!rowData.name || !rowData.latitude || !rowData.longitude) {
      throw new Error('Missing required fields');
    }

    return rowData;
  }

  async performDryRun(suppliers) {
    console.log('\n🔍 DRY RUN - Data Analysis:');
    console.log('============================');
    
    // Analyze data quality
    let validSuppliers = 0;
    let withRatings = 0;
    let highRating = 0;
    
    const sampleData = suppliers.slice(0, 10);
    
    suppliers.forEach(supplier => {
      if (supplier.name && supplier.latitude && supplier.longitude) {
        validSuppliers++;
        const rating = parseFloat(supplier.rating);
        if (rating > 0) {
          withRatings++;
          if (rating >= 4.0) {
            highRating++;
          }
        }
      }
    });
    
    console.log(`📊 Quality Analysis:`);
    console.log(`   Valid suppliers: ${validSuppliers}/${suppliers.length} (${((validSuppliers/suppliers.length)*100).toFixed(1)}%)`);
    console.log(`   With ratings: ${withRatings} suppliers`);
    console.log(`   High ratings (4.0+): ${highRating} suppliers`);
    
    console.log('\n🔍 Sample records:');
    sampleData.forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.name}`);
      console.log(`   Address: ${supplier.address || 'N/A'}`);
      console.log(`   Rating: ${supplier.rating || 'N/A'}⭐ (${supplier.user_ratings_total || 0} reviews)`);
      console.log(`   Location: ${supplier.latitude}, ${supplier.longitude}`);
      console.log('');
    });
    
    console.log('✅ Dry run completed. Run without --dry-run to perform actual import.');
  }

  async processBatches(suppliers) {
    const batches = this.createBatches(suppliers, this.batchSize);
    
    console.log(`\n📦 Processing ${batches.length} batches...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} suppliers)`);
        await this.processBatch(batch);
        this.importedCount += batch.length;
        console.log(`   ✅ Batch ${i + 1} completed successfully`);
        
        // Progress indicator
        if (i % 10 === 9) {
          const progress = ((i + 1) / batches.length * 100).toFixed(1);
          console.log(`   📈 Overall progress: ${progress}% (${this.importedCount} suppliers imported)`);
        }
        
        // Small delay between batches
        if (i < batches.length - 1) {
          await this.sleep(100);
        }
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
        this.errorCount += batch.length;
      }
    }
  }

  async processBatch(batch) {
    // Generate SQL for batch insert using the exact CSV schema
    const columns = Object.keys(batch[0]).join(', ');
    const values = batch.map(supplier => {
      const vals = Object.values(supplier).map(val => {
        if (val === null || val === undefined || val === '') return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return val;
      });
      return `(${vals.join(', ')})`;
    }).join(', ');

    const sql = `INSERT INTO suppliers (${columns}) VALUES ${values};`;
    
    // Write to temp file and execute
    const sqlFile = path.join(__dirname, `../migration_data/direct_import_${Date.now()}.sql`);
    
    // Ensure directory exists
    const migrationDir = path.dirname(sqlFile);
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }
    
    fs.writeFileSync(sqlFile, sql);
    
    try {
      const remoteFlag = this.useRemote ? '--remote' : '--local';
      const command = `cd "${path.dirname(__dirname)}" && wrangler d1 execute rawgle-production-db ${remoteFlag} --file="${sqlFile}"`;
      
      execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log(`   ⚠️  Some suppliers already exist (skipping duplicates)`);
      } else {
        throw error;
      }
    }
    
    // Clean up temp file
    try {
      fs.unlinkSync(sqlFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  parseCountFromResult(result) {
    const lines = result.split('\n');
    for (const line of lines) {
      const match = line.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return 0;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    remote: args.includes('--remote')
  };

  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  if (batchSizeArg) {
    options.batchSize = parseInt(batchSizeArg.split('=')[1]) || 100;
  }

  console.log('🎯 Rawgle Direct Supplier Import System v3.0');
  console.log('==============================================');
  console.log('🏗️  Importing suppliers directly to production database schema');
  console.log('');
  
  const importer = new DirectSupplierImporter(options);
  await importer.importSuppliers();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = DirectSupplierImporter;
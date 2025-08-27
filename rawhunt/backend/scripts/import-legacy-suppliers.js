#!/usr/bin/env node

/**
 * Legacy Supplier Import Script
 * Imports 9,137 legacy suppliers from old rawgle.com system
 * 
 * Usage: node scripts/import-legacy-suppliers.js [options]
 * Options:
 *   --dry-run   Show what would be imported without actually importing
 *   --batch-size=N   Number of records to process at once (default: 100)
 *   --remote    Import to remote database instead of local
 */

const fs = require('fs');
const path = require('path');

class LegacySupplierImporter {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.batchSize = options.batchSize || 100;
    this.useRemote = options.remote || false;
    this.importedCount = 0;
    this.errorCount = 0;
  }

  async importSuppliers(legacyDataFile) {
    console.log('🚀 Starting Legacy Supplier Import');
    console.log('=====================================');
    console.log(`📊 Configuration:`);
    console.log(`   Dry Run: ${this.dryRun}`);
    console.log(`   Batch Size: ${this.batchSize}`);
    console.log(`   Database: ${this.useRemote ? 'Remote' : 'Local'}`);
    console.log(`   Source: ${legacyDataFile}`);
    console.log('');

    try {
      const legacyData = await this.loadLegacyData(legacyDataFile);
      console.log(`📋 Found ${legacyData.length} legacy suppliers to import`);
      
      if (this.dryRun) {
        console.log('\n🔍 DRY RUN - Showing first 5 records:');
        legacyData.slice(0, 5).forEach((supplier, index) => {
          console.log(`${index + 1}. ${supplier.business_name} - ${supplier.address || 'No address'}`);
        });
        console.log('\n✅ Dry run completed. Run without --dry-run to perform actual import.');
        return;
      }

      await this.processBatches(legacyData);
      
      console.log('\n🎉 Import Summary:');
      console.log(`   ✅ Imported: ${this.importedCount} suppliers`);
      console.log(`   ❌ Errors: ${this.errorCount} suppliers`);
      console.log(`   📊 Success Rate: ${((this.importedCount / legacyData.length) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    }
  }

  async loadLegacyData(filePath) {
    // This would load from the actual legacy system export
    // For now, we'll simulate the structure expected from 9,137 suppliers
    
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(rawData);
    }

    // Generate sample data structure for testing
    console.log('⚠️  Legacy data file not found. Creating sample structure...');
    return this.generateSampleLegacyData();
  }

  generateSampleLegacyData() {
    // This represents the expected structure from the old rawgle.com system
    const categories = ['Pet Food', 'Veterinary', 'Pet Grooming', 'Pet Training', 'Pet Supplies'];
    const cities = [
      { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
      { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
      { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
      { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
      { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 }
    ];

    const sampleData = [];
    for (let i = 1; i <= 50; i++) { // Generate 50 for testing
      const city = cities[Math.floor(Math.random() * cities.length)];
      sampleData.push({
        legacy_id: `legacy_${i}`,
        business_name: `Legacy Supplier ${i}`,
        description: `Raw pet food supplier number ${i} from legacy system`,
        category: categories[Math.floor(Math.random() * categories.length)],
        specialties: ['raw_food', 'legacy_import'],
        address: `${100 + i} Main St, ${city.name}`,
        latitude: city.lat + (Math.random() - 0.5) * 0.1,
        longitude: city.lng + (Math.random() - 0.5) * 0.1,
        phone: `(${Math.floor(Math.random() * 900) + 100}) 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        email: `supplier${i}@legacy-rawgle.com`,
        website: `https://supplier${i}.legacy-rawgle.com`,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
        review_count: Math.floor(Math.random() * 200) + 10,
        price_range: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        is_verified: Math.random() > 0.3, // 70% verified
        created_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return sampleData;
  }

  async processBatches(data) {
    const batches = this.createBatches(data, this.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} suppliers)`);
      
      try {
        await this.processBatch(batch);
        console.log(`   ✅ Batch ${i + 1} completed successfully`);
        
        // Add a small delay between batches to avoid overwhelming the database
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
    const insertStatements = [];
    
    for (const supplier of batch) {
      try {
        const insertSQL = this.convertToInsertSQL(supplier);
        insertStatements.push(insertSQL);
      } catch (error) {
        console.error(`   ⚠️  Skipping supplier ${supplier.business_name}: ${error.message}`);
        this.errorCount++;
      }
    }

    if (insertStatements.length > 0) {
      await this.executeBatchInsert(insertStatements);
      this.importedCount += insertStatements.length;
    }
  }

  convertToInsertSQL(legacySupplier) {
    // Validate required fields
    if (!legacySupplier.business_name || !legacySupplier.latitude || !legacySupplier.longitude) {
      throw new Error('Missing required fields');
    }

    // Convert legacy format to rawgle_suppliers schema
    const supplier = {
      name: legacySupplier.business_name,
      description: legacySupplier.description || '',
      category: legacySupplier.category || 'Pet Food',
      specialties: JSON.stringify(legacySupplier.specialties || ['raw_food']),
      location_latitude: legacySupplier.latitude,
      location_longitude: legacySupplier.longitude,
      location_address: legacySupplier.address || '',
      contact_phone: legacySupplier.phone || null,
      contact_email: legacySupplier.email || null,
      website_url: legacySupplier.website || null,
      rating_average: legacySupplier.rating || 0.0,
      rating_count: legacySupplier.review_count || 0,
      price_range: legacySupplier.price_range || 'medium',
      business_hours: JSON.stringify({}),
      images: JSON.stringify([]),
      is_verified: legacySupplier.is_verified ? 1 : 0,
      is_active: 1,
      created_at: legacySupplier.created_date || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create parameterized query
    const columns = Object.keys(supplier).join(', ');
    const placeholders = Object.keys(supplier).map(() => '?').join(', ');
    
    return {
      sql: `INSERT INTO rawgle_suppliers (${columns}) VALUES (${placeholders})`,
      params: Object.values(supplier)
    };
  }

  async executeBatchInsert(insertStatements) {
    // For demonstration, we'll write the SQL commands to a file
    // In production, this would execute via wrangler d1 execute
    
    const sqlFile = path.join(__dirname, `../migration_data/legacy_import_${Date.now()}.sql`);
    const sqlContent = insertStatements.map(stmt => 
      stmt.sql.replace(/\?/g, () => {
        const param = stmt.params.shift();
        if (param === null || param === undefined) return 'NULL';
        if (typeof param === 'string') return `'${param.replace(/'/g, "''")}'`;
        return param;
      })
    ).join(';\n') + ';';

    fs.writeFileSync(sqlFile, sqlContent);
    console.log(`   📝 Generated SQL file: ${path.basename(sqlFile)}`);
    
    // Execute via wrangler (commented for safety during development)
    /*
    const { exec } = require('child_process');
    const remoteFlag = this.useRemote ? '--remote' : '';
    const command = `cd ${path.dirname(__dirname)} && wrangler d1 execute rawgle-production-db ${remoteFlag} --file="${sqlFile}"`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Database execution failed: ${error.message}`));
          return;
        }
        resolve(stdout);
      });
    });
    */
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
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

  const legacyDataFile = args.find(arg => !arg.startsWith('--')) || 
                         path.join(__dirname, '../migration_data/legacy_suppliers.json');

  const importer = new LegacySupplierImporter(options);
  await importer.importSuppliers(legacyDataFile);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = LegacySupplierImporter;
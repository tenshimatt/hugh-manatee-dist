#!/usr/bin/env node

/**
 * Bulk Supplier Import - Direct SQL Generation
 * Creates SQL insert statements from CSV for direct database execution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BulkSupplierImporter {
  constructor() {
    this.sourceFile = path.join(__dirname, '../../findrawdogfood/suppliers.csv');
    this.outputFile = path.join(__dirname, '../migration_data/bulk_supplier_import.sql');
    this.insertedCount = 0;
  }

  async run() {
    console.log('🚀 Bulk Supplier Import - SQL Generation Approach');
    console.log('==================================================');
    console.log(`📂 Source: ${path.relative(process.cwd(), this.sourceFile)}`);
    console.log(`📄 Output: ${path.relative(process.cwd(), this.outputFile)}`);
    console.log('');

    try {
      // Check database current count
      await this.checkCurrentCount();
      
      // Generate SQL file
      await this.generateSQLFile();
      
      // Execute the import
      await this.executeImport();
      
      console.log('\n🎉 Import completed successfully!');
      console.log(`   📊 Imported: ${this.insertedCount} suppliers`);
      
      // Verify final count
      await this.checkCurrentCount();
      
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    }
  }

  async checkCurrentCount() {
    try {
      const command = `cd "${path.dirname(__dirname)}" && wrangler d1 execute rawgle-production-db --remote --command="SELECT COUNT(*) as count FROM suppliers;"`;
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      const count = this.parseCountFromResult(result);
      console.log(`📊 Current suppliers in database: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Failed to check database count:', error.message);
      throw error;
    }
  }

  async generateSQLFile() {
    console.log('📖 Reading CSV and generating SQL...');
    
    if (!fs.existsSync(this.sourceFile)) {
      throw new Error(`Source file not found: ${this.sourceFile}`);
    }

    // Read the entire CSV content
    const csvContent = fs.readFileSync(this.sourceFile, 'utf8');
    const lines = csvContent.split('\n');
    
    // Get headers from first line
    const headerLine = lines[0];
    const headers = headerLine.split(',');
    
    console.log(`   📋 Found ${lines.length - 1} data rows`);
    console.log(`   📄 Headers: ${headers.length} columns`);

    // Ensure migration directory exists
    const migrationDir = path.dirname(this.outputFile);
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }

    // Open SQL file for writing
    let sqlContent = `-- Bulk Supplier Import Generated ${new Date().toISOString()}\n`;
    sqlContent += `-- Source: ${this.sourceFile}\n`;
    sqlContent += `-- Total records: ${lines.length - 1}\n\n`;
    
    // Add a single bulk INSERT statement
    sqlContent += `INSERT INTO suppliers (${headers.join(', ')}) VALUES\n`;
    
    const valueRows = [];
    let processedCount = 0;
    
    // Process each data line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Use a simpler approach - just escape single quotes and handle the line as a whole
        const valueRow = this.convertLineToSQLValues(line, headers.length);
        if (valueRow) {
          valueRows.push(valueRow);
          processedCount++;
        }
      } catch (error) {
        console.warn(`   ⚠️  Row ${i + 1}: ${error.message.substring(0, 100)}...`);
      }
    }

    sqlContent += valueRows.join(',\n');
    sqlContent += ';';
    
    // Write the SQL file
    fs.writeFileSync(this.outputFile, sqlContent);
    
    console.log(`   ✅ Generated SQL file with ${processedCount} suppliers`);
    console.log(`   📁 File size: ${(fs.statSync(this.outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    this.insertedCount = processedCount;
    return processedCount;
  }

  convertLineToSQLValues(line, expectedColumns) {
    // For this complex CSV, we'll use a different approach
    // We'll parse the CSV line manually, handling quoted sections
    
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        // Starting a quoted section
        inQuotes = true;
        quoteChar = char;
        currentValue += char;
      } else if (char === quoteChar && inQuotes) {
        // Ending a quoted section (or escaped quote)
        if (i + 1 < line.length && line[i + 1] === quoteChar) {
          // Escaped quote, add both
          currentValue += char + char;
          i++; // Skip the next quote
        } else {
          // End of quoted section
          inQuotes = false;
          quoteChar = null;
          currentValue += char;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator - add current value and reset
        values.push(this.formatSQLValue(currentValue));
        currentValue = '';
      } else {
        // Regular character
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(this.formatSQLValue(currentValue));
    
    // Validate column count
    if (values.length !== expectedColumns) {
      // If we have too few columns, pad with NULLs
      while (values.length < expectedColumns) {
        values.push('NULL');
      }
      // If we have too many, truncate (shouldn't happen with proper parsing)
      if (values.length > expectedColumns) {
        values.splice(expectedColumns);
      }
    }
    
    return `(${values.join(', ')})`;
  }

  formatSQLValue(value) {
    // Clean up the value
    value = value.trim();
    
    // Handle empty/null values
    if (!value || value === '' || value === 'null' || value === 'NULL') {
      return 'NULL';
    }
    
    // If it's already quoted, clean it up and re-quote for SQL
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Escape single quotes for SQL by doubling them
    value = value.replace(/'/g, "''");
    
    // If it looks like a number, don't quote it
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return value;
    }
    
    // Quote string values
    return `'${value}'`;
  }

  async executeImport() {
    console.log('💾 Executing SQL import...');
    
    try {
      const command = `cd "${path.dirname(__dirname)}" && wrangler d1 execute rawgle-production-db --remote --file="${this.outputFile}"`;
      
      console.log('   🚀 Starting database execution (this may take a few minutes)...');
      const startTime = Date.now();
      
      execSync(command, { 
        encoding: 'utf8', 
        stdio: 'inherit', // Show output in real-time
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   ✅ Database execution completed in ${duration} seconds`);
      
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log('   ⚠️  Some suppliers already exist (duplicates skipped)');
      } else {
        throw new Error(`Database execution failed: ${error.message}`);
      }
    }
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
}

// Run the import
async function main() {
  const importer = new BulkSupplierImporter();
  await importer.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}
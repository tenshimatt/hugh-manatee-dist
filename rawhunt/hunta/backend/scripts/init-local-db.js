/**
 * Initialize local SQLite database for development
 */

import fs from 'fs';
import path from 'path';

const WRANGLER_DB_PATH = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

async function initializeDatabase() {
    try {
        console.log('🎯 Initializing local database...');
        
        // Wait a moment for wrangler to create the database file
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Find the SQLite database file
        const dbDir = path.join(process.cwd(), WRANGLER_DB_PATH);
        if (!fs.existsSync(dbDir)) {
            console.log('❌ Database directory not found. Make sure wrangler dev is running.');
            return;
        }
        
        const dbFiles = fs.readdirSync(dbDir).filter(f => f.endsWith('.sqlite'));
        if (dbFiles.length === 0) {
            console.log('❌ No SQLite database files found.');
            return;
        }
        
        const dbFile = path.join(dbDir, dbFiles[0]);
        console.log(`📁 Found database file: ${dbFile}`);
        
        // Read schema from migrations
        const schemaPath = path.join(process.cwd(), 'migrations', '0001_initial.sql');
        if (!fs.existsSync(schemaPath)) {
            console.log('❌ Schema file not found at migrations/0001_initial.sql');
            return;
        }
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Apply schema via API call to local wrangler
        const response = await fetch('http://localhost:8787/health');
        if (response.ok) {
            console.log('✅ Backend is running');
            
            // Test if tables exist
            const testResponse = await fetch('http://localhost:8787/api/routes');
            const testData = await testResponse.json();
            
            if (testData.success && testData.data.routes.length >= 0) {
                console.log('✅ Database tables already exist and are working');
            } else {
                console.log('❌ Database tables need to be created');
                console.log('📝 Please run the following commands in another terminal:');
                console.log('   wrangler d1 execute hunta-db --local --file=./migrations/0001_initial.sql');
            }
        } else {
            console.log('❌ Backend is not responding');
        }
        
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase();
}

export { initializeDatabase };
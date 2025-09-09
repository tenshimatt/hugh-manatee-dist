#!/usr/bin/env ts-node
import { db } from '../config/database';

async function main() {
  try {
    const tables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Current Tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check if pets table exists and what columns it has
    const petsColumns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pets' 
      ORDER BY ordinal_position
    `);
    
    if (petsColumns.length > 0) {
      console.log('\nPets table columns:');
      petsColumns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    } else {
      console.log('\nPets table does not exist');
    }
    
    await db.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
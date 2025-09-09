#!/usr/bin/env ts-node
/**
 * Check Current Schema Script
 */

import { db } from '../config/database';
import { logger } from '../config/logger';

async function checkSchema(): Promise<void> {
  try {
    logger.info('📊 Checking current user table schema...');
    
    const schemaCheck = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    logger.info('Current user table schema:');
    if (schemaCheck.rows && schemaCheck.rows.length > 0) {
      schemaCheck.rows.forEach(row => {
        logger.info(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) default: ${row.column_default}`);
      });
    } else {
      logger.info('No schema found or no rows returned');
      logger.info('Full result:', schemaCheck);
    }
    
    // Check if there are any users
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    logger.info(`Total users: ${userCount.rows[0].count}`);
    
    if (userCount.rows[0].count > 0) {
      const users = await db.query('SELECT * FROM users LIMIT 3');
      logger.info('Sample users:');
      users.rows.forEach(user => {
        logger.info(`  - ID: ${user.id}, Email: ${user.email}, Type: ${user.account_type}`);
      });
    }
    
  } catch (error) {
    logger.error('Schema check failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  checkSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Schema check failed:', error);
      process.exit(1);
    });
}
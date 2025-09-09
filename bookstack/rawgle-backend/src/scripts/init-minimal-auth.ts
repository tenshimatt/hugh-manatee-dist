#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { db } from '../config/database';
import { logger } from '../config/logger';

/**
 * Initialize minimal authentication schema for RAWGLE platform
 */
async function initMinimalAuth() {
  try {
    logger.info('🚀 Initializing minimal authentication schema...');

    // Read the minimal schema SQL file
    const schemaPath = path.join(__dirname, 'minimal-auth-setup.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');

    // Execute the schema
    await db.query(schemaSQL);

    logger.info('✅ Minimal authentication schema initialized successfully');

    // Verify the setup by checking if users exist
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = usersResult[0]?.count || 0;

    logger.info(`📊 Database ready with ${userCount} users`);

    // Test admin user exists
    const adminResult = await db.query('SELECT id, email, account_type FROM users WHERE email = $1', ['admin@rawgle.com']);
    if (adminResult.length > 0) {
      logger.info('✅ Admin user ready for testing');
      logger.info('   Email: admin@rawgle.com');
      logger.info('   Password: admin123');
    }

    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize minimal authentication schema:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initMinimalAuth()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Initialization failed:', error);
      process.exit(1);
    });
}

export { initMinimalAuth };
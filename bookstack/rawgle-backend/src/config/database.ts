import { Pool, PoolClient } from 'pg';
import { dbConfig, config } from './env';
import { logger } from './logger';

class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor() {
    this.pool = new Pool({
      ...dbConfig,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected database pool error:', err);
    });

    // Handle client connection
    this.pool.on('connect', (client) => {
      logger.debug('New database client connected');
    });

    // Handle client removal
    this.pool.on('remove', (client) => {
      logger.debug('Database client removed');
    });

    logger.info('Database connection pool initialized');
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error('Error getting database client:', error);
      throw error;
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.getClient();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        query: text,
        duration: `${duration}ms`,
        rowCount: result.rowCount,
      });

      return result.rows;
    } catch (error) {
      logger.error('Database query error:', {
        query: text,
        params,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      logger.debug('Transaction completed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back due to error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.query('SELECT 1 as health_check');
      const latency = Date.now() - start;
      return { status: 'connected', latency };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { status: 'disconnected', latency: Date.now() - start };
    }
  }

  async getStats(): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingConnections: number;
  }> {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingConnections: this.pool.waitingCount,
    };
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database pool:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = Database.getInstance();

// Helper function for migrations
export async function runMigration(sql: string, description?: string): Promise<void> {
  try {
    logger.info(`Running migration: ${description || 'Unknown'}`);
    await db.query(sql);
    logger.info(`Migration completed: ${description || 'Unknown'}`);
  } catch (error) {
    logger.error(`Migration failed: ${description || 'Unknown'}`, error);
    throw error;
  }
}

// Initialize minimal authentication schema for basic JWT functionality
export async function initDatabase(): Promise<void> {
  try {
    logger.info('Initializing minimal authentication database schema...');
    
    // Use minimal schema for authentication-only setup
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      // Use minimal authentication schema
      const minimalSchemaPath = path.join(__dirname, '..', 'scripts', 'minimal-auth-setup.sql');
      const minimalSchemaSQL = await fs.readFile(minimalSchemaPath, 'utf8');
      logger.info('Executing minimal authentication schema...');
      await db.query(minimalSchemaSQL);
      logger.info('✅ Minimal authentication database schema created successfully');
    } catch (minimalError) {
      logger.warn('Minimal schema failed, falling back to basic tables...', minimalError);
      // Fallback to basic schema if SQL file is not found
      await createBasicTables();
    }

  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Fallback basic table creation
async function createBasicTables(): Promise<void> {
  // Create users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      password_hash VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      account_type VARCHAR(20) DEFAULT 'user' CHECK (account_type IN ('user', 'business', 'admin')),
      paws_tokens INTEGER DEFAULT 100 CHECK (paws_tokens >= 0),
      level VARCHAR(20) DEFAULT 'Bronze',
      phone VARCHAR(20),
      date_of_birth DATE,
      location_address TEXT,
      location_lat DECIMAL(10, 8),
      location_lng DECIMAL(11, 8),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Create indexes for users table
  await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)');

  // Create email verification tokens table
  await db.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Create password reset tokens table
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  logger.info('✅ Basic database tables initialized successfully');
}
/**
 * Database Connection and Query Utilities for RAWGLE Blog Platform
 * PostgreSQL connection management with connection pooling
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// Database configuration
const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'rawgle_blog',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
};

// Create connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(config);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  
  return pool;
}

/**
 * Execute a SQL query with parameters
 */
export async function query<T = any>(
  text: string, 
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const pool = getPool();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log('Slow query executed:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', {
      text: text.substring(0, 100),
      params,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

/**
 * Execute a query and return only the first row
 */
export async function queryOne<T = any>(
  text: string, 
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if database connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close all database connections (useful for testing)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Database helper functions for common operations
 */

/**
 * Build pagination query with offset and limit
 */
export function buildPaginationQuery(
  baseQuery: string,
  page: number = 1,
  limit: number = 10
): { query: string; offset: number; limit: number } {
  const offset = (page - 1) * limit;
  return {
    query: `${baseQuery} LIMIT $${baseQuery.split('$').length} OFFSET $${baseQuery.split('$').length + 1}`,
    offset,
    limit
  };
}

/**
 * Build search query with full-text search
 */
export function buildSearchQuery(
  searchTerm: string,
  baseQuery: string = 'SELECT * FROM blog_posts_published'
): { query: string; searchVector: string } {
  const searchVector = searchTerm
    .split(' ')
    .filter(term => term.length > 0)
    .map(term => `${term}:*`)
    .join(' & ');
    
  const query = `${baseQuery} WHERE search_vector @@ plainto_tsquery('english', $1)`;
  
  return { query, searchVector: searchTerm };
}

/**
 * Execute a query with automatic retry on connection failure
 */
export async function queryWithRetry<T = any>(
  text: string,
  params?: any[],
  maxRetries: number = 3
): Promise<QueryResult<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await query<T>(text, params);
    } catch (error) {
      lastError = error as Error;
      
      // Only retry on connection errors
      if (error && typeof error === 'object' && 'code' in error) {
        const pgError = error as any;
        if (pgError.code === 'ECONNREFUSED' || pgError.code === 'ENOTFOUND') {
          console.warn(`Database connection failed, attempt ${attempt}/${maxRetries}`);
          
          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
        }
      }
      
      // Non-connection error or max retries reached
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Type definitions for better TypeScript support
 */
export interface DatabaseRow {
  [key: string]: any;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Helper to create paginated results
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    }
  };
}

// Export the pool getter for advanced usage
export { getPool };
import { PrismaClient } from '@prisma/client';
import { createLogger } from 'winston';

const logger = createLogger({
  level: 'info',
  format: require('winston').format.combine(
    require('winston').format.timestamp(),
    require('winston').format.errors({ stack: true }),
    require('winston').format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new (require('winston').transports.Console)({
      format: require('winston').format.simple()
    })
  ]
});

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Log slow queries
    this.prisma.$on('query', (e) => {
      if (e.duration > 1000) {
        logger.warn('Slow query detected', {
          query: e.query,
          duration: e.duration,
          params: e.params
        });
      }
    });

    logger.info('Database connection initialized');
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Connected to PostgreSQL database');
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Disconnected from PostgreSQL database');
    } catch (error) {
      logger.error('Failed to disconnect from database', { error });
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error });
      return false;
    }
  }
}

export const database = DatabaseConnection.getInstance();
export const prisma = database.getClient();
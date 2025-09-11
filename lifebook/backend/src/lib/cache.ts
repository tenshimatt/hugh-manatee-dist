import Redis from 'ioredis';
import { createLogger } from 'winston';

const logger = createLogger({
  level: 'info',
  format: require('winston').format.combine(
    require('winston').format.timestamp(),
    require('winston').format.errors({ stack: true }),
    require('winston').format.json()
  ),
  defaultMeta: { service: 'cache' },
  transports: [
    new (require('winston').transports.Console)({
      format: require('winston').format.simple()
    })
  ]
});

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
}

class CacheConnection {
  private static instance: CacheConnection;
  private redis: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  private constructor() {
    const config: CacheConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'spec-system:',
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    };

    // Main Redis connection
    this.redis = new Redis(config);

    // Separate connections for pub/sub (recommended by ioredis)
    this.subscriber = new Redis(config);
    this.publisher = new Redis(config);

    this.setupEventListeners();
    logger.info('Redis connections initialized');
  }

  private setupEventListeners(): void {
    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', { error });
    });

    this.redis.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });
  }

  public static getInstance(): CacheConnection {
    if (!CacheConnection.instance) {
      CacheConnection.instance = new CacheConnection();
    }
    return CacheConnection.instance;
  }

  public getClient(): Redis {
    return this.redis;
  }

  public getSubscriber(): Redis {
    return this.subscriber;
  }

  public getPublisher(): Redis {
    return this.publisher;
  }

  // Document caching methods
  public async cacheDocument(documentId: string, document: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(`document:${documentId}`, ttl, JSON.stringify(document));
      logger.debug('Document cached', { documentId, ttl });
    } catch (error) {
      logger.error('Failed to cache document', { documentId, error });
      throw error;
    }
  }

  public async getCachedDocument(documentId: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(`document:${documentId}`);
      if (cached) {
        logger.debug('Document cache hit', { documentId });
        return JSON.parse(cached);
      }
      logger.debug('Document cache miss', { documentId });
      return null;
    } catch (error) {
      logger.error('Failed to retrieve cached document', { documentId, error });
      return null;
    }
  }

  public async invalidateDocument(documentId: string): Promise<void> {
    try {
      await this.redis.del(`document:${documentId}`);
      logger.debug('Document cache invalidated', { documentId });
    } catch (error) {
      logger.error('Failed to invalidate document cache', { documentId, error });
    }
  }

  // Session management for collaboration
  public async setCollaborationSession(documentId: string, userId: string, sessionData: any, ttl: number = 7200): Promise<void> {
    try {
      await this.redis.setex(`collab:${documentId}:${userId}`, ttl, JSON.stringify(sessionData));
      await this.redis.sadd(`collab:active:${documentId}`, userId);
      logger.debug('Collaboration session cached', { documentId, userId });
    } catch (error) {
      logger.error('Failed to cache collaboration session', { documentId, userId, error });
      throw error;
    }
  }

  public async getActiveCollaborators(documentId: string): Promise<string[]> {
    try {
      const collaborators = await this.redis.smembers(`collab:active:${documentId}`);
      return collaborators;
    } catch (error) {
      logger.error('Failed to get active collaborators', { documentId, error });
      return [];
    }
  }

  public async removeCollaborationSession(documentId: string, userId: string): Promise<void> {
    try {
      await this.redis.del(`collab:${documentId}:${userId}`);
      await this.redis.srem(`collab:active:${documentId}`, userId);
      logger.debug('Collaboration session removed', { documentId, userId });
    } catch (error) {
      logger.error('Failed to remove collaboration session', { documentId, userId, error });
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', { error });
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.redis.quit(),
        this.subscriber.quit(),
        this.publisher.quit()
      ]);
      logger.info('Disconnected from Redis');
    } catch (error) {
      logger.error('Failed to disconnect from Redis', { error });
      throw error;
    }
  }
}

export const cache = CacheConnection.getInstance();
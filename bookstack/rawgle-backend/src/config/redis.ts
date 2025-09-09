import { createClient } from 'redis';
import { redisConfig, config } from './env';
import { logger } from './logger';

class RedisClient {
  private client: ReturnType<typeof createClient>;
  private static instance: RedisClient;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries, giving up');
            return false;
          }
          const delay = Math.min(retries * 50, 1000);
          logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
      ...(redisConfig.password && { password: redisConfig.password }),
      database: redisConfig.db,
    });

    this.setupEventHandlers();
  }

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
        logger.info('✅ Redis connection established');
      }
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }

  async set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<void> {
    try {
      if (options?.EX) {
        await this.client.setEx(key, options.EX, value);
      } else if (options?.PX) {
        await this.client.pSetEx(key, options.PX, value);
      } else {
        await this.client.set(key, value);
      }
      logger.debug(`Redis SET: ${key}`);
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      logger.debug(`Redis GET: ${key} ${value ? 'found' : 'not found'}`);
      return value;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      const result = await this.client.del(key);
      logger.debug(`Redis DEL: ${key} (deleted: ${result})`);
      return result;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  async setJson(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const jsonValue = JSON.stringify(value);
    const options = ttlSeconds ? { EX: ttlSeconds } : undefined;
    await this.set(key, jsonValue, options);
  }

  async getJson<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Redis JSON parse error for key ${key}:`, error);
      return null;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const result = await this.client.incr(key);
      logger.debug(`Redis INCR: ${key} -> ${result}`);
      return result;
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      logger.debug(`Redis EXPIRE: ${key} -> ${seconds}s`);
      return result;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.client.ping();
      const latency = Date.now() - start;
      return { status: 'connected', latency };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return { status: 'disconnected', latency: Date.now() - start };
    }
  }

  getClient(): ReturnType<typeof createClient> {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  // Session management helpers
  async setSession(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
    await this.setJson(`session:${sessionId}`, data, ttlSeconds);
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    return await this.getJson<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<number> {
    return await this.del(`session:${sessionId}`);
  }

  // Rate limiting helpers
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const currentCount = await this.incr(key);
    if (currentCount === 1) {
      await this.expire(key, windowSeconds);
    }
    return currentCount;
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance();

// Session management utilities
export const sessionManager = {
  async create(userId: string, sessionData: any): Promise<string> {
    const sessionId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await redis.setSession(sessionId, { userId, ...sessionData }, 86400); // 24 hours
    return sessionId;
  },

  async get(sessionId: string): Promise<any> {
    return await redis.getSession(sessionId);
  },

  async destroy(sessionId: string): Promise<boolean> {
    const result = await redis.deleteSession(sessionId);
    return result > 0;
  },

  async refresh(sessionId: string, ttlSeconds: number = 86400): Promise<boolean> {
    return await redis.expire(`session:${sessionId}`, ttlSeconds);
  },
};

// Rate limiting utilities
export const rateLimiter = {
  async checkLimit(identifier: string, maxRequests: number, windowSeconds: number): Promise<{
    allowed: boolean;
    count: number;
    resetTime: number;
  }> {
    const key = `rate_limit:${identifier}`;
    const count = await redis.incrementRateLimit(key, windowSeconds);
    const allowed = count <= maxRequests;
    const resetTime = Date.now() + (windowSeconds * 1000);

    return { allowed, count, resetTime };
  },
};

logger.info('✅ Redis configuration loaded successfully');
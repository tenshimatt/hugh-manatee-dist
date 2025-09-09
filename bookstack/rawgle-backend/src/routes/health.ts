import express from 'express';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { config } from '../config/env';
import { logger } from '../config/logger';

const router = express.Router();

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: string;
      latency: number;
      connections?: {
        total: number;
        idle: number;
        waiting: number;
      };
    };
    redis: {
      status: string;
      latency: number;
    };
  };
  system: {
    memory: {
      used: string;
      total: string;
      percentage: string;
    };
    cpu: {
      usage: string;
    };
    disk?: {
      available: string;
      usage: string;
    };
  };
}

// Basic health check
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database health
    const dbHealth = await db.healthCheck();
    const dbStats = await db.getStats();
    
    // Check Redis health
    const redisHealth = await redis.healthCheck();
    
    // Get system information
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.rss / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    
    // Determine overall health status
    const services = [dbHealth.status, redisHealth.status];
    const overallStatus = services.every(s => s === 'connected') 
      ? 'healthy' 
      : services.some(s => s === 'connected') 
        ? 'degraded' 
        : 'unhealthy';
    
    const healthCheck: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: config.NODE_ENV,
      version: config.API_VERSION,
      services: {
        database: {
          status: dbHealth.status,
          latency: dbHealth.latency,
          connections: {
            total: dbStats.totalConnections,
            idle: dbStats.idleConnections,
            waiting: dbStats.waitingConnections,
          },
        },
        redis: {
          status: redisHealth.status,
          latency: redisHealth.latency,
        },
      },
      system: {
        memory: {
          used: `${memUsedMB}MB`,
          total: `${memTotalMB}MB`,
          percentage: `${memPercentage}%`,
        },
        cpu: {
          usage: `${Math.round(process.cpuUsage().user / 1000000)}ms`,
        },
      },
    };
    
    const totalLatency = Date.now() - startTime;
    
    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 
      : overallStatus === 'degraded' ? 207 
      : 503;
    
    // Log health check result
    logger.debug('Health check completed', {
      status: overallStatus,
      totalLatency: `${totalLatency}ms`,
      dbLatency: `${dbHealth.latency}ms`,
      redisLatency: `${redisHealth.latency}ms`,
    });
    
    res.status(statusCode).json(healthCheck);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    const errorResponse: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: config.NODE_ENV,
      version: config.API_VERSION,
      services: {
        database: {
          status: 'disconnected',
          latency: 0,
        },
        redis: {
          status: 'disconnected',
          latency: 0,
        },
      },
      system: {
        memory: {
          used: 'N/A',
          total: 'N/A',
          percentage: 'N/A',
        },
        cpu: {
          usage: 'N/A',
        },
      },
    };
    
    res.status(503).json(errorResponse);
  }
});

// Deep health check with additional diagnostics
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Perform detailed database checks
    const dbHealth = await db.healthCheck();
    const dbStats = await db.getStats();
    
    // Test database write capability
    const testWrite = await db.query('SELECT NOW() as test_timestamp');
    
    // Perform detailed Redis checks
    const redisHealth = await redis.healthCheck();
    const redisInfo = redis.isReady();
    
    // Test Redis write capability
    const testKey = `health_check_${Date.now()}`;
    await redis.set(testKey, 'test_value', { EX: 10 });
    const testValue = await redis.get(testKey);
    await redis.del(testKey);
    
    // Get detailed system information
    const memUsage = process.memoryUsage();
    
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: config.NODE_ENV,
      version: config.API_VERSION,
      services: {
        database: {
          status: dbHealth.status,
          latency: dbHealth.latency,
          connections: dbStats,
          writeTest: testWrite.length > 0 ? 'passed' : 'failed',
        },
        redis: {
          status: redisHealth.status,
          latency: redisHealth.latency,
          ready: redisInfo,
          writeTest: testValue === 'test_value' ? 'passed' : 'failed',
        },
      },
      system: {
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        },
        process: {
          pid: process.pid,
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
      performance: {
        totalLatency: `${Date.now() - startTime}ms`,
        dbLatency: `${dbHealth.latency}ms`,
        redisLatency: `${redisHealth.latency}ms`,
      },
    };
    
    logger.info('Detailed health check completed', detailedHealth.performance);
    
    res.json(detailedHealth);
    
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Readiness check (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    const dbHealth = await db.healthCheck();
    const redisHealth = await redis.healthCheck();
    
    const ready = dbHealth.status === 'connected' && redisHealth.status === 'connected';
    
    if (ready) {
      res.json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth.status,
          redis: redisHealth.status,
        },
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

export { router as healthRouter };
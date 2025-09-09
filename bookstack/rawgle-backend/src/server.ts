import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config, corsConfig, rateLimitConfig } from './config/env';
import { logger, requestLogger, auditLogger } from './config/logger';
import { db, initDatabase } from './config/database';
import { redis } from './config/redis';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { tddPortalRouter } from './routes/tdd-portal';
import { blogRouter } from './routes/blog';
import { storesRouter } from './routes/stores';
import { petsRouter } from './routes/pets';
import { feedingRouter } from './routes/feeding';
import { knowledgeBaseRouter } from './routes/knowledge-base';
import { chatRouter } from './routes/chat';
import { healthDataRouter } from './routes/health-data';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { validateRequest } from './middleware/validation';

class Server {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net"],
          scriptSrcAttr: ["'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors(corsConfig));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    this.app.use(rateLimit({
      ...rateLimitConfig,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true,
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb',
    }));

    // Cookie parsing middleware (required for HTTP-only cookies)
    this.app.use(cookieParser());

    // Request logging
    this.app.use(requestLogger);

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // API versioning middleware
    this.app.use(`/api/${config.API_VERSION}`, (req, res, next) => {
      res.setHeader('API-Version', config.API_VERSION);
      next();
    });

    logger.info('✅ Express middleware configured');
  }

  private setupRoutes(): void {
    // Health check routes (no version prefix for monitoring)
    this.app.use('/health', healthRouter);
    this.app.use(`/api/${config.API_VERSION}/health`, healthRouter);

    // API routes
    this.app.use(`/api/${config.API_VERSION}/auth`, authRouter);
    this.app.use(`/api/${config.API_VERSION}/tdd`, tddPortalRouter);
    this.app.use(`/api/${config.API_VERSION}/blog`, blogRouter);
    this.app.use(`/api/${config.API_VERSION}/knowledge-base`, knowledgeBaseRouter);
    this.app.use(`/api/${config.API_VERSION}/stores`, storesRouter);
    this.app.use(`/api/${config.API_VERSION}/pets`, petsRouter);
    this.app.use(`/api/${config.API_VERSION}/feeding`, feedingRouter);
    this.app.use(`/api/${config.API_VERSION}/chat`, chatRouter);
    this.app.use(`/api/${config.API_VERSION}/health-data`, healthDataRouter);
    // TODO: Add users routes here
    
    // Direct portal access (no API prefix for HTML interfaces)
    this.app.use('/tdd-portal', tddPortalRouter);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'RAWGLE Backend API',
        version: config.API_VERSION,
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    });

    // API root endpoint
    this.app.get(`/api/${config.API_VERSION}`, (req, res) => {
      res.json({
        success: true,
        message: 'RAWGLE Backend API',
        version: config.API_VERSION,
        endpoints: [
          '/health - Health check endpoint',
          '/api/v1/auth - Authentication endpoints',
          '/api/v1/tdd - TDD Portal and test management',
          '/api/v1/blog - Blog and knowledge base endpoints',
          '/api/v1/knowledge-base - Knowledge base articles management',
          '/api/v1/stores - Store locator and supplier endpoints',
          '/api/v1/pets - Pet management endpoints',
          '/api/v1/feeding - Feeding schedule endpoints',
        ],
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('✅ Express routes configured');
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    logger.info('✅ Error handling configured');
  }

  private async initializeServices(): Promise<void> {
    try {
      logger.info('Initializing services...');

      // Initialize database (optional in development mode)
      let dbConnected = false;
      try {
        await initDatabase();
        const dbHealth = await db.healthCheck();
        if (dbHealth.status === 'connected') {
          dbConnected = true;
          logger.info('✅ Database connection established');
        }
      } catch (error) {
        logger.warn('⚠️  Database connection failed - continuing in development mode without database', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Initialize Redis connection (optional for development)
      let redisConnected = false;
      try {
        await redis.connect();
        const redisHealth = await redis.healthCheck();
        if (redisHealth.status === 'connected') {
          redisConnected = true;
          logger.info('✅ Redis connection established');
        }
      } catch (error) {
        logger.warn('⚠️  Redis connection failed - continuing in development mode', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Report final service status
      const serviceStatus: string[] = [];
      if (dbConnected) serviceStatus.push('Database');
      if (redisConnected) serviceStatus.push('Redis');
      
      if (dbConnected && redisConnected) {
        logger.info('✅ All services initialized successfully');
      } else if (dbConnected || redisConnected) {
        logger.info(`✅ Core services initialized (${serviceStatus.join(', ')} available)`);
      } else {
        logger.info('✅ Server initialized in development mode (no external services)');
      }
    } catch (error) {
      logger.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      // Initialize all services
      await this.initializeServices();

      // Start HTTP server
      this.server = this.app.listen(config.PORT, () => {
        logger.info(`🚀 RAWGLE Backend API running on port ${config.PORT}`);
        logger.info(`📊 Environment: ${config.NODE_ENV}`);
        logger.info(`🔗 Health check: http://localhost:${config.PORT}/health`);
        logger.info(`📡 API endpoint: http://localhost:${config.PORT}/api/${config.API_VERSION}`);
        
        // Log system resources
        const memUsage = process.memoryUsage();
        logger.info('System resources:', {
          memory: {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          },
          uptime: `${Math.round(process.uptime())}s`,
          nodeVersion: process.version,
        });
      });

      // Handle server errors
      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        switch (error.code) {
          case 'EACCES':
            logger.error(`Port ${config.PORT} requires elevated privileges`);
            process.exit(1);
          case 'EADDRINUSE':
            logger.error(`Port ${config.PORT} is already in use`);
            process.exit(1);
          default:
            throw error;
        }
      });

    } catch (error) {
      logger.error('❌ Server startup failed:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('Shutting down server...');

      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((error: Error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }

      // Close database connections
      await db.close();

      // Close Redis connection
      await redis.disconnect();

      logger.info('✅ Server shutdown complete');
    } catch (error) {
      logger.error('❌ Error during server shutdown:', error);
      throw error;
    }
  }

  getApp(): express.Application {
    return this.app;
  }
}

// Create server instance
const server = new Server();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server if this file is run directly
if (require.main === module) {
  server.start();
}

export { server };
export default server;
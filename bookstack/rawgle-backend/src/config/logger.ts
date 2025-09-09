import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './env';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n  ${JSON.stringify(meta, null, 2)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create daily rotate file transport
const fileTransport = new DailyRotateFile({
  filename: config.LOG_FILE.replace('.log', '-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: config.LOG_MAX_SIZE,
  maxFiles: config.LOG_MAX_FILES,
  level: config.LOG_LEVEL,
  format: logFormat,
});

// Create error file transport
const errorFileTransport = new DailyRotateFile({
  filename: config.LOG_FILE.replace('.log', '-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: config.LOG_MAX_SIZE,
  maxFiles: config.LOG_MAX_FILES,
  level: 'error',
  format: logFormat,
});

// Create console transport
const consoleTransport = new winston.transports.Console({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: config.NODE_ENV === 'production' ? logFormat : consoleFormat,
});

// Create logger instance
const logger = winston.createLogger({
  levels,
  level: config.LOG_LEVEL,
  format: logFormat,
  transports: [
    fileTransport,
    errorFileTransport,
    consoleTransport,
  ],
  exitOnError: false,
});

// Handle unhandled exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: config.LOG_FILE.replace('.log', '-exceptions.log'),
    format: logFormat,
  })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({
    filename: config.LOG_FILE.replace('.log', '-rejections.log'),
    format: logFormat,
  })
);

// Add request logging utility
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const { method, url, ip, headers } = req;
  
  // Log request start
  logger.info('Request started', {
    method,
    url,
    ip,
    userAgent: headers['user-agent'],
    requestId: req.id,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Log response
    logger.info('Request completed', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      requestId: req.id,
    });

    // Call original end
    originalEnd.apply(res, args);
  };

  next();
};

// Add audit logging utility
export const auditLogger = {
  auth: (userId: string, action: string, details?: any) => {
    logger.info('Auth audit', {
      category: 'authentication',
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  user: (userId: string, action: string, targetUserId?: string, details?: any) => {
    logger.info('User audit', {
      category: 'user_management',
      userId,
      action,
      targetUserId,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  data: (userId: string, action: string, resource: string, resourceId?: string, details?: any) => {
    logger.info('Data audit', {
      category: 'data_access',
      userId,
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  security: (event: string, details?: any, userId?: string) => {
    logger.warn('Security audit', {
      category: 'security',
      event,
      userId,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Add performance logging utility
export const performanceLogger = {
  time: (label: string) => {
    const start = Date.now();
    return {
      end: (details?: any) => {
        const duration = Date.now() - start;
        logger.debug('Performance metric', {
          label,
          duration: `${duration}ms`,
          details,
        });
        return duration;
      },
    };
  },

  database: (query: string, duration: number, rowCount?: number) => {
    logger.debug('Database performance', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rowCount,
    });
  },
};

// Export logger instance
export { logger };

// Log startup message
logger.info('✅ Winston logging configured successfully', {
  logLevel: config.LOG_LEVEL,
  logFile: config.LOG_FILE,
  environment: config.NODE_ENV,
});
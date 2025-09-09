import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  });
};
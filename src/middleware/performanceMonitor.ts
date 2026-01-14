import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Performance monitoring middleware
 * Logs slow API requests (>3s) and adds response time headers
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalJson = res.json;

  // Override res.json to capture response time
  res.json = function (body: any) {
    const duration = Date.now() - startTime;
    
    // Add response time header
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Log slow requests (>3 seconds)
    if (duration > 3000) {
      logger.warn(`Slow API request detected: ${req.method} ${req.path} - ${duration}ms`, {
        method: req.method,
        path: req.path,
        duration,
        query: req.query,
        tenantId: req.tenantId,
      });
    }
    
    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`${req.method} ${req.path} - ${duration}ms`);
    }
    
    return originalJson.call(this, body);
  };

  next();
};

/**
 * Timeout middleware - abort requests taking longer than specified time
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error(`Request timeout: ${req.method} ${req.path} - exceeded ${timeoutMs}ms`);
        res.status(504).json({
          success: false,
          message: 'Request timeout - operation took too long',
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

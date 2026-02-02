import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Enhanced CORS middleware with dynamic origin handling
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Parse allowed origins - support comma-separated list
    const configOrigin = config.cors.origin;
    const allowedOrigins =
      typeof configOrigin === 'string'
        ? configOrigin.split(',').map(o => o.trim())
        : Array.isArray(configOrigin)
          ? configOrigin
          : [configOrigin];

    // Add common Netlify and Vercel patterns
    const netlifyPatterns = [
      'https://ayphentextile.netlify.app',
      'https://ayphen-textile.netlify.app',
      /https:\/\/.*\.netlify\.app$/,
    ];

    const vercelPatterns = ['https://ayphen-textile.vercel.app', /https:\/\/.*\.vercel\.app$/];

    const allPatterns = [...netlifyPatterns, ...vercelPatterns];

    // Allow all origins in development
    if (config.env === 'development') {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Check deployment platform patterns (Netlify and Vercel)
    for (const pattern of allPatterns) {
      if (typeof pattern === 'string' && pattern === origin) {
        return callback(null, true);
      }
      if (pattern instanceof RegExp && pattern.test(origin)) {
        return callback(null, true);
      }
    }

    logger.warn(`CORS: Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  maxAge: 86400, // 24 hours
});

/**
 * Enhanced security middleware with Helmet
 */
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
});

/**
 * Enhanced compression middleware
 */
export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter function
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses larger than 1KB
  windowBits: 15,
  memLevel: 8,
});

/**
 * Request ID middleware for tracing
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};

/**
 * Request logging middleware
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

/**
 * Content type validation middleware
 */
export const contentTypeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    // Only require Content-Type for requests that actually have a body
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const transferEncoding = req.headers['transfer-encoding'];

    // If there's no body (content-length is 0 or undefined, and no transfer-encoding)
    if (contentLength === 0 && !transferEncoding) {
      return next();
    }

    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be application/json',
      });
    }
  }
  next();
};

/**
 * Timeout middleware
 */
export const timeoutMiddleware = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ success: false, message: 'Request timeout' });
      }
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    next();
  };
};

/**
 * Maintenance mode middleware
 */
export const maintenanceModeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env['MAINTENANCE_MODE'] === 'true') {
    res.status(503).json({
      error: 'Service Under Maintenance',
      message: 'Service temporarily unavailable',
    });
    return;
  }
  next();
};

/**
 * Response time middleware
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Request completed in ${duration}ms`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    });
  });
  next();
};

/**
 * API version middleware
 */
export const apiVersionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.headers['api-version'] = 'v1';
  next();
};

/**
 * Client version middleware
 */
export const clientVersionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const clientVersion = req.headers['x-client-version'];
  if (clientVersion) {
    logger.info(`Client version: ${clientVersion}`);
  }
  next();
};

/**
 * Request size limit middleware
 */
export const requestSizeLimitMiddleware = (limit: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const size = parseInt(contentLength);
      const maxSize = parseSize(limit);
      if (size > maxSize) {
        res.status(413).json({
          error: 'Payload Too Large',
          message: `Request size exceeds limit of ${limit}`,
        });
        return;
      }
    }
    next();
  };
};

// Helper function to parse size string to bytes
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error('Invalid size format');
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      userId?: string;
      tenantId?: string;
      userRole?: string;
    }
  }
}

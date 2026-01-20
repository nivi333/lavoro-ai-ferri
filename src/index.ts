import express from 'express';
import dotenv from 'dotenv';
import { config } from './config/config';
import { logger } from './utils/logger';
import {
  corsMiddleware,
  securityMiddleware,
  compressionMiddleware,
  requestIdMiddleware,
  requestLoggingMiddleware,
  responseTimeMiddleware,
  apiVersionMiddleware,
  contentTypeMiddleware,
  clientVersionMiddleware,
  requestSizeLimitMiddleware,
  timeoutMiddleware,
  maintenanceModeMiddleware,
} from './middleware/requestMiddleware';
import { performanceMonitor } from './middleware/performanceMonitor';
import { performanceOptimization } from './middleware/performanceOptimization';
import {
  enhancedErrorHandler,
  notFoundHandler,
  setupUnhandledRejectionHandler,
  setupUncaughtExceptionHandler,
} from './middleware/enhancedErrorHandler';

import { setupSwagger } from './docs/swagger';
import v1Routes from './routes/v1';

// Load environment variables
dotenv.config();

// Setup error handlers
setupUnhandledRejectionHandler();
setupUncaughtExceptionHandler();

const app = express();

// Core middleware stack
app.use(maintenanceModeMiddleware);
app.use(requestIdMiddleware);
app.use(performanceMonitor); // Track slow requests
app.use(performanceOptimization); // Optimize response times and caching
app.use(responseTimeMiddleware);
app.use(requestLoggingMiddleware);
app.use(apiVersionMiddleware);
app.use(clientVersionMiddleware);

// Security middleware
app.use(securityMiddleware);
app.use(corsMiddleware);

// Compression and parsing middleware
app.use(compressionMiddleware);
app.use(requestSizeLimitMiddleware('10mb'));
app.use(timeoutMiddleware(30000)); // 30 seconds
app.use(contentTypeMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
// app.use(generalRateLimit);
// app.use(/* generalRateLimit */);

// API Documentation
setupSwagger(app);

// API routes
app.use('/api/v1', v1Routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// API routes will be added here
app.get('/', (req, res) => {
  res.json({
    message: 'Ayphen Textile - Textile Manufacturing ERP API',
    version: '1.0.0',
    environment: config.env,
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(enhancedErrorHandler);

const server = app.listen(config.port, config.host, () => {
  logger.info(`🚀 Server running on ${config.host}:${config.port} in ${config.env} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;

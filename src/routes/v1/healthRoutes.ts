import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import { redisClient } from '../../utils/redis';
import { globalPrisma } from '../../database/connection';
import { logger } from '../../utils/logger';
import { config } from '../../config/config';

const router = Router();

// Minimal ping endpoint for keep-alive (no DB/Redis check)
router.get('/ping', (_req, res) => {
  res.status(200).send('OK');
});

// Basic health check
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: '1.0.0',
      services: {
        api: 'healthy',
        database: 'checking...',
        redis: 'checking...',
      },
    };

    // Check database connection
    try {
      await globalPrisma.$queryRaw`SELECT 1`;
      healthStatus.services.database = 'healthy';
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'DEGRADED';
    }

    // Check Redis connection
    try {
      if (redisClient.isReady()) {
        await redisClient.get('health-check');
        healthStatus.services.redis = 'healthy';
      } else {
        healthStatus.services.redis = 'unhealthy';
        healthStatus.status = 'DEGRADED';
      }
    } catch (error) {
      healthStatus.services.redis = 'unhealthy';
      healthStatus.status = 'DEGRADED';
    }

    const statusCode = healthStatus.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: '1.0.0',
      system: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss,
        },
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
      services: {
        api: {
          status: 'healthy',
          responseTime: Date.now(),
        },
        database: {
          status: 'checking...',
          responseTime: null,
        },
        redis: {
          status: 'checking...',
          responseTime: null,
        },
      },
    };

    // Check database with timing
    const dbStart = Date.now();
    try {
      await globalPrisma.$queryRaw`SELECT 1`;
      detailedHealth.services.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
      };
    } catch (error) {
      detailedHealth.services.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
      };
      detailedHealth.status = 'DEGRADED';
    }

    // Check Redis with timing
    const redisStart = Date.now();
    try {
      if (redisClient.isReady()) {
        await redisClient.get('health-check');
        detailedHealth.services.redis = {
          status: 'healthy',
          responseTime: Date.now() - redisStart,
        };
      } else {
        detailedHealth.services.redis = {
          status: 'unhealthy',
          responseTime: Date.now() - redisStart,
          error: redisClient.getLastError() || 'Redis client not ready (isConnected is false)',
        } as any;
        detailedHealth.status = 'DEGRADED';
      }
    } catch (error: any) {
      detailedHealth.services.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - redisStart,
        error: error.message || 'Unknown Redis error',
      } as any;
      detailedHealth.status = 'DEGRADED';
    }

    const statusCode = detailedHealth.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
    });
  }
});

// Authentication service health
router.get('/auth', AuthController.healthCheck);

// Database health check
router.get('/database', async (req, res) => {
  try {
    const start = Date.now();
    await globalPrisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    res.status(200).json({
      status: 'healthy',
      service: 'database',
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Database health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'database',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Redis health check
router.get('/redis', async (req, res) => {
  try {
    const start = Date.now();

    if (!redisClient.isReady()) {
      throw new Error('Redis client not ready');
    }

    await redisClient.get('health-check');
    const responseTime = Date.now() - start;

    res.status(200).json({
      status: 'healthy',
      service: 'redis',
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Redis health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'redis',
      error: 'Redis connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

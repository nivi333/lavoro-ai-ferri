import { logger } from '../utils/logger';
import { globalPrisma } from '../database/connection';
import { redisClient } from '../utils/redis';

/**
 * HeartbeatService
 * Responsible for keeping the backend 'active' and monitoring basic health
 * in the background. On Render's Free tier, this help stay awake while
 * there is any activity, and provides logs for monitoring.
 */
export class HeartbeatService {
  private static interval: NodeJS.Timeout | null = null;

  static start(intervalMs: number = 600000) {
    // Default 10 minutes
    if (this.interval) {
      return;
    }

    logger.info('💓 Heartbeat service started');

    this.interval = setInterval(async () => {
      try {
        const start = Date.now();

        // 1. Simple DB check
        await globalPrisma.$queryRaw`SELECT 1`;

        // 2. Redis check if available
        let redisStatus = 'N/A';
        if (redisClient.isReady()) {
          redisStatus = 'ready';
        }

        const duration = Date.now() - start;
        logger.info(`💓 Heartbeat: DB OK, Redis: ${redisStatus}, Latency: ${duration}ms`);
      } catch (error: any) {
        logger.error('💓 Heartbeat failed:', error.message);
      }
    }, intervalMs);

    // Initial heartbeat
    this.interval.unref(); // Don't keep the process alive just for this if everything else stops
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('💓 Heartbeat service stopped');
    }
  }
}

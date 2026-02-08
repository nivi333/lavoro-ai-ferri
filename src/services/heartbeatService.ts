import { logger } from '../utils/logger';
import { globalPrisma } from '../database/connection';
import { redisClient } from '../utils/redis';

/**
 * HeartbeatService
 * Responsible for keeping the backend 'active' and monitoring basic health
 * in the background. On Render's Free tier, this help stay awake while
 * there is any activity, and provides logs for monitoring.
 * 
 * Includes connection recovery logic for Supabase connection drops.
 */
export class HeartbeatService {
  private static interval: NodeJS.Timeout | null = null;
  private static consecutiveFailures: number = 0;
  private static readonly MAX_FAILURES_BEFORE_RECONNECT = 2;

  /**
   * Attempt to reconnect to the database
   */
  private static async reconnectDatabase(): Promise<boolean> {
    try {
      logger.info('💓 Attempting database reconnection...');
      await globalPrisma.$disconnect();
      await globalPrisma.$connect();
      logger.info('💓 Database reconnected successfully');
      return true;
    } catch (error: any) {
      logger.error('💓 Database reconnection failed:', error.message);
      return false;
    }
  }

  static start(intervalMs: number = 300000) {
    // Default 5 minutes (reduced from 10 to keep connections warm)
    if (this.interval) {
      return;
    }

    logger.info('💓 Heartbeat service started');

    this.interval = setInterval(async () => {
      try {
        const start = Date.now();

        // 1. Simple DB check with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DB query timeout')), 10000)
        );
        
        await Promise.race([
          globalPrisma.$queryRaw`SELECT 1`,
          timeoutPromise
        ]);

        // 2. Redis check if available
        let redisStatus = 'N/A';
        if (redisClient.isReady()) {
          redisStatus = 'ready';
        }

        const duration = Date.now() - start;
        logger.info(`💓 Heartbeat: DB OK, Redis: ${redisStatus}, Latency: ${duration}ms`);
        
        // Reset failure counter on success
        this.consecutiveFailures = 0;
      } catch (error: any) {
        this.consecutiveFailures++;
        logger.error(`💓 Heartbeat failed (${this.consecutiveFailures}/${this.MAX_FAILURES_BEFORE_RECONNECT}):`, error.message);
        
        // Attempt reconnection after consecutive failures
        if (this.consecutiveFailures >= this.MAX_FAILURES_BEFORE_RECONNECT) {
          const reconnected = await this.reconnectDatabase();
          if (reconnected) {
            this.consecutiveFailures = 0;
          }
        }
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

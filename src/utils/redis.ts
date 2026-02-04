import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';
import { logger } from './logger';

class RedisManager {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private lastError: string | null = null;

  constructor() {
    let clientConfig: any;
    if (process.env.REDIS_URL) {
      const isTLS = process.env.REDIS_URL.startsWith('rediss://');
      clientConfig = {
        url: process.env.REDIS_URL,
        socket: isTLS ? { tls: true, rejectUnauthorized: false } : undefined,
      };
      logger.info(`Initializing Redis with URL (TLS: ${isTLS})`);
    } else {
      clientConfig = {
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          tls: process.env.REDIS_TLS === 'true',
        },
        database: config.redis.db,
      };
      if (config.redis.password) {
        clientConfig.password = config.redis.password;
      }
    }

    this.client = createClient(clientConfig);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', error => {
      logger.error('Redis client error:', error);
      this.lastError = error.message || String(error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  async connect(): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries && !this.isConnected) {
      try {
        logger.info(`Attempting Redis connection (Attempt ${retryCount + 1}/${maxRetries})...`);
        await this.client.connect();
        logger.info('Redis connection established successfully');
        return;
      } catch (error: any) {
        retryCount++;
        this.lastError = `Attempt ${retryCount}: ${error.message}`;
        logger.warn(`Redis connection failed (Attempt ${retryCount}/${maxRetries}):`, error);
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    logger.error('Failed to establish Redis connection after multiple attempts.');
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  // Convenience methods for common operations
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.client.get(key);
    } catch (error) {
      logger.warn(`Redis GET error for key ${key} - Redis not available:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) return;
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.warn(`Redis SET error for key ${key} - Redis not available:`, error);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.setEx(key, seconds, value);
    } catch (error) {
      logger.warn(`Redis SETEX error for key ${key} - Redis not available:`, error);
    }
  }

  async del(...keys: string[]): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.del(keys);
    } catch (error) {
      logger.warn(`Redis DEL error for keys ${keys.join(', ')} - Redis not available:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.exists(key);
    } catch (error) {
      logger.warn(`Redis EXISTS error for key ${key} - Redis not available:`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.warn(`Redis EXPIRE error for key ${key} - Redis not available:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) return -1;
      return await this.client.ttl(key);
    } catch (error) {
      logger.warn(`Redis TTL error for key ${key} - Redis not available:`, error);
      return -1;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.incr(key);
    } catch (error) {
      logger.warn(`Redis INCR error for key ${key} - Redis not available:`, error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.decr(key);
    } catch (error) {
      logger.warn(`Redis DECR error for key ${key} - Redis not available:`, error);
      return 0;
    }
  }

  async hget(key: string, field: string): Promise<string | undefined> {
    try {
      if (!this.isConnected) return undefined;
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.warn(`Redis HGET error for key ${key}, field ${field} - Redis not available:`, error);
      return undefined;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.hSet(key, field, value);
    } catch (error) {
      logger.warn(`Redis HSET error for key ${key}, field ${field} - Redis not available:`, error);
      return 0;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      if (!this.isConnected) return {};
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.warn(`Redis HGETALL error for key ${key} - Redis not available:`, error);
      return {};
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.hDel(key, fields);
    } catch (error) {
      logger.warn(
        `Redis HDEL error for key ${key}, fields ${fields.join(', ')} - Redis not available:`,
        error
      );
      return 0;
    }
  }

  // Rate limiting helper
  async rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      if (!this.isConnected) {
        // Allow all requests if Redis is not available
        return {
          allowed: true,
          remaining: limit - 1,
          resetTime: Date.now() + windowSeconds * 1000,
        };
      }

      const current = await this.incr(key);

      if (current === 1) {
        await this.expire(key, windowSeconds);
      }

      const ttl = await this.ttl(key);
      const resetTime = Date.now() + ttl * 1000;

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime,
      };
    } catch (error) {
      logger.warn(`Redis rate limit error for key ${key} - Redis not available:`, error);
      // Allow all requests if Redis fails
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + windowSeconds * 1000,
      };
    }
  }

  // Session management helpers
  async storeSession(sessionId: string, data: any, ttlSeconds: number): Promise<void> {
    try {
      if (!this.isConnected) return;
      const key = `session:${sessionId}`;
      await this.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      logger.warn(`Error storing session ${sessionId} - Redis not available:`, error);
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      if (!this.isConnected) return null;
      const key = `session:${sessionId}`;
      const data = await this.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn(`Error getting session ${sessionId} - Redis not available:`, error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      const key = `session:${sessionId}`;
      await this.del(key);
    } catch (error) {
      logger.warn(`Error deleting session ${sessionId} - Redis not available:`, error);
    }
  }

  // Cache helpers
  async cache(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      logger.warn(`Error caching data for key ${key} - Redis not available:`, error);
    }
  }

  async getCache(key: string): Promise<any | null> {
    try {
      if (!this.isConnected) return null;
      const data = await this.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn(`Error getting cached data for key ${key} - Redis not available:`, error);
      return null;
    }
  }

  async invalidateCache(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      // Note: This is a simple implementation. For production, consider using SCAN
      // to avoid blocking the Redis server with large keysets
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.del(...keys);
      }
    } catch (error) {
      logger.warn(`Error invalidating cache pattern ${pattern} - Redis not available:`, error);
    }
  }
}

// Create singleton instance
const redisManager = new RedisManager();

// Export the client for direct access
export const redisClient = redisManager;

// Auto-connect on import
redisManager.connect().catch(error => {
  logger.error('Failed to auto-connect to Redis:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisManager.disconnect();
});

process.on('SIGTERM', async () => {
  await redisManager.disconnect();
});

export default redisManager;

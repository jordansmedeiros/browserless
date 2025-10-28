/**
 * Redis Client for Log Streaming
 * Provides pub/sub capabilities for multi-instance log streaming
 */

import { Redis } from 'ioredis';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

/**
 * Check if Redis is enabled via environment variable
 */
export function isRedisEnabled(): boolean {
  return process.env.ENABLE_REDIS_LOG_STREAMING === 'true';
}

/**
 * Get or create Redis publisher client
 */
export function getRedisPublisher(): Redis | null {
  if (!isRedisEnabled()) {
    return null;
  }

  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        console.log(`[Redis] Reconnecting publisher, attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Publisher connected');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Publisher error:', err);
    });

    redisClient.on('close', () => {
      console.log('[Redis] Publisher connection closed');
    });
  }

  return redisClient;
}

/**
 * Get or create Redis subscriber client
 * Note: Must use separate client for pub/sub in Redis
 */
export function getRedisSubscriber(): Redis | null {
  if (!isRedisEnabled()) {
    return null;
  }

  if (!redisSubscriber) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisSubscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        console.log(`[Redis] Reconnecting subscriber, attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
    });

    redisSubscriber.on('connect', () => {
      console.log('[Redis] Subscriber connected');
    });

    redisSubscriber.on('error', (err) => {
      console.error('[Redis] Subscriber error:', err);
    });

    redisSubscriber.on('close', () => {
      console.log('[Redis] Subscriber connection closed');
    });
  }

  return redisSubscriber;
}

/**
 * Publish a log entry to Redis
 */
export async function publishJobLog(jobId: string, logEntry: any): Promise<boolean> {
  const publisher = getRedisPublisher();

  if (!publisher) {
    return false; // Redis not enabled, use fallback
  }

  try {
    await publisher.publish(`job-logs:${jobId}`, JSON.stringify(logEntry));
    return true;
  } catch (error) {
    console.error(`[Redis] Failed to publish log for job ${jobId}:`, error);
    return false;
  }
}

/**
 * Subscribe to job logs
 */
export async function subscribeToJobLogs(
  jobId: string,
  callback: (logEntry: any) => void
): Promise<(() => void) | null> {
  const subscriber = getRedisSubscriber();

  if (!subscriber) {
    return null; // Redis not enabled, use fallback
  }

  const channel = `job-logs:${jobId}`;

  const messageHandler = (ch: string, message: string) => {
    if (ch === channel) {
      try {
        const logEntry = JSON.parse(message);
        callback(logEntry);
      } catch (error) {
        console.error(`[Redis] Failed to parse log message:`, error);
      }
    }
  };

  subscriber.on('message', messageHandler);

  try {
    await subscriber.subscribe(channel);
    console.log(`[Redis] Subscribed to ${channel}`);

    // Return cleanup function
    return async () => {
      subscriber.off('message', messageHandler);
      await subscriber.unsubscribe(channel);
      console.log(`[Redis] Unsubscribed from ${channel}`);
    };
  } catch (error) {
    console.error(`[Redis] Failed to subscribe to ${channel}:`, error);
    subscriber.off('message', messageHandler);
    return null;
  }
}

/**
 * Close Redis connections (cleanup)
 */
export async function closeRedis(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (redisClient) {
    promises.push(redisClient.quit().then(() => {}).catch(err => {
      console.error('[Redis] Error closing publisher:', err);
    }));
    redisClient = null;
  }

  if (redisSubscriber) {
    promises.push(redisSubscriber.quit().then(() => {}).catch(err => {
      console.error('[Redis] Error closing subscriber:', err);
    }));
    redisSubscriber = null;
  }

  await Promise.all(promises);
  console.log('[Redis] Connections closed');
}

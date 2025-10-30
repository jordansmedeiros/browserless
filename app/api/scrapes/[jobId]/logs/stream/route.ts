/**
 * SSE Endpoint for Real-Time Log Streaming
 * Streams scrape job logs via Server-Sent Events
 * Supports both Redis pub/sub (multi-instance) and in-memory EventEmitter (single-instance)
 */

import { NextRequest } from 'next/server';
import { scrapeLoggerService, type LogEntry } from '@/lib/services/scrape-logger';
import { subscribeToJobLogs, isRedisEnabled } from '@/lib/redis';
import { prisma } from '@/lib/db';
import { sanitizeLogEntry } from '@/lib/utils/sanitization';

/**
 * Debug log helper - only logs if DEBUG_LOG_STREAMING is enabled
 */
function debugLog(...args: any[]) {
  if (process.env.DEBUG_LOG_STREAMING === 'true') {
    console.log('[Stream]', ...args);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // Create a stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let redisUnsubscribe: (() => void) | null = null;
      let heartbeat: NodeJS.Timeout | null = null;

      try {
        // Create log listener with sanitization
        const sendLog = (log: LogEntry) => {
          try {
            const sanitized = sanitizeLogEntry(log);
            const data = `data: ${JSON.stringify(sanitized)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error(`[Stream] Error sending log for job ${jobId}:`, error);
          }
        };

        debugLog(`SSE connected for job ${jobId}`);

        // Backfill from database first (if job is completed/failed)
        let dbLogCount = 0;
        const dbLogKeys = new Set<string>();
        try {
          const job = await prisma.scrapeJob.findUnique({
            where: { id: jobId },
            select: { logs: true, status: true },
          });

          if (job?.logs) {
            // Parse logs if stored as JSON string
            let logsArray: any[];
            if (typeof job.logs === 'string') {
              try {
                logsArray = JSON.parse(job.logs);
              } catch (parseError) {
                console.error(`[Stream] Error parsing job.logs JSON for job ${jobId}:`, parseError);
                logsArray = [];
              }
            } else if (Array.isArray(job.logs)) {
              logsArray = job.logs;
            } else {
              logsArray = [];
            }

            // Send each log entry and build Set of keys for deduplication
            logsArray.forEach((log: any) => {
              sendLog(log as LogEntry);
              // Create unique key: timestamp|level|message
              if (log.timestamp && log.level && log.message) {
                const key = `${log.timestamp}|${log.level}|${log.message}`;
                dbLogKeys.add(key);
              }
            });
            dbLogCount = logsArray.length;
          }
        } catch (error) {
          console.error(`[Stream] Error loading logs from DB for job ${jobId}:`, error);
        }

        // Send logs from memory buffer (fixes race condition)
        // Filter using Set to avoid duplicates based on timestamp|level|message
        const memoryLogs = scrapeLoggerService.getJobLogs(jobId);
        const filteredMemoryLogs = memoryLogs.filter(log => {
          const key = `${log.timestamp}|${log.level}|${log.message}`;
          return !dbLogKeys.has(key);
        });

        // Sort filtered memory logs by timestamp to ensure correct ordering
        const sortedMemoryLogs = [...filteredMemoryLogs].sort((a, b) => {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

        const memoryLogCount = sortedMemoryLogs.length;

        if (memoryLogCount > 0) {
          debugLog(`Sending ${memoryLogCount} logs from memory buffer for job ${jobId} (filtered from ${memoryLogs.length} total)`);
          sortedMemoryLogs.forEach((log) => {
            sendLog(log);
          });
        } else if (memoryLogs.length > 0 && dbLogKeys.size > 0) {
          debugLog(`Skipped ${memoryLogs.length} duplicate logs from memory buffer for job ${jobId}`);
        }

        // Subscribe to real-time logs
        if (isRedisEnabled()) {
          // Use Redis pub/sub for multi-instance deployments
          debugLog(`Using Redis subscription for job ${jobId}`);

          redisUnsubscribe = await subscribeToJobLogs(jobId, sendLog);

          if (!redisUnsubscribe) {
            // Redis failed, fall back to in-memory
            console.warn(`[Stream] Redis subscription failed for job ${jobId}, falling back to in-memory`);
            scrapeLoggerService.attachLogListener(jobId, sendLog);
          }
        } else {
          // Use in-memory EventEmitter for single-instance
          debugLog(`Using in-memory subscription for job ${jobId}`);
          scrapeLoggerService.attachLogListener(jobId, sendLog);
          debugLog(`Listener attached for job ${jobId}`);
        }

        // Keep connection alive with heartbeat
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (error) {
            // Connection might be closed
            if (heartbeat) clearInterval(heartbeat);
          }
        }, 15000); // Every 15 seconds

        // Cleanup on connection close
        request.signal.addEventListener('abort', () => {
          debugLog(`Connection closed for job ${jobId}`);

          if (heartbeat) {
            clearInterval(heartbeat);
          }

          if (redisUnsubscribe) {
            redisUnsubscribe();
          } else {
            scrapeLoggerService.detachLogListener(jobId, sendLog);
          }

          try {
            controller.close();
          } catch (e) {
            // Controller might already be closed
          }
        });
      } catch (error) {
        console.error(`[Stream] Error setting up stream for job ${jobId}:`, error);

        if (heartbeat) {
          clearInterval(heartbeat);
        }

        try {
          controller.close();
        } catch (e) {
          // Controller might already be closed
        }
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

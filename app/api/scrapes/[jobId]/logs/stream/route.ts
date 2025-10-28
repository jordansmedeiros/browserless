/**
 * SSE Endpoint for Real-Time Log Streaming
 * Streams scrape job logs via Server-Sent Events
 * Supports both Redis pub/sub (multi-instance) and in-memory EventEmitter (single-instance)
 */

import { NextRequest } from 'next/server';
import { scrapeLoggerService, type LogEntry } from '@/lib/services/scrape-logger';
import { subscribeToJobLogs, isRedisEnabled } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

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
        // Create log listener
        const sendLog = (log: LogEntry) => {
          try {
            const data = `data: ${JSON.stringify(log)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error(`[Stream] Error sending log for job ${jobId}:`, error);
          }
        };

        // Backfill from database first (if job is completed/failed)
        try {
          const job = await prisma.scrapeJob.findUnique({
            where: { id: jobId },
            select: { logs: true, status: true },
          });

          if (job?.logs && Array.isArray(job.logs)) {
            job.logs.forEach((log: any) => {
              sendLog(log as LogEntry);
            });
          }
        } catch (error) {
          console.error(`[Stream] Error loading logs from DB for job ${jobId}:`, error);
        }

        // Subscribe to real-time logs
        if (isRedisEnabled()) {
          // Use Redis pub/sub for multi-instance deployments
          console.log(`[Stream] Using Redis subscription for job ${jobId}`);

          redisUnsubscribe = await subscribeToJobLogs(jobId, sendLog);

          if (!redisUnsubscribe) {
            // Redis failed, fall back to in-memory
            console.warn(`[Stream] Redis subscription failed for job ${jobId}, falling back to in-memory`);
            scrapeLoggerService.attachLogListener(jobId, sendLog);
          }
        } else {
          // Use in-memory EventEmitter for single-instance
          console.log(`[Stream] Using in-memory subscription for job ${jobId}`);
          scrapeLoggerService.attachLogListener(jobId, sendLog);

          // Send existing in-memory logs (not already in DB)
          const existingLogs = scrapeLoggerService.getJobLogs(jobId);
          existingLogs.forEach((log) => {
            sendLog(log);
          });
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
          console.log(`[Stream] Connection closed for job ${jobId}`);

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

/**
 * SSE Endpoint for Real-Time Log Streaming
 * Streams scrape job logs via Server-Sent Events
 */

import { NextRequest } from 'next/server';
import { scrapeLoggerService, type LogEntry } from '@/lib/services/scrape-logger';

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
    start(controller) {
      // Create log listener
      const sendLog = (log: LogEntry) => {
        const data = `data: ${JSON.stringify(log)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Attach listener to job
      scrapeLoggerService.attachLogListener(jobId, sendLog);

      // Send existing logs first
      const existingLogs = scrapeLoggerService.getJobLogs(jobId);
      existingLogs.forEach((log) => {
        sendLog(log);
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000); // Every 15 seconds

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        scrapeLoggerService.detachLogListener(jobId, sendLog);
        try {
          controller.close();
        } catch (e) {
          // Controller might already be closed
        }
      });
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

/**
 * Polling Endpoint for Historical Logs
 * Returns logs from database and memory buffer
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeLoggerService, type LogEntry } from '@/lib/services/scrape-logger';
import { sanitizeLogEntry } from '@/lib/utils/sanitization';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const fromIndex = parseInt(searchParams.get('fromIndex') || '0', 10);

    // Get job from database
    const job = await prisma.scrapeJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        logs: true,
        executions: {
          select: {
            logs: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Combine logs from all sources
    let allLogs: LogEntry[] = [];

    // Get job-level logs from database (orchestrator logs)
    if (job.logs) {
      try {
        const jobLogs = typeof job.logs === 'string'
          ? JSON.parse(job.logs)
          : job.logs;
        if (Array.isArray(jobLogs)) {
          allLogs = allLogs.concat(jobLogs as LogEntry[]);
        }
      } catch (error) {
        console.error('[GET /api/scrapes/[jobId]/logs] Error parsing job logs:', error);
      }
    }

    // Get persisted logs from executions
    for (const execution of job.executions) {
      if (execution.logs && Array.isArray(execution.logs)) {
        allLogs = allLogs.concat(execution.logs as unknown as LogEntry[]);
      }
    }

    // Get in-memory logs from logger service
    const memoryLogs = scrapeLoggerService.getJobLogs(jobId);
    allLogs = allLogs.concat(memoryLogs);

    // Sort by timestamp
    allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Sanitize logs before sending to client
    const sanitizedLogs = allLogs.map(sanitizeLogEntry);

    // Get logs from specified index
    const requestedLogs = sanitizedLogs.slice(fromIndex);

    return NextResponse.json({
      logs: requestedLogs,
      lastIndex: sanitizedLogs.length,
      jobStatus: job.status,
      hasMore: job.status === 'running' || job.status === 'pending',
    });
  } catch (error) {
    console.error('[GET /api/scrapes/[jobId]/logs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

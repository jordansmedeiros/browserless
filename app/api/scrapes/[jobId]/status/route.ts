/**
 * Consolidated Status Endpoint
 * Returns job status + stats + recent logs in a single request
 * Optimizes terminal monitor polling by reducing from 2 requests to 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scrapeLoggerService, type LogEntry } from '@/lib/services/scrape-logger';
import { sanitizeLogEntry } from '@/lib/utils/sanitization';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Fetch job with all relations
    const job = await prisma.scrapeJob.findUnique({
      where: { id: jobId },
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        executions: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Calculate stats
    const totalTribunals = job.tribunals.length;
    const completedTribunals = job.tribunals.filter(t => t.status === 'completed').length;
    const failedTribunals = job.tribunals.filter(t => t.status === 'failed').length;
    const totalProcesses = job.executions.reduce((sum, e) => sum + (e.processosCount || 0), 0);

    const stats = {
      status: job.status,
      totalTribunals,
      completedTribunals,
      failedTribunals,
      totalProcesses,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      duration: job.startedAt && job.completedAt
        ? job.completedAt.getTime() - job.startedAt.getTime()
        : undefined,
    };

    // Get recent logs (last 10 from memory)
    let recentLogs: LogEntry[] = scrapeLoggerService.getJobLogs(jobId);

    // Fallback to DB logs if memory is empty
    if (recentLogs.length === 0 && job.logs) {
      try {
        const jobLogs = typeof job.logs === 'string'
          ? JSON.parse(job.logs)
          : job.logs;
        if (Array.isArray(jobLogs)) {
          recentLogs = jobLogs as LogEntry[];
        }
      } catch (error) {
        console.error('[GET /api/scrapes/[jobId]/status] Error parsing job logs:', error);
      }
    }

    // Take only last 10 logs and sanitize
    const sanitizedRecentLogs = recentLogs
      .slice(-10)
      .map(sanitizeLogEntry);

    return NextResponse.json(
      {
        job: job as ScrapeJobWithRelations,
        stats,
        recentLogs: sanitizedRecentLogs,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/scrapes/[jobId]/status] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status do job' },
      { status: 500 }
    );
  }
}

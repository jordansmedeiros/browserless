/**
 * useJobLogs Hook
 * Custom hook for managing SSE + fallback polling for job logs
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useLogsStore, type JobSummary, type ConnectionStatus } from '@/lib/stores';
import type { LogEntry } from '@/lib/services/scrape-logger';
import { sanitizeLogEntry } from '@/lib/utils/sanitization';
import { ScrapeJobStatus } from '@/lib/types/scraping';

interface UseJobLogsOptions {
  /** Enable/disable log streaming (default: true) */
  enabled?: boolean;
  /** Auto-scroll to bottom when new logs arrive (default: true) */
  autoScroll?: boolean;
}

interface UseJobLogsReturn {
  logs: LogEntry[];
  connectionStatus: ConnectionStatus;
  stats: JobSummary | null;
  scrollToBottom: () => void;
  downloadLogs: () => void;
}

export function useJobLogs(
  jobId: string,
  options: UseJobLogsOptions = {}
): UseJobLogsReturn {
  const { enabled = true, autoScroll = true } = options;

  const logsStore = useLogsStore();

  // Internal state to control SSE/polling based on job status
  // This will be disabled when job reaches a terminal state
  const [internalEnabled, setInternalEnabled] = useState(enabled);

  // Refs to avoid stale closures
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastLogIndexRef = useRef(0);
  const stopPollingRef = useRef<(() => void) | null>(null);
  const autoScrollRef = useRef(autoScroll);

  // Update refs
  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  // Sync internal enabled state with prop
  useEffect(() => {
    setInternalEnabled(enabled);
  }, [enabled]);

  // Use a memoized selector for log count
  const logCount = useLogsStore((state) => state.logsByJob[jobId]?.length || 0);

  useEffect(() => {
    lastLogIndexRef.current = logCount;
  }, [jobId, logCount]);

  // Monitor job status and disable SSE/polling when job reaches terminal state
  useEffect(() => {
    const stats = logsStore.getStats(jobId);
    if (stats && stats.status) {
      const isTerminalState =
        stats.status === ScrapeJobStatus.COMPLETED ||
        stats.status === ScrapeJobStatus.FAILED ||
        stats.status === ScrapeJobStatus.CANCELED;

      if (isTerminalState && internalEnabled) {
        // Job has reached terminal state, disable SSE/polling
        setInternalEnabled(false);
      }
    }
  }, [jobId, logsStore, internalEnabled]);

  // Format timestamp helper
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      autoScrollRef.current = true;
    }
  }, []);

  // Download logs function
  const downloadLogs = useCallback(() => {
    const logs = logsStore.getLogsForJob(jobId);
    if (logs.length === 0) return;

    // Sanitize and format logs as plain text
    const logText = logs
      .map((log) => sanitizeLogEntry(log))
      .map((log) => {
        const timestamp = formatTime(log.timestamp);
        const level = log.level.toUpperCase().padEnd(7);
        const context = log.context ? ` ${JSON.stringify(log.context)}` : '';
        return `[${timestamp}] ${level} ${log.message}${context}`;
      })
      .join('\n');

    // Create blob and download
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrape-job-${jobId.slice(0, 8)}-logs.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [jobId, logsStore]);

  // Fetch job statistics using consolidated endpoint
  // This endpoint returns job status + stats + recent logs in a single request
  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/scrapes/${jobId}/status`);
        const data = await response.json();

        if (data.stats) {
          logsStore.setStats(jobId, {
            status: data.stats.status,
            totalTribunals: data.stats.totalTribunals,
            completedTribunals: data.stats.completedTribunals,
            failedTribunals: data.stats.failedTribunals,
            totalProcesses: data.stats.totalProcesses,
            duration: data.stats.duration ? Math.floor(data.stats.duration / 1000) : undefined,
            startedAt: data.stats.startedAt ? new Date(data.stats.startedAt) : undefined,
            completedAt: data.stats.completedAt ? new Date(data.stats.completedAt) : undefined,
          });
        }

        // Add recent logs to store if logs store is empty (avoid duplication with SSE)
        if (data.recentLogs && data.recentLogs.length > 0) {
          const currentLogs = logsStore.getLogsForJob(jobId);
          if (currentLogs.length === 0) {
            logsStore.addLogs(jobId, data.recentLogs);
          }
        }
      } catch (error) {
        console.error('[useJobLogs] Error fetching job status:', error);
      }
    };

    fetchJobStatus();

    // Poll for updates only if streaming is enabled and job is in active state
    const stats = logsStore.getStats(jobId);
    if (
      internalEnabled &&
      (!stats ||
        stats.status === ScrapeJobStatus.RUNNING ||
        stats.status === ScrapeJobStatus.PENDING)
    ) {
      const interval = setInterval(fetchJobStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [jobId, internalEnabled, logsStore]);

  // Polling fallback function
  const startPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/scrapes/${jobId}/logs?fromIndex=${lastLogIndexRef.current}`
        );
        const data = await response.json();

        if (data.logs && data.logs.length > 0) {
          logsStore.addLogs(jobId, data.logs);
          lastLogIndexRef.current += data.logs.length;
        }

        if (!data.hasMore) {
          clearInterval(pollInterval);
          logsStore.setConnectionStatus(jobId, 'disconnected');
        }
      } catch (error) {
        console.error('[useJobLogs] Polling error:', error);
        clearInterval(pollInterval);
        logsStore.setConnectionStatus(jobId, 'error');
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId, logsStore]);

  // SSE connection effect
  useEffect(() => {
    if (!internalEnabled) {
      logsStore.setConnectionStatus(jobId, 'disconnected');
      return;
    }

    const connectSSE = () => {
      logsStore.setConnectionStatus(jobId, 'connecting');

      try {
        const eventSource = new EventSource(`/api/scrapes/${jobId}/logs/stream`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          logsStore.setConnectionStatus(jobId, 'connected');
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const log: LogEntry = JSON.parse(event.data);
            logsStore.addLog(jobId, log);
          } catch (error) {
            console.error('[useJobLogs] Error parsing log:', error);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          logsStore.setConnectionStatus(jobId, 'error');

          // Retry connection with exponential backoff
          if (reconnectAttemptsRef.current < 3) {
            const delay = 1000 * Math.pow(2, reconnectAttemptsRef.current);
            setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              connectSSE();
            }, delay);
          } else {
            // Fall back to polling after 3 failed attempts
            logsStore.setConnectionStatus(jobId, 'disconnected');
            // Stop any existing polling before starting new one
            stopPollingRef.current?.();
            stopPollingRef.current = startPolling();
          }
        };
      } catch (error) {
        console.error('[useJobLogs] Error creating EventSource:', error);
        logsStore.setConnectionStatus(jobId, 'error');
      }
    };

    connectSSE();

    return () => {
      // Clean up polling if active
      stopPollingRef.current?.();
      stopPollingRef.current = null;

      // Clean up SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [jobId, internalEnabled, logsStore, startPolling]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScrollRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logCount]);

  return {
    logs: logsStore.getLogsForJob(jobId),
    connectionStatus: logsStore.getConnectionStatus(jobId),
    stats: logsStore.getStats(jobId) || null,
    scrollToBottom,
    downloadLogs,
  };
}

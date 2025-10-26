/**
 * Scrape Logger Service
 * Provides structured logging for scrape jobs with event emission
 */

import { EventEmitter } from 'events';

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string; // ISO 8601
  level: LogLevel;
  message: string;
  context?: Record<string, any>; // Optional structured data
}

class ScrapeLoggerService extends EventEmitter {
  private static instance: ScrapeLoggerService;
  private logBuffers: Map<string, LogEntry[]> = new Map();

  private constructor() {
    super();
    this.setMaxListeners(0); // Allow unlimited listeners (one per active job)
  }

  static getInstance(): ScrapeLoggerService {
    if (!ScrapeLoggerService.instance) {
      ScrapeLoggerService.instance = new ScrapeLoggerService();
    }
    return ScrapeLoggerService.instance;
  }

  /**
   * Create a job-specific logger instance
   */
  createJobLogger(jobId: string) {
    // Initialize buffer for this job
    if (!this.logBuffers.has(jobId)) {
      this.logBuffers.set(jobId, []);
    }

    const logger = {
      info: (message: string, context?: Record<string, any>) => {
        this.addLog(jobId, 'info', message, context);
      },
      success: (message: string, context?: Record<string, any>) => {
        this.addLog(jobId, 'success', message, context);
      },
      warn: (message: string, context?: Record<string, any>) => {
        this.addLog(jobId, 'warn', message, context);
      },
      error: (message: string, context?: Record<string, any>) => {
        this.addLog(jobId, 'error', message, context);
      },
      getLogs: () => {
        return this.logBuffers.get(jobId) || [];
      },
      clearLogs: () => {
        this.logBuffers.delete(jobId);
      },
    };

    return logger;
  }

  /**
   * Add a log entry and emit event
   */
  private addLog(
    jobId: string,
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // Add to buffer
    const buffer = this.logBuffers.get(jobId);
    if (buffer) {
      buffer.push(logEntry);

      // Limit buffer size to last 1000 entries
      if (buffer.length > 1000) {
        buffer.shift();
      }
    }

    // Emit event for real-time streaming
    this.emit(`job-${jobId}-log`, logEntry);
  }

  /**
   * Get logs for a specific job
   */
  getJobLogs(jobId: string, fromIndex: number = 0): LogEntry[] {
    const logs = this.logBuffers.get(jobId) || [];
    return logs.slice(fromIndex);
  }

  /**
   * Get log count for a job
   */
  getJobLogCount(jobId: string): number {
    return this.logBuffers.get(jobId)?.length || 0;
  }

  /**
   * Clear logs for a job (call after persisting to database)
   */
  clearJobLogs(jobId: string) {
    this.logBuffers.delete(jobId);
  }

  /**
   * Attach listener for job logs
   */
  attachLogListener(jobId: string, callback: (log: LogEntry) => void) {
    this.on(`job-${jobId}-log`, callback);
  }

  /**
   * Detach listener for job logs
   */
  detachLogListener(jobId: string, callback: (log: LogEntry) => void) {
    this.off(`job-${jobId}-log`, callback);
  }
}

// Export singleton instance
export const scrapeLoggerService = ScrapeLoggerService.getInstance();

// Export helper function
export function createJobLogger(jobId: string) {
  return scrapeLoggerService.createJobLogger(jobId);
}

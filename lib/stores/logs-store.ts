/**
 * Logs Store
 * Zustand store for managing job logs by jobId
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LogEntry } from '@/lib/services/scrape-logger';

const MAX_LOGS_PER_JOB = 1000;

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface JobSummary {
  status: string;
  totalTribunals: number;
  completedTribunals: number;
  failedTribunals: number;
  totalProcesses: number;
  duration?: number; // in seconds
  startedAt?: Date;
  completedAt?: Date;
}

interface LogsState {
  // State
  logsByJob: Record<string, LogEntry[]>;
  connectionStatus: Record<string, ConnectionStatus>;
  statsByJob: Record<string, JobSummary>;

  // Actions
  addLog: (jobId: string, log: LogEntry) => void;
  addLogs: (jobId: string, logs: LogEntry[]) => void;
  setLogs: (jobId: string, logs: LogEntry[]) => void;
  clearLogs: (jobId: string) => void;
  setConnectionStatus: (jobId: string, status: ConnectionStatus) => void;
  setStats: (jobId: string, stats: JobSummary) => void;
  reset: (jobId?: string) => void;

  // Computed/Selectors
  getLogsForJob: (jobId: string) => LogEntry[];
  getConnectionStatus: (jobId: string) => ConnectionStatus;
  getStats: (jobId: string) => JobSummary | undefined;
  getLogCount: (jobId: string) => number;
}

export const useLogsStore = create<LogsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      logsByJob: {},
      connectionStatus: {},
      statsByJob: {},

      // Actions
      addLog: (jobId, log) => {
        set((state) => {
          if (!state.logsByJob[jobId]) {
            state.logsByJob[jobId] = [];
          }

          const logs = state.logsByJob[jobId];
          logs.push(log);

          // Limit to MAX_LOGS_PER_JOB entries
          if (logs.length > MAX_LOGS_PER_JOB) {
            logs.shift();
          }
        });
      },

      addLogs: (jobId, newLogs) => {
        set((state) => {
          if (!state.logsByJob[jobId]) {
            state.logsByJob[jobId] = [];
          }

          const logs = state.logsByJob[jobId];
          logs.push(...newLogs);

          // Limit to MAX_LOGS_PER_JOB entries
          if (logs.length > MAX_LOGS_PER_JOB) {
            logs.splice(0, logs.length - MAX_LOGS_PER_JOB);
          }
        });
      },

      setLogs: (jobId, logs) => {
        set((state) => {
          state.logsByJob[jobId] = logs;
        });
      },

      clearLogs: (jobId) => {
        set((state) => {
          delete state.logsByJob[jobId];
          delete state.connectionStatus[jobId];
          delete state.statsByJob[jobId];
        });
      },

      setConnectionStatus: (jobId, status) => {
        set((state) => {
          state.connectionStatus[jobId] = status;
        });
      },

      setStats: (jobId, stats) => {
        set((state) => {
          state.statsByJob[jobId] = stats;
        });
      },

      reset: (jobId) => {
        if (jobId) {
          set((state) => {
            delete state.logsByJob[jobId];
            delete state.connectionStatus[jobId];
            delete state.statsByJob[jobId];
          });
        } else {
          set((state) => {
            state.logsByJob = {};
            state.connectionStatus = {};
            state.statsByJob = {};
          });
        }
      },

      // Computed/Selectors
      getLogsForJob: (jobId) => {
        return get().logsByJob[jobId] || [];
      },

      getConnectionStatus: (jobId) => {
        return get().connectionStatus[jobId] || 'disconnected';
      },

      getStats: (jobId) => {
        return get().statsByJob[jobId];
      },

      getLogCount: (jobId) => {
        return get().logsByJob[jobId]?.length || 0;
      },
    })),
    { name: 'LogsStore' }
  )
);

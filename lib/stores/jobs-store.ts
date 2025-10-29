/**
 * Jobs Store
 * Zustand store for managing scrape jobs state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';
import { getActiveJobsStatusAction, cancelScrapeJobAction } from '@/app/actions/pje';

interface JobsState {
  // State
  activeJobs: ScrapeJobWithRelations[];
  isPolling: boolean;
  lastFetch: number;
  error: string | null;

  // Actions
  setActiveJobs: (jobs: ScrapeJobWithRelations[]) => void;
  addJob: (job: ScrapeJobWithRelations) => void;
  removeJob: (jobId: string) => void;
  updateJobStatus: (jobId: string, status: string) => void;
  fetchActiveJobs: (jobIds?: string[]) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  setPolling: (isPolling: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed/Selectors
  getJobById: (jobId: string) => ScrapeJobWithRelations | undefined;
  getRunningJobs: () => ScrapeJobWithRelations[];
  getPendingJobs: () => ScrapeJobWithRelations[];
}

export const useJobsStore = create<JobsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      activeJobs: [],
      isPolling: false,
      lastFetch: 0,
      error: null,

      // Actions
      setActiveJobs: (jobs) => {
        set((state) => {
          state.activeJobs = jobs;
          state.lastFetch = Date.now();
        });
      },

      addJob: (job) => {
        set((state) => {
          // Avoid duplicates
          const exists = state.activeJobs.some((j) => j.id === job.id);
          if (!exists) {
            state.activeJobs.push(job);
          }
        });
      },

      removeJob: (jobId) => {
        set((state) => {
          state.activeJobs = state.activeJobs.filter((j) => j.id !== jobId);
        });
      },

      updateJobStatus: (jobId, status) => {
        set((state) => {
          const job = state.activeJobs.find((j) => j.id === jobId);
          if (job) {
            job.status = status;
          }
        });
      },

      fetchActiveJobs: async (jobIds) => {
        set((state) => {
          state.isPolling = true;
          state.error = null;
        });

        try {
          const result = await getActiveJobsStatusAction(jobIds || []);

          if (result.success && result.data) {
            set((state) => {
              state.activeJobs = result.data!;
              state.lastFetch = Date.now();
              state.isPolling = false;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Failed to fetch jobs';
              state.isPolling = false;
            });
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error';
            state.isPolling = false;
          });
        }
      },

      cancelJob: async (jobId) => {
        const previousJobs = get().activeJobs;

        // Optimistic update: update UI immediately
        set((state) => {
          const job = state.activeJobs.find((j) => j.id === jobId);
          if (job) {
            job.status = 'canceled';
          }
        });

        try {
          const result = await cancelScrapeJobAction(jobId);

          if (!result.success) {
            // Revert on failure
            set((state) => {
              state.activeJobs = previousJobs;
              state.error = result.error || 'Failed to cancel job';
            });
          } else {
            // Remove job from list after confirmation
            set((state) => {
              state.activeJobs = state.activeJobs.filter((j) => j.id !== jobId);
            });
          }
        } catch (error) {
          // Revert on error
          set((state) => {
            state.activeJobs = previousJobs;
            state.error = error instanceof Error ? error.message : 'Unknown error';
          });
        }
      },

      setPolling: (isPolling) => {
        set((state) => {
          state.isPolling = isPolling;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      reset: () => {
        set((state) => {
          state.activeJobs = [];
          state.isPolling = false;
          state.lastFetch = 0;
          state.error = null;
        });
      },

      // Computed/Selectors
      getJobById: (jobId) => {
        return get().activeJobs.find((j) => j.id === jobId);
      },

      getRunningJobs: () => {
        return get().activeJobs.filter((j) => j.status === 'running');
      },

      getPendingJobs: () => {
        return get().activeJobs.filter((j) => j.status === 'pending');
      },
    })),
    { name: 'JobsStore' }
  )
);

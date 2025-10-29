/**
 * useJobPolling Hook
 * Custom hook for managing polling of active scrape jobs
 */

import { useEffect, useRef } from 'react';
import { useJobsStore } from '@/lib/stores';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';

interface UseJobPollingOptions {
  /** Specific job IDs to monitor (optional) */
  jobIds?: string[];
  /** Enable/disable polling (default: true) */
  enabled?: boolean;
  /** Polling interval in milliseconds (default: 3000) */
  interval?: number;
}

interface UseJobPollingReturn {
  jobs: ScrapeJobWithRelations[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useJobPolling(options: UseJobPollingOptions = {}): UseJobPollingReturn {
  const { jobIds, enabled = true, interval = 3000 } = options;

  const jobsStore = useJobsStore();

  // Use refs to avoid stale closures and unnecessary re-renders
  const jobIdsRef = useRef(jobIds);
  const enabledRef = useRef(enabled);
  const intervalRef = useRef(interval);

  // Update refs when props change
  useEffect(() => {
    jobIdsRef.current = jobIds;
  }, [jobIds]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    intervalRef.current = interval;
  }, [interval]);

  // Polling effect
  useEffect(() => {
    if (!enabledRef.current) return;

    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      // Get job IDs to monitor
      const ids = jobIdsRef.current || jobsStore.activeJobs.map((j) => j.id);

      // Skip if no jobs to monitor
      if (ids.length === 0 && !jobIdsRef.current) {
        return;
      }

      // Fetch jobs from server
      await jobsStore.fetchActiveJobs(ids);

      // Stop polling if no active jobs remain
      const hasActiveJobs = jobsStore.activeJobs.some(
        (j) => j.status === 'pending' || j.status === 'running'
      );

      // Only stop if monitoring specific IDs and they're all done
      if (!hasActiveJobs && jobIdsRef.current && intervalId) {
        clearInterval(intervalId);
      }
    };

    // Initial fetch
    poll();

    // Setup interval
    intervalId = setInterval(poll, intervalRef.current);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - use refs to avoid re-renders

  return {
    jobs: jobsStore.activeJobs,
    isLoading: jobsStore.isPolling,
    error: jobsStore.error,
    refresh: () => jobsStore.fetchActiveJobs(jobIds),
  };
}

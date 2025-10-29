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

  // Backoff control refs
  const currentIntervalRef = useRef(interval);
  const unchangedPollsRef = useRef(0);
  const lastJobsHashRef = useRef<string>('');

  // Update refs when props change
  useEffect(() => {
    jobIdsRef.current = jobIds;
  }, [jobIds]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    intervalRef.current = interval;
    currentIntervalRef.current = interval; // Reset current interval when prop changes
  }, [interval]);

  // Hash function for detecting job changes
  const getJobsHash = (jobs: ScrapeJobWithRelations[]): string => {
    return jobs.map(j => `${j.id}:${j.status}`).sort().join(',');
  };

  // Polling effect
  useEffect(() => {
    if (!enabledRef.current) return;

    let intervalId: NodeJS.Timeout;
    let emptyJobsCount = 0;

    const poll = async () => {
      // Get job IDs to monitor
      // Priority: explicit jobIds prop > watchedJobIds > all active jobs
      const ids = jobIdsRef.current || jobsStore.watchedJobIds.length > 0
        ? jobsStore.watchedJobIds
        : jobsStore.activeJobs.map((j) => j.id);

      // Skip if no jobs to monitor
      if (ids.length === 0 && !jobIdsRef.current) {
        emptyJobsCount++;
        // Stop polling after 3 consecutive empty polls
        if (emptyJobsCount >= 3 && intervalId) {
          clearInterval(intervalId);
        }
        return;
      }

      // Reset counter if we have jobs
      emptyJobsCount = 0;

      // Fetch jobs from server
      await jobsStore.fetchActiveJobs(ids);

      // Calculate hash of current jobs to detect changes
      const currentHash = getJobsHash(jobsStore.activeJobs);

      // Detect change
      if (currentHash !== lastJobsHashRef.current) {
        // Change detected - reset to fast interval
        unchangedPollsRef.current = 0;

        // Only recreate interval if we've backed off
        if (currentIntervalRef.current !== intervalRef.current) {
          currentIntervalRef.current = intervalRef.current;

          if (intervalId) {
            clearInterval(intervalId);
            intervalId = setInterval(poll, currentIntervalRef.current);
          }
        }
      } else {
        // No change - apply backoff
        unchangedPollsRef.current++;

        if (unchangedPollsRef.current >= 2) {
          const newInterval = Math.min(
            Math.floor(currentIntervalRef.current * 1.67),
            10000
          );

          // Only recreate interval if it actually changed
          if (newInterval !== currentIntervalRef.current) {
            currentIntervalRef.current = newInterval;

            if (intervalId) {
              clearInterval(intervalId);
              intervalId = setInterval(poll, currentIntervalRef.current);
            }

            console.log(`[useJobPolling] No changes detected, backing off to ${currentIntervalRef.current}ms`);
          }
        }
      }

      lastJobsHashRef.current = currentHash;

      // Stop polling if no active jobs remain
      const hasActiveJobs = jobsStore.activeJobs.some(
        (j) => j.status === 'pending' || j.status === 'running'
      );

      // Stop if monitoring specific IDs and they're all done
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

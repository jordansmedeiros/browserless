/**
 * Dashboard Store
 * Zustand store para gerenciar estado do dashboard
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  DashboardStats,
  DashboardChartsData,
  RecentActivity,
} from '@/lib/types/dashboard';
import {
  getDashboardStatsAction,
  getDashboardChartsDataAction,
  getRecentActivityAction,
  getDashboardDataAction,
} from '@/app/actions/dashboard';

interface DashboardState {
  // State
  stats: DashboardStats | null;
  chartsData: DashboardChartsData | null;
  recentActivity: RecentActivity | null;
  isPolling: boolean;
  lastFetch: number;
  error: string | null;
  loading: boolean;

  // Actions
  setStats: (stats: DashboardStats) => void;
  setChartsData: (data: DashboardChartsData) => void;
  setRecentActivity: (activity: RecentActivity) => void;
  fetchDashboardData: () => Promise<void>;
  togglePolling: (enabled: boolean) => void;
  refresh: () => Promise<void>;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      stats: null,
      chartsData: null,
      recentActivity: null,
      isPolling: false,
      lastFetch: 0,
      error: null,
      loading: false,

      // Actions
      setStats: (stats) => {
        set((state) => {
          state.stats = stats;
        });
      },

      setChartsData: (data) => {
        set((state) => {
          state.chartsData = data;
        });
      },

      setRecentActivity: (activity) => {
        set((state) => {
          state.recentActivity = activity;
        });
      },

      fetchDashboardData: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const result = await getDashboardDataAction();

          if (result.success && result.data) {
            set((state) => {
              state.stats = result.data!.stats;
              state.chartsData = result.data!.chartsData;
              state.recentActivity = result.data!.recentActivity;
              state.lastFetch = Date.now();
              state.loading = false;
              state.error = null;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Erro ao buscar dados do dashboard';
              state.loading = false;
            });
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Erro desconhecido';
            state.loading = false;
          });
        }
      },

      togglePolling: (enabled) => {
        set((state) => {
          state.isPolling = enabled;
        });
      },

      refresh: async () => {
        await get().fetchDashboardData();
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      reset: () => {
        set((state) => {
          state.stats = null;
          state.chartsData = null;
          state.recentActivity = null;
          state.isPolling = false;
          state.lastFetch = 0;
          state.error = null;
          state.loading = false;
        });
      },
    })),
    { name: 'DashboardStore' }
  )
);


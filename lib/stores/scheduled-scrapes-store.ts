/**
 * Scheduled Scrapes Store
 * Zustand store for managing scheduled scrapes state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ScheduledScrapeWithRelations } from '@/lib/types/scraping';
import { listScheduledScrapesAction, toggleScheduledScrapeAction, deleteScheduledScrapeAction } from '@/app/actions/pje';
import { toast } from 'sonner';

interface ScheduledScrapesState {
  // State
  schedules: ScheduledScrapeWithRelations[];
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'active' | 'inactive';
  page: number;
  totalPages: number;

  // Actions
  setSchedules: (schedules: ScheduledScrapeWithRelations[]) => void;
  addSchedule: (schedule: ScheduledScrapeWithRelations) => void;
  updateSchedule: (scheduleId: string, updates: Partial<ScheduledScrapeWithRelations>) => void;
  removeSchedule: (scheduleId: string) => void;
  fetchSchedules: (filter?: 'all' | 'active' | 'inactive', page?: number) => Promise<void>;
  toggleSchedule: (scheduleId: string) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  setFilter: (filter: 'all' | 'active' | 'inactive') => void;
  setPage: (page: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed/Selectors
  getScheduleById: (scheduleId: string) => ScheduledScrapeWithRelations | undefined;
  getActiveSchedules: () => ScheduledScrapeWithRelations[];
}

export const useScheduledScrapesStore = create<ScheduledScrapesState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      schedules: [],
      isLoading: false,
      error: null,
      filter: 'all',
      page: 1,
      totalPages: 1,

      // Actions
      setSchedules: (schedules) => {
        set((state) => {
          state.schedules = schedules;
        });
      },

      addSchedule: (schedule) => {
        set((state) => {
          // Avoid duplicates
          const exists = state.schedules.some((s) => s.id === schedule.id);
          if (!exists) {
            state.schedules.push(schedule);
          }
        });
      },

      updateSchedule: (scheduleId, updates) => {
        set((state) => {
          const schedule = state.schedules.find((s) => s.id === scheduleId);
          if (schedule) {
            Object.assign(schedule, updates);
          }
        });
      },

      removeSchedule: (scheduleId) => {
        set((state) => {
          state.schedules = state.schedules.filter((s) => s.id !== scheduleId);
        });
      },

      fetchSchedules: async (filter, page) => {
        const currentFilter = filter ?? get().filter;
        const currentPage = page ?? get().page;

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const result = await listScheduledScrapesAction({
            active: currentFilter === 'all' ? undefined : currentFilter === 'active',
            page: currentPage,
            pageSize: 20,
          });

          if (result.success && result.data) {
            set((state) => {
              state.schedules = result.data!.schedules;
              state.totalPages = result.data!.totalPages;
              state.page = currentPage;
              state.filter = currentFilter;
              state.isLoading = false;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Erro ao carregar agendamentos';
              state.isLoading = false;
            });
            toast.error(result.error || 'Erro ao carregar agendamentos');
          }
        } catch (error) {
          console.error('[ScheduledScrapesStore] Error fetching schedules:', error);
          set((state) => {
            state.error = 'Erro inesperado ao carregar agendamentos';
            state.isLoading = false;
          });
          toast.error('Erro inesperado ao carregar agendamentos');
        }
      },

      toggleSchedule: async (scheduleId) => {
        const schedule = get().schedules.find((s) => s.id === scheduleId);
        if (!schedule) return;

        const newActive = !schedule.active;

        // Optimistic update
        set((state) => {
          const s = state.schedules.find((s) => s.id === scheduleId);
          if (s) {
            s.active = newActive;
          }
        });

        try {
          const result = await toggleScheduledScrapeAction(scheduleId, newActive);

          if (result.success) {
            toast.success(newActive ? 'Agendamento ativado' : 'Agendamento pausado');
          } else {
            // Revert on error
            set((state) => {
              const s = state.schedules.find((s) => s.id === scheduleId);
              if (s) {
                s.active = !newActive;
              }
            });
            toast.error(result.error || 'Erro ao alterar status');
          }
        } catch (error) {
          console.error('[ScheduledScrapesStore] Error toggling schedule:', error);
          // Revert on error
          set((state) => {
            const s = state.schedules.find((s) => s.id === scheduleId);
            if (s) {
              s.active = !newActive;
            }
          });
          toast.error('Erro inesperado ao alterar status');
        }
      },

      deleteSchedule: async (scheduleId) => {
        // Optimistic update - remove from list
        const originalSchedules = get().schedules;
        set((state) => {
          state.schedules = state.schedules.filter((s) => s.id !== scheduleId);
        });

        try {
          const result = await deleteScheduledScrapeAction(scheduleId);

          if (result.success) {
            toast.success('Agendamento deletado');
          } else {
            // Revert on error
            set((state) => {
              state.schedules = originalSchedules;
            });
            toast.error(result.error || 'Erro ao deletar agendamento');
          }
        } catch (error) {
          console.error('[ScheduledScrapesStore] Error deleting schedule:', error);
          // Revert on error
          set((state) => {
            state.schedules = originalSchedules;
          });
          toast.error('Erro inesperado ao deletar agendamento');
        }
      },

      setFilter: (filter) => {
        set((state) => {
          state.filter = filter;
          state.page = 1; // Reset to first page when filter changes
        });
        get().fetchSchedules(filter, 1);
      },

      setPage: (page) => {
        set((state) => {
          state.page = page;
        });
        get().fetchSchedules(undefined, page);
      },

      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      reset: () => {
        set((state) => {
          state.schedules = [];
          state.isLoading = false;
          state.error = null;
          state.filter = 'all';
          state.page = 1;
          state.totalPages = 1;
        });
      },

      // Computed/Selectors
      getScheduleById: (scheduleId) => {
        return get().schedules.find((s) => s.id === scheduleId);
      },

      getActiveSchedules: () => {
        return get().schedules.filter((s) => s.active);
      },
    }))
  )
);

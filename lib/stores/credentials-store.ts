/**
 * Credentials Store
 * Zustand store for managing credentials state with caching
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CredencialWithRelations, AdvogadoWithCredenciais } from '@/lib/types/credentials';
import { listAdvogadosAction } from '@/app/actions/pje';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CredentialsState {
  // State
  credentials: CredencialWithRelations[];
  isLoading: boolean;
  lastFetch: number;
  error: string | null;

  // Actions
  setCredentials: (credentials: CredencialWithRelations[]) => void;
  fetchCredentials: () => Promise<void>;
  invalidate: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed/Selectors
  getActiveCredentials: () => CredencialWithRelations[];
  getCredentialById: (id: string) => CredencialWithRelations | undefined;
  getCredentialsByAdvogado: (advogadoId: string) => CredencialWithRelations[];
}

export const useCredentialsStore = create<CredentialsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      credentials: [],
      isLoading: false,
      lastFetch: 0,
      error: null,

      // Actions
      setCredentials: (credentials) => {
        set((state) => {
          state.credentials = credentials;
          state.lastFetch = Date.now();
        });
      },

      fetchCredentials: async () => {
        const now = Date.now();
        const { lastFetch, credentials } = get();

        // Cache hit - return early if cache is still valid
        if (credentials.length > 0 && now - lastFetch < CACHE_TTL) {
          return;
        }

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const result = await listAdvogadosAction();

          if (result.success && result.data) {
            // Extract all active credentials from all advogados
            const allCredentials: CredencialWithRelations[] = [];

            result.data.forEach((advogado: AdvogadoWithCredenciais) => {
              advogado.credenciais.forEach((credencial) => {
                if (credencial.ativa) {
                  // Extract advogado data without circular reference
                  const { credenciais, ...advogadoData } = advogado;

                  allCredentials.push({
                    ...credencial,
                    advogado: advogadoData,
                  });
                }
              });
            });

            set((state) => {
              state.credentials = allCredentials;
              state.lastFetch = now;
              state.isLoading = false;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Erro ao carregar credenciais';
              state.isLoading = false;
            });
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Erro desconhecido';
            state.isLoading = false;
          });
        }
      },

      invalidate: () => {
        set((state) => {
          state.lastFetch = 0; // Force refetch on next access
        });
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
          state.credentials = [];
          state.isLoading = false;
          state.lastFetch = 0;
          state.error = null;
        });
      },

      // Computed/Selectors
      getActiveCredentials: () => {
        return get().credentials.filter((c) => c.ativa);
      },

      getCredentialById: (id) => {
        return get().credentials.find((c) => c.id === id);
      },

      getCredentialsByAdvogado: (advogadoId) => {
        return get().credentials.filter((c) => c.advogadoId === advogadoId);
      },
    })),
    { name: 'CredentialsStore' }
  )
);

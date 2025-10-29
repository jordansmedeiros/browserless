/**
 * useCredentials Hook
 * Custom hook for loading and caching credentials
 */

import { useEffect } from 'react';
import { useCredentialsStore } from '@/lib/stores';
import type { CredencialWithRelations } from '@/lib/types/credentials';

interface UseCredentialsReturn {
  credentials: CredencialWithRelations[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCredentials(): UseCredentialsReturn {
  const store = useCredentialsStore();

  // Auto-fetch on mount if cache is expired
  useEffect(() => {
    store.fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    credentials: store.getActiveCredentials(),
    isLoading: store.isLoading,
    error: store.error,
    refresh: store.fetchCredentials,
  };
}

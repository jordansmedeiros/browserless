/**
 * useTribunalCache Hook
 * Custom hook that listens to tribunal cache invalidations and refetches automatically
 */

import { useEffect, useState } from 'react';
import { onCacheInvalidation } from '@/lib/services/tribunal';
import type { TribunalInfo } from '@/lib/types/tribunal';

interface UseTribunalCacheReturn {
  tribunals: TribunalInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTribunalCache(): UseTribunalCacheReturn {
  const [tribunals, setTribunals] = useState<TribunalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTribunals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Importar dinamicamente para evitar circular dependency
      const { listAllTRTs } = await import('@/lib/services/tribunal');
      const data = await listAllTRTs();
      setTribunals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tribunais');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch inicial
  useEffect(() => {
    fetchTribunals();
  }, []);

  // Escutar invalidações de cache
  useEffect(() => {
    const unsubscribe = onCacheInvalidation(() => {
      console.log('[useTribunalCache] Cache invalidated, refetching...');
      fetchTribunals();
    });

    return unsubscribe;
  }, []);

  return {
    tribunals,
    isLoading,
    error,
    refresh: fetchTribunals,
  };
}

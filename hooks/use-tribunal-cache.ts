'use client';

/**
 * useTribunalCache Hook
 * Custom hook for fetching and managing tribunal data
 *
 * Note: This hook does not implement real-time cache invalidation.
 * For real-time updates, implement a proper event channel (SSE/WebSocket)
 * through a separate client-safe module.
 */

import { useEffect, useState } from 'react';
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
      // Fetch via API endpoint to respect client/server boundary
      const response = await fetch('/api/tribunals');
      if (!response.ok) {
        throw new Error('Erro ao buscar tribunais');
      }
      const data = await response.json();
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

  return {
    tribunals,
    isLoading,
    error,
    refresh: fetchTribunals,
  };
}

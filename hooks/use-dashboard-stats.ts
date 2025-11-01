'use client';

/**
 * useDashboardStats Hook
 * Custom hook para gerenciar estado e polling de dados do dashboard
 */

import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/lib/stores';

interface UseDashboardStatsOptions {
  /** Intervalo de polling em ms (default: 10000) */
  refreshInterval?: number;
  /** Habilitar polling automático (default: true) */
  enabled?: boolean;
}

/**
 * Hook para buscar e gerenciar dados do dashboard
 */
export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
  const {
    refreshInterval = 10000,
    enabled = true,
  } = options;

  const {
    stats,
    chartsData,
    recentActivity,
    loading,
    error,
    lastFetch,
    isPolling,
    fetchDashboardData,
    togglePolling,
    refresh,
  } = useDashboardStore();

  // Função para buscar dados
  const fetchData = useCallback(async () => {
    try {
      await fetchDashboardData();
    } catch (err) {
      console.error('[useDashboardStats] Erro ao buscar dados:', err);
    }
  }, [fetchDashboardData]);

  // Polling effect
  useEffect(() => {
    if (!enabled) {
      togglePolling(false);
      return;
    }

    // Buscar dados iniciais
    fetchData();

    // Configurar polling
    togglePolling(true);
    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => {
      clearInterval(interval);
      togglePolling(false);
    };
  }, [enabled, refreshInterval, fetchData, togglePolling]);

  return {
    stats,
    chartsData,
    recentActivity,
    loading,
    error,
    lastFetch,
    isPolling,
    refresh,
  };
}


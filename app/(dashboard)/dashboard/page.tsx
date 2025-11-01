'use client';

/**
 * Dashboard Page
 * Página principal do dashboard conectada ao banco de dados
 */

import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { StatsCards } from '@/components/dashboard/stats-cards';
import {
  ProcessosPorTribunalChart,
  ProcessosPorTipoChart,
  RaspagensPorStatusChart,
  TendenciaProcessosChart,
  PerformanceTribunaisChart,
} from '@/components/dashboard/charts';
import { RecentActivityComponent } from '@/components/dashboard/recent-activity';
import { RealtimeIndicator } from '@/components/dashboard/realtime-indicator';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { DashboardError } from '@/components/dashboard/dashboard-error';

export default function DashboardPage() {
  const {
    stats,
    chartsData,
    recentActivity,
    loading,
    error,
    lastFetch,
    isPolling,
    refresh,
  } = useDashboardStats({
    refreshInterval: 10000, // 10 segundos
    enabled: true,
  });

  // Estados de loading e erro
  if (loading && !stats && !chartsData) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        <RealtimeIndicator
          isPolling={isPolling}
          lastUpdate={lastFetch}
          onRefresh={refresh}
          refreshing={loading && !!stats}
        />
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProcessosPorTribunalChart data={chartsData?.processosPorTribunal} loading={loading} />
        <ProcessosPorTipoChart data={chartsData?.processosPorTipo} loading={loading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RaspagensPorStatusChart data={chartsData?.raspagensPorStatus} loading={loading} />
        <TendenciaProcessosChart data={chartsData?.tendenciaProcessos} loading={loading} />
      </div>

      {/* Performance Chart */}
      {chartsData?.performanceTribunais &&
        chartsData.performanceTribunais.length > 0 && (
          <PerformanceTribunaisChart
            data={chartsData.performanceTribunais}
            loading={loading}
          />
        )}

      {/* Recent Activity */}
      <RecentActivityComponent data={recentActivity} loading={loading} />
    </div>
  );
}

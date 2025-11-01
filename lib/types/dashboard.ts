/**
 * Dashboard Types
 * Tipos para o dashboard e suas métricas
 */

import type {
  ScrapeJobWithRelations,
  ProcessoUnificado,
  ScrapeType,
} from './scraping';
import type { Tribunal, TribunalConfig } from '@prisma/client';

/**
 * Estatísticas gerais do dashboard
 */
export interface DashboardStats {
  totalProcessos: number;
  totalRaspagens: number;
  totalCredenciais: number;
  totalTribunais: number;
  jobsAtivos: {
    pending: number;
    running: number;
  };
  ultimaAtividade: {
    tipo: 'scrape' | 'processo' | 'credencial';
    timestamp: Date;
    descricao: string;
  } | null;
}

/**
 * Ponto de dados para gráficos
 */
export interface ChartDataPoint {
  nome: string;
  valor: number;
  [key: string]: any;
}

/**
 * Dados para gráficos do dashboard
 */
export interface DashboardChartsData {
  processosPorTribunal: ChartDataPoint[];
  processosPorTipo: ChartDataPoint[];
  raspagensPorStatus: ChartDataPoint[];
  tendenciaProcessos: {
    data: string; // YYYY-MM-DD
    total: number;
    novos: number;
  }[];
  performanceTribunais: {
    tribunal: string;
    tempoMedio: number; // em segundos
    sucessos: number;
    falhas: number;
  }[];
}

/**
 * Resumo de execução de raspagem
 */
export interface ScrapeExecutionSummary {
  id: string;
  scrapeType: ScrapeType;
  status: string;
  processosCount: number;
  createdAt: Date;
  completedAt: Date | null;
  tribunal: {
    codigo: string;
    nome: string;
  };
}

/**
 * Atividades recentes
 */
export interface RecentActivity {
  jobs: ScrapeJobWithRelations[];
  execucoes: ScrapeExecutionSummary[];
  processosRecentes: ProcessoUnificado[];
}

/**
 * Resposta consolidada de dados do dashboard
 */
export interface DashboardData {
  stats: DashboardStats;
  chartsData: DashboardChartsData;
  recentActivity: RecentActivity;
}

/**
 * Opções para filtros de tempo nos gráficos
 */
export type TimeRangeFilter = '7d' | '30d' | '90d' | 'all';

/**
 * Tipo de gráfico para exibição
 */
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area';

/**
 * Configuração de exibição de gráfico
 */
export interface ChartConfig {
  type: ChartType;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  height?: number;
  colors?: string[];
}

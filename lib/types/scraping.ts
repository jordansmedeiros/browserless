/**
 * Scraping Types
 * Tipos para o sistema de raspagem de processos do PJE
 */

import type { ProcessoPJE } from './pje';
import type { TribunalConfig, ScrapeJob, ScrapeJobTribunal, ScrapeExecution, Tribunal } from '@prisma/client';

// Re-export Prisma types (TribunalConfig already exported from ./tribunal)
export type { ScrapeExecution, ScrapeJob, ScrapeJobTribunal, Tribunal } from '@prisma/client';

/**
 * TribunalConfig with Tribunal relation
 */
export type TribunalConfigWithTribunal = TribunalConfig & {
  tribunal: Tribunal;
};

/**
 * Status de um job de raspagem
 * Fluxo: pending -> running -> (completed | failed)
 * Jobs em 'pending' são descobertos via polling do orchestrator
 */
export enum ScrapeJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

/**
 * Tipo de raspagem
 */
export enum ScrapeType {
  ACERVO_GERAL = 'acervo_geral',
  PENDENTES = 'pendentes',
  ARQUIVADOS = 'arquivados',
  MINHA_PAUTA = 'minha_pauta',
}

/**
 * Sub-tipo de raspagem (para "Pendentes de Manifestação")
 */
export enum ScrapeSubType {
  COM_DADO_CIENCIA = 'com_dado_ciencia',
  SEM_PRAZO = 'sem_prazo',
}

/**
 * ScrapeJob com relações incluídas
 */
export interface ScrapeJobWithRelations extends ScrapeJob {
  tribunals: (ScrapeJobTribunal & {
    tribunalConfig: TribunalConfigWithTribunal;
  })[];
  executions: (ScrapeExecution & {
    tribunalConfig?: TribunalConfigWithTribunal;
  })[];
}

/**
 * Entrada para criação de um job de raspagem
 */
export interface CreateScrapeJobInput {
  credencialId: string;
  tribunalConfigIds: string[];
  scrapeType: ScrapeType;
  scrapeSubType?: ScrapeSubType;
}

/**
 * Resultado da execução de um script de raspagem
 */
export interface ScrapingResult {
  success: boolean;
  processosCount: number;
  processos: ProcessoPJE[];
  timestamp: string;
  advogado?: {
    idAdvogado: string;
    cpf: string;
    nome: string;
  };
  error?: {
    type: string;
    category: string;
    message: string;
    technicalMessage?: string;
    retryable: boolean;
    timestamp: string;
    details?: Record<string, any>;
  };
}

/**
 * Progresso de um job de raspagem
 */
export interface ScrapeJobProgress {
  jobId: string;
  status: ScrapeJobStatus;
  totalTribunals: number;
  completedTribunals: number;
  failedTribunals: number;
  currentTribunal?: {
    codigo: string;
    nome: string;
    status: ScrapeJobStatus;
  };
  progressPercentage: number;
}

/**
 * Filtros para listagem de jobs
 */
export interface ListScrapeJobsFilters {
  status?: ScrapeJobStatus[];
  scrapeType?: ScrapeType[];
  startDate?: Date;
  endDate?: Date;
  tribunalSearch?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Resultado paginado de jobs
 */
export interface PaginatedScrapeJobs {
  jobs: ScrapeJobWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Detalhes de uma execução com dados descomprimidos
 */
export interface ScrapeExecutionDetails extends ScrapeExecution {
  tribunalConfig: TribunalConfig;
  resultDataDecoded?: {
    processos: ProcessoPJE[];
  };
}

/**
 * Mapeamento de tipo de raspagem para nome do script
 */
export const SCRAPE_TYPE_TO_SCRIPT: Record<ScrapeType, string> = {
  [ScrapeType.ACERVO_GERAL]: 'raspar-acervo-geral.js',
  [ScrapeType.PENDENTES]: 'raspar-pendentes.js', // Will be determined by subtype
  [ScrapeType.ARQUIVADOS]: 'raspar-arquivados.js',
  [ScrapeType.MINHA_PAUTA]: 'raspar-minha-pauta.js',
};

/**
 * Mapeamento de sub-tipo para nome do script
 */
export const SCRAPE_SUBTYPE_TO_SCRIPT: Record<ScrapeSubType, string> = {
  [ScrapeSubType.COM_DADO_CIENCIA]: 'raspar-pendentes-dada-ciencia.js',
  [ScrapeSubType.SEM_PRAZO]: 'raspar-pendentes-sem-prazo.js',
};

/**
 * Nomes amigáveis para tipos de raspagem
 */
export const SCRAPE_TYPE_LABELS: Record<ScrapeType, string> = {
  [ScrapeType.ACERVO_GERAL]: 'Acervo Geral',
  [ScrapeType.PENDENTES]: 'Pendentes de Manifestação',
  [ScrapeType.ARQUIVADOS]: 'Arquivados',
  [ScrapeType.MINHA_PAUTA]: 'Minha Pauta',
};

/**
 * Nomes amigáveis para sub-tipos de raspagem
 */
export const SCRAPE_SUBTYPE_LABELS: Record<ScrapeSubType, string> = {
  [ScrapeSubType.COM_DADO_CIENCIA]: 'Com Dado Ciência',
  [ScrapeSubType.SEM_PRAZO]: 'Sem Prazo',
};

/**
 * Nomes amigáveis para status de job
 */
export const SCRAPE_STATUS_LABELS: Record<ScrapeJobStatus, string> = {
  [ScrapeJobStatus.PENDING]: 'Pendente',
  [ScrapeJobStatus.RUNNING]: 'Em Execução',
  [ScrapeJobStatus.COMPLETED]: 'Concluído',
  [ScrapeJobStatus.FAILED]: 'Falhou',
  [ScrapeJobStatus.CANCELED]: 'Cancelado',
};

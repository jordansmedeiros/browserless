/**
 * Scraping Types
 * Tipos para o sistema de raspagem de processos do PJE
 */

import type { ProcessoPJE } from './pje';
import type { TribunalConfig, ScrapeJob, ScrapeJobTribunal, ScrapeExecution, Tribunal, ScheduledScrape } from '@prisma/client';

// Re-export Prisma types (TribunalConfig already exported from ./tribunal)
export type { ScrapeExecution, ScrapeJob, ScrapeJobTribunal, Tribunal, ScheduledScrape } from '@prisma/client';

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

/**
 * Família de tribunal
 */
export enum TribunalFamily {
  TRT = 'TRT',
  TJ = 'TJ',
  TRF = 'TRF',
  SUPERIOR = 'SUPERIOR',
}

/**
 * Mapeamento de tipos de raspagem por família de tribunal
 * Usado para exibir nomenclatura específica de cada tribunal
 */
export const SCRAPE_TYPE_LABELS_BY_FAMILY: Record<TribunalFamily, Record<ScrapeType, string>> = {
  [TribunalFamily.TRT]: {
    [ScrapeType.ACERVO_GERAL]: 'Acervo Geral',
    [ScrapeType.PENDENTES]: 'Pendentes de Manifestação',
    [ScrapeType.ARQUIVADOS]: 'Arquivados',
    [ScrapeType.MINHA_PAUTA]: 'Minha Pauta',
  },
  [TribunalFamily.TJ]: {
    [ScrapeType.ACERVO_GERAL]: 'Acervo',
    [ScrapeType.PENDENTES]: 'Expedientes',
    [ScrapeType.ARQUIVADOS]: 'Arquivados',
    [ScrapeType.MINHA_PAUTA]: 'Pauta de Audiência',
  },
  [TribunalFamily.TRF]: {
    [ScrapeType.ACERVO_GERAL]: 'Acervo Geral',
    [ScrapeType.PENDENTES]: 'Pendentes',
    [ScrapeType.ARQUIVADOS]: 'Arquivados',
    [ScrapeType.MINHA_PAUTA]: 'Pauta',
  },
  [TribunalFamily.SUPERIOR]: {
    [ScrapeType.ACERVO_GERAL]: 'Acervo',
    [ScrapeType.PENDENTES]: 'Pendentes',
    [ScrapeType.ARQUIVADOS]: 'Arquivados',
    [ScrapeType.MINHA_PAUTA]: 'Pauta',
  },
};

/**
 * Descrições detalhadas por tipo e família
 */
export const SCRAPE_TYPE_DESCRIPTIONS: Record<TribunalFamily, Record<ScrapeType, string>> = {
  [TribunalFamily.TRT]: {
    [ScrapeType.PENDENTES]: 'Processos com pendências de manifestação e prazos a cumprir',
    [ScrapeType.ACERVO_GERAL]: 'Todos os processos ativos do advogado',
    [ScrapeType.ARQUIVADOS]: 'Processos arquivados e finalizados',
    [ScrapeType.MINHA_PAUTA]: 'Audiências e sessões agendadas',
  },
  [TribunalFamily.TJ]: {
    [ScrapeType.PENDENTES]: 'Expedientes pendentes de análise',
    [ScrapeType.ACERVO_GERAL]: 'Acervo completo de processos',
    [ScrapeType.ARQUIVADOS]: 'Processos arquivados',
    [ScrapeType.MINHA_PAUTA]: 'Pautas de audiência agendadas',
  },
  [TribunalFamily.TRF]: {
    [ScrapeType.PENDENTES]: 'Processos pendentes',
    [ScrapeType.ACERVO_GERAL]: 'Acervo geral',
    [ScrapeType.ARQUIVADOS]: 'Processos arquivados',
    [ScrapeType.MINHA_PAUTA]: 'Pautas agendadas',
  },
  [TribunalFamily.SUPERIOR]: {
    [ScrapeType.PENDENTES]: 'Processos pendentes',
    [ScrapeType.ACERVO_GERAL]: 'Acervo geral',
    [ScrapeType.ARQUIVADOS]: 'Processos arquivados',
    [ScrapeType.MINHA_PAUTA]: 'Pautas agendadas',
  },
};

/**
 * ScheduledScrape com relações incluídas
 */
export interface ScheduledScrapeWithRelations extends ScheduledScrape {
  credencial: {
    id: string;
    advogado: {
      nome: string;
      oabNumero: string;
      oabUf: string;
    };
  };
}

/**
 * Entrada para criação de raspagem programada
 */
export interface CreateScheduledScrapeInput {
  name: string;
  description?: string;
  credencialId: string;
  tribunalConfigIds: string[]; // Formato: ["TRT3-PJE-1g", "TRT15-PJE-2g"]
  scrapeType: ScrapeType;
  scrapeSubType?: ScrapeSubType;
  cronExpression: string;
  timezone?: string;
  active?: boolean;
}

/**
 * Entrada para atualização de raspagem programada
 */
export interface UpdateScheduledScrapeInput {
  name?: string;
  description?: string;
  credencialId?: string;
  tribunalConfigIds?: string[];
  scrapeType?: ScrapeType;
  scrapeSubType?: ScrapeSubType;
  cronExpression?: string;
  timezone?: string;
  active?: boolean;
}

/**
 * Tipo de frequência para UI (convertido para cron)
 */
export enum ScheduleFrequencyType {
  DAILY = 'daily',           // Todo dia em horário específico
  WEEKLY = 'weekly',         // Dias da semana específicos
  INTERVAL = 'interval',     // A cada X horas
  CUSTOM = 'custom',         // Cron expression customizada
}

/**
 * Configuração de frequência para UI
 */
export interface ScheduleFrequencyConfig {
  type: ScheduleFrequencyType;
  // Para DAILY
  dailyTime?: string; // Formato: "09:00"
  // Para WEEKLY
  weekDays?: number[]; // 0-6 (domingo-sábado)
  weeklyTime?: string; // Formato: "09:00"
  // Para INTERVAL
  intervalHours?: number; // 1-24
  // Para CUSTOM
  customCron?: string;
}

/**
 * Resultado paginado de raspagens programadas
 */
export interface PaginatedScheduledScrapes {
  schedules: ScheduledScrapeWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Processo unificado - normalizado agregando campos de todas as tabelas
 */
export interface ProcessoUnificado {
  id: string; // UUID do registro
  idPje: number | null; // ID único no sistema PJE (null para TJMG que não tem idPje)
  numeroProcesso: string; // número CNJ
  tribunalConfigId: string; // UUID do TribunalConfig
  tribunalCodigo: string; // ex: "TRT3", "TJMG"
  tribunalNome: string;
  grau: string; // "1g", "2g", "unico"
  sistema: string; // "PJE", "EPROC", etc
  tipoRaspagem: ScrapeType;
  subtipoRaspagem: string | null;
  classeJudicial: string | null;
  orgaoJulgador: string | null; // descricaoOrgaoJulgador ou siglaOrgaoJulgador
  nomeParteAutora: string | null;
  nomeParteRe: string | null; // ou partes para TJMG
  dataAutuacao: Date | null;
  dataUltimaAtualizacao: Date; // createdAt ou updatedAt
  scrapeJobId: string;
  scrapeExecutionId: string;
  origem: 'PendentesManifestacao' | 'Processos' | 'ProcessosArquivados' | 'MinhaPauta' | 'ProcessosTJMG';
  metadados: Record<string, any> | null; // campos específicos de cada tipo
}

/**
 * Filtros para listagem de processos
 */
export interface ListProcessosFilters {
  tribunalConfigIds?: string[]; // filtrar por tribunais específicos
  scrapeTypes?: ScrapeType[]; // filtrar por tipos de raspagem
  startDate?: Date; // data inicial de criação
  endDate?: Date; // data final de criação
  searchTerm?: string; // busca textual em numeroProcesso, partes, órgão
  sortBy?: 'dataAutuacao' | 'dataUltimaAtualizacao' | 'numeroProcesso'; // campo para ordenação
  sortDirection?: 'asc' | 'desc';
  page?: number; // página atual, default 1
  pageSize?: number; // itens por página, default 50
  tribunalFamily?: TribunalFamily; // filtrar por família de tribunal
}

/**
 * Interface para configuração de colunas por tipo de processo
 */
export interface ColumnConfig {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  formatter?: (value: any, processo: ProcessoUnificado) => string;
}

/**
 * Resultado paginado de processos únicos
 */
export interface PaginatedProcessos {
  processos: ProcessoUnificado[];
  total: number; // total de processos únicos
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    porTribunal: Record<string, number>; // contagem por tribunal
    porTipo: Record<ScrapeType, number>; // contagem por tipo
    ultimaAtualizacao: Date | null; // data da última raspagem
  };
}
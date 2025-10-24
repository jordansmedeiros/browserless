/**
 * PJE Domain Types
 * Tipos compartilhados para dados do PJE (Processo Judicial Eletrônico)
 */

export interface ProcessoPJE {
  numero: string;
  dataAjuizamento: string;
  classe: string;
  assunto: string;
  vara: string;
  fase: string;
  valor?: number;
  partes: Parte[];
}

export interface Parte {
  nome: string;
  tipo: 'autor' | 'reu' | 'advogado' | 'outro';
  documento?: string;
}

export interface Totalizador {
  id: number;
  nome: string;
  quantidade: number;
}

export interface PerfilPJE {
  id: string;
  nome: string;
  oab?: string;
  tribunal: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  perfil?: PerfilPJE;
  error?: string;
}

export interface ScrapeResult {
  success: boolean;
  processos: ProcessoPJE[];
  total: number;
  timestamp: string;
  error?: string;
}

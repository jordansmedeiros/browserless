/**
 * PJE Domain Types
 * Tipos compartilhados para dados do PJE (Processo Judicial Eletrônico)
 */

import type { TRTCode, Grau } from './tribunal';

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
  tribunal: string; // Mantido para backward compatibility
  trt: TRTCode; // Novo campo específico para TRT
  grau: Grau; // Novo campo para grau
}

export interface LoginResult {
  success: boolean;
  message: string;
  perfil?: PerfilPJE;
  error?: {
    type: string;
    category: string;
    message: string;           // Mensagem amigável para o usuário
    technicalMessage?: string; // Mensagem técnica para debug
    retryable: boolean;
    timestamp: string;
    details?: Record<string, any>;
  };
}

export interface ScrapeResult {
  success: boolean;
  processos: ProcessoPJE[];
  total: number;
  timestamp: string;
  error?: {
    type: string;
    category: string;
    message: string;           // Mensagem amigável para o usuário
    technicalMessage?: string; // Mensagem técnica para debug
    retryable: boolean;
    timestamp: string;
    details?: Record<string, any>;
  };
}

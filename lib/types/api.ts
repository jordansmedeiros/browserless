/**
 * API Request/Response Types
 * Tipos para comunicação entre frontend e backend
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  cpf: string;
  senha: string;
}

export interface ScrapeRequest {
  categoria?: number; // 1: Todos, 2: Pendentes, 5: Arquivados
  pagina?: number;
  limite?: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

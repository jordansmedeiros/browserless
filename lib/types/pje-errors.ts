/**
 * PJE Error Classification Types
 * Sistema de classificação de erros para operações no PJE
 */

/**
 * Tipos de erro possíveis durante operações no PJE
 */
export enum PJEErrorType {
  // Erros de Servidor/Infraestrutura
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',           // TRT temporariamente indisponível
  SERVER_ERROR = 'SERVER_ERROR',                       // Erro 500, 503, etc.
  NETWORK_ERROR = 'NETWORK_ERROR',                     // Timeout, DNS, etc.

  // Erros de Autenticação
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',     // Credenciais incorretas
  BLOCKED_BY_CLOUDFRONT = 'BLOCKED_BY_CLOUDFRONT',     // CloudFront WAF bloqueou (403)
  SESSION_EXPIRED = 'SESSION_EXPIRED',                 // Sessão expirou

  // Erros de Estrutura
  PAGE_STRUCTURE_DIFFERENT = 'PAGE_STRUCTURE_DIFFERENT',   // Página de login diferente
  SSO_STRUCTURE_DIFFERENT = 'SSO_STRUCTURE_DIFFERENT',     // Página SSO diferente
  API_STRUCTURE_CHANGED = 'API_STRUCTURE_CHANGED',         // API retornou formato diferente

  // Erros de Permissão
  USER_NOT_AUTHORIZED = 'USER_NOT_AUTHORIZED',         // Usuário não tem acesso a este TRT
  MISSING_PERMISSIONS = 'MISSING_PERMISSIONS',         // Sem permissão para esta operação

  // Erros de Scraping
  SCRAPE_ERROR = 'SCRAPE_ERROR',                       // Erro durante raspagem
  NO_DATA_FOUND = 'NO_DATA_FOUND',                     // Nenhum dado encontrado

  // Outros
  UNEXPECTED_REDIRECT = 'UNEXPECTED_REDIRECT',         // Redirecionado para URL inesperada
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',                     // Erro desconhecido
}

/**
 * Categoria de erro para agrupamento
 */
export enum PJEErrorCategory {
  TEMPORARY = 'TEMPORARY',           // Temporário - pode funcionar se tentar novamente
  CONFIGURATION = 'CONFIGURATION',   // Problema de configuração - precisa ajuste no código
  CREDENTIALS = 'CREDENTIALS',       // Problema de credenciais - usuário precisa verificar
  PERMISSION = 'PERMISSION',         // Problema de permissão - usuário não tem acesso
  UNKNOWN = 'UNKNOWN',              // Desconhecido
}

/**
 * Informações detalhadas sobre um erro PJE
 */
export interface PJEError {
  type: PJEErrorType;
  category: PJEErrorCategory;
  message: string;
  userMessage: string;        // Mensagem amigável para o usuário
  details?: {
    url?: string;
    statusCode?: number;
    pageTitle?: string;
    httpError?: string;
    [key: string]: any;
  };
  retryable: boolean;         // Indica se vale a pena tentar novamente
  timestamp: string;
}

/**
 * Mapeamento de tipo de erro para categoria
 */
export const ERROR_CATEGORY_MAP: Record<PJEErrorType, PJEErrorCategory> = {
  // Temporários
  [PJEErrorType.SERVER_UNAVAILABLE]: PJEErrorCategory.TEMPORARY,
  [PJEErrorType.SERVER_ERROR]: PJEErrorCategory.TEMPORARY,
  [PJEErrorType.NETWORK_ERROR]: PJEErrorCategory.TEMPORARY,
  [PJEErrorType.SESSION_EXPIRED]: PJEErrorCategory.TEMPORARY,
  [PJEErrorType.BLOCKED_BY_CLOUDFRONT]: PJEErrorCategory.TEMPORARY,

  // Configuração
  [PJEErrorType.PAGE_STRUCTURE_DIFFERENT]: PJEErrorCategory.CONFIGURATION,
  [PJEErrorType.SSO_STRUCTURE_DIFFERENT]: PJEErrorCategory.CONFIGURATION,
  [PJEErrorType.API_STRUCTURE_CHANGED]: PJEErrorCategory.CONFIGURATION,

  // Credenciais
  [PJEErrorType.AUTHENTICATION_FAILED]: PJEErrorCategory.CREDENTIALS,

  // Permissão
  [PJEErrorType.USER_NOT_AUTHORIZED]: PJEErrorCategory.PERMISSION,
  [PJEErrorType.MISSING_PERMISSIONS]: PJEErrorCategory.PERMISSION,

  // Outros
  [PJEErrorType.SCRAPE_ERROR]: PJEErrorCategory.UNKNOWN,
  [PJEErrorType.NO_DATA_FOUND]: PJEErrorCategory.UNKNOWN,
  [PJEErrorType.UNEXPECTED_REDIRECT]: PJEErrorCategory.UNKNOWN,
  [PJEErrorType.UNKNOWN_ERROR]: PJEErrorCategory.UNKNOWN,
};

/**
 * Mensagens amigáveis para o usuário
 */
export const USER_FRIENDLY_MESSAGES: Record<PJEErrorType, string> = {
  [PJEErrorType.SERVER_UNAVAILABLE]:
    'O sistema do TRT está temporariamente indisponível. Por favor, tente novamente em alguns minutos.',

  [PJEErrorType.SERVER_ERROR]:
    'O servidor do TRT retornou um erro. Tente novamente mais tarde.',

  [PJEErrorType.NETWORK_ERROR]:
    'Erro de conexão com o servidor do TRT. Verifique sua internet e tente novamente.',

  [PJEErrorType.AUTHENTICATION_FAILED]:
    'CPF ou senha incorretos. Verifique suas credenciais e tente novamente.',

  [PJEErrorType.BLOCKED_BY_CLOUDFRONT]:
    'O sistema de segurança do TRT bloqueou a requisição. Aguarde alguns minutos antes de tentar novamente.',

  [PJEErrorType.SESSION_EXPIRED]:
    'Sua sessão expirou. Faça login novamente.',

  [PJEErrorType.PAGE_STRUCTURE_DIFFERENT]:
    'A estrutura da página de login deste TRT é diferente do esperado. Entre em contato com o suporte.',

  [PJEErrorType.SSO_STRUCTURE_DIFFERENT]:
    'O sistema de autenticação deste TRT é diferente do esperado. Entre em contato com o suporte.',

  [PJEErrorType.API_STRUCTURE_CHANGED]:
    'A API do TRT mudou. Entre em contato com o suporte para atualização.',

  [PJEErrorType.USER_NOT_AUTHORIZED]:
    'Você não tem autorização para acessar este TRT. Verifique se possui procuração/habilitação neste tribunal.',

  [PJEErrorType.MISSING_PERMISSIONS]:
    'Você não tem permissão para realizar esta operação.',

  [PJEErrorType.SCRAPE_ERROR]:
    'Erro ao obter os dados. Tente novamente.',

  [PJEErrorType.NO_DATA_FOUND]:
    'Nenhum dado encontrado.',

  [PJEErrorType.UNEXPECTED_REDIRECT]:
    'Redirecionamento inesperado durante a operação. Tente novamente.',

  [PJEErrorType.UNKNOWN_ERROR]:
    'Erro desconhecido. Entre em contato com o suporte se o problema persistir.',
};

/**
 * Indica se um tipo de erro é retryable (vale a pena tentar novamente)
 */
export const ERROR_RETRYABLE_MAP: Record<PJEErrorType, boolean> = {
  [PJEErrorType.SERVER_UNAVAILABLE]: true,
  [PJEErrorType.SERVER_ERROR]: true,
  [PJEErrorType.NETWORK_ERROR]: true,
  [PJEErrorType.SESSION_EXPIRED]: true,
  [PJEErrorType.BLOCKED_BY_CLOUDFRONT]: true, // Mas com delay maior

  [PJEErrorType.AUTHENTICATION_FAILED]: false,
  [PJEErrorType.PAGE_STRUCTURE_DIFFERENT]: false,
  [PJEErrorType.SSO_STRUCTURE_DIFFERENT]: false,
  [PJEErrorType.API_STRUCTURE_CHANGED]: false,
  [PJEErrorType.USER_NOT_AUTHORIZED]: false,
  [PJEErrorType.MISSING_PERMISSIONS]: false,

  [PJEErrorType.SCRAPE_ERROR]: true,
  [PJEErrorType.NO_DATA_FOUND]: false,
  [PJEErrorType.UNEXPECTED_REDIRECT]: true,
  [PJEErrorType.UNKNOWN_ERROR]: true,
};

/**
 * Scraping Errors
 * Classes de erro específicas para o sistema de raspagem
 */

/**
 * Tipo de erro de raspagem
 */
export enum ScrapingErrorType {
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  SCRIPT = 'script',
  RATE_LIMIT = 'rate_limit',
  PJE_SYSTEM = 'pje_system',
  UNKNOWN = 'unknown',
}

/**
 * Classe base para erros de raspagem
 */
export class ScrapingError extends Error {
  public readonly type: ScrapingErrorType;
  public readonly retryable: boolean;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    type: ScrapingErrorType,
    retryable: boolean,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ScrapingError';
    this.type = type;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Mantém o stack trace correto
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Retorna uma mensagem amigável para o usuário
   */
  public getUserMessage(): string {
    return getUserFriendlyMessage(this.type, this.message);
  }

  /**
   * Serializa o erro para armazenamento no banco
   */
  public toJSON() {
    return {
      type: this.type,
      message: this.message,
      userMessage: this.getUserMessage(),
      retryable: this.retryable,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

/**
 * Erro de autenticação (não retryable)
 */
export class AuthenticationError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ScrapingErrorType.AUTHENTICATION, false, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Erro de rede (retryable)
 */
export class NetworkError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ScrapingErrorType.NETWORK, true, context);
    this.name = 'NetworkError';
  }
}

/**
 * Erro de timeout (retryable)
 */
export class TimeoutError extends ScrapingError {
  public readonly phase?: 'login' | 'data-fetch' | 'unknown';

  constructor(message: string, context?: Record<string, any>) {
    super(message, ScrapingErrorType.TIMEOUT, true, context);
    this.name = 'TimeoutError';
    this.phase = context?.phase || 'unknown';
  }
}

/**
 * Erro no script (não retryable)
 */
export class ScriptError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ScrapingErrorType.SCRIPT, false, context);
    this.name = 'ScriptError';
  }
}

/**
 * Erro de rate limit (retryable)
 */
export class RateLimitError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ScrapingErrorType.RATE_LIMIT, true, context);
    this.name = 'RateLimitError';
  }
}

/**
 * Erro do sistema PJE (retryable)
 */
export class PJESystemError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ScrapingErrorType.PJE_SYSTEM, true, context);
    this.name = 'PJESystemError';
  }
}

/**
 * Classifica um erro genérico em um tipo específico de erro de raspagem
 *
 * @param error - Erro a ser classificado
 * @returns Instância de ScrapingError apropriada
 */
export function classifyError(error: Error | string): ScrapingError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  // Extract phase from error object if present (for login phase detection)
  const errorPhase = (error as any).error?.phase;

  const context = {
    originalError: errorMessage,
    stack: errorStack,
    phase: errorPhase, // Preserve phase for TimeoutError
  };

  // Erros de autenticação
  if (
    /authentication failed/i.test(errorMessage) ||
    /invalid credentials/i.test(errorMessage) ||
    /unauthorized/i.test(errorMessage) ||
    /401/.test(errorMessage) ||
    /403/.test(errorMessage)
  ) {
    return new AuthenticationError(errorMessage, context);
  }

  // Erros de rate limit
  if (
    /429/.test(errorMessage) ||
    /rate limit/i.test(errorMessage) ||
    /CloudFront/i.test(errorMessage)
  ) {
    return new RateLimitError(errorMessage, context);
  }

  // Erros de timeout
  if (
    /timeout/i.test(errorMessage) ||
    /ETIMEDOUT/i.test(errorMessage) ||
    /Navigation timeout/i.test(errorMessage)
  ) {
    return new TimeoutError(errorMessage, context);
  }

  // Erros de rede
  if (
    /ECONNREFUSED/i.test(errorMessage) ||
    /ENOTFOUND/i.test(errorMessage) ||
    /ECONNRESET/i.test(errorMessage) ||
    /socket hang up/i.test(errorMessage) ||
    /net::ERR_/i.test(errorMessage)
  ) {
    return new NetworkError(errorMessage, context);
  }

  // Erros do sistema PJE
  if (
    /500/.test(errorMessage) ||
    /502/.test(errorMessage) ||
    /503/.test(errorMessage) ||
    /504/.test(errorMessage) ||
    /temporarily unavailable/i.test(errorMessage)
  ) {
    return new PJESystemError(errorMessage, context);
  }

  // Erros de script (sintaxe, referências, etc)
  if (
    /SyntaxError/i.test(errorMessage) ||
    /ReferenceError/i.test(errorMessage) ||
    /TypeError/i.test(errorMessage) ||
    /is not defined/i.test(errorMessage)
  ) {
    return new ScriptError(errorMessage, context);
  }

  // Erro desconhecido (não retryable por padrão)
  return new ScrapingError(
    errorMessage,
    ScrapingErrorType.UNKNOWN,
    false,
    context
  );
}

/**
 * Verifica se um erro é passível de retry
 *
 * @param error - Erro a ser verificado
 * @returns true se o erro pode ser retentado
 */
export function isRetryableError(error: Error | ScrapingError | string): boolean {
  if (error instanceof ScrapingError) {
    return error.retryable;
  }

  const classified = classifyError(
    typeof error === 'string' ? error : (error as Error)
  );
  return classified.retryable;
}

/**
 * Retorna uma mensagem amigável para o usuário baseada no tipo de erro
 *
 * @param type - Tipo do erro
 * @param technicalMessage - Mensagem técnica original
 * @returns Mensagem amigável
 */
export function getUserFriendlyMessage(
  type: ScrapingErrorType,
  technicalMessage: string
): string {
  switch (type) {
    case ScrapingErrorType.AUTHENTICATION:
      return 'Falha na autenticação. Verifique suas credenciais e tente novamente.';

    case ScrapingErrorType.NETWORK:
      return 'Erro de conexão com o PJE. Verifique sua internet e tente novamente.';

    case ScrapingErrorType.TIMEOUT:
      return 'O servidor do PJE demorou muito para responder. Tente novamente em alguns minutos.';

    case ScrapingErrorType.RATE_LIMIT:
      return 'Limite de requisições atingido. Aguarde alguns minutos antes de tentar novamente.';

    case ScrapingErrorType.PJE_SYSTEM:
      return 'O sistema do PJE está temporariamente indisponível. Tente novamente mais tarde.';

    case ScrapingErrorType.SCRIPT:
      return 'Erro interno no script de raspagem. Contate o suporte técnico.';

    case ScrapingErrorType.UNKNOWN:
    default:
      return `Erro desconhecido: ${technicalMessage}`;
  }
}

/**
 * Formata um erro para log estruturado
 *
 * @param error - Erro a ser formatado
 * @returns Objeto com informações formatadas do erro
 */
export function formatErrorForLog(error: Error | ScrapingError | string): {
  type: string;
  message: string;
  retryable: boolean;
  timestamp: string;
  context?: Record<string, any>;
} {
  if (error instanceof ScrapingError) {
    return {
      type: error.type,
      message: error.message,
      retryable: error.retryable,
      timestamp: error.timestamp,
      context: error.context,
    };
  }

  const classified = classifyError(
    typeof error === 'string' ? error : (error as Error)
  );

  return {
    type: classified.type,
    message: classified.message,
    retryable: classified.retryable,
    timestamp: classified.timestamp,
    context: classified.context,
  };
}

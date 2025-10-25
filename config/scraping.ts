/**
 * Scraping Configuration
 * Configuração do sistema de raspagem de processos
 */

import { ScrapeType, ScrapeSubType, SCRAPE_TYPE_TO_SCRIPT, SCRAPE_SUBTYPE_TO_SCRIPT } from '@/lib/types/scraping';
import path from 'path';

/**
 * Configuração de limites de execução concorrente
 */
export const SCRAPING_CONCURRENCY = {
  /** Máximo de jobs executando simultaneamente */
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),

  /** Máximo de tribunais sendo raspados simultaneamente dentro de um job */
  maxConcurrentTribunals: parseInt(process.env.MAX_CONCURRENT_TRIBUNALS || '3', 10),

  /** Máximo de instâncias de browser abertas simultaneamente (limite de memória) */
  maxBrowserInstances: parseInt(process.env.MAX_BROWSER_INSTANCES || '10', 10),
} as const;

/**
 * Configuração de retry e timeouts
 */
export const SCRAPING_RETRY = {
  /** Número máximo de tentativas para execuções que falharam */
  maxAttempts: 3,

  /** Delays entre tentativas em milissegundos (exponential backoff) */
  retryDelays: [30_000, 60_000, 120_000], // 30s, 60s, 120s

  /** Timeout máximo por execução de script (10 minutos) */
  scriptTimeout: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Configuração de polling para atualizações de status
 */
export const SCRAPING_POLLING = {
  /** Intervalo de polling do cliente em milissegundos */
  clientPollInterval: 3000, // 3 seconds

  /** Timeout para considerar um job como "travado" */
  jobStuckTimeout: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Diretório base dos scripts de raspagem
 * Usa scripts genéricos em pje-common que funcionam com qualquer tribunal
 */
const SCRIPTS_BASE_DIR = path.join(process.cwd(), 'server', 'scripts', 'pje-common');

/**
 * Resolve o caminho do script baseado no tipo e sub-tipo de raspagem
 *
 * @param scrapeType - Tipo de raspagem
 * @param scrapeSubType - Sub-tipo de raspagem (opcional, usado para "pendentes")
 * @returns Caminho absoluto do script
 */
export function resolveScriptPath(
  scrapeType: ScrapeType,
  scrapeSubType?: ScrapeSubType
): string {
  let scriptName: string;

  if (scrapeType === ScrapeType.PENDENTES && scrapeSubType) {
    // Para "pendentes", usa o sub-tipo para determinar o script
    scriptName = SCRAPE_SUBTYPE_TO_SCRIPT[scrapeSubType];
  } else {
    // Para outros tipos, usa o mapeamento direto
    scriptName = SCRAPE_TYPE_TO_SCRIPT[scrapeType];
  }

  return path.join(SCRIPTS_BASE_DIR, scriptName);
}

/**
 * Categorias de erros que são passíveis de retry
 */
export const RETRYABLE_ERROR_PATTERNS = [
  // Erros de rede
  /ETIMEDOUT/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ECONNRESET/i,
  /socket hang up/i,

  // Erros HTTP temporários
  /429/,  // Too Many Requests
  /500/,  // Internal Server Error
  /502/,  // Bad Gateway
  /503/,  // Service Unavailable
  /504/,  // Gateway Timeout

  // Erros do PJE
  /CloudFront/i,
  /rate limit/i,
  /temporarily unavailable/i,

  // Erros do Puppeteer
  /Navigation timeout/i,
  /net::ERR_/i,
] as const;

/**
 * Categorias de erros que NÃO são passíveis de retry
 */
export const NON_RETRYABLE_ERROR_PATTERNS = [
  // Erros de autenticação
  /authentication failed/i,
  /invalid credentials/i,
  /unauthorized/i,
  /401/,
  /403/,

  // Erros de validação
  /validation error/i,
  /invalid input/i,
  /bad request/i,
  /400/,
] as const;

/**
 * Verifica se um erro é passível de retry
 *
 * @param error - Erro a ser verificado
 * @returns true se o erro pode ser retentado
 */
export function isRetryableError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Primeiro verifica se é um erro explicitamente não-retryable
  for (const pattern of NON_RETRYABLE_ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return false;
    }
  }

  // Depois verifica se é um erro retryable
  for (const pattern of RETRYABLE_ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return true;
    }
  }

  // Por padrão, erros desconhecidos não são retryable
  return false;
}

/**
 * Calcula o delay para a próxima tentativa baseado no número de tentativas
 *
 * @param attemptNumber - Número da tentativa (0-indexed)
 * @returns Delay em milissegundos
 */
export function getRetryDelay(attemptNumber: number): number {
  if (attemptNumber >= SCRAPING_RETRY.retryDelays.length) {
    return SCRAPING_RETRY.retryDelays[SCRAPING_RETRY.retryDelays.length - 1];
  }
  return SCRAPING_RETRY.retryDelays[attemptNumber];
}

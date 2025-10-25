/**
 * PJE Error Detection Utilities
 * Funções para detectar e classificar erros durante operações no PJE
 */

import type { Page } from 'puppeteer';
import {
  PJEErrorType,
  PJEErrorCategory,
  type PJEError,
  ERROR_CATEGORY_MAP,
  USER_FRIENDLY_MESSAGES,
  ERROR_RETRYABLE_MAP,
} from '../types/pje-errors';

/**
 * Cria um objeto PJEError padronizado
 */
export function createPJEError(
  type: PJEErrorType,
  message: string,
  details?: Record<string, any>
): PJEError {
  return {
    type,
    category: ERROR_CATEGORY_MAP[type],
    message,
    userMessage: USER_FRIENDLY_MESSAGES[type],
    details,
    retryable: ERROR_RETRYABLE_MAP[type],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Detecta o tipo de erro baseado na URL e título da página
 */
export async function detectErrorFromPage(
  page: Page,
  expectedDomain?: string
): Promise<PJEError | null> {
  const url = page.url();
  const title = await page.title();
  const content = await page.content();

  // 1. Verifica se é erro de servidor (HTTP 401, 500, 503, etc.)
  if (
    content.includes('HTTP Status 401') ||
    content.includes('JBWEB000065') ||
    title.includes('401')
  ) {
    return createPJEError(
      PJEErrorType.SERVER_UNAVAILABLE,
      'Servidor retornou HTTP 401 - Sistema temporariamente indisponível',
      { url, title, statusCode: 401 }
    );
  }

  if (
    content.includes('HTTP Status 500') ||
    content.includes('HTTP Status 503') ||
    title.includes('500') ||
    title.includes('503')
  ) {
    return createPJEError(
      PJEErrorType.SERVER_ERROR,
      'Servidor retornou erro 500/503',
      { url, title, statusCode: content.includes('500') ? 500 : 503 }
    );
  }

  // 2. Verifica se é bloqueio do CloudFront
  if (url.includes('403') || title.includes('403') || title.toLowerCase().includes('forbidden')) {
    return createPJEError(
      PJEErrorType.BLOCKED_BY_CLOUDFRONT,
      'CloudFront bloqueou o acesso (403)',
      { url, title, statusCode: 403 }
    );
  }

  // 3. Verifica se ainda está na página de login SSO (falha de autenticação)
  if (url.includes('sso.cloud.pje.jus.br')) {
    // Verifica se tem mensagem de erro específica
    const hasInvalidCredentialsMsg =
      content.includes('inválido') ||
      content.includes('incorreto') ||
      content.includes('Invalid username or password');

    if (hasInvalidCredentialsMsg) {
      return createPJEError(
        PJEErrorType.AUTHENTICATION_FAILED,
        'Credenciais incorretas - mensagem de erro na página SSO',
        { url, title }
      );
    }

    // Se voltou para SSO sem mensagem clara, pode ser vários motivos
    return createPJEError(
      PJEErrorType.AUTHENTICATION_FAILED,
      'Autenticação falhou - permaneceu na página SSO',
      { url, title }
    );
  }

  // 4. Verifica se redirecionou para domínio esperado
  if (expectedDomain && !url.includes(expectedDomain)) {
    return createPJEError(
      PJEErrorType.UNEXPECTED_REDIRECT,
      `Redirecionado para URL inesperada: ${url}`,
      { url, title, expectedDomain }
    );
  }

  // Sem erro detectado
  return null;
}

/**
 * Detecta erro ao verificar se elemento existe na página
 * Aguarda o elemento aparecer por até {timeout}ms antes de considerar erro
 */
export async function detectStructureError(
  page: Page,
  selector: string,
  context: 'login' | 'sso' | 'page',
  timeout: number = 10000
): Promise<PJEError | null> {
  try {
    // Aguarda o elemento aparecer (com timeout)
    await page.waitForSelector(selector, { visible: true, timeout });
    return null; // Elemento existe, sem erro
  } catch (error) {
    // Timeout ou elemento não encontrado
    const url = page.url();
    const title = await page.title();

    if (context === 'login') {
      return createPJEError(
        PJEErrorType.PAGE_STRUCTURE_DIFFERENT,
        `Elemento ${selector} não encontrado na página de login após ${timeout}ms`,
        { url, title, selector, context, timeout }
      );
    }

    if (context === 'sso') {
      return createPJEError(
        PJEErrorType.SSO_STRUCTURE_DIFFERENT,
        `Campo ${selector} não encontrado na página SSO após ${timeout}ms`,
        { url, title, selector, context, timeout }
      );
    }

    return createPJEError(
      PJEErrorType.PAGE_STRUCTURE_DIFFERENT,
      `Elemento ${selector} não encontrado após ${timeout}ms`,
      { url, title, selector, context, timeout }
    );
  }
}

/**
 * Detecta erro de network/timeout
 */
export function detectNetworkError(error: Error): PJEError {
  const errorMessage = error.message.toLowerCase();

  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('navigation timeout')
  ) {
    return createPJEError(
      PJEErrorType.NETWORK_ERROR,
      `Timeout ao acessar página: ${error.message}`,
      { originalError: error.message }
    );
  }

  if (
    errorMessage.includes('net::err_') ||
    errorMessage.includes('dns') ||
    errorMessage.includes('connection')
  ) {
    return createPJEError(
      PJEErrorType.NETWORK_ERROR,
      `Erro de rede: ${error.message}`,
      { originalError: error.message }
    );
  }

  return createPJEError(
    PJEErrorType.UNKNOWN_ERROR,
    `Erro desconhecido: ${error.message}`,
    { originalError: error.message }
  );
}

/**
 * Detecta erro durante scraping
 */
export function detectScrapeError(error: Error, context?: string): PJEError {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('api') || errorMessage.includes('fetch')) {
    return createPJEError(
      PJEErrorType.API_STRUCTURE_CHANGED,
      `Erro ao acessar API: ${error.message}`,
      { originalError: error.message, context }
    );
  }

  if (errorMessage.includes('parse') || errorMessage.includes('json')) {
    return createPJEError(
      PJEErrorType.API_STRUCTURE_CHANGED,
      `Erro ao processar resposta da API: ${error.message}`,
      { originalError: error.message, context }
    );
  }

  return createPJEError(
    PJEErrorType.SCRAPE_ERROR,
    `Erro durante raspagem: ${error.message}`,
    { originalError: error.message, context }
  );
}

/**
 * Verifica se login foi bem-sucedido baseado na URL final
 */
export function isLoginSuccessful(
  finalUrl: string,
  expectedDomain: string
): boolean {
  return (
    finalUrl.includes(expectedDomain) &&
    !finalUrl.includes('sso.cloud') &&
    !finalUrl.includes('login.seam')
  );
}

/**
 * Formata erro PJE para exibição em console
 */
export function formatErrorForConsole(error: PJEError): string {
  const categoryEmoji = {
    [PJEErrorCategory.TEMPORARY]: '⏳',
    [PJEErrorCategory.CONFIGURATION]: '⚙️',
    [PJEErrorCategory.CREDENTIALS]: '🔐',
    [PJEErrorCategory.PERMISSION]: '🚫',
    [PJEErrorCategory.UNKNOWN]: '❓',
  };

  const emoji = categoryEmoji[error.category];
  const retryable = error.retryable ? '(pode tentar novamente)' : '(não retryable)';

  return `${emoji} [${error.type}] ${error.message} ${retryable}`;
}

/**
 * Formata erro PJE para retornar na API
 */
export function formatErrorForAPI(error: PJEError) {
  return {
    success: false,
    error: {
      type: error.type,
      category: error.category,
      message: error.userMessage, // Mensagem amigável para o usuário
      technicalMessage: error.message, // Mensagem técnica para debug
      retryable: error.retryable,
      timestamp: error.timestamp,
      details: error.details,
    },
  };
}

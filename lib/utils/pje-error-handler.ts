/**
 * PJE Error Handler
 * Manipulador centralizado de erros para operações PJE
 * Pode ser usado tanto em scripts quanto em APIs
 */

import type { Page } from 'puppeteer';
import type { PJEError } from '../types/pje-errors.js';
import {
  detectErrorFromPage,
  detectStructureError,
  detectNetworkError,
  detectScrapeError,
  formatErrorForAPI,
  formatErrorForConsole,
} from './pje-error-detector.js';

/**
 * Interface para resultado de operação com tratamento de erro
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    category: string;
    message: string;           // Mensagem amigável para o usuário
    technicalMessage: string;  // Mensagem técnica para debug
    retryable: boolean;
    timestamp: string;
    details?: Record<string, any>;
  };
}

/**
 * Wrapper para operações que podem falhar
 * Captura exceções e retorna um OperationResult padronizado
 */
export async function handleOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<OperationResult<T>> {
  try {
    const data = await operation();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const pjeError = detectNetworkError(
      error instanceof Error ? error : new Error(String(error))
    );

    return formatErrorForAPI(pjeError) as OperationResult<T>;
  }
}

/**
 * Verifica erros após navegação/login
 */
export async function checkPageForErrors(
  page: Page,
  expectedDomain?: string
): Promise<OperationResult<void>> {
  const pageError = await detectErrorFromPage(page, expectedDomain);

  if (pageError) {
    return formatErrorForAPI(pageError) as OperationResult<void>;
  }

  return { success: true };
}

/**
 * Verifica se elemento existe na página e retorna erro se não existir
 */
export async function checkElementExists(
  page: Page,
  selector: string,
  context: 'login' | 'sso' | 'page'
): Promise<OperationResult<void>> {
  const structureError = await detectStructureError(page, selector, context);

  if (structureError) {
    return formatErrorForAPI(structureError) as OperationResult<void>;
  }

  return { success: true };
}

/**
 * Wrapper para operações de scraping
 */
export async function handleScrape<T>(
  scrapeOperation: () => Promise<T>,
  context?: string
): Promise<OperationResult<T>> {
  try {
    const data = await scrapeOperation();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const scrapeError = detectScrapeError(
      error instanceof Error ? error : new Error(String(error)),
      context
    );

    return formatErrorForAPI(scrapeError) as OperationResult<T>;
  }
}

/**
 * Loga erro no console de forma formatada
 */
export function logError(error: PJEError): void {
  console.error(formatErrorForConsole(error));
}

/**
 * Cria resposta de erro para API Express/Next.js
 */
export function createErrorResponse(error: PJEError, statusCode?: number) {
  const response = formatErrorForAPI(error);

  // Determina status code HTTP baseado no tipo de erro
  const httpStatusCode =
    statusCode ||
    (error.details?.statusCode as number) ||
    (error.retryable ? 503 : 400);

  return {
    statusCode: httpStatusCode,
    body: response,
  };
}

/**
 * Middleware para capturar erros em operações PJE
 * Exemplo de uso em Next.js API Route:
 *
 * export default async function handler(req, res) {
 *   const result = await withPJEErrorHandling(async () => {
 *     // sua operação aqui
 *     return await scrapeProcessos();
 *   });
 *
 *   if (!result.success) {
 *     return res.status(result.statusCode || 500).json(result.body);
 *   }
 *
 *   return res.json({ success: true, data: result.data });
 * }
 */
export async function withPJEErrorHandling<T>(
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; statusCode?: number; body?: any }> {
  try {
    const data = await operation();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const pjeError = detectNetworkError(
      error instanceof Error ? error : new Error(String(error))
    );

    const { statusCode, body } = createErrorResponse(pjeError);

    return {
      success: false,
      statusCode,
      body,
    };
  }
}

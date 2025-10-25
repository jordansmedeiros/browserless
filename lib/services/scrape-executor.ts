/**
 * Scrape Executor
 * Executa scripts de raspagem como subprocessos
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { resolveScriptPath, SCRAPING_RETRY, isRetryableError as configIsRetryable } from '@/config/scraping';
import {
  ScrapingResult,
  ScrapeType,
  ScrapeSubType
} from '@/lib/types/scraping';
import {
  classifyError,
  isRetryableError,
  formatErrorForLog,
  ScrapingError
} from '@/lib/errors/scraping-errors';

const execAsync = promisify(exec);

/**
 * Credenciais para login no PJE
 */
export interface CredenciaisParaLogin {
  cpf: string;
  senha: string;
  idAdvogado: string;
}

/**
 * Configuração de tribunal para raspagem
 */
export interface TribunalConfigParaRaspagem {
  urlBase: string;
  urlLoginSeam: string;
  urlApi: string;
  codigo?: string; // Ex: "TRT3-1g"
}

/**
 * Opções para execução de script
 */
export interface ExecuteScriptOptions {
  credentials: CredenciaisParaLogin;
  tribunalConfig: TribunalConfigParaRaspagem;
  scrapeType: ScrapeType;
  scrapeSubType?: ScrapeSubType;
  timeout?: number;
}

/**
 * Resultado da execução do script com logs
 */
export interface ExecutionResult {
  result: ScrapingResult;
  logs: string[];
  duration: number; // em milissegundos
}

/**
 * Executa um script de raspagem como subprocess
 *
 * @param options - Opções de execução
 * @returns Resultado da execução com logs
 * @throws ScrapingError se a execução falhar
 */
export async function executeScript(
  options: ExecuteScriptOptions
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const logs: string[] = [];

  try {
    // Resolve o caminho do script
    const scriptPath = resolveScriptPath(options.scrapeType, options.scrapeSubType);
    logs.push(`[Executor] Script path: ${scriptPath}`);
    logs.push(`[Executor] Tribunal: ${options.tribunalConfig.codigo || options.tribunalConfig.urlBase}`);

    // Prepara as variáveis de ambiente
    const env = {
      ...process.env,
      PJE_CPF: options.credentials.cpf,
      PJE_SENHA: options.credentials.senha,
      PJE_ID_ADVOGADO: options.credentials.idAdvogado,
      PJE_BASE_URL: options.tribunalConfig.urlBase,
      PJE_LOGIN_URL: options.tribunalConfig.urlLoginSeam,
      PJE_API_URL: options.tribunalConfig.urlApi,
      // Desabilita output de arquivo (scripts devem apenas retornar JSON via stdout)
      PJE_OUTPUT_FILE: '',
    };

    logs.push(`[Executor] Starting script execution...`);

    // Executa o script com timeout
    const timeout = options.timeout || SCRAPING_RETRY.scriptTimeout;
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      env,
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large JSON outputs
    });

    // Captura stderr como logs
    if (stderr) {
      logs.push(`[Script stderr] ${stderr}`);
    }

    // Parse do resultado JSON do stdout
    logs.push(`[Executor] Parsing script output...`);
    const result = parseScriptOutput(stdout);

    const duration = Date.now() - startTime;
    logs.push(`[Executor] Execution completed in ${duration}ms`);
    logs.push(`[Executor] Processes scraped: ${result.processosCount}`);

    return {
      result,
      logs,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logs.push(`[Executor] Execution failed after ${duration}ms`);

    // Classifica o erro
    const scrapingError = classifyError(error);
    logs.push(`[Executor] Error classified as: ${scrapingError.type} (retryable: ${scrapingError.retryable})`);
    logs.push(`[Executor] Error: ${scrapingError.message}`);

    // Adiciona stderr ao log se disponível
    if (error.stderr) {
      logs.push(`[Script stderr] ${error.stderr}`);
    }

    throw scrapingError;
  }
}

/**
 * Executa um script com retry automático para erros retryable
 *
 * @param options - Opções de execução
 * @param maxAttempts - Número máximo de tentativas (padrão: configuração)
 * @returns Resultado da execução com logs
 * @throws ScrapingError se todas as tentativas falharem
 */
export async function executeScriptWithRetry(
  options: ExecuteScriptOptions,
  maxAttempts: number = SCRAPING_RETRY.maxAttempts
): Promise<ExecutionResult> {
  const allLogs: string[] = [];
  let lastError: ScrapingError | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      allLogs.push(`\n=== Attempt ${attempt + 1}/${maxAttempts} ===`);

      const result = await executeScript(options);
      allLogs.push(...result.logs);

      // Sucesso - retorna resultado
      return {
        ...result,
        logs: allLogs,
      };
    } catch (error: any) {
      lastError = error instanceof ScrapingError ? error : classifyError(error);
      allLogs.push(`[Retry] Attempt ${attempt + 1} failed: ${lastError.message}`);

      // Se não é retryable, falha imediatamente
      if (!lastError.retryable) {
        allLogs.push(`[Retry] Error is not retryable, aborting`);
        throw Object.assign(lastError, {
          message: `${lastError.message} (after ${attempt + 1} attempt${attempt > 0 ? 's' : ''})`
        });
      }

      // Se é a última tentativa, falha
      if (attempt === maxAttempts - 1) {
        allLogs.push(`[Retry] Max attempts reached, aborting`);
        throw Object.assign(lastError, {
          message: `${lastError.message} (after ${maxAttempts} attempts)`
        });
      }

      // Aguarda antes de tentar novamente
      const delay = SCRAPING_RETRY.retryDelays[attempt] || SCRAPING_RETRY.retryDelays[SCRAPING_RETRY.retryDelays.length - 1];
      allLogs.push(`[Retry] Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  // Não deveria chegar aqui, mas por garantia
  throw lastError || new Error('Unknown error during retry');
}

/**
 * Parseia a saída do script (JSON no stdout)
 *
 * @param stdout - Saída padrão do script
 * @returns Resultado da raspagem parseado
 * @throws Error se o parsing falhar
 */
function parseScriptOutput(stdout: string): ScrapingResult {
  try {
    // Remove linhas de log e mantém apenas o JSON final
    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1]; // Assume que o JSON é a última linha

    const parsed = JSON.parse(jsonLine);

    // Valida estrutura básica
    if (typeof parsed.success !== 'boolean') {
      throw new Error('Invalid script output: missing "success" field');
    }

    // Normaliza o resultado
    return {
      success: parsed.success,
      processosCount: parsed.processosCount || parsed.processos?.length || 0,
      processos: parsed.processos || [],
      timestamp: parsed.timestamp || new Date().toISOString(),
      error: parsed.error,
    };
  } catch (error: any) {
    throw new Error(`Failed to parse script output: ${error.message}\nOutput: ${stdout.substring(0, 500)}`);
  }
}

/**
 * Helper para aguardar um tempo
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Valida se um script existe e é executável
 *
 * @param scrapeType - Tipo de raspagem
 * @param scrapeSubType - Sub-tipo de raspagem
 * @returns true se o script existe
 */
export async function validateScriptExists(
  scrapeType: ScrapeType,
  scrapeSubType?: ScrapeSubType
): Promise<boolean> {
  try {
    const scriptPath = resolveScriptPath(scrapeType, scrapeSubType);
    const { access } = await import('fs/promises');
    const { constants } = await import('fs');

    await access(scriptPath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Limpa processos filhos órfãos (cleanup em caso de shutdown)
 *
 * @param signal - Sinal recebido (SIGTERM, SIGINT, etc)
 */
export function cleanupChildProcesses(signal: string) {
  console.log(`[Executor] Received ${signal}, cleaning up child processes...`);

  // O Node.js automaticamente limpa processos filhos ao terminar,
  // mas podemos adicionar lógica adicional aqui se necessário

  // Por exemplo, matar processos que possam estar travados:
  if (process.platform === 'win32') {
    // Windows: taskkill /F /IM node.exe /FI "PID ne [parent_pid]"
    // (não implementado por ser arriscado - pode matar outros processos Node)
  } else {
    // Unix: pkill -P [parent_pid]
    // (não implementado - deixamos o OS cuidar disso)
  }

  console.log(`[Executor] Cleanup complete`);
}

// Registra handlers de cleanup
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => cleanupChildProcesses('SIGTERM'));
  process.on('SIGINT', () => cleanupChildProcesses('SIGINT'));
}

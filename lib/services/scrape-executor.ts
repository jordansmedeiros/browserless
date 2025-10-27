/**
 * Scrape Executor
 * Executa scripts de raspagem como subprocessos
 */

import { spawn } from 'child_process';
import { dirname } from 'path';
import { resolveScriptPath, SCRAPING_RETRY } from '@/config/scraping';
import {
  ScrapingResult,
  ScrapeType,
  ScrapeSubType
} from '@/lib/types/scraping';
import {
  classifyError,
  formatErrorForLog,
  ScrapingError
} from '@/lib/errors/scraping-errors';

/**
 * Limite máximo de linhas de log mantidas em memória
 * Mantém as últimas N linhas para evitar consumo excessivo de memória
 */
const MAX_LOG_LINES = 1000;

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
  logger?: {
    info: (msg: string, ctx?: any) => void;
    warn: (msg: string, ctx?: any) => void;
    error: (msg: string, ctx?: any) => void;
  };
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
    addLogLine(logs, `[Executor] Script path: ${scriptPath}`);
    addLogLine(logs, `[Executor] Tribunal: ${options.tribunalConfig.codigo || options.tribunalConfig.urlBase}`);

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

    addLogLine(logs, `[Executor] Starting script execution...`);

    // Envia log inicial ao logger se presente
    options.logger?.info(`[Executor] Starting script execution...`);

    // Executa o script com spawn para streaming em tempo real
    const timeout = options.timeout || SCRAPING_RETRY.scriptTimeout;
    const { stdout, stderr, exitCode } = await executeScriptWithSpawn(
      scriptPath,
      env,
      timeout,
      options.logger,
      logs
    );

    // Parse do resultado JSON do stdout
    addLogLine(logs, `[Executor] Parsing script output...`);
    options.logger?.info(`[Executor] Parsing script output...`);
    const result = parseScriptOutput(stdout);

    const duration = Date.now() - startTime;
    addLogLine(logs, `[Executor] Execution completed in ${duration}ms`);
    addLogLine(logs, `[Executor] Processes scraped: ${result.processosCount}`);

    // Envia logs finais ao logger
    options.logger?.info(`[Executor] Execution completed in ${duration}ms`);
    options.logger?.info(`[Executor] Processes scraped: ${result.processosCount}`);

    return {
      result,
      logs,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    addLogLine(logs, `[Executor] Execution failed after ${duration}ms`);

    // Classifica o erro
    const scrapingError = classifyError(error);
    addLogLine(logs, `[Executor] Error classified as: ${scrapingError.type} (retryable: ${scrapingError.retryable})`);
    addLogLine(logs, `[Executor] Error: ${scrapingError.message}`);

    // Envia sumário do erro ao logger
    options.logger?.error(`[Executor] Execution failed after ${duration}ms`);
    options.logger?.error(
      `Erro classificado: ${scrapingError.type} (retryable: ${scrapingError.retryable})`,
      { type: scrapingError.type, retryable: scrapingError.retryable }
    );
    options.logger?.error(scrapingError.message);

    // Adiciona stderr ao log se disponível
    if (error.stderr) {
      addLogLine(logs, `[Script stderr] ${error.stderr}`);
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
      const attemptMsg = `\n=== Attempt ${attempt + 1}/${maxAttempts} ===`;
      addLogLine(allLogs, attemptMsg);

      // Envia log de tentativa ao logger se presente
      if (attempt > 0) {
        options.logger?.info(`Tentativa ${attempt + 1}/${maxAttempts}...`);
      }

      const result = await executeScript(options);

      // Adiciona logs respeitando MAX_LOG_LINES
      for (const line of result.logs) {
        addLogLine(allLogs, line);
      }

      // Sucesso - retorna resultado
      return {
        ...result,
        logs: allLogs,
      };
    } catch (error: any) {
      lastError = error instanceof ScrapingError ? error : classifyError(error);
      const failMsg = `[Retry] Attempt ${attempt + 1} failed: ${lastError.message}`;
      addLogLine(allLogs, failMsg);

      // Envia erro ao logger
      options.logger?.error(`Tentativa ${attempt + 1} falhou: ${lastError.message}`);

      // Se não é retryable, falha imediatamente
      if (!lastError.retryable) {
        addLogLine(allLogs, `[Retry] Error is not retryable, aborting`);
        options.logger?.error(`Erro não recuperável, abortando`);
        throw Object.assign(lastError, {
          message: `${lastError.message} (after ${attempt + 1} attempt${attempt > 0 ? 's' : ''})`
        });
      }

      // Se é a última tentativa, falha
      if (attempt === maxAttempts - 1) {
        addLogLine(allLogs, `[Retry] Max attempts reached, aborting`);
        options.logger?.error(`Máximo de tentativas atingido, abortando`);
        throw Object.assign(lastError, {
          message: `${lastError.message} (after ${maxAttempts} attempts)`
        });
      }

      // Aguarda antes de tentar novamente
      const delay = SCRAPING_RETRY.retryDelays[attempt] || SCRAPING_RETRY.retryDelays[SCRAPING_RETRY.retryDelays.length - 1];
      addLogLine(allLogs, `[Retry] Waiting ${delay}ms before retry...`);
      options.logger?.info(`Aguardando ${Math.round(delay / 1000)}s antes de tentar novamente...`);
      await sleep(delay);
    }
  }

  // Não deveria chegar aqui, mas por garantia
  throw lastError || new Error('Unknown error during retry');
}

/**
 * Executa script usando spawn para streaming em tempo real
 */
function executeScriptWithSpawn(
  scriptPath: string,
  env: NodeJS.ProcessEnv,
  timeout: number,
  logger?: { info: (msg: string, ctx?: any) => void; warn: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void },
  logs?: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(process.execPath, [scriptPath], {
      env,
      cwd: dirname(scriptPath),
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';
    let timeoutId: NodeJS.Timeout | null = null;
    let killTimeoutId: NodeJS.Timeout | null = null;
    let killed = false;

    // Configura timeout manual
    if (timeout) {
      timeoutId = setTimeout(() => {
        killed = true;
        childProcess.kill('SIGTERM');

        // Escalona para SIGKILL após 5s se o processo não morrer
        killTimeoutId = setTimeout(() => {
          childProcess.kill('SIGKILL');
        }, 5000);

        reject(new Error(`Script execution timed out after ${timeout}ms`));
      }, timeout);
    }

    // Processa stderr em tempo real (logs)
    childProcess.stderr?.on('data', (data: Buffer) => {
      stderrBuffer += data.toString();
      const lines = stderrBuffer.split('\n');
      stderrBuffer = lines.pop() || ''; // Guarda linha incompleta

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          const logEntry = `[Script] ${trimmedLine}`;

          // Adiciona ao array local
          if (logs) {
            addLogLine(logs, logEntry);
          }

          // Envia ao logger em tempo real com heurística de severidade
          if (logger) {
            const upperLine = trimmedLine.toUpperCase();
            if (upperLine.startsWith('ERROR') || upperLine.startsWith('FATAL') || upperLine.includes('ERROR:')) {
              logger.error(trimmedLine);
            } else if (upperLine.startsWith('WARN') || upperLine.startsWith('WARNING') || upperLine.includes('WARN:')) {
              logger.warn(trimmedLine);
            } else {
              // stderr por padrão é tratado como erro
              logger.error(trimmedLine);
            }
          }
        }
      });
    });

    // Coleta stdout (JSON de resultado)
    childProcess.stdout?.on('data', (data: Buffer) => {
      stdoutBuffer += data.toString();
    });

    // Processa erro do processo
    childProcess.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (killTimeoutId) clearTimeout(killTimeoutId);
      if (!killed) {
        reject(error);
      }
    });

    // Processa finalização
    childProcess.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (killTimeoutId) clearTimeout(killTimeoutId);

      if (killed) {
        return; // Já rejeitado pelo timeout
      }

      // Processa linha final de stderr se houver
      if (stderrBuffer.trim()) {
        const trimmedLine = stderrBuffer.trim();
        const logEntry = `[Script] ${trimmedLine}`;
        if (logs) {
          addLogLine(logs, logEntry);
        }

        // Envia ao logger com heurística de severidade
        if (logger) {
          const upperLine = trimmedLine.toUpperCase();
          if (upperLine.startsWith('ERROR') || upperLine.startsWith('FATAL') || upperLine.includes('ERROR:')) {
            logger.error(trimmedLine);
          } else if (upperLine.startsWith('WARN') || upperLine.startsWith('WARNING') || upperLine.includes('WARN:')) {
            logger.warn(trimmedLine);
          } else {
            // stderr por padrão é tratado como erro
            logger.error(trimmedLine);
          }
        }
      }

      if (code === 0) {
        resolve({
          stdout: stdoutBuffer,
          stderr: stderrBuffer,
          exitCode: code,
        });
      } else {
        const error = new Error(`Script exited with code ${code}`);
        Object.assign(error, {
          code,
          stderr: stderrBuffer,
          stdout: stdoutBuffer,
        });
        reject(error);
      }
    });
  });
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
    const trimmed = stdout.trim();

    // Tenta encontrar o último bloco JSON balanceado {...}
    let jsonString: string | null = null;
    let braceCount = 0;
    let startIndex = -1;

    // Busca de trás para frente pelo último objeto JSON completo
    for (let i = trimmed.length - 1; i >= 0; i--) {
      if (trimmed[i] === '}') {
        if (braceCount === 0) {
          startIndex = i;
        }
        braceCount++;
      } else if (trimmed[i] === '{') {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          // Encontrou um bloco balanceado completo
          jsonString = trimmed.substring(i, startIndex + 1);
          break;
        }
      }
    }

    // Fallback: tenta parsear a saída completa após remover prefixos não-JSON
    if (!jsonString) {
      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = trimmed.substring(firstBrace, lastBrace + 1);
      }
    }

    if (!jsonString) {
      throw new Error('No valid JSON object found in script output');
    }

    const parsed = JSON.parse(jsonString);

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
    const snippet = stdout.substring(0, 500);
    throw new Error(`Failed to parse script output: ${error.message}\nOutput snippet: ${snippet}${stdout.length > 500 ? '...' : ''}`);
  }
}

/**
 * Adiciona log ao array mantendo limite de linhas
 * @param logs - Array de logs
 * @param line - Linha de log a adicionar
 */
function addLogLine(logs: string[], line: string): void {
  logs.push(line);
  if (logs.length > MAX_LOG_LINES) {
    // Mantém apenas as últimas MAX_LOG_LINES linhas
    logs.splice(0, logs.length - MAX_LOG_LINES);
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

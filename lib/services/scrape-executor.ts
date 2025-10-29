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
    // Resolve o caminho do script (passa código do tribunal para encontrar script específico)
    const scriptPath = resolveScriptPath(
      options.scrapeType,
      options.scrapeSubType,
      options.tribunalConfig.codigo
    );
    addLogLine(logs, `[Executor] Script path: ${scriptPath}`);
    addLogLine(logs, `[Executor] Tribunal: ${options.tribunalConfig.codigo || options.tribunalConfig.urlBase}`);

    // Log para terminal do servidor
    console.log(`[Executor] Script path: ${scriptPath}`);
    console.log(`[Executor] Tribunal: ${options.tribunalConfig.codigo || options.tribunalConfig.urlBase}`);

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

    // Log para terminal do servidor
    console.log(`[Executor] Starting script execution...`);

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
    console.log(`[Executor] Parsing script output...`);

    const result = parseScriptOutput(stdout);

    const duration = Date.now() - startTime;
    addLogLine(logs, `[Executor] Execution completed in ${duration}ms`);
    addLogLine(logs, `[Executor] Processes scraped: ${result.processosCount}`);

    // Envia logs finais ao logger
    options.logger?.info(`[Executor] Execution completed in ${duration}ms`);
    options.logger?.info(`[Executor] Processes scraped: ${result.processosCount}`);

    // Log para terminal do servidor
    console.log(`[Executor] Execution completed in ${duration}ms`);
    console.log(`[Executor] Processes scraped: ${result.processosCount}`);

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

    // Log para terminal do servidor
    console.error(`[Executor] Execution failed after ${duration}ms`);
    console.error(`[Executor] Error classified as: ${scrapingError.type} (retryable: ${scrapingError.retryable})`);
    console.error(`[Executor] Error: ${scrapingError.message}`);

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

      // Log para terminal do servidor
      console.log(attemptMsg);

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

      // Log para terminal do servidor
      console.error(failMsg);

      // Se não é retryable, falha imediatamente
      if (!lastError.retryable) {
        addLogLine(allLogs, `[Retry] Error is not retryable, aborting`);
        options.logger?.error(`Erro não recuperável, abortando`);
        console.error(`[Retry] Error is not retryable, aborting`);
        throw Object.assign(lastError, {
          message: `${lastError.message} (after ${attempt + 1} attempt${attempt > 0 ? 's' : ''})`
        });
      }

      // Se é a última tentativa, falha
      if (attempt === maxAttempts - 1) {
        addLogLine(allLogs, `[Retry] Max attempts reached, aborting`);
        options.logger?.error(`Máximo de tentativas atingido, abortando`);
        console.error(`[Retry] Max attempts reached, aborting`);
        throw Object.assign(lastError, {
          message: `${lastError.message} (after ${maxAttempts} attempts)`
        });
      }

      // Aguarda antes de tentar novamente
      const delay = SCRAPING_RETRY.retryDelays[attempt] || SCRAPING_RETRY.retryDelays[SCRAPING_RETRY.retryDelays.length - 1];
      addLogLine(allLogs, `[Retry] Waiting ${delay}ms before retry...`);
      options.logger?.info(`Aguardando ${Math.round(delay / 1000)}s antes de tentar novamente...`);
      console.log(`[Retry] Waiting ${delay}ms before retry...`);
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
        const timeoutMsg = `Script execution timed out after ${timeout}ms`;
        console.error(`[Executor] ${timeoutMsg}`);
        childProcess.kill('SIGTERM');

        // Escalona para SIGKILL após 5s se o processo não morrer
        killTimeoutId = setTimeout(() => {
          childProcess.kill('SIGKILL');
        }, 5000);

        reject(new Error(timeoutMsg));
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

          // Log para terminal do servidor (CRÍTICO - feedback visual em tempo real)
          console.log(logEntry);

          // Envia ao logger em tempo real com heurística de severidade
          if (logger) {
            const upperLine = trimmedLine.toUpperCase();
            if (upperLine.startsWith('ERROR') || upperLine.startsWith('FATAL') || upperLine.includes('ERROR:')) {
              logger.error(trimmedLine);
            } else if (upperLine.startsWith('WARN') || upperLine.startsWith('WARNING') || upperLine.includes('WARN:')) {
              logger.warn(trimmedLine);
            } else if (upperLine.startsWith('✅') || upperLine.includes('SUCCESS') || upperLine.includes('CONCLUÍ')) {
              logger.info(trimmedLine); // Logs de sucesso
            } else {
              // Por padrão, logs do script são informativos (não erros)
              logger.info(trimmedLine);
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

        // Log para terminal do servidor
        console.log(logEntry);

        // Envia ao logger com heurística de severidade
        if (logger) {
          const upperLine = trimmedLine.toUpperCase();
          if (upperLine.startsWith('ERROR') || upperLine.startsWith('FATAL') || upperLine.includes('ERROR:')) {
            logger.error(trimmedLine);
          } else if (upperLine.startsWith('WARN') || upperLine.startsWith('WARNING') || upperLine.includes('WARN:')) {
            logger.warn(trimmedLine);
          } else if (upperLine.startsWith('✅') || upperLine.includes('SUCCESS') || upperLine.includes('CONCLUÍ')) {
            logger.info(trimmedLine); // Logs de sucesso
          } else {
            // Por padrão, logs do script são informativos (não erros)
            logger.info(trimmedLine);
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
        console.error(`[Executor] Script exited with code ${code}`);

        // Tenta extrair erro real do JSON no stdout
        let errorMessage = `Script exited with code ${code}`;
        let errorDetails = null;

        try {
          const result = JSON.parse(stdoutBuffer);
          if (result.error) {
            errorMessage = result.error.message || errorMessage;
            errorDetails = result.error;
            console.error(`[Executor] Erro parseado do script:`, errorDetails);
          }
        } catch (e) {
          // stdout não é JSON válido ou não contém erro estruturado
          // Usa mensagem genérica
        }

        const error = new Error(errorMessage);
        Object.assign(error, {
          code,
          stderr: stderrBuffer,
          stdout: stdoutBuffer,
          errorDetails,
        });
        reject(error);
      }
    });
  });
}

/**
 * Normaliza resultado parseado para ScrapingResult
 * @param parsed - Objeto parseado do JSON
 * @returns ScrapingResult normalizado
 */
function normalizeResult(parsed: any): ScrapingResult {
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
    advogado: parsed.advogado,
    error: parsed.error,
  };
}

/**
 * Parseia a saída do script (JSON no stdout)
 * Utiliza estratégia em camadas para maior robustez
 *
 * @param stdout - Saída padrão do script
 * @returns Resultado da raspagem parseado
 * @throws Error se o parsing falhar em todas as estratégias
 */
function parseScriptOutput(stdout: string): ScrapingResult {
  const trimmed = stdout.trim();

  if (!trimmed) {
    throw new Error('Script output is empty');
  }

  // Camada 1: Parse direto (caso mais comum - script retorna apenas JSON)
  try {
    const parsed = JSON.parse(trimmed);
    return normalizeResult(parsed);
  } catch (directParseError) {
    // Continua para estratégias mais complexas
  }

  // Camada 2: Extração de primeiro/último bloco (fallback 1)
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(jsonCandidate);
      return normalizeResult(parsed);
    } catch (extractParseError) {
      // Continua para última estratégia
    }
  }

  // Camada 3: Busca linha por linha (fallback 2)
  const lines = trimmed.split('\n');

  // Tenta linhas individuais de trás pra frente
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('{')) {
      try {
        const parsed = JSON.parse(line);
        return normalizeResult(parsed);
      } catch {
        // Tenta próxima linha
      }
    }
  }

  // Camada 4: Multi-line JSON (fallback 3)
  let jsonBuffer = '';
  let foundStart = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('{')) foundStart = true;
    if (foundStart) jsonBuffer += line + '\n';
    if (trimmedLine.endsWith('}') && foundStart) {
      try {
        const parsed = JSON.parse(jsonBuffer);
        return normalizeResult(parsed);
      } catch {
        // Reset e continua
        jsonBuffer = '';
        foundStart = false;
      }
    }
  }

  // Todas as estratégias falharam
  throw new Error(
    `Failed to parse script output after trying all strategies.\n` +
    `Output length: ${stdout.length} chars\n` +
    `First 200 chars: ${stdout.substring(0, 200)}\n` +
    `Last 200 chars: ${stdout.substring(Math.max(0, stdout.length - 200))}`
  );
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
 * @param tribunalCodigo - Código do tribunal (opcional)
 * @returns true se o script existe
 */
export async function validateScriptExists(
  scrapeType: ScrapeType,
  scrapeSubType?: ScrapeSubType,
  tribunalCodigo?: string
): Promise<boolean> {
  try {
    const scriptPath = resolveScriptPath(scrapeType, scrapeSubType, tribunalCodigo);
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

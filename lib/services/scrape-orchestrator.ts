/**
 * Scrape Orchestrator
 * Orquestra a execução de jobs de raspagem
 */

import { prisma } from '@/lib/prisma';
import { scrapeQueue } from './scrape-queue';
import { executeScriptWithRetry, type CredenciaisParaLogin, type TribunalConfigParaRaspagem } from './scrape-executor';
import { compressJSON } from '@/lib/utils/compression';
import { SCRAPING_CONCURRENCY } from '@/config/scraping';
import { ScrapeJobStatus } from '@/lib/types/scraping';
import { ScrapingError, formatErrorForLog } from '@/lib/errors/scraping-errors';
import { createJobLogger, type LogEntry } from './scrape-logger';

/**
 * Limita execuções concorrentes dentro de um job
 */
class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrent: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.running >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

/**
 * Executa um job de raspagem completo
 *
 * @param jobId - ID do job a ser executado
 */
export async function executeJob(jobId: string): Promise<void> {
  console.log(`[Orchestrator] Starting job ${jobId}`);

  // Create logger for this job
  const logger = createJobLogger(jobId);

  try {
    // Busca o job com seus tribunais
    const job = await prisma.scrapeJob.findUnique({
      where: { id: jobId },
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
                credenciais: {
                  where: { credencial: { ativa: true } },
                  include: {
                    credencial: {
                      include: {
                        advogado: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    logger.info(`Iniciando raspagem de ${job.scrapeType}`, {
      tribunalCount: job.tribunals.length
    });

    // Atualiza status para running
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: ScrapeJobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    console.log(`[Orchestrator] Job ${jobId} has ${job.tribunals.length} tribunals to process`);

    // Limiter para controlar concorrência dentro do job
    const limiter = new ConcurrencyLimiter(SCRAPING_CONCURRENCY.maxConcurrentTribunals);

    // Executa raspagem para cada tribunal
    const results = await Promise.allSettled(
      job.tribunals.map(jobTribunal =>
        limiter.run(() => executeTribunalScraping(job, jobTribunal, logger))
      )
    );

    // Conta sucessos e falhas
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[Orchestrator] Job ${jobId} completed: ${successful} successful, ${failed} failed`);

    if (failed === 0) {
      logger.success(`Raspagem concluída com sucesso!`, {
        successful,
        total: job.tribunals.length
      });
    } else if (successful === 0) {
      logger.error(`Raspagem falhou em todos os tribunais`, {
        failed,
        total: job.tribunals.length
      });
    } else {
      logger.warn(`Raspagem concluída com falhas parciais`, {
        successful,
        failed,
        total: job.tribunals.length
      });
    }

    // Atualiza status final do job
    const finalStatus = failed === 0
      ? ScrapeJobStatus.COMPLETED
      : successful === 0
        ? ScrapeJobStatus.FAILED
        : ScrapeJobStatus.COMPLETED; // Completou com falhas parciais

    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
      },
    });

    // Persiste logs no banco
    await persistJobLogs(jobId, logger.getLogs());

    // Notifica a fila que o job terminou
    scrapeQueue.markAsCompleted(jobId, finalStatus === ScrapeJobStatus.FAILED ? 'failed' : 'completed');

    // Limpa logs da memória
    logger.clearLogs();
  } catch (error: any) {
    console.error(`[Orchestrator] Job ${jobId} failed with error:`, error);

    logger.error(`Erro crítico na execução do job: ${error.message}`);

    // Persiste logs no banco mesmo em caso de erro
    await persistJobLogs(jobId, logger.getLogs());

    // Atualiza job como failed
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: ScrapeJobStatus.FAILED,
        completedAt: new Date(),
      },
    });

    // Notifica a fila
    scrapeQueue.markAsCompleted(jobId, 'failed');

    // Limpa logs da memória
    logger.clearLogs();

    throw error;
  }
}

/**
 * Executa raspagem para um tribunal específico dentro de um job
 */
async function executeTribunalScraping(
  job: any,
  jobTribunal: any,
  logger: ReturnType<typeof createJobLogger>
): Promise<void> {
  const tribunalConfig = jobTribunal.tribunalConfig;
  const tribunalCodigo = `${tribunalConfig.tribunal.codigo}-${tribunalConfig.grau}`;

  console.log(`[Orchestrator] Starting scraping for ${tribunalCodigo} in job ${job.id}`);

  logger.info(`Iniciando raspagem: ${tribunalCodigo}`);

  try {
    // Atualiza status do tribunal para running
    await prisma.scrapeJobTribunal.update({
      where: { id: jobTribunal.id },
      data: { status: ScrapeJobStatus.RUNNING },
    });

    // Busca credenciais válidas para este tribunal
    logger.info(`Buscando credenciais para ${tribunalCodigo}...`);
    const credentials = await getCredentialsForTribunal(tribunalConfig.id);
    if (!credentials) {
      logger.error(`Credenciais não encontradas para ${tribunalCodigo}`);
      throw new Error(`No valid credentials found for tribunal ${tribunalCodigo}`);
    }

    logger.info(`Credenciais encontradas, iniciando autenticação...`);

    // Cria registro de execução
    const execution = await prisma.scrapeExecution.create({
      data: {
        scrapeJobId: job.id,
        tribunalConfigId: tribunalConfig.id,
        status: ScrapeJobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    console.log(`[Orchestrator] Created execution ${execution.id} for ${tribunalCodigo}`);

    // Prepara configuração para o executor
    const tribunalConfigForScraping: TribunalConfigParaRaspagem = {
      urlBase: tribunalConfig.urlBase,
      urlLoginSeam: tribunalConfig.urlLoginSeam,
      urlApi: tribunalConfig.urlApi,
      codigo: tribunalCodigo,
    };

    // Executa o script com retry
    logger.info(`Executando script de raspagem para ${tribunalCodigo}...`);
    logger.info('Conectando ao logger de tempo real...');
    const result = await executeScriptWithRetry({
      credentials,
      tribunalConfig: tribunalConfigForScraping,
      scrapeType: job.scrapeType,
      scrapeSubType: job.scrapeSubType,
      logger: {
        info: (msg: string, ctx?: any) => logger.info(msg, ctx),
        warn: (msg: string, ctx?: any) => logger.warn(msg, ctx),
        error: (msg: string, ctx?: any) => logger.error(msg, ctx),
      },
    });

    console.log(`[Orchestrator] Scraping completed for ${tribunalCodigo}: ${result.result.processosCount} processes`);

    logger.success(`Raspagem concluída para ${tribunalCodigo}`, {
      processosCount: result.result.processosCount
    });

    // Comprime os dados de resultado
    const compressedData = compressJSON({
      processos: result.result.processos,
    });

    // Converte logs de string para estrutura LogEntry
    const structuredLogs: LogEntry[] = result.logs.map(logLine => ({
      timestamp: new Date().toISOString(),
      level: 'info' as const,
      message: logLine,
    }));

    // Atualiza execução com resultado
    await prisma.scrapeExecution.update({
      where: { id: execution.id },
      data: {
        status: ScrapeJobStatus.COMPLETED,
        processosCount: result.result.processosCount,
        resultData: compressedData,
        logs: structuredLogs,
        completedAt: new Date(),
      },
    });

    // Atualiza status do tribunal para completed
    await prisma.scrapeJobTribunal.update({
      where: { id: jobTribunal.id },
      data: { status: ScrapeJobStatus.COMPLETED },
    });
  } catch (error: any) {
    console.error(`[Orchestrator] Failed to scrape ${tribunalCodigo}:`, error);

    logger.error(`Falha na raspagem de ${tribunalCodigo}: ${error.message}`);

    // Formata o erro como LogEntry estruturado
    const errorLogEntry: LogEntry = error instanceof ScrapingError
      ? {
          timestamp: new Date().toISOString(),
          level: 'error' as const,
          message: error.message,
          context: {
            type: error.type,
            retryable: error.retryable,
            ...formatErrorForLog(error),
          },
        }
      : {
          timestamp: new Date().toISOString(),
          level: 'error' as const,
          message: error.message,
          context: {
            type: 'unknown',
            retryable: false,
          },
        };

    // Atualiza execução como failed
    const execution = await prisma.scrapeExecution.findFirst({
      where: {
        scrapeJobId: job.id,
        tribunalConfigId: tribunalConfig.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (execution) {
      const existingLogs = execution.logs
        ? (Array.isArray(execution.logs) ? execution.logs as LogEntry[] : [execution.logs as LogEntry])
        : [];
      await prisma.scrapeExecution.update({
        where: { id: execution.id },
        data: {
          status: ScrapeJobStatus.FAILED,
          errorMessage: errorLogEntry.message,
          logs: [...existingLogs, errorLogEntry],
          completedAt: new Date(),
        },
      });
    }

    // Atualiza status do tribunal para failed
    await prisma.scrapeJobTribunal.update({
      where: { id: jobTribunal.id },
      data: { status: ScrapeJobStatus.FAILED },
    });

    throw error;
  }
}

/**
 * Busca credenciais válidas para um tribunal
 */
async function getCredentialsForTribunal(
  tribunalConfigId: string
): Promise<CredenciaisParaLogin | null> {
  const credencialTribunal = await prisma.credencialTribunal.findFirst({
    where: {
      tribunalConfigId,
      credencial: {
        ativa: true,
      },
    },
    include: {
      credencial: {
        include: {
          advogado: true,
        },
      },
    },
  });

  if (!credencialTribunal) {
    return null;
  }

  return {
    cpf: credencialTribunal.credencial.advogado.cpf,
    senha: credencialTribunal.credencial.senha,
    idAdvogado: credencialTribunal.credencial.advogado.idAdvogado || '',
  };
}

/**
 * Persiste logs do job no banco de dados
 */
async function persistJobLogs(jobId: string, logs: LogEntry[]): Promise<void> {
  if (logs.length === 0) return;

  try {
    // Atualiza o job com os logs em formato JSON
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        logs: JSON.stringify(logs),
      },
    });

    console.log(`[Orchestrator] Persisted ${logs.length} logs for job ${jobId}`);
  } catch (error: any) {
    console.error(`[Orchestrator] Failed to persist logs for job ${jobId}:`, error);
    // Não lança erro para não interromper o fluxo
  }
}

/**
 * Inicializa o orchestrator e conecta com a fila
 */
export function initializeOrchestrator(): void {
  console.log('[Orchestrator] Initializing...');

  // Define o callback de execução na fila
  scrapeQueue.setExecutionCallback(async (jobId: string) => {
    try {
      await executeJob(jobId);
    } catch (error: any) {
      console.error(`[Orchestrator] Error executing job ${jobId}:`, error);
    }
  });

  console.log('[Orchestrator] Initialized and connected to queue');

  // Verifica se há jobs interrompidos e marca como failed
  checkForInterruptedJobs();
}

/**
 * Verifica e marca jobs que foram interrompidos (servidor reiniciou)
 */
async function checkForInterruptedJobs(): Promise<void> {
  try {
    const interruptedJobs = await prisma.scrapeJob.findMany({
      where: {
        status: ScrapeJobStatus.RUNNING,
      },
    });

    if (interruptedJobs.length > 0) {
      console.log(`[Orchestrator] Found ${interruptedJobs.length} interrupted jobs`);

      await Promise.all(
        interruptedJobs.map(job =>
          prisma.scrapeJob.update({
            where: { id: job.id },
            data: {
              status: ScrapeJobStatus.FAILED,
              completedAt: new Date(),
            },
          })
        )
      );

      console.log('[Orchestrator] Marked interrupted jobs as failed');
    }
  } catch (error: any) {
    console.error('[Orchestrator] Error checking for interrupted jobs:', error);
  }
}

/**
 * Para o orchestrator (cleanup)
 */
export function stopOrchestrator(): void {
  console.log('[Orchestrator] Stopping...');
  scrapeQueue.stop();
  console.log('[Orchestrator] Stopped');
}

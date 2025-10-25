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
        limiter.run(() => executeTribunalScraping(job, jobTribunal))
      )
    );

    // Conta sucessos e falhas
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[Orchestrator] Job ${jobId} completed: ${successful} successful, ${failed} failed`);

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

    // Notifica a fila que o job terminou
    scrapeQueue.markAsCompleted(jobId, finalStatus === ScrapeJobStatus.FAILED ? 'failed' : 'completed');
  } catch (error: any) {
    console.error(`[Orchestrator] Job ${jobId} failed with error:`, error);

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

    throw error;
  }
}

/**
 * Executa raspagem para um tribunal específico dentro de um job
 */
async function executeTribunalScraping(
  job: any,
  jobTribunal: any
): Promise<void> {
  const tribunalConfig = jobTribunal.tribunalConfig;
  const tribunalCodigo = `${tribunalConfig.tribunal.codigo}-${tribunalConfig.grau}`;

  console.log(`[Orchestrator] Starting scraping for ${tribunalCodigo} in job ${job.id}`);

  try {
    // Atualiza status do tribunal para running
    await prisma.scrapeJobTribunal.update({
      where: { id: jobTribunal.id },
      data: { status: ScrapeJobStatus.RUNNING },
    });

    // Busca credenciais válidas para este tribunal
    const credentials = await getCredentialsForTribunal(tribunalConfig.id);
    if (!credentials) {
      throw new Error(`No valid credentials found for tribunal ${tribunalCodigo}`);
    }

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
    const result = await executeScriptWithRetry({
      credentials,
      tribunalConfig: tribunalConfigForScraping,
      scrapeType: job.scrapeType,
      scrapeSubType: job.scrapeSubType,
    });

    console.log(`[Orchestrator] Scraping completed for ${tribunalCodigo}: ${result.result.processosCount} processes`);

    // Comprime os dados de resultado
    const compressedData = compressJSON({
      processos: result.result.processos,
    });

    // Atualiza execução com resultado
    await prisma.scrapeExecution.update({
      where: { id: execution.id },
      data: {
        status: ScrapeJobStatus.COMPLETED,
        processosCount: result.result.processosCount,
        resultData: compressedData,
        executionLogs: result.logs.join('\n'),
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

    // Formata o erro
    const errorLog = error instanceof ScrapingError
      ? formatErrorForLog(error)
      : { type: 'unknown', message: error.message, retryable: false, timestamp: new Date().toISOString() };

    // Atualiza execução como failed
    const execution = await prisma.scrapeExecution.findFirst({
      where: {
        scrapeJobId: job.id,
        tribunalConfigId: tribunalConfig.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (execution) {
      await prisma.scrapeExecution.update({
        where: { id: execution.id },
        data: {
          status: ScrapeJobStatus.FAILED,
          errorMessage: errorLog.message,
          executionLogs: execution.executionLogs
            ? `${execution.executionLogs}\n\n[ERROR] ${JSON.stringify(errorLog, null, 2)}`
            : `[ERROR] ${JSON.stringify(errorLog, null, 2)}`,
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

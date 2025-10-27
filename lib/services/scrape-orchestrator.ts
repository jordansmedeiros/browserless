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
import { persistProcessos } from './scrape-data-persister';

/**
 * Controle de polling
 */
let pollingInterval: NodeJS.Timeout | null = null;
let isPolling: boolean = false;
let pollingIterationCount: number = 0;

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

    // Log para terminal do servidor
    console.log(`[Orchestrator] Iniciando raspagem de ${job.scrapeType} para ${job.tribunals.length} tribunais`);

    // Valida que o job está em running (já deve ter sido marcado pelo claim atômico)
    if (job.status !== ScrapeJobStatus.RUNNING) {
      console.warn(`[Orchestrator] Job ${jobId} status is ${job.status}, expected RUNNING - updating`);
      await prisma.scrapeJob.update({
        where: { id: jobId },
        data: {
          status: ScrapeJobStatus.RUNNING,
          startedAt: new Date(),
        },
      });
    }

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
  console.log(`[Orchestrator] Iniciando raspagem: ${tribunalCodigo}`);

  try {
    // Atualiza status do tribunal para running
    await prisma.scrapeJobTribunal.update({
      where: { id: jobTribunal.id },
      data: { status: ScrapeJobStatus.RUNNING },
    });

    // Busca credenciais válidas para este tribunal
    logger.info(`Buscando credenciais para ${tribunalCodigo}...`);
    console.log(`[Orchestrator] Buscando credenciais para ${tribunalCodigo}...`);

    const credentials = await getCredentialsForTribunal(tribunalConfig.id);
    if (!credentials) {
      logger.error(`Credenciais não encontradas para ${tribunalCodigo}`);
      console.error(`[Orchestrator] Credenciais não encontradas para ${tribunalCodigo}`);
      throw new Error(`No valid credentials found for tribunal ${tribunalCodigo}`);
    }

    logger.info(`Credenciais encontradas, iniciando autenticação...`);
    console.log(`[Orchestrator] Credenciais encontradas para ${tribunalCodigo}, iniciando autenticação...`);

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
    console.log(`[Orchestrator] Executando script de raspagem para ${tribunalCodigo}...`);

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
    console.log(`[Orchestrator] Raspagem concluída para ${tribunalCodigo}: ${result.result.processosCount} processos`);

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
        logs: structuredLogs as any, // TypeScript cast - array é válido para Json
        completedAt: new Date(),
      },
    });

    // Salva processos nas tabelas específicas por tipo
    try {
      logger.info(`Salvando ${result.result.processosCount} processos no banco...`);
      console.log(`[Orchestrator] Salvando ${result.result.processosCount} processos no banco...`);

      const savedCount = await persistProcessos(execution.id, job.scrapeType, result.result);

      logger.success(`${savedCount} processos salvos no banco com sucesso`);
      console.log(`[Orchestrator] ${savedCount} processos salvos no banco com sucesso`);
    } catch (error: any) {
      logger.error(`Erro ao salvar processos no banco: ${error.message}`);
      console.error(`[Orchestrator] Erro ao persistir processos:`, error);
      // Não lança erro para não falhar a execução, apenas loga
    }

    // Atualiza ID do advogado no banco se foi retornado pela raspagem
    if (result.result.advogado?.idAdvogado && result.result.advogado?.cpf) {
      try {
        logger.info(`Atualizando ID do advogado no banco...`);
        console.log(`[Orchestrator] Atualizando ID do advogado ${result.result.advogado.cpf} no banco...`);

        await updateAdvogadoIdFromScraping(
          result.result.advogado.cpf,
          result.result.advogado.idAdvogado,
          result.result.advogado.nome
        );

        logger.success(`ID do advogado atualizado: ${result.result.advogado.idAdvogado}`);
        console.log(`[Orchestrator] ID do advogado atualizado: ${result.result.advogado.idAdvogado}`);
      } catch (error: any) {
        logger.error(`Erro ao atualizar ID do advogado: ${error.message}`);
        console.error(`[Orchestrator] Erro ao atualizar advogado:`, error);
        // Não lança erro para não falhar a execução
      }
    }

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
        ? (Array.isArray(execution.logs) ? execution.logs as unknown as LogEntry[] : [execution.logs as unknown as LogEntry])
        : [];
      await prisma.scrapeExecution.update({
        where: { id: execution.id },
        data: {
          status: ScrapeJobStatus.FAILED,
          errorMessage: errorLogEntry.message,
          logs: [...existingLogs, errorLogEntry] as any, // Array is valid for Json
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
 * Atualiza ID do advogado no banco com dados obtidos na raspagem
 */
async function updateAdvogadoIdFromScraping(
  cpf: string,
  idAdvogado: string,
  nome?: string
): Promise<void> {
  console.log(`[Orchestrator] Atualizando ID do advogado ${cpf} -> ${idAdvogado}`);

  // Busca advogado pelo CPF
  const advogado = await prisma.advogado.findFirst({
    where: { cpf }
  });

  if (!advogado) {
    console.warn(`[Orchestrator] Advogado com CPF ${cpf} não encontrado no banco`);
    return;
  }

  // Atualiza apenas se o ID não estiver configurado ou for diferente
  if (!advogado.idAdvogado || advogado.idAdvogado !== idAdvogado) {
    await prisma.advogado.update({
      where: { id: advogado.id },
      data: {
        idAdvogado,
        // Atualiza nome também se fornecido e diferente
        ...(nome && nome !== advogado.nome ? { nome } : {}),
      }
    });
    console.log(`[Orchestrator] ID do advogado atualizado: ${advogado.nome} -> ${idAdvogado}`);
  } else {
    console.log(`[Orchestrator] ID do advogado já está configurado corretamente`);
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
    // Atualiza o job com os logs em formato JSON nativo
    // Salva array JSON diretamente (assumindo coluna do tipo Json no schema)
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        logs: logs as any,
      },
    });

    console.log(`[Orchestrator] Persisted ${logs.length} logs for job ${jobId}`);
  } catch (error: any) {
    console.error(`[Orchestrator] Failed to persist logs for job ${jobId}:`, error);
    // Não lança erro para não interromper o fluxo
  }
}

/**
 * Verifica e processa jobs pendentes no banco de dados
 */
async function pollPendingJobs(): Promise<void> {
  // Evita execuções concorrentes do polling
  if (isPolling) {
    console.log('[Orchestrator] Polling already in progress, skipping...');
    return;
  }

  isPolling = true;
  pollingIterationCount++;

  try {
    // Verifica jobs travados a cada 10 iterações
    if (pollingIterationCount % 10 === 0) {
      await checkForStuckJobs();
    }

    // Verifica capacidade disponível
    if (!scrapeQueue.hasCapacity()) {
      console.log('[Orchestrator] No capacity available for new jobs');
      return;
    }

    const availableSlots = SCRAPING_CONCURRENCY.maxConcurrentJobs - scrapeQueue.getStats().running;

    // Claim atômico de jobs dentro de uma transação
    const claimedJobs = await prisma.$transaction(async (tx) => {
      // 1. Busca jobs pendentes do banco
      const pendingJobs = await tx.scrapeJob.findMany({
        where: {
          status: ScrapeJobStatus.PENDING,
          startedAt: null,
        },
        orderBy: {
          createdAt: 'asc', // FIFO
        },
        take: availableSlots,
      });

      if (pendingJobs.length === 0) {
        return [];
      }

      const jobIds = pendingJobs.map(j => j.id);
      const now = new Date();

      // 2. Atualiza jobs para status 'running' com startedAt
      const updateResult = await tx.scrapeJob.updateMany({
        where: {
          id: { in: jobIds },
          status: ScrapeJobStatus.PENDING, // Garante que ainda estão pending
          startedAt: null,
        },
        data: {
          status: ScrapeJobStatus.RUNNING,
          startedAt: now,
        },
      });

      // 3. Valida que o número de linhas atualizadas corresponde ao esperado
      if (updateResult.count !== pendingJobs.length) {
        console.warn(`[Orchestrator] Claimed ${updateResult.count} jobs but found ${pendingJobs.length} - race condition detected`);

        // Re-busca apenas os jobs que foram efetivamente atualizados
        const actuallyClaimedJobs = await tx.scrapeJob.findMany({
          where: {
            id: { in: jobIds },
            status: ScrapeJobStatus.RUNNING,
            startedAt: now,
          },
        });

        return actuallyClaimedJobs;
      }

      return pendingJobs;
    });

    if (claimedJobs.length > 0) {
      const stats = scrapeQueue.getStats();
      console.log(`[Orchestrator] Claimed ${claimedJobs.length} jobs atomically, capacity: ${stats.running}/${stats.capacity}`);

      // Processa cada job claimed
      for (const job of claimedJobs) {
        try {
          // Marca como running na fila local
          scrapeQueue.markAsRunning(job.id);

          // Executa job de forma assíncrona (sem await)
          executeJob(job.id).catch((error) => {
            console.error(`[Orchestrator] Error executing job ${job.id}:`, error);
          });
        } catch (error: any) {
          console.error(`[Orchestrator] Failed to start job ${job.id}:`, error);
          // Continua para próximo job sem interromper o polling
        }
      }
    }
  } catch (error: any) {
    console.error('[Orchestrator] Error during polling:', error);
  } finally {
    isPolling = false;
  }
}

/**
 * Verifica e marca jobs que ficaram travados em 'running' por muito tempo
 */
async function checkForStuckJobs(): Promise<void> {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const stuckJobs = await prisma.scrapeJob.findMany({
      where: {
        status: ScrapeJobStatus.RUNNING,
        startedAt: {
          lt: twoHoursAgo,
        },
      },
    });

    if (stuckJobs.length > 0) {
      console.log(`[Orchestrator] Found ${stuckJobs.length} stuck jobs, marking as failed`);

      await Promise.all(
        stuckJobs.map(job =>
          prisma.scrapeJob.update({
            where: { id: job.id },
            data: {
              status: ScrapeJobStatus.FAILED,
              completedAt: new Date(),
            },
          })
        )
      );
    }
  } catch (error: any) {
    console.error('[Orchestrator] Error checking for stuck jobs:', error);
  }
}

/**
 * Inicia o polling de jobs pendentes
 */
function startPolling(): void {
  if (pollingInterval !== null) {
    console.log('[Orchestrator] Polling already started');
    return;
  }

  console.log('[Orchestrator] Started polling for pending jobs (interval: 5s)');

  // Executa primeira verificação imediatamente
  pollPendingJobs();

  // Agenda verificações periódicas a cada 5 segundos
  pollingInterval = setInterval(() => {
    pollPendingJobs();
  }, 5000);
}

/**
 * Para o polling de jobs pendentes
 */
function stopPolling(): void {
  if (pollingInterval !== null) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[Orchestrator] Stopped polling');
  }
}

/**
 * Inicializa o orchestrator e conecta com a fila
 */
export function initializeOrchestrator(): void {
  console.log('[Orchestrator] Initializing...');

  console.log('[Orchestrator] Initialized with polling-based job discovery');

  // Verifica se há jobs interrompidos e marca como failed
  checkForInterruptedJobs();

  // Inicia polling de jobs pendentes
  startPolling();
}

/**
 * Verifica e marca jobs que foram interrompidos (servidor reiniciou)
 * Aplica filtro de tempo para evitar falsos positivos em jobs recém-iniciados
 */
async function checkForInterruptedJobs(): Promise<void> {
  try {
    // Considera interrompidos apenas jobs com mais de 15 minutos em RUNNING
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const interruptedJobs = await prisma.scrapeJob.findMany({
      where: {
        status: ScrapeJobStatus.RUNNING,
        startedAt: {
          lt: fifteenMinutesAgo,
        },
      },
    });

    if (interruptedJobs.length > 0) {
      console.log(
        `[Orchestrator] Found ${interruptedJobs.length} interrupted jobs (running > 15min), marking as failed`
      );

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
    } else {
      console.log('[Orchestrator] No interrupted jobs found (checked jobs running > 15min)');
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
  stopPolling();
  scrapeQueue.stop();
  console.log('[Orchestrator] Stopped');
}

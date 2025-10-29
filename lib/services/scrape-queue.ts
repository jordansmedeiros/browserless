/**
 * Scrape Queue
 * Gerencia controle de concorrência de jobs em execução
 * NOTA: Jobs não são mais enfileirados aqui - o orchestrator usa polling no banco
 */

import { SCRAPING_CONCURRENCY } from '@/config/scraping';
import { ScrapeJobStatus } from '@/lib/types/scraping';

/**
 * Item na fila de execução
 */
interface QueueItem {
  jobId: string;
  enqueuedAt: Date;
  startedAt?: Date;
}

/**
 * Status do job na fila
 */
export interface JobQueueStatus {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'not_found';
  position?: number; // Posição na fila (apenas para jobs em espera)
  enqueuedAt?: Date;
  startedAt?: Date;
}

/**
 * Classe singleton para gerenciar a fila de jobs de raspagem
 */
class ScrapeQueue {
  private static instance: ScrapeQueue;

  /** Fila de jobs aguardando execução */
  private queue: QueueItem[] = [];

  /** Set de IDs de jobs atualmente em execução */
  private running: Set<string> = new Set();

  /** Map de jobs completados (mantém por 1 hora para consulta) */
  private completed: Map<string, { status: 'completed' | 'failed'; completedAt: Date }> = new Map();

  /** Intervalo de limpeza de jobs antigos */
  private cleanupInterval: NodeJS.Timeout | null = null;

  /** Processamento está ativo? */
  private processing = false;

  private constructor() {
    // Singleton - construtor privado
    this.startCleanupInterval();
  }

  /**
   * Retorna a instância singleton da fila
   */
  public static getInstance(): ScrapeQueue {
    if (!ScrapeQueue.instance) {
      ScrapeQueue.instance = new ScrapeQueue();
    }
    return ScrapeQueue.instance;
  }

  /**
   * Adiciona um job à fila
   * @deprecated Jobs são descobertos via polling - não use este método
   * @param jobId - ID do job a ser enfileirado
   * @throws Error sempre - método não deve mais ser utilizado
   */
  public enqueue(jobId: string): void {
    throw new Error(
      `[Queue] enqueue() is deprecated and should not be called - orchestrator uses database polling to discover jobs. Job ${jobId} should be created with status PENDING in the database.`
    );
  }

  /**
   * Remove um job da fila (cancelamento)
   *
   * @param jobId - ID do job a ser removido
   * @returns true se o job foi removido da fila
   */
  public dequeue(jobId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.jobId !== jobId);

    const removed = initialLength !== this.queue.length;
    if (removed) {
      console.log(`[Queue] Job ${jobId} removed from queue`);
    }

    return removed;
  }

  /**
   * Marca um job como iniciado (move da fila para running)
   * Called by orchestrator when starting a job from polling
   * @param jobId - ID do job
   */
  public markAsRunning(jobId: string): void {
    // Remove da fila se estiver lá
    this.dequeue(jobId);

    // Adiciona ao set de running
    this.running.add(jobId);

    console.log(`[Queue] Job ${jobId} marked as running. Running: ${this.running.size}/${SCRAPING_CONCURRENCY.maxConcurrentJobs}`);
  }

  /**
   * Marca um job como completado ou falho
   * Called by orchestrator when job finishes
   * @param jobId - ID do job
   * @param status - Status final (aceita qualquer case, normalizado internamente)
   */
  public markAsCompleted(jobId: string, status: ScrapeJobStatus.COMPLETED | ScrapeJobStatus.FAILED | 'completed' | 'failed'): void {
    // Normaliza status para lowercase antes de qualquer comparação
    const normalizedStatus = String(status).toLowerCase();

    // Valida status recebido
    if (normalizedStatus !== 'completed' && normalizedStatus !== 'failed') {
      console.warn(`[Queue] Invalid status received: ${status}, treating as 'failed'`);
    }

    // Remove do set de running
    this.running.delete(jobId);

    // Determina status interno final
    const internalStatus: 'completed' | 'failed' = normalizedStatus === 'completed' ? 'completed' : 'failed';

    // Adiciona ao map de completed
    this.completed.set(jobId, {
      status: internalStatus,
      completedAt: new Date(),
    });

    console.log(`[Queue] Job ${jobId} marked as ${internalStatus}. Running: ${this.running.size}`);
  }

  /**
   * Verifica se há capacidade para executar mais jobs
   * Used by orchestrator polling to check available slots
   * @returns true se há slots disponíveis
   */
  public hasCapacity(): boolean {
    return this.running.size < SCRAPING_CONCURRENCY.maxConcurrentJobs;
  }

  /**
   * Retorna o próximo job da fila sem removê-lo
   *
   * @returns Item da fila ou undefined se vazia
   */
  public peek(): QueueItem | undefined {
    return this.queue[0];
  }

  /**
   * Retorna o status de um job na fila
   *
   * @param jobId - ID do job
   * @returns Status do job
   */
  public getJobStatus(jobId: string): JobQueueStatus {
    // Verifica se está em running
    if (this.running.has(jobId)) {
      return {
        jobId,
        status: 'running',
      };
    }

    // Verifica se está na fila
    const queueIndex = this.queue.findIndex(item => item.jobId === jobId);
    if (queueIndex !== -1) {
      const item = this.queue[queueIndex];
      return {
        jobId,
        status: 'queued',
        position: queueIndex + 1,
        enqueuedAt: item.enqueuedAt,
      };
    }

    // Verifica se está em completed
    const completedStatus = this.completed.get(jobId);
    if (completedStatus) {
      return {
        jobId,
        status: completedStatus.status,
      };
    }

    // Não encontrado
    return {
      jobId,
      status: 'not_found',
    };
  }

  /**
   * Retorna estatísticas da fila
   */
  public getStats() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      capacity: SCRAPING_CONCURRENCY.maxConcurrentJobs,
      hasCapacity: this.hasCapacity(),
    };
  }


  /**
   * Verifica se um job está na fila de espera
   */
  private isInQueue(jobId: string): boolean {
    return this.queue.some(item => item.jobId === jobId);
  }

  /**
   * Inicia intervalo de limpeza de jobs completados antigos
   */
  private startCleanupInterval(): void {
    // Limpa jobs completados a cada hora
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldJobs();
    }, 60 * 60 * 1000); // 1 hora
  }

  /**
   * Remove jobs completados com mais de 1 hora
   */
  private cleanupOldJobs(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleaned = 0;

    for (const [jobId, data] of this.completed.entries()) {
      if (data.completedAt < oneHourAgo) {
        this.completed.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Queue] Cleaned ${cleaned} old completed jobs`);
    }
  }

  /**
   * Para o intervalo de limpeza (cleanup)
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.processing = false;
    console.log('[Queue] Stopped');
  }
}

/**
 * Exporta a instância singleton
 */
export const scrapeQueue = ScrapeQueue.getInstance();

/**
 * Exporta a classe para testes
 */
export { ScrapeQueue };

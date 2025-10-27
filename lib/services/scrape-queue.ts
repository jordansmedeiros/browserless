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

  /** Callback para execução de jobs (será substituído pelo orchestrator) */
  private triggerJobExecution: (jobId: string) => Promise<void>;

  private constructor() {
    // Singleton - construtor privado
    this.startCleanupInterval();

    // Define implementação padrão
    this.triggerJobExecution = async (jobId: string) => {
      console.log(`[Queue] Default triggerJobExecution called for job ${jobId} - orchestrator callback not set!`);
    };
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
   * @throws Error se o job já estiver na fila ou em execução
   */
  public enqueue(jobId: string): void {
    console.warn('[Queue] DEPRECATED: enqueue() should not be called - orchestrator uses polling');

    // Verifica se já está na fila ou em execução
    if (this.isInQueue(jobId) || this.running.has(jobId)) {
      throw new Error(`Job ${jobId} is already queued or running`);
    }

    // Adiciona à fila
    this.queue.push({
      jobId,
      enqueuedAt: new Date(),
    });

    console.log(`[Queue] Job ${jobId} enqueued. Queue size: ${this.queue.length}`);

    // Inicia processamento se não estiver ativo
    if (!this.processing) {
      this.startProcessing();
    }
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
   * @param status - Status final (completed ou failed)
   */
  public markAsCompleted(jobId: string, status: 'completed' | 'failed'): void {
    // Remove do set de running
    this.running.delete(jobId);

    // Adiciona ao map de completed
    this.completed.set(jobId, {
      status,
      completedAt: new Date(),
    });

    console.log(`[Queue] Job ${jobId} marked as ${status}. Running: ${this.running.size}`);
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
   * Inicia o processamento da fila
   * @deprecated Processing is now handled by orchestrator polling
   */
  private startProcessing(): void {
    if (this.processing) return;

    // Early return if queue is empty (no jobs to process)
    if (this.queue.length === 0) {
      console.log('[Queue] DEPRECATED: startProcessing called but queue is empty');
      return;
    }

    this.processing = true;
    console.log('[Queue] Started processing');

    this.processNextIfAvailable();
  }

  /**
   * Processa o próximo job se houver capacidade
   */
  private async processNextIfAvailable(): Promise<void> {
    // Verifica capacidade
    if (!this.hasCapacity()) {
      console.log('[Queue] No capacity available, waiting...');
      return;
    }

    // Pega próximo da fila
    const next = this.peek();
    if (!next) {
      console.log('[Queue] Queue is empty, stopping processing');
      this.processing = false;
      return;
    }

    // Marca como running
    this.markAsRunning(next.jobId);

    // Delega a execução para o orchestrator
    // (o orchestrator chamará markAsCompleted quando terminar)
    // IMPORTANTE: Não await aqui para permitir processamento concorrente
    // Erros são tratados dentro do callback do orchestrator
    this.triggerJobExecution(next.jobId).catch((error) => {
      console.error(`[Queue] Unhandled error in job ${next.jobId}:`, error);
      // Marca como failed em caso de erro não tratado
      this.markAsCompleted(next.jobId, 'failed');
    });

    // Processa próximo se ainda houver capacidade
    if (this.hasCapacity() && this.queue.length > 0) {
      setImmediate(() => this.processNextIfAvailable());
    }
  }


  /**
   * Define o callback para execução de jobs
   * @deprecated Callback não é mais usado - orchestrator usa polling
   * @param callback - Função que será chamada para executar um job
   */
  public setExecutionCallback(callback: (jobId: string) => Promise<void>): void {
    console.warn('[Queue] DEPRECATED: setExecutionCallback() is no longer used');
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

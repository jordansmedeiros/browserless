/**
 * Scheduled Scrape Service
 * Serviço que gerencia agendamentos de raspagens usando node-cron
 */

import cron from 'node-cron';
import { prisma } from '@/lib/db';
import { getNextRunTime } from '@/lib/utils/cron-helpers';
import type { ScheduledScrape } from '@prisma/client';

/**
 * Map interno para rastrear jobs ativos
 */
const activeTasks = new Map<string, cron.ScheduledTask>();

/**
 * Flag de inicialização
 */
let isInitialized = false;

/**
 * Inicializa o scheduler carregando todos os agendamentos ativos
 */
export async function initializeScheduler(): Promise<void> {
  if (isInitialized) {
    console.log('[ScheduledScrapeService] Already initialized, skipping');
    return;
  }

  try {
    console.log('[ScheduledScrapeService] Initializing...');

    // Carregar todos os agendamentos ativos
    const activeSchedules = await prisma.scheduledScrape.findMany({
      where: { active: true },
      include: {
        credencial: {
          include: {
            advogado: true,
          },
        },
      },
    });

    console.log(`[ScheduledScrapeService] Found ${activeSchedules.length} active schedules`);

    // Registrar cron job para cada agendamento
    for (const schedule of activeSchedules) {
      try {
        scheduleJob(schedule);

        // Atualizar nextRunAt no banco
        const nextRun = getNextRunTime(schedule.cronExpression, schedule.timezone);
        await prisma.scheduledScrape.update({
          where: { id: schedule.id },
          data: { nextRunAt: nextRun },
        });
      } catch (error) {
        console.error(`[ScheduledScrapeService] Failed to schedule job ${schedule.id}:`, error);
      }
    }

    isInitialized = true;
    console.log(`[ScheduledScrapeService] Initialized with ${activeTasks.size} active schedules`);
  } catch (error) {
    console.error('[ScheduledScrapeService] Initialization failed:', error);
    throw error;
  }
}

/**
 * Registra um cron job para um agendamento
 */
export function scheduleJob(schedule: ScheduledScrape): void {
  try {
    // Criar cron task
    const task = cron.schedule(
      schedule.cronExpression,
      async () => {
        await executeScheduledScrape(schedule.id);
      },
      {
        scheduled: true,
        timezone: schedule.timezone,
      }
    );

    // Armazenar task no Map
    activeTasks.set(schedule.id, task);

    console.log(`[ScheduledScrapeService] Scheduled job ${schedule.id}: ${schedule.name}`);
  } catch (error) {
    console.error(`[ScheduledScrapeService] Failed to schedule job ${schedule.id}:`, error);
    throw error;
  }
}

/**
 * Executa uma raspagem agendada
 */
export async function executeScheduledScrape(scheduleId: string): Promise<void> {
  try {
    console.log(`[ScheduledScrapeService] Executing schedule ${scheduleId}`);

    // Buscar agendamento (verificar se ainda está ativo)
    const schedule = await prisma.scheduledScrape.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      console.error(`[ScheduledScrapeService] Schedule ${scheduleId} not found`);
      return;
    }

    if (!schedule.active) {
      console.log(`[ScheduledScrapeService] Schedule ${scheduleId} is inactive, skipping`);
      return;
    }

    // Criar scrape job via action
    // Importação dinâmica para evitar dependência circular
    const { createScrapeJobAction } = await import('@/app/actions/pje');

    const tribunalIds = schedule.tribunalConfigIds as string[];

    const result = await createScrapeJobAction({
      credencialId: schedule.credencialId,
      tribunalIds,
      scrapeType: schedule.scrapeType as any,
      scrapeSubType: schedule.scrapeSubType as any,
    });

    if (result.success && result.data) {
      console.log(`[ScheduledScrapeService] Created job ${result.data.jobId} for schedule ${scheduleId}`);

      // Atualizar campos no banco
      const nextRun = getNextRunTime(schedule.cronExpression, schedule.timezone);
      await prisma.scheduledScrape.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          lastJobId: result.data.jobId,
          runCount: { increment: 1 },
          nextRunAt: nextRun,
        },
      });
    } else {
      console.error(`[ScheduledScrapeService] Failed to create job for schedule ${scheduleId}:`, result.error);
    }
  } catch (error) {
    console.error(`[ScheduledScrapeService] Error executing schedule ${scheduleId}:`, error);
    // Não propagar erro - scheduler deve continuar funcionando
  }
}

/**
 * Adiciona novo agendamento em runtime
 */
export function addSchedule(schedule: ScheduledScrape): void {
  try {
    scheduleJob(schedule);
    console.log(`[ScheduledScrapeService] Added schedule ${schedule.id}`);
  } catch (error) {
    console.error(`[ScheduledScrapeService] Failed to add schedule ${schedule.id}:`, error);
    throw error;
  }
}

/**
 * Atualiza agendamento existente
 */
export function updateSchedule(scheduleId: string, schedule: ScheduledScrape): void {
  try {
    // Remove job antigo
    removeSchedule(scheduleId);

    // Adiciona novo job
    scheduleJob(schedule);

    console.log(`[ScheduledScrapeService] Updated schedule ${scheduleId}`);
  } catch (error) {
    console.error(`[ScheduledScrapeService] Failed to update schedule ${scheduleId}:`, error);
    throw error;
  }
}

/**
 * Remove agendamento
 */
export function removeSchedule(scheduleId: string): void {
  try {
    const task = activeTasks.get(scheduleId);

    if (task) {
      task.stop();
      activeTasks.delete(scheduleId);
      console.log(`[ScheduledScrapeService] Removed schedule ${scheduleId}`);
    }
  } catch (error) {
    console.error(`[ScheduledScrapeService] Failed to remove schedule ${scheduleId}:`, error);
    throw error;
  }
}

/**
 * Pausa agendamento sem remover
 */
export async function pauseSchedule(scheduleId: string): Promise<void> {
  try {
    const task = activeTasks.get(scheduleId);

    if (task) {
      task.stop();
      console.log(`[ScheduledScrapeService] Paused schedule ${scheduleId}`);
    }
  } catch (error) {
    console.error(`[ScheduledScrapeService] Failed to pause schedule ${scheduleId}:`, error);
    throw error;
  }
}

/**
 * Retoma agendamento pausado
 */
export async function resumeSchedule(scheduleId: string): Promise<void> {
  try {
    // Buscar agendamento do banco
    const schedule = await prisma.scheduledScrape.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Remove task antiga se existir
    const existingTask = activeTasks.get(scheduleId);
    if (existingTask) {
      existingTask.stop();
      activeTasks.delete(scheduleId);
    }

    // Cria nova task
    scheduleJob(schedule);

    console.log(`[ScheduledScrapeService] Resumed schedule ${scheduleId}`);
  } catch (error) {
    console.error(`[ScheduledScrapeService] Failed to resume schedule ${scheduleId}:`, error);
    throw error;
  }
}

/**
 * Para todos os cron jobs ativos
 */
export function stopScheduler(): void {
  try {
    console.log(`[ScheduledScrapeService] Stopping ${activeTasks.size} active schedules`);

    for (const [scheduleId, task] of activeTasks.entries()) {
      task.stop();
      console.log(`[ScheduledScrapeService] Stopped schedule ${scheduleId}`);
    }

    activeTasks.clear();
    isInitialized = false;

    console.log('[ScheduledScrapeService] Stopped successfully');
  } catch (error) {
    console.error('[ScheduledScrapeService] Failed to stop scheduler:', error);
    throw error;
  }
}

/**
 * Retorna estatísticas do scheduler
 */
export function getSchedulerStats(): {
  initialized: boolean;
  activeSchedules: number;
  scheduleIds: string[];
} {
  return {
    initialized: isInitialized,
    activeSchedules: activeTasks.size,
    scheduleIds: Array.from(activeTasks.keys()),
  };
}

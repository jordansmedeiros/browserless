/**
 * Performance Tracker
 * Rastreia e analisa métricas de performance de raspagens
 */

import { prisma } from '@/lib/prisma';
import { SCRAPING_PERFORMANCE } from '@/config/scraping';

/**
 * Tipo de alerta de performance
 */
export enum PerformanceAlertType {
  LENTIDAO = 'LENTIDAO',
  FALHA_RECORRENTE = 'FALHA_RECORRENTE',
  SUCESSO_APOS_FALHAS = 'SUCESSO_APOS_FALHAS',
  PERFORMANCE_DEGRADADA = 'PERFORMANCE_DEGRADADA',
}

/**
 * Severidade do alerta
 */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

/**
 * Interface de alerta de performance
 */
export interface PerformanceAlert {
  tipo: PerformanceAlertType;
  tribunalConfigId: string;
  tribunalCodigo?: string;
  mensagem: string;
  severidade: AlertSeverity;
  dados: Record<string, any>;
  timestamp: Date;
}

/**
 * Classifica tipo de erro com base na mensagem
 */
function classifyErrorType(errorMessage: string): string {
  const message = errorMessage.toLowerCase();

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT';
  }
  if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
    return 'AUTHENTICATION';
  }
  if (message.includes('500') || message.includes('internal server')) {
    return 'SERVER_ERROR';
  }
  if (message.includes('503') || message.includes('unavailable')) {
    return 'SERVICE_UNAVAILABLE';
  }
  if (message.includes('network') || message.includes('connection')) {
    return 'NETWORK_ERROR';
  }
  if (message.includes('exit') || message.includes('code 1')) {
    return 'SCRIPT_ERROR';
  }

  return 'UNKNOWN';
}

/**
 * Rastreia performance de uma execução e gera métricas/alertas
 *
 * @param executionId - ID da execução concluída
 * @param tribunalConfigId - ID da configuração do tribunal
 * @returns Lista de alertas gerados (se houver)
 */
export async function trackExecutionPerformance(
  executionId: string,
  tribunalConfigId: string
): Promise<PerformanceAlert[]> {
  try {
    // Busca a execução com todos os dados
    const execution = await prisma.scrapeExecution.findUnique({
      where: { id: executionId },
      include: {
        tribunalConfig: {
          include: {
            tribunal: true
          }
        }
      }
    });

    if (!execution || !execution.startedAt || !execution.completedAt) {
      console.warn(`[PerformanceTracker] Execution ${executionId} sem timestamps válidos`);
      return [];
    }

    // Calcula duração
    const duracao = execution.completedAt.getTime() - execution.startedAt.getTime();
    const sucesso = execution.status === 'completed';
    const errorType = execution.errorMessage ? classifyErrorType(execution.errorMessage) : null;

    // Salva métrica no banco
    await prisma.tribunalPerformanceMetrics.create({
      data: {
        tribunalConfigId,
        scrapeExecutionId: executionId,
        duracao,
        processosCount: execution.processosCount || 0,
        sucesso,
        errorType,
      }
    });

    console.log(
      `[PerformanceTracker] Métrica registrada: ${execution.tribunalConfig.tribunal.codigo} ${execution.tribunalConfig.grau} - ` +
      `${Math.round(duracao / 1000)}s, ${execution.processosCount} processos, ` +
      `${sucesso ? 'sucesso' : 'falha'}`
    );

    // Verifica alertas
    const alerts = await checkPerformanceAlerts(execution, duracao);

    // Loga alertas no console
    for (const alert of alerts) {
      const logLevel = alert.severidade === AlertSeverity.ERROR ? 'error' :
                       alert.severidade === AlertSeverity.WARNING ? 'warn' :
                       'log';
      console[logLevel](`[PerformanceAlert] ${alert.tipo}: ${alert.mensagem}`);
    }

    return alerts;
  } catch (error: any) {
    console.error(`[PerformanceTracker] Erro ao rastrear execução ${executionId}:`, error);
    return [];
  }
}

/**
 * Verifica e gera alertas de performance
 *
 * @param execution - Execução a verificar
 * @param duracao - Duração da execução em ms
 * @returns Lista de alertas gerados
 */
async function checkPerformanceAlerts(
  execution: any,
  duracao: number
): Promise<PerformanceAlert[]> {
  const alerts: PerformanceAlert[] = [];
  const tribunalCodigo = `${execution.tribunalConfig.tribunal.codigo} ${execution.tribunalConfig.grau}`;

  // Alert 1: Lentidão (duração > threshold)
  if (duracao > SCRAPING_PERFORMANCE.durationThreshold) {
    const duracaoMinutos = Math.round(duracao / 60000);
    const thresholdMinutos = Math.round(SCRAPING_PERFORMANCE.durationThreshold / 60000);

    alerts.push({
      tipo: PerformanceAlertType.LENTIDAO,
      tribunalConfigId: execution.tribunalConfigId,
      tribunalCodigo,
      mensagem: `Raspagem demorou ${duracaoMinutos} minutos (limite: ${thresholdMinutos} minutos)`,
      severidade: AlertSeverity.WARNING,
      dados: {
        duracao,
        threshold: SCRAPING_PERFORMANCE.durationThreshold,
        processosCount: execution.processosCount
      },
      timestamp: new Date(),
    });
  }

  // Alert 2: Falhas recorrentes (últimas N execuções)
  const recentExecutions = await prisma.tribunalPerformanceMetrics.findMany({
    where: { tribunalConfigId: execution.tribunalConfigId },
    orderBy: { createdAt: 'desc' },
    take: SCRAPING_PERFORMANCE.failureThreshold,
  });

  if (recentExecutions.length >= SCRAPING_PERFORMANCE.failureThreshold) {
    const allFailed = recentExecutions.every(e => !e.sucesso);
    const allSucceeded = recentExecutions.every(e => e.sucesso);

    if (allFailed) {
      alerts.push({
        tipo: PerformanceAlertType.FALHA_RECORRENTE,
        tribunalConfigId: execution.tribunalConfigId,
        tribunalCodigo,
        mensagem: `${SCRAPING_PERFORMANCE.failureThreshold} falhas consecutivas detectadas`,
        severidade: AlertSeverity.ERROR,
        dados: {
          recentExecutions: recentExecutions.map(e => ({
            duracao: e.duracao,
            sucesso: e.sucesso,
            errorType: e.errorType,
            createdAt: e.createdAt,
          }))
        },
        timestamp: new Date(),
      });
    } else if (allSucceeded && recentExecutions[0].sucesso) {
      // Verifica se houve falhas antes desse streak de sucesso
      const olderExecutions = await prisma.tribunalPerformanceMetrics.findMany({
        where: {
          tribunalConfigId: execution.tribunalConfigId,
          createdAt: { lt: recentExecutions[recentExecutions.length - 1].createdAt }
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      if (olderExecutions.some(e => !e.sucesso)) {
        alerts.push({
          tipo: PerformanceAlertType.SUCESSO_APOS_FALHAS,
          tribunalConfigId: execution.tribunalConfigId,
          tribunalCodigo,
          mensagem: `Recuperação detectada: ${SCRAPING_PERFORMANCE.failureThreshold} sucessos consecutivos após falhas`,
          severidade: AlertSeverity.INFO,
          dados: {
            streak: recentExecutions.length,
          },
          timestamp: new Date(),
        });
      }
    }
  }

  // Alert 3: Performance degradada (comparação com média histórica)
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - SCRAPING_PERFORMANCE.analysisWindowDays);

  const historicalMetrics = await prisma.tribunalPerformanceMetrics.findMany({
    where: {
      tribunalConfigId: execution.tribunalConfigId,
      sucesso: true, // Apenas execuções bem-sucedidas
      createdAt: { gte: windowStart }
    },
    select: { duracao: true }
  });

  if (historicalMetrics.length >= 5) { // Mínimo de 5 amostras
    const duracoes = historicalMetrics.map(m => m.duracao);
    const media = duracoes.reduce((sum, d) => sum + d, 0) / duracoes.length;

    // Calcula desvio padrão
    const variance = duracoes.reduce((sum, d) => sum + Math.pow(d - media, 2), 0) / duracoes.length;
    const stdDev = Math.sqrt(variance);

    // Alerta se duração atual > média + 2 desvios padrão
    const threshold = media + (2 * stdDev);
    if (execution.status === 'completed' && duracao > threshold) {
      const degradacao = ((duracao - media) / media * 100).toFixed(1);

      alerts.push({
        tipo: PerformanceAlertType.PERFORMANCE_DEGRADADA,
        tribunalConfigId: execution.tribunalConfigId,
        tribunalCodigo,
        mensagem: `Performance degradada: ${degradacao}% mais lento que a média histórica`,
        severidade: AlertSeverity.WARNING,
        dados: {
          duracao,
          media: Math.round(media),
          stdDev: Math.round(stdDev),
          threshold: Math.round(threshold),
          amostras: historicalMetrics.length,
        },
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Obtém estatísticas de performance de um tribunal
 *
 * @param tribunalConfigId - ID da configuração do tribunal
 * @param days - Número de dias para análise (padrão: 7)
 * @returns Estatísticas agregadas
 */
export async function getTribunalPerformanceStats(
  tribunalConfigId: string,
  days: number = 7
): Promise<{
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  avgProcessosCount: number;
  errorTypes: Record<string, number>;
}> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - days);

  const metrics = await prisma.tribunalPerformanceMetrics.findMany({
    where: {
      tribunalConfigId,
      createdAt: { gte: windowStart }
    }
  });

  if (metrics.length === 0) {
    return {
      totalExecutions: 0,
      successRate: 0,
      avgDuration: 0,
      avgProcessosCount: 0,
      errorTypes: {},
    };
  }

  const successCount = metrics.filter(m => m.sucesso).length;
  const totalDuration = metrics.reduce((sum, m) => sum + m.duracao, 0);
  const totalProcessos = metrics.reduce((sum, m) => sum + m.processosCount, 0);

  const errorTypes: Record<string, number> = {};
  for (const metric of metrics) {
    if (metric.errorType) {
      errorTypes[metric.errorType] = (errorTypes[metric.errorType] || 0) + 1;
    }
  }

  return {
    totalExecutions: metrics.length,
    successRate: (successCount / metrics.length) * 100,
    avgDuration: totalDuration / metrics.length,
    avgProcessosCount: totalProcessos / metrics.length,
    errorTypes,
  };
}

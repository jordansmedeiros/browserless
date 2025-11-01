'use server';

/**
 * Server Actions para Dashboard
 * Funções para buscar estatísticas e dados para o dashboard
 */

import { getPrisma } from '@/lib/db';
import type {
  DashboardStats,
  DashboardChartsData,
  RecentActivity,
  ScrapeExecutionSummary,
  ChartDataPoint,
} from '@/lib/types/dashboard';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';
import { ScrapeJobStatus } from '@/lib/types/scraping';
import { SCRAPE_TYPE_LABELS } from '@/lib/types/scraping';

/**
 * Server Action: Get Dashboard Stats
 * Retorna estatísticas gerais agregadas do sistema
 */
export async function getDashboardStatsAction(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  try {
    const prisma = await getPrisma();

    // Contar processos de todas as tabelas em paralelo
    const [
      countPendentes,
      countProcessos,
      countArquivados,
      countMinhaPauta,
      countTJMG,
      countScrapeJobs,
      countCredenciais,
      countTribunais,
    ] = await Promise.all([
      prisma.pendentesManifestacao.count(),
      prisma.processos.count(),
      prisma.processosArquivados.count(),
      prisma.minhaPauta.count(),
      prisma.processosTJMG.count(),
      prisma.scrapeJob.count(),
      prisma.credencial.count({ where: { ativa: true } }),
      prisma.tribunal.count({ where: { ativo: true } }),
    ]);

    const totalProcessos =
      countPendentes + countProcessos + countArquivados + countMinhaPauta + countTJMG;

    // Contar jobs ativos
    const jobsAtivos = await prisma.scrapeJob.groupBy({
      by: ['status'],
      where: {
        status: {
          in: [ScrapeJobStatus.PENDING, ScrapeJobStatus.RUNNING],
        },
      },
      _count: {
        id: true,
      },
    });

    const pendingCount = jobsAtivos.find((j) => j.status === ScrapeJobStatus.PENDING)?._count.id || 0;
    const runningCount = jobsAtivos.find((j) => j.status === ScrapeJobStatus.RUNNING)?._count.id || 0;

    // Buscar última atividade (último job completado ou último processo adicionado)
    const ultimoJob = await prisma.scrapeJob.findFirst({
      where: {
        status: ScrapeJobStatus.COMPLETED,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const ultimoProcesso = await prisma.$queryRaw<
      Array<{ createdAt: Date; tipo: string }>
    >`
      SELECT 
        createdAt,
        'processo' as tipo
      FROM (
        SELECT createdAt FROM "PendentesManifestacao" ORDER BY createdAt DESC LIMIT 1
        UNION ALL
        SELECT createdAt FROM "Processos" ORDER BY createdAt DESC LIMIT 1
        UNION ALL
        SELECT createdAt FROM "ProcessosArquivados" ORDER BY createdAt DESC LIMIT 1
        UNION ALL
        SELECT createdAt FROM "MinhaPauta" ORDER BY createdAt DESC LIMIT 1
        UNION ALL
        SELECT createdAt FROM "ProcessosTJMG" ORDER BY createdAt DESC LIMIT 1
      ) AS todos_processos
      ORDER BY createdAt DESC
      LIMIT 1
    `;

    let ultimaAtividade = null;
    if (ultimoJob?.completedAt) {
      ultimaAtividade = {
        tipo: 'scrape' as const,
        timestamp: ultimoJob.completedAt,
        descricao: `Raspagem ${SCRAPE_TYPE_LABELS[ultimoJob.scrapeType as keyof typeof SCRAPE_TYPE_LABELS] || 'desconhecido'} completada`,
      };
    } else if (ultimoProcesso && ultimoProcesso.length > 0 && ultimoProcesso[0].createdAt) {
      ultimaAtividade = {
        tipo: 'processo' as const,
        timestamp: ultimoProcesso[0].createdAt,
        descricao: 'Novo processo adicionado',
      };
    }

    const stats: DashboardStats = {
      totalProcessos,
      totalRaspagens: countScrapeJobs,
      totalCredenciais: countCredenciais,
      totalTribunais: countTribunais,
      jobsAtivos: {
        pending: pendingCount,
        running: runningCount,
      },
      ultimaAtividade,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('[getDashboardStatsAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar estatísticas do dashboard',
    };
  }
}

/**
 * Server Action: Get Dashboard Charts Data
 * Retorna dados para gráficos do dashboard
 */
export async function getDashboardChartsDataAction(): Promise<{
  success: boolean;
  data?: DashboardChartsData;
  error?: string;
}> {
  try {
    const prisma = await getPrisma();

    // 1. Processos por tribunal (top 10)
    const processosPorTribunalRaw = await prisma.scrapeExecution.groupBy({
      by: ['tribunalConfigId'],
      _sum: {
        processosCount: true,
      },
      where: {
        processosCount: {
          gt: 0,
        },
      },
      orderBy: {
        _sum: {
          processosCount: 'desc',
        },
      },
      take: 10,
    });

    const tribunalIds = processosPorTribunalRaw.map((p) => p.tribunalConfigId);
    const tribunais = await prisma.tribunalConfig.findMany({
      where: {
        id: {
          in: tribunalIds,
        },
      },
      include: {
        tribunal: true,
      },
    });

    const tribunaisMap = new Map(tribunais.map((t) => [t.id, t]));
    const processosPorTribunal: ChartDataPoint[] = processosPorTribunalRaw
      .map((p) => {
        const tribunal = tribunaisMap.get(p.tribunalConfigId);
        return {
          nome: tribunal?.tribunal?.nome || tribunal?.tribunal?.codigo || 'Desconhecido',
          valor: p._sum.processosCount || 0,
        };
      })
      .filter((p) => p.valor > 0);

    // 2. Processos por tipo de raspagem
    const processosPorTipoRaw = await prisma.scrapeExecution.groupBy({
      by: ['scrapeJobId'],
      _sum: {
        processosCount: true,
      },
      where: {
        processosCount: {
          gt: 0,
        },
      },
    });

    const scrapeJobIds = processosPorTipoRaw.map((p) => p.scrapeJobId);
    const scrapeJobs = await prisma.scrapeJob.findMany({
      where: {
        id: {
          in: scrapeJobIds,
        },
      },
      select: {
        id: true,
        scrapeType: true,
        scrapeSubType: true,
      },
    });

    const scrapeTypeMap = new Map(scrapeJobs.map((j) => [j.id, j]));
    const processosPorTipoMap = new Map<string, number>();

    processosPorTipoRaw.forEach((p) => {
      const job = scrapeTypeMap.get(p.scrapeJobId);
      if (job) {
        const tipoLabel =
          SCRAPE_TYPE_LABELS[job.scrapeType as keyof typeof SCRAPE_TYPE_LABELS] || job.scrapeType;
        const count = p._sum.processosCount || 0;
        processosPorTipoMap.set(tipoLabel, (processosPorTipoMap.get(tipoLabel) || 0) + count);
      }
    });

    const processosPorTipo: ChartDataPoint[] = Array.from(processosPorTipoMap.entries()).map(
      ([nome, valor]) => ({
        nome,
        valor,
      })
    );

    // 3. Raspagens por status nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const raspagensPorStatusRaw = await prisma.scrapeJob.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const statusLabels: Record<string, string> = {
      pending: 'Pendente',
      running: 'Em Execução',
      completed: 'Completado',
      failed: 'Falhou',
      canceled: 'Cancelado',
    };

    const raspagensPorStatus: ChartDataPoint[] = raspagensPorStatusRaw.map((r) => ({
      nome: statusLabels[r.status] || r.status,
      valor: r._count.id,
    }));

    // 4. Tendência de processos (últimos 7 dias - simplificado)
    const tendenciaProcessos: DashboardChartsData['tendenciaProcessos'] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [countTotal, countNovos] = await Promise.all([
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM (
            SELECT createdAt FROM "PendentesManifestacao"
            WHERE createdAt < ${nextDate}
            UNION ALL
            SELECT createdAt FROM "Processos"
            WHERE createdAt < ${nextDate}
            UNION ALL
            SELECT createdAt FROM "ProcessosArquivados"
            WHERE createdAt < ${nextDate}
            UNION ALL
            SELECT createdAt FROM "MinhaPauta"
            WHERE createdAt < ${nextDate}
            UNION ALL
            SELECT createdAt FROM "ProcessosTJMG"
            WHERE createdAt < ${nextDate}
          ) AS todos_processos
        `,
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM (
            SELECT createdAt FROM "PendentesManifestacao"
            WHERE createdAt >= ${date} AND createdAt < ${nextDate}
            UNION ALL
            SELECT createdAt FROM "Processos"
            WHERE createdAt >= ${date} AND createdAt < ${nextDate}
            UNION ALL
            SELECT createdAt FROM "ProcessosArquivados"
            WHERE createdAt >= ${date} AND createdAt < ${nextDate}
            UNION ALL
            SELECT createdAt FROM "MinhaPauta"
            WHERE createdAt >= ${date} AND createdAt < ${nextDate}
            UNION ALL
            SELECT createdAt FROM "ProcessosTJMG"
            WHERE createdAt >= ${date} AND createdAt < ${nextDate}
          ) AS novos_processos
        `,
      ]);

      tendenciaProcessos.push({
        data: date.toISOString().split('T')[0],
        total: Number(countTotal[0]?.count || 0),
        novos: Number(countNovos[0]?.count || 0),
      });
    }

    // 5. Performance média por tribunal
    const performanceRaw = await prisma.scrapeExecution.groupBy({
      by: ['tribunalConfigId'],
      where: {
        startedAt: {
          not: null,
        },
        completedAt: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        processosCount: true,
      },
    });

    const tribunalIdsPerf = performanceRaw.map((p) => p.tribunalConfigId);
    const tribunaisPerf = await prisma.tribunalConfig.findMany({
      where: {
        id: {
          in: tribunalIdsPerf,
        },
      },
      include: {
        tribunal: true,
      },
    });

    const tribunaisMapPerf = new Map(tribunaisPerf.map((t) => [t.id, t]));

    // Calcular tempo médio e rates de sucesso/falha
    const performanceTribunais = await Promise.all(
      performanceRaw.map(async (p) => {
        const tribunal = tribunaisMapPerf.get(p.tribunalConfigId);
        if (!tribunal) return null;

        const executions = await prisma.scrapeExecution.findMany({
          where: {
            tribunalConfigId: p.tribunalConfigId,
            startedAt: {
              not: null,
            },
            completedAt: {
              not: null,
            },
          },
          select: {
            startedAt: true,
            completedAt: true,
            status: true,
          },
        });

        const tempos = executions
          .map((e) => {
            if (e.startedAt && e.completedAt) {
              return e.completedAt.getTime() - e.startedAt.getTime();
            }
            return null;
          })
          .filter((t): t is number => t !== null);

        const tempoMedio = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length / 1000 : 0;
        const sucessos = executions.filter((e) => e.status === 'completed').length;
        const falhas = executions.filter((e) => e.status === 'failed').length;

        return {
          tribunal: tribunal.tribunal.nome,
          tempoMedio,
          sucessos,
          falhas,
        };
      })
    );

    const chartsData: DashboardChartsData = {
      processosPorTribunal,
      processosPorTipo,
      raspagensPorStatus,
      tendenciaProcessos,
      performanceTribunais: performanceTribunais.filter((p): p is NonNullable<typeof p> => p !== null),
    };

    return {
      success: true,
      data: chartsData,
    };
  } catch (error) {
    console.error('[getDashboardChartsDataAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar dados para gráficos',
    };
  }
}

/**
 * Server Action: Get Recent Activity
 * Retorna atividades recentes do sistema
 */
export async function getRecentActivityAction(): Promise<{
  success: boolean;
  data?: RecentActivity;
  error?: string;
}> {
  try {
    const prisma = await getPrisma();

    // Últimos 10 jobs com detalhes
    const jobs = await prisma.scrapeJob.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        executions: true,
      },
    });

    // Últimas 5 execuções completadas
    const execucoes = await prisma.scrapeExecution.findMany({
      where: {
        status: 'completed',
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 5,
      include: {
        tribunalConfig: {
          include: {
            tribunal: true,
          },
        },
        scrapeJob: {
          select: {
            scrapeType: true,
          },
        },
      },
    });

    const execucoesSummary: ScrapeExecutionSummary[] = execucoes.map((e) => ({
      id: e.id,
      scrapeType: e.scrapeJob.scrapeType as any,
      status: e.status,
      processosCount: e.processosCount,
      createdAt: e.createdAt,
      completedAt: e.completedAt,
      tribunal: {
        codigo: e.tribunalConfig.tribunal.codigo,
        nome: e.tribunalConfig.tribunal.nome,
      },
    }));

    // Processos recentes (últimos 10 processos adicionados)
    // Buscar das 5 tabelas e combinar
    const processosRecentes = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        "numeroProcesso",
        "createdAt",
        'PendentesManifestacao' as origem
      FROM "PendentesManifestacao"
      WHERE "numeroProcesso" IS NOT NULL
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    const recentActivity: RecentActivity = {
      jobs: jobs as ScrapeJobWithRelations[],
      execucoes: execucoesSummary,
      processosRecentes: [], // Simplificado por enquanto
    };

    return {
      success: true,
      data: recentActivity,
    };
  } catch (error) {
    console.error('[getRecentActivityAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar atividades recentes',
    };
  }
}

/**
 * Server Action: Get Dashboard Data (All in One)
 * Retorna todos os dados do dashboard em uma única chamada
 * Otimiza o número de requisições
 */
export async function getDashboardDataAction(): Promise<{
  success: boolean;
  data?: {
    stats: DashboardStats;
    chartsData: DashboardChartsData;
    recentActivity: RecentActivity;
  };
  error?: string;
}> {
  try {
    const [statsResult, chartsResult, activityResult] = await Promise.all([
      getDashboardStatsAction(),
      getDashboardChartsDataAction(),
      getRecentActivityAction(),
    ]);

    if (!statsResult.success) {
      return statsResult;
    }

    if (!chartsResult.success) {
      return chartsResult;
    }

    if (!activityResult.success) {
      return activityResult;
    }

    return {
      success: true,
      data: {
        stats: statsResult.data!,
        chartsData: chartsResult.data!,
        recentActivity: activityResult.data!,
      },
    };
  } catch (error) {
    console.error('[getDashboardDataAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar dados do dashboard',
    };
  }
}


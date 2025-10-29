import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ExecutionStats {
  tribunalCodigo: string;
  tribunalNome: string;
  grau: string;
  status: string;
  processosCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  duration: string;
  errorMessage: string | null;
  errorType: string | null;
}

async function analyzeMultiTRTJob(jobId?: string) {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     ANÁLISE DETALHADA: JOB MULTI-TRT                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // 1. Buscar job (por ID ou mais recente)
  let job;

  if (jobId) {
    job = await prisma.scrapeJob.findUnique({
      where: { id: jobId },
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true
              }
            }
          }
        },
        executions: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true
              }
            }
          },
          orderBy: [
            { tribunalConfig: { tribunal: { codigo: 'asc' } } },
            { tribunalConfig: { grau: 'asc' } }
          ]
        }
      }
    });
  } else {
    // Buscar o mais recente de acervo_geral com múltiplos tribunais
    job = await prisma.scrapeJob.findFirst({
      where: {
        scrapeType: 'acervo_geral'
      },
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true
              }
            }
          }
        },
        executions: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true
              }
            }
          },
          orderBy: [
            { createdAt: 'asc' }
          ]
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  if (!job) {
    console.error('❌ Job não encontrado!');
    return;
  }

  // 2. Informações gerais do job
  console.log('📋 INFORMAÇÕES GERAIS DO JOB');
  console.log('═'.repeat(70));
  console.log(`Job ID: ${job.id}`);
  console.log(`Status: ${job.status}`);
  console.log(`Tipo: ${job.scrapeType}${job.scrapeSubType ? ` (${job.scrapeSubType})` : ''}`);
  console.log(`Criado em: ${job.createdAt.toLocaleString('pt-BR')}`);
  console.log(`Iniciado em: ${job.startedAt ? job.startedAt.toLocaleString('pt-BR') : 'N/A'}`);
  console.log(`Concluído em: ${job.completedAt ? job.completedAt.toLocaleString('pt-BR') : 'N/A'}`);

  if (job.startedAt && job.completedAt) {
    const duration = job.completedAt.getTime() - job.startedAt.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    console.log(`Duração total: ${minutes}m ${seconds}s`);
  }

  console.log(`\nTribunais configurados: ${job.tribunals.length}`);
  console.log(`Execuções registradas: ${job.executions.length}`);
  console.log('');

  // 3. Processar execuções e calcular estatísticas
  const stats: ExecutionStats[] = [];
  let totalProcessos = 0;
  let sucessos = 0;
  let falhas = 0;

  for (const execution of job.executions) {
    const tribunalConfig = execution.tribunalConfig;
    if (!tribunalConfig) continue;

    const tribunal = tribunalConfig.tribunal;
    const processosCount = execution.processosCount || 0;
    totalProcessos += processosCount;

    if (execution.status === 'completed') {
      sucessos++;
    } else if (execution.status === 'failed') {
      falhas++;
    }

    let duration = 'N/A';
    if (execution.startedAt && execution.completedAt) {
      const durationMs = execution.completedAt.getTime() - execution.startedAt.getTime();
      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);
      duration = `${mins}m ${secs}s`;
    }

    // Parse error data if exists
    let errorMessage = null;
    let errorType = null;
    if (execution.errorData) {
      try {
        const errorData = typeof execution.errorData === 'string'
          ? JSON.parse(execution.errorData)
          : execution.errorData;
        errorMessage = errorData.message || null;
        errorType = errorData.type || errorData.category || null;
      } catch (e) {
        errorMessage = String(execution.errorData);
      }
    }

    stats.push({
      tribunalCodigo: tribunal.codigo,
      tribunalNome: tribunal.nome,
      grau: tribunalConfig.grau,
      status: execution.status,
      processosCount,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration,
      errorMessage,
      errorType
    });
  }

  // 4. Exibir relatório detalhado
  console.log('📊 EXECUÇÕES POR TRIBUNAL');
  console.log('═'.repeat(70));
  console.log('');

  // Agrupar por status
  const completed = stats.filter(s => s.status === 'completed');
  const failed = stats.filter(s => s.status === 'failed');
  const pending = stats.filter(s => s.status === 'pending');
  const running = stats.filter(s => s.status === 'running');

  // Mostrar execuções completadas
  if (completed.length > 0) {
    console.log(`✅ COMPLETADAS (${completed.length}):`);
    console.log('─'.repeat(70));
    for (const stat of completed) {
      const processos = stat.processosCount > 0
        ? `✓ ${stat.processosCount} processos`
        : '⚠ 0 processos';
      console.log(`${stat.tribunalCodigo} ${stat.grau}: ${processos} | ${stat.duration}`);
    }
    console.log('');
  }

  // Mostrar execuções falhadas
  if (failed.length > 0) {
    console.log(`❌ FALHADAS (${failed.length}):`);
    console.log('─'.repeat(70));
    for (const stat of failed) {
      console.log(`${stat.tribunalCodigo} ${stat.grau}:`);
      console.log(`   Erro: ${stat.errorType || 'N/A'}`);
      console.log(`   Mensagem: ${stat.errorMessage || 'N/A'}`);
      console.log(`   Duração: ${stat.duration}`);
      console.log('');
    }
  }

  // Mostrar execuções pendentes ou em execução
  if (pending.length > 0) {
    console.log(`⏳ PENDENTES (${pending.length}):`);
    console.log('─'.repeat(70));
    for (const stat of pending) {
      console.log(`${stat.tribunalCodigo} ${stat.grau}`);
    }
    console.log('');
  }

  if (running.length > 0) {
    console.log(`🔄 EM EXECUÇÃO (${running.length}):`);
    console.log('─'.repeat(70));
    for (const stat of running) {
      console.log(`${stat.tribunalCodigo} ${stat.grau}`);
    }
    console.log('');
  }

  // 5. Estatísticas finais
  console.log('═'.repeat(70));
  console.log('📈 ESTATÍSTICAS FINAIS');
  console.log('═'.repeat(70));
  console.log(`Total de execuções: ${stats.length}`);
  console.log(`Completadas: ${sucessos} (${((sucessos / stats.length) * 100).toFixed(1)}%)`);
  console.log(`Falhadas: ${falhas} (${((falhas / stats.length) * 100).toFixed(1)}%)`);
  console.log(`Pendentes: ${pending.length}`);
  console.log(`Em execução: ${running.length}`);
  console.log('');
  console.log(`Total de processos raspados: ${totalProcessos}`);
  console.log('');

  // 6. Análise de processos por tribunal
  const tribunaisComProcessos = completed.filter(s => s.processosCount > 0);
  const tribunaisSemProcessos = completed.filter(s => s.processosCount === 0);

  if (tribunaisComProcessos.length > 0) {
    console.log(`✓ Tribunais com processos: ${tribunaisComProcessos.length}`);
    for (const stat of tribunaisComProcessos) {
      console.log(`  ${stat.tribunalCodigo} ${stat.grau}: ${stat.processosCount} processos`);
    }
    console.log('');
  }

  if (tribunaisSemProcessos.length > 0) {
    console.log(`⚠ Tribunais sem processos (${tribunaisSemProcessos.length}):`);
    const tribunaisCodigos = tribunaisSemProcessos.map(s => `${s.tribunalCodigo} ${s.grau}`).join(', ');
    console.log(`  ${tribunaisCodigos}`);
    console.log('');
  }

  // 7. Análise de causa raiz
  console.log('═'.repeat(70));
  console.log('🔍 ANÁLISE DE CAUSA RAIZ');
  console.log('═'.repeat(70));

  if (failed.length > 0) {
    console.log(`\n❌ ${failed.length} execuções falharam:`);
    const errorsByType = failed.reduce((acc, stat) => {
      const type = stat.errorType || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [type, count] of Object.entries(errorsByType)) {
      console.log(`   - ${type}: ${count} ocorrências`);
    }
  }

  if (tribunaisSemProcessos.length > 0) {
    console.log(`\n⚠ ${tribunaisSemProcessos.length} tribunais retornaram 0 processos:`);
    console.log('   Possíveis causas:');
    console.log('   - Advogado não possui processos nesses tribunais');
    console.log('   - Credenciais não habilitadas/validadas nesses tribunais');
    console.log('   - Problema na API de listagem do acervo geral');
  }

  if (totalProcessos > 0) {
    console.log(`\n✓ Total de ${totalProcessos} processos raspados com sucesso`);
    const avg = totalProcessos / tribunaisComProcessos.length;
    console.log(`   Média: ${avg.toFixed(1)} processos por tribunal com dados`);
  } else {
    console.log('\n❌ PROBLEMA CRÍTICO: Nenhum processo foi raspado!');
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✅ ANÁLISE CONCLUÍDA');
  console.log('═'.repeat(70));
}

// Executa
const jobId = process.argv[2]; // Permite passar o ID do job como argumento
analyzeMultiTRTJob(jobId)
  .catch(console.error)
  .finally(() => prisma.$disconnect());

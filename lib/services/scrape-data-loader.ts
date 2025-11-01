/**
 * Scrape Data Loader
 * Serviço para carregar dados de raspagem com estratégia híbrida:
 * 1. Tenta carregar das tabelas específicas por tipo (preferencial)
 * 2. Fallback para resultData comprimido se as tabelas estiverem vazias
 */

import type { PrismaClient } from '@prisma/client';
import { ScrapeType, type ProcessoUnificado } from '@/lib/types/scraping';
import { decompressJSON } from '@/lib/utils/compression';
import type {
  PendentesManifestacao,
  Processos,
  ProcessosArquivados,
  MinhaPauta,
  ProcessosTJMG,
  ScrapeExecution,
  TribunalConfig,
  Tribunal,
  ScrapeJob,
} from '@prisma/client';

/**
 * Carrega processos de uma execução específica usando estratégia híbrida
 *
 * @param prisma - Instância do PrismaClient
 * @param executionId - ID da execução
 * @param scrapeType - Tipo de raspagem
 * @param resultData - Dados comprimidos (opcional, usado como fallback)
 * @returns Array de processos normalizados
 */
export async function loadProcessosFromExecution(
  prisma: PrismaClient,
  executionId: string,
  scrapeType: ScrapeType,
  resultData?: string | null
): Promise<any[]> {
  console.log(`[DataLoader] Carregando processos da execução ${executionId}, tipo: ${scrapeType}`);

  // Estratégia 1: Carregar das tabelas específicas (preferencial)
  try {
    const processosFromTables = await loadFromTypeSpecificTable(prisma, executionId, scrapeType);

    if (processosFromTables.length > 0) {
      console.log(`[DataLoader] ✓ Carregados ${processosFromTables.length} processos das tabelas específicas`);
      return processosFromTables;
    }

    console.log(`[DataLoader] Tabelas específicas vazias, tentando fallback para resultData...`);
  } catch (error: any) {
    console.error(`[DataLoader] Erro ao carregar das tabelas específicas:`, error);
    console.log(`[DataLoader] Tentando fallback para resultData...`);
  }

  // Estratégia 2: Fallback para resultData comprimido
  if (resultData) {
    try {
      const decompressed = await decompressJSON(resultData);

      if (decompressed?.processos && Array.isArray(decompressed.processos)) {
        console.log(`[DataLoader] ✓ Carregados ${decompressed.processos.length} processos do resultData (fallback)`);
        return decompressed.processos;
      }

      console.warn(`[DataLoader] resultData não contém array de processos válido`);
    } catch (error: any) {
      console.error(`[DataLoader] Erro ao descomprimir resultData:`, error);
    }
  }

  console.warn(`[DataLoader] Nenhum dado encontrado para execução ${executionId}`);
  return [];
}

/**
 * Carrega processos das tabelas específicas baseado no tipo de raspagem
 */
async function loadFromTypeSpecificTable(
  prisma: PrismaClient,
  executionId: string,
  scrapeType: ScrapeType
): Promise<any[]> {
  switch (scrapeType) {
    case ScrapeType.PENDENTES:
      return await loadPendentesManifestacao(prisma, executionId);

    case ScrapeType.ACERVO_GERAL:
      return await loadProcessosAcervoGeral(prisma, executionId);

    case ScrapeType.ARQUIVADOS:
      return await loadProcessosArquivados(prisma, executionId);

    case ScrapeType.MINHA_PAUTA:
      return await loadMinhaPauta(prisma, executionId);

    default:
      console.warn(`[DataLoader] Tipo de raspagem não suportado: ${scrapeType}`);
      return [];
  }
}

/**
 * Carrega processos pendentes de manifestação
 */
async function loadPendentesManifestacao(prisma: PrismaClient, executionId: string): Promise<any[]> {
  const processos = await prisma.pendentesManifestacao.findMany({
    where: { scrapeExecutionId: executionId },
    orderBy: { dataPrazoLegalParte: 'asc' },
  });

  // Normaliza para formato esperado pela UI
  return processos.map(p => ({
    id: p.idPje,
    numeroProcesso: p.numeroProcesso,
    numero: p.numero,
    classeJudicial: p.classeJudicial,
    descricaoOrgaoJulgador: p.descricaoOrgaoJulgador,
    siglaOrgaoJulgador: p.siglaOrgaoJulgador,
    segredoDeJustica: p.segredoDeJustica,
    codigoStatusProcesso: p.codigoStatusProcesso,
    prioridadeProcessual: p.prioridadeProcessual,
    juizoDigital: p.juizoDigital,
    prazoVencido: p.prazoVencido,
    nomeParteAutora: p.nomeParteAutora,
    qtdeParteAutora: p.qtdeParteAutora,
    nomeParteRe: p.nomeParteRe,
    qtdeParteRe: p.qtdeParteRe,
    dataCienciaParte: p.dataCienciaParte?.toISOString(),
    dataPrazoLegalParte: p.dataPrazoLegalParte?.toISOString(),
    dataAutuacao: p.dataAutuacao?.toISOString(),
    dataArquivamento: p.dataArquivamento?.toISOString(),
    dataCriacaoExpediente: p.dataCriacaoExpediente?.toISOString(),
    idDocumento: p.idDocumento?.toString(),
    urlDocumento: p.urlDocumento,
    documentoMetadados: p.documentoMetadados,
    pdfLocal: p.pdfLocal,
    processosAssociados: p.processosAssociados,
  }));
}

/**
 * Carrega processos do acervo geral
 * Detecta automaticamente se é TJMG ou TRT baseado nos dados disponíveis
 */
async function loadProcessosAcervoGeral(prisma: PrismaClient, executionId: string): Promise<any[]> {
  // Primeiro tenta carregar do TJMG (se houver dados)
  const processosTJMG = await prisma.processosTJMG.findMany({
    where: { scrapeExecutionId: executionId },
    orderBy: { createdAt: 'desc' },
  });

  if (processosTJMG.length > 0) {
    console.log(`[DataLoader] Carregando ${processosTJMG.length} processos TJMG`);
    return processosTJMG.map(p => ({
      numero: p.numero,
      regiao: p.regiao,
      tipo: p.tipo,
      partes: p.partes,
      vara: p.vara,
      dataDistribuicao: p.dataDistribuicao,
      ultimoMovimento: p.ultimoMovimento,
      textoCompleto: p.textoCompleto,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  // Fallback para TRT (Processos normais)
  const processos = await prisma.processos.findMany({
    where: { scrapeExecutionId: executionId },
    orderBy: { dataAutuacao: 'desc' },
  });

  return processos.map(p => {
    // Se metadados contém o objeto completo, usa ele; senão normaliza
    if (p.metadados && typeof p.metadados === 'object') {
      return p.metadados;
    }

    return {
      id: p.idPje,
      numeroProcesso: p.numeroProcesso,
      numero: p.numero,
      classeJudicial: p.classeJudicial,
      descricaoOrgaoJulgador: p.descricaoOrgaoJulgador,
      siglaOrgaoJulgador: p.siglaOrgaoJulgador,
      segredoDeJustica: p.segredoDeJustica,
      codigoStatusProcesso: p.codigoStatusProcesso,
      prioridadeProcessual: p.prioridadeProcessual,
      juizoDigital: p.juizoDigital,
      nomeParteAutora: p.nomeParteAutora,
      qtdeParteAutora: p.qtdeParteAutora,
      nomeParteRe: p.nomeParteRe,
      qtdeParteRe: p.qtdeParteRe,
      dataAutuacao: p.dataAutuacao?.toISOString(),
      dataArquivamento: p.dataArquivamento?.toISOString(),
    };
  });
}

/**
 * Carrega processos arquivados
 */
async function loadProcessosArquivados(prisma: PrismaClient, executionId: string): Promise<any[]> {
  const processos = await prisma.processosArquivados.findMany({
    where: { scrapeExecutionId: executionId },
    orderBy: { dataArquivamento: 'desc' },
  });

  return processos.map(p => {
    // Se metadados contém o objeto completo, usa ele; senão normaliza
    if (p.metadados && typeof p.metadados === 'object') {
      return p.metadados;
    }

    return {
      id: p.idPje,
      numeroProcesso: p.numeroProcesso,
      numero: p.numero,
      classeJudicial: p.classeJudicial,
      descricaoOrgaoJulgador: p.descricaoOrgaoJulgador,
      siglaOrgaoJulgador: p.siglaOrgaoJulgador,
      segredoDeJustica: p.segredoDeJustica,
      codigoStatusProcesso: p.codigoStatusProcesso,
      prioridadeProcessual: p.prioridadeProcessual,
      juizoDigital: p.juizoDigital,
      nomeParteAutora: p.nomeParteAutora,
      qtdeParteAutora: p.qtdeParteAutora,
      nomeParteRe: p.nomeParteRe,
      qtdeParteRe: p.qtdeParteRe,
      dataAutuacao: p.dataAutuacao?.toISOString(),
      dataArquivamento: p.dataArquivamento?.toISOString(),
    };
  });
}

/**
 * Carrega processos da minha pauta (audiências/sessões)
 */
async function loadMinhaPauta(prisma: PrismaClient, executionId: string): Promise<any[]> {
  const processos = await prisma.minhaPauta.findMany({
    where: { scrapeExecutionId: executionId },
    orderBy: { dataInicio: 'asc' },
  });

  return processos.map(p => {
    // Se metadados contém o objeto completo, usa ele; senão normaliza
    if (p.metadados && typeof p.metadados === 'object') {
      return p.metadados;
    }

    return {
      id: p.idPje,
      nrProcesso: p.nrProcesso,
      dataInicio: p.dataInicio?.toISOString(),
      dataFim: p.dataFim?.toISOString(),
      urlAudienciaVirtual: p.urlAudienciaVirtual,
      arquivoICS: p.arquivoICS,
      tipo: {
        descricao: p.tipoDescricao,
        codigo: p.tipoCodigo,
      },
      processo: p.processoMetadados,
      poloAtivo: p.poloAtivo,
      poloPassivo: p.poloPassivo,
    };
  });
}

/**
 * Processa array em chunks com concorrência limitada
 * @param items - Array de itens a processar
 * @param processItem - Função para processar cada item
 * @param concurrency - Número máximo de processos concorrentes
 * @returns Array de resultados na mesma ordem
 */
async function processConcurrently<T, R>(
  items: T[],
  processItem: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function processNext(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      results[index] = await processItem(item);
    }
  }

  // Cria pool de workers limitado
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => processNext());
  await Promise.all(workers);

  return results;
}

/**
 * Carrega todos os processos de todas as execuções de um job
 *
 * @param prisma - Instância do PrismaClient
 * @param executions - Array de execuções do job
 * @param scrapeType - Tipo de raspagem
 * @returns Array consolidado de todos os processos
 */
export async function loadAllProcessosFromJob(
  prisma: PrismaClient,
  executions: Array<{ id: string; resultData?: string | null }>,
  scrapeType: ScrapeType
): Promise<any[]> {
  // Define concorrência máxima (5-10 execuções em paralelo para evitar saturar Prisma)
  const MAX_CONCURRENCY = 10;

  console.log(`[DataLoader] Carregando ${executions.length} execuções com concorrência limitada (max: ${MAX_CONCURRENCY})...`);

  // Carrega execuções com concorrência limitada mantendo ordem
  const processArrays = await processConcurrently(
    executions,
    (execution) => loadProcessosFromExecution(
      prisma,
      execution.id,
      scrapeType,
      execution.resultData
    ),
    MAX_CONCURRENCY
  );

  // Consolida resultados mantendo ordem
  const allProcesses = processArrays.flat();

  console.log(`[DataLoader] Total de ${allProcesses.length} processos carregados de ${executions.length} execuções`);
  console.log(`[DataLoader] Carregamento com concorrência limitada concluído`);
  return allProcesses;
}

/**
 * Tipo auxiliar para ScrapeExecution com relações incluídas
 */
type ScrapeExecutionWithRelations = ScrapeExecution & {
  scrapeJobId: string;
  tribunalConfig: TribunalConfig & {
    tribunal: Tribunal;
  };
  scrapeJob: ScrapeJob & {
    scrapeType: string;
    scrapeSubType: string | null;
  };
  createdAt: Date;
};

/**
 * Tipo compatível com o resultado do Prisma usando select
 * Permite tipos parciais mas garante campos mínimos necessários
 */
type ScrapeExecutionSelectCompatible = {
  id: string;
  createdAt: Date;
  scrapeJobId: string;
  tribunalConfig: {
    id: string;
    grau: string;
    sistema: string;
    tribunal: {
      codigo: string;
      nome: string;
    };
  };
  scrapeJob: {
    scrapeType: string;
    scrapeSubType: string | null;
  };
};

/**
 * Normaliza processo de qualquer tabela para formato ProcessoUnificado
 *
 * @param processo - Registro de qualquer tabela de processos
 * @param scrapeExecution - Execução com relações incluídas (aceita tipos completos ou selecionados)
 * @param origem - Tabela de origem do processo
 * @returns Processo normalizado no formato unificado
 */
export function normalizeProcessoToUnificado(
  processo: PendentesManifestacao | Processos | ProcessosArquivados | MinhaPauta | ProcessosTJMG,
  scrapeExecution: ScrapeExecutionWithRelations | ScrapeExecutionSelectCompatible,
  origem: 'PendentesManifestacao' | 'Processos' | 'ProcessosArquivados' | 'MinhaPauta' | 'ProcessosTJMG'
): ProcessoUnificado {
  const tribunalConfig = scrapeExecution.tribunalConfig;
  const tribunal = tribunalConfig.tribunal;

  // Extrair campos comuns independente da tabela
  let idPje: number | null;
  let numeroProcesso: string;
  let dataAutuacao: Date | null = null;
  let nomeParteAutora: string | null = null;
  let nomeParteRe: string | null = null;
  let orgaoJulgador: string | null = null;
  let classeJudicial: string | null = null;
  const metadados: Record<string, any> = {};

  // Normalizar campos específicos por tipo de tabela
  if (origem === 'PendentesManifestacao') {
    const p = processo as PendentesManifestacao;
    idPje = p.idPje;
    numeroProcesso = p.numeroProcesso;
    dataAutuacao = p.dataAutuacao;
    nomeParteAutora = p.nomeParteAutora;
    nomeParteRe = p.nomeParteRe;
    classeJudicial = p.classeJudicial;
    orgaoJulgador = p.descricaoOrgaoJulgador || p.siglaOrgaoJulgador || null;
    
    // Metadados específicos
    metadados.dataCienciaParte = p.dataCienciaParte;
    metadados.dataPrazoLegalParte = p.dataPrazoLegalParte;
    metadados.prazoVencido = p.prazoVencido;
    metadados.idDocumento = p.idDocumento;
  } else if (origem === 'Processos') {
    const p = processo as Processos;
    idPje = p.idPje;
    numeroProcesso = p.numeroProcesso;
    dataAutuacao = p.dataAutuacao;
    nomeParteAutora = p.nomeParteAutora;
    nomeParteRe = p.nomeParteRe;
    classeJudicial = p.classeJudicial;
    orgaoJulgador = p.descricaoOrgaoJulgador || p.siglaOrgaoJulgador || null;
    
    // Se metadados contém objeto completo, copiar campos relevantes
    if (p.metadados && typeof p.metadados === 'object') {
      Object.assign(metadados, p.metadados);
    }
  } else if (origem === 'ProcessosArquivados') {
    const p = processo as ProcessosArquivados;
    idPje = p.idPje;
    numeroProcesso = p.numeroProcesso;
    dataAutuacao = p.dataAutuacao;
    nomeParteAutora = p.nomeParteAutora;
    nomeParteRe = p.nomeParteRe;
    classeJudicial = p.classeJudicial;
    orgaoJulgador = p.descricaoOrgaoJulgador || p.siglaOrgaoJulgador || null;
    
    // Se metadados contém objeto completo, copiar campos relevantes
    if (p.metadados && typeof p.metadados === 'object') {
      Object.assign(metadados, p.metadados);
    }
  } else if (origem === 'MinhaPauta') {
    const p = processo as MinhaPauta;
    idPje = p.idPje;
    numeroProcesso = p.nrProcesso;
    dataAutuacao = null; // MinhaPauta não tem dataAutuacao
    nomeParteAutora = null;
    nomeParteRe = null;
    classeJudicial = null;
    orgaoJulgador = null;
    
    // Metadados específicos
    metadados.dataInicio = p.dataInicio;
    metadados.dataFim = p.dataFim;
    metadados.urlAudienciaVirtual = p.urlAudienciaVirtual;
    metadados.processoMetadados = p.processoMetadados;
    if (p.metadados && typeof p.metadados === 'object') {
      Object.assign(metadados, p.metadados);
    }
  } else if (origem === 'ProcessosTJMG') {
    const p = processo as ProcessosTJMG;
    // ProcessosTJMG não tem idPje - usar null ao invés de 0
    idPje = null;
    numeroProcesso = p.numero;
    dataAutuacao = null;
    // Extrair partes do campo partes (string)
    const partesStr = p.partes || '';
    // Tentar extrair nomeParteAutora e nomeParteRe do texto
    // Formato típico: "Author X Defendant" ou similar
    const partesMatch = partesStr.match(/(.+?)\s+(?:vs|X|x|contra)\s+(.+)/i);
    if (partesMatch) {
      nomeParteAutora = partesMatch[1].trim() || null;
      nomeParteRe = partesMatch[2].trim() || null;
    } else {
      nomeParteRe = partesStr || null;
    }
    classeJudicial = null;
    orgaoJulgador = p.vara || null;
    
    // Metadados específicos
    metadados.regiao = p.regiao;
    metadados.tipo = p.tipo;
    metadados.vara = p.vara;
    metadados.dataDistribuicao = p.dataDistribuicao;
    metadados.ultimoMovimento = p.ultimoMovimento;
  } else {
    throw new Error(`Tipo de origem desconhecido: ${origem}`);
  }

  // Normalizar data de última atualização
  const dataUltimaAtualizacao = (processo as any).updatedAt || (processo as any).createdAt || scrapeExecution.createdAt;

  return {
    id: processo.id,
    idPje,
    numeroProcesso,
    tribunalConfigId: tribunalConfig.id,
    tribunalCodigo: tribunal.codigo,
    tribunalNome: tribunal.nome,
    grau: tribunalConfig.grau,
    sistema: tribunalConfig.sistema,
    tipoRaspagem: scrapeExecution.scrapeJob.scrapeType as ScrapeType,
    subtipoRaspagem: scrapeExecution.scrapeJob.scrapeSubType || null,
    classeJudicial,
    orgaoJulgador,
    nomeParteAutora,
    nomeParteRe,
    dataAutuacao,
    dataUltimaAtualizacao,
    scrapeJobId: scrapeExecution.scrapeJobId,
    scrapeExecutionId: scrapeExecution.id,
    origem,
    metadados: Object.keys(metadados).length > 0 ? metadados : null,
  };
}

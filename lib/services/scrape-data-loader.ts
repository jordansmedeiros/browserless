/**
 * Scrape Data Loader
 * Serviço para carregar dados de raspagem com estratégia híbrida:
 * 1. Tenta carregar das tabelas específicas por tipo (preferencial)
 * 2. Fallback para resultData comprimido se as tabelas estiverem vazias
 */

import { prisma } from '@/lib/prisma';
import { ScrapeType } from '@/lib/types/scraping';
import { decompressJSON } from '@/lib/utils/compression';

/**
 * Carrega processos de uma execução específica usando estratégia híbrida
 *
 * @param executionId - ID da execução
 * @param scrapeType - Tipo de raspagem
 * @param resultData - Dados comprimidos (opcional, usado como fallback)
 * @returns Array de processos normalizados
 */
export async function loadProcessosFromExecution(
  executionId: string,
  scrapeType: ScrapeType,
  resultData?: string | null
): Promise<any[]> {
  console.log(`[DataLoader] Carregando processos da execução ${executionId}, tipo: ${scrapeType}`);

  // Estratégia 1: Carregar das tabelas específicas (preferencial)
  try {
    const processosFromTables = await loadFromTypeSpecificTable(executionId, scrapeType);

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
      const decompressed = decompressJSON(resultData);

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
  executionId: string,
  scrapeType: ScrapeType
): Promise<any[]> {
  switch (scrapeType) {
    case ScrapeType.PENDENTES:
      return await loadPendentesManifestacao(executionId);

    case ScrapeType.ACERVO_GERAL:
      return await loadProcessosAcervoGeral(executionId);

    case ScrapeType.ARQUIVADOS:
      return await loadProcessosArquivados(executionId);

    case ScrapeType.MINHA_PAUTA:
      return await loadMinhaPauta(executionId);

    default:
      console.warn(`[DataLoader] Tipo de raspagem não suportado: ${scrapeType}`);
      return [];
  }
}

/**
 * Carrega processos pendentes de manifestação
 */
async function loadPendentesManifestacao(executionId: string): Promise<any[]> {
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
 */
async function loadProcessosAcervoGeral(executionId: string): Promise<any[]> {
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
async function loadProcessosArquivados(executionId: string): Promise<any[]> {
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
async function loadMinhaPauta(executionId: string): Promise<any[]> {
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
 * Carrega todos os processos de todas as execuções de um job
 *
 * @param executions - Array de execuções do job
 * @param scrapeType - Tipo de raspagem
 * @returns Array consolidado de todos os processos
 */
export async function loadAllProcessosFromJob(
  executions: Array<{ id: string; resultData?: string | null }>,
  scrapeType: ScrapeType
): Promise<any[]> {
  const allProcesses: any[] = [];

  for (const execution of executions) {
    const processes = await loadProcessosFromExecution(
      execution.id,
      scrapeType,
      execution.resultData
    );
    allProcesses.push(...processes);
  }

  console.log(`[DataLoader] Total de ${allProcesses.length} processos carregados de ${executions.length} execuções`);
  return allProcesses;
}

/**
 * Scrape Data Persister
 * Serviço para salvar dados de raspagem nas tabelas específicas por tipo
 */

import { prisma } from '@/lib/db';
import { ScrapeType, type ScrapingResult } from '@/lib/types/scraping';

/**
 * Tamanho do chunk para inserções em lote
 * SQLite suporta ~999 parâmetros por query (SQLITE_MAX_VARIABLE_NUMBER)
 * Com ~20 campos por registro, 500 registros = ~10000 parâmetros (seguro)
 */
const BATCH_SIZE = 500;

/**
 * Salva os processos raspados nas tabelas específicas por tipo
 *
 * @param executionId - ID da execução
 * @param scrapeType - Tipo de raspagem
 * @param result - Resultado da raspagem
 * @returns Número de processos salvos
 */
export async function persistProcessos(
  executionId: string,
  scrapeType: ScrapeType,
  result: ScrapingResult
): Promise<number> {
  if (!result.success || !result.processos || result.processos.length === 0) {
    return 0;
  }

  console.log(`[DataPersister] Salvando ${result.processos.length} processos do tipo ${scrapeType} na execução ${executionId}`);

  try {
    switch (scrapeType) {
      case ScrapeType.PENDENTES:
        return await persistPendentesManifestacao(executionId, result.processos);

      case ScrapeType.ACERVO_GERAL:
        return await persistAcervoGeral(executionId, result.processos);

      case ScrapeType.ARQUIVADOS:
        return await persistProcessosArquivados(executionId, result.processos);

      case ScrapeType.MINHA_PAUTA:
        return await persistMinhaPauta(executionId, result.processos);

      default:
        console.warn(`[DataPersister] Tipo de raspagem não suportado: ${scrapeType}`);
        return 0;
    }
  } catch (error: any) {
    console.error(`[DataPersister] Erro ao salvar processos:`, error);
    throw new Error(`Falha ao persistir processos: ${error.message}`);
  }
}

/**
 * Executa createMany em chunks para evitar timeout com volumes grandes
 * @param model - Modelo Prisma (ex: prisma.pendentesManifestacao)
 * @param data - Array de dados a inserir
 * @returns Total de registros inseridos
 */
async function createManyInBatches<T>(
  model: any,
  data: T[]
): Promise<number> {
  if (data.length <= BATCH_SIZE) {
    // Volume pequeno - inserção direta
    const result = await model.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  // Volume grande - processar em chunks
  console.log(`[DataPersister] Processando ${data.length} registros em chunks de ${BATCH_SIZE}...`);
  let totalInserted = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    const result = await model.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    totalInserted += result.count;
    console.log(`[DataPersister] Chunk ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.length / BATCH_SIZE)}: ${result.count} registros inseridos`);
  }

  return totalInserted;
}

/**
 * Salva processos pendentes de manifestação
 */
async function persistPendentesManifestacao(
  executionId: string,
  processos: any[]
): Promise<number> {
  console.log(`[DataPersister] Processando ${processos.length} processos pendentes...`);

  const data = processos.map(p => ({
    scrapeExecutionId: executionId,
    idPje: p.id,
    numeroProcesso: p.numeroProcesso,
    numero: p.numero,
    classeJudicial: p.classeJudicial,
    descricaoOrgaoJulgador: p.descricaoOrgaoJulgador,
    siglaOrgaoJulgador: p.siglaOrgaoJulgador,
    segredoDeJustica: p.segredoDeJustica ?? false,
    codigoStatusProcesso: p.codigoStatusProcesso,
    prioridadeProcessual: p.prioridadeProcessual ?? 0,
    juizoDigital: p.juizoDigital ?? false,
    prazoVencido: p.prazoVencido ?? false,
    nomeParteAutora: p.nomeParteAutora,
    qtdeParteAutora: p.qtdeParteAutora,
    nomeParteRe: p.nomeParteRe,
    qtdeParteRe: p.qtdeParteRe,
    dataCienciaParte: p.dataCienciaParte ? new Date(p.dataCienciaParte) : null,
    dataPrazoLegalParte: p.dataPrazoLegalParte ? new Date(p.dataPrazoLegalParte) : null,
    dataAutuacao: p.dataAutuacao ? new Date(p.dataAutuacao) : null,
    dataArquivamento: p.dataArquivamento ? new Date(p.dataArquivamento) : null,
    dataCriacaoExpediente: p.dataCriacaoExpediente ? new Date(p.dataCriacaoExpediente) : null,
    idDocumento: p.idDocumento ? BigInt(p.idDocumento) : null,
    urlDocumento: p.urlDocumento,
    documentoMetadados: p.documentoMetadados,
    pdfLocal: p.pdfLocal,
    processosAssociados: p.processosAssociados,
  }));

  const result = await prisma.pendentesManifestacao.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`[DataPersister] ${result.count} processos pendentes salvos`);
  return result.count;
}

/**
 * Salva processos do acervo geral
 */
async function persistAcervoGeral(
  executionId: string,
  processos: any[]
): Promise<number> {
  console.log(`[DataPersister] Processando ${processos.length} processos do acervo geral...`);

  const data = processos.map(p => ({
    scrapeExecutionId: executionId,
    idPje: p.id,
    numeroProcesso: p.numeroProcesso,
    numero: p.numero,
    classeJudicial: p.classeJudicial,
    descricaoOrgaoJulgador: p.descricaoOrgaoJulgador,
    siglaOrgaoJulgador: p.siglaOrgaoJulgador,
    segredoDeJustica: p.segredoDeJustica ?? false,
    codigoStatusProcesso: p.codigoStatusProcesso,
    prioridadeProcessual: p.prioridadeProcessual ?? 0,
    juizoDigital: p.juizoDigital ?? false,
    nomeParteAutora: p.nomeParteAutora,
    qtdeParteAutora: p.qtdeParteAutora,
    nomeParteRe: p.nomeParteRe,
    qtdeParteRe: p.qtdeParteRe,
    dataAutuacao: p.dataAutuacao ? new Date(p.dataAutuacao) : null,
    dataArquivamento: p.dataArquivamento ? new Date(p.dataArquivamento) : null,
    metadados: p,  // Guarda o objeto completo em metadados
  }));

  const result = await prisma.processos.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`[DataPersister] ${result.count} processos do acervo geral salvos`);
  return result.count;
}

/**
 * Salva processos arquivados
 */
async function persistProcessosArquivados(
  executionId: string,
  processos: any[]
): Promise<number> {
  console.log(`[DataPersister] Processando ${processos.length} processos arquivados...`);

  const data = processos.map(p => ({
    scrapeExecutionId: executionId,
    idPje: p.id,
    numeroProcesso: p.numeroProcesso,
    numero: p.numero,
    classeJudicial: p.classeJudicial,
    descricaoOrgaoJulgador: p.descricaoOrgaoJulgador,
    siglaOrgaoJulgador: p.siglaOrgaoJulgador,
    segredoDeJustica: p.segredoDeJustica ?? false,
    codigoStatusProcesso: p.codigoStatusProcesso,
    prioridadeProcessual: p.prioridadeProcessual ?? 0,
    juizoDigital: p.juizoDigital ?? false,
    nomeParteAutora: p.nomeParteAutora,
    qtdeParteAutora: p.qtdeParteAutora,
    nomeParteRe: p.nomeParteRe,
    qtdeParteRe: p.qtdeParteRe,
    dataAutuacao: p.dataAutuacao ? new Date(p.dataAutuacao) : null,
    dataArquivamento: p.dataArquivamento ? new Date(p.dataArquivamento) : null,
    metadados: p,
  }));

  const result = await prisma.processosArquivados.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`[DataPersister] ${result.count} processos arquivados salvos`);
  return result.count;
}

/**
 * Salva processos da minha pauta (audiências/sessões)
 */
async function persistMinhaPauta(
  executionId: string,
  processos: any[]
): Promise<number> {
  console.log(`[DataPersister] Processando ${processos.length} audiências/sessões da minha pauta...`);

  const data = processos.map(p => ({
    scrapeExecutionId: executionId,
    idPje: p.id,
    nrProcesso: p.nrProcesso,
    dataInicio: p.dataInicio ? new Date(p.dataInicio) : null,
    dataFim: p.dataFim ? new Date(p.dataFim) : null,
    urlAudienciaVirtual: p.urlAudienciaVirtual,
    arquivoICS: p.arquivoICS,
    tipoDescricao: p.tipo?.descricao,
    tipoCodigo: p.tipo?.codigo,
    processoMetadados: p.processo,
    poloAtivo: p.poloAtivo,
    poloPassivo: p.poloPassivo,
    metadados: p,
  }));

  const result = await prisma.minhaPauta.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`[DataPersister] ${result.count} audiências/sessões salvas`);
  return result.count;
}

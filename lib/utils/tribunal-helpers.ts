/**
 * Helpers para trabalhar com famílias de tribunais
 * Fornece funções para detectar família, mapear nomenclatura e colunas
 */

import type { ScrapeType, ProcessoUnificado } from '@/lib/types/scraping';
import { TribunalFamily } from '@/lib/types/scraping';

/**
 * Detecta a família de tribunal baseado no código
 */
export function getTribunalFamily(tribunalCodigo: string): TribunalFamily {
  if (tribunalCodigo.startsWith('TRT')) {
    return TribunalFamily.TRT;
  }
  if (tribunalCodigo.startsWith('TJ')) {
    return TribunalFamily.TJ;
  }
  if (tribunalCodigo.startsWith('TRF')) {
    return TribunalFamily.TRF;
  }
  return TribunalFamily.SUPERIOR;
}

/**
 * Retorna label específico do tipo de raspagem baseado na família do tribunal
 */
export function getScrapeTypeLabel(
  scrapeType: ScrapeType,
  tribunalFamily: TribunalFamily
): string {
  switch (tribunalFamily) {
    case TribunalFamily.TRT:
      switch (scrapeType) {
        case 'pendentes':
          return 'Pendentes de Manifestação';
        case 'acervo_geral':
          return 'Acervo Geral';
        case 'arquivados':
          return 'Arquivados';
        case 'minha_pauta':
          return 'Minha Pauta';
        default:
          return scrapeType;
      }
    case TribunalFamily.TJ:
      switch (scrapeType) {
        case 'pendentes':
          return 'Expedientes';
        case 'acervo_geral':
          return 'Acervo';
        case 'arquivados':
          return 'Arquivados';
        case 'minha_pauta':
          return 'Pauta de Audiência';
        default:
          return scrapeType;
      }
    case TribunalFamily.TRF:
    case TribunalFamily.SUPERIOR:
      // Fallback genérico
      switch (scrapeType) {
        case 'pendentes':
          return 'Pendentes';
        case 'acervo_geral':
          return 'Acervo Geral';
        case 'arquivados':
          return 'Arquivados';
        case 'minha_pauta':
          return 'Pauta';
        default:
          return scrapeType;
      }
    default:
      return scrapeType;
  }
}

/**
 * Retorna descrição detalhada do tipo de raspagem baseado na família do tribunal
 */
export function getScrapeTypeDescription(
  scrapeType: ScrapeType,
  tribunalFamily: TribunalFamily
): string {
  switch (tribunalFamily) {
    case TribunalFamily.TRT:
      switch (scrapeType) {
        case 'pendentes':
          return 'Processos com pendências de manifestação e prazos a cumprir';
        case 'acervo_geral':
          return 'Todos os processos ativos do advogado';
        case 'arquivados':
          return 'Processos arquivados e finalizados';
        case 'minha_pauta':
          return 'Audiências e sessões agendadas';
        default:
          return '';
      }
    case TribunalFamily.TJ:
      switch (scrapeType) {
        case 'pendentes':
          return 'Expedientes pendentes de análise';
        case 'acervo_geral':
          return 'Acervo completo de processos';
        case 'arquivados':
          return 'Processos arquivados';
        case 'minha_pauta':
          return 'Pautas de audiência agendadas';
        default:
          return '';
      }
    case TribunalFamily.TRF:
    case TribunalFamily.SUPERIOR:
      // Descrições genéricas
      switch (scrapeType) {
        case 'pendentes':
          return 'Processos pendentes';
        case 'acervo_geral':
          return 'Acervo geral';
        case 'arquivados':
          return 'Processos arquivados';
        case 'minha_pauta':
          return 'Pautas agendadas';
        default:
          return '';
      }
    default:
      return '';
  }
}

/**
 * Retorna colunas específicas a exibir baseado na origem e família do tribunal
 */
export function getColumnsByOrigemAndFamily(
  origem: ProcessoUnificado['origem'],
  tribunalFamily: TribunalFamily
): string[] {
  switch (tribunalFamily) {
    case TribunalFamily.TRT:
      switch (origem) {
        case 'PendentesManifestacao':
          return [
            'numeroProcesso',
            'partes',
            'orgaoJulgador',
            'dataCienciaParte',
            'dataPrazoLegalParte',
            'prazoVencido',
            'dataAutuacao',
          ];
        case 'Processos':
          return [
            'numeroProcesso',
            'partes',
            'orgaoJulgador',
            'classeJudicial',
            'dataAutuacao',
          ];
        case 'ProcessosArquivados':
          return [
            'numeroProcesso',
            'partes',
            'orgaoJulgador',
            'dataAutuacao',
            'dataArquivamento',
          ];
        case 'MinhaPauta':
          return [
            'numeroProcesso',
            'dataInicio',
            'dataFim',
            'urlAudienciaVirtual',
            'tipoDescricao',
          ];
        default:
          return ['numeroProcesso', 'partes', 'orgaoJulgador', 'dataAutuacao'];
      }
    case TribunalFamily.TJ:
      if (origem === 'ProcessosTJMG') {
        return [
          'numero',
          'regiao',
          'tipo',
          'partes',
          'vara',
          'dataDistribuicao',
          'ultimoMovimento',
        ];
      }
      // Fallback genérico para TJ
      return ['numeroProcesso', 'partes', 'dataAutuacao'];
    case TribunalFamily.TRF:
    case TribunalFamily.SUPERIOR:
      // Colunas genéricas
      return ['numeroProcesso', 'partes', 'orgaoJulgador', 'dataAutuacao'];
    default:
      return ['numeroProcesso', 'partes', 'dataAutuacao'];
  }
}

/**
 * Retorna label amigável para uma coluna baseado na família do tribunal
 */
export function getColumnLabel(column: string, tribunalFamily: TribunalFamily): string {
  const labels: Record<string, Record<TribunalFamily, string>> = {
    numeroProcesso: {
      [TribunalFamily.TRT]: 'Número do Processo',
      [TribunalFamily.TJ]: 'Número do Processo',
      [TribunalFamily.TRF]: 'Número do Processo',
      [TribunalFamily.SUPERIOR]: 'Número do Processo',
    },
    numero: {
      [TribunalFamily.TRT]: 'Número',
      [TribunalFamily.TJ]: 'Número',
      [TribunalFamily.TRF]: 'Número',
      [TribunalFamily.SUPERIOR]: 'Número',
    },
    partes: {
      [TribunalFamily.TRT]: 'Partes',
      [TribunalFamily.TJ]: 'Partes',
      [TribunalFamily.TRF]: 'Partes',
      [TribunalFamily.SUPERIOR]: 'Partes',
    },
    nomeParteAutora: {
      [TribunalFamily.TRT]: 'Autor(a)',
      [TribunalFamily.TJ]: 'Autor(a)',
      [TribunalFamily.TRF]: 'Autor(a)',
      [TribunalFamily.SUPERIOR]: 'Autor(a)',
    },
    nomeParteRe: {
      [TribunalFamily.TRT]: 'Réu/Ré',
      [TribunalFamily.TJ]: 'Réu/Ré',
      [TribunalFamily.TRF]: 'Réu/Ré',
      [TribunalFamily.SUPERIOR]: 'Réu/Ré',
    },
    orgaoJulgador: {
      [TribunalFamily.TRT]: 'Órgão Julgador',
      [TribunalFamily.TJ]: 'Órgão Julgador',
      [TribunalFamily.TRF]: 'Órgão Julgador',
      [TribunalFamily.SUPERIOR]: 'Órgão Julgador',
    },
    vara: {
      [TribunalFamily.TRT]: 'Vara',
      [TribunalFamily.TJ]: 'Vara',
      [TribunalFamily.TRF]: 'Vara',
      [TribunalFamily.SUPERIOR]: 'Vara',
    },
    classeJudicial: {
      [TribunalFamily.TRT]: 'Classe',
      [TribunalFamily.TJ]: 'Classe',
      [TribunalFamily.TRF]: 'Classe',
      [TribunalFamily.SUPERIOR]: 'Classe',
    },
    dataAutuacao: {
      [TribunalFamily.TRT]: 'Data de Autuação',
      [TribunalFamily.TJ]: 'Data de Autuação',
      [TribunalFamily.TRF]: 'Data de Autuação',
      [TribunalFamily.SUPERIOR]: 'Data de Autuação',
    },
    dataCienciaParte: {
      [TribunalFamily.TRT]: 'Data Ciência da Parte',
      [TribunalFamily.TJ]: 'Data Ciência',
      [TribunalFamily.TRF]: 'Data Ciência',
      [TribunalFamily.SUPERIOR]: 'Data Ciência',
    },
    dataPrazoLegalParte: {
      [TribunalFamily.TRT]: 'Prazo Legal',
      [TribunalFamily.TJ]: 'Prazo',
      [TribunalFamily.TRF]: 'Prazo',
      [TribunalFamily.SUPERIOR]: 'Prazo',
    },
    prazoVencido: {
      [TribunalFamily.TRT]: 'Prazo Vencido',
      [TribunalFamily.TJ]: 'Prazo Vencido',
      [TribunalFamily.TRF]: 'Prazo Vencido',
      [TribunalFamily.SUPERIOR]: 'Prazo Vencido',
    },
    dataArquivamento: {
      [TribunalFamily.TRT]: 'Data Arquivamento',
      [TribunalFamily.TJ]: 'Data Arquivamento',
      [TribunalFamily.TRF]: 'Data Arquivamento',
      [TribunalFamily.SUPERIOR]: 'Data Arquivamento',
    },
    dataInicio: {
      [TribunalFamily.TRT]: 'Data/Hora Início',
      [TribunalFamily.TJ]: 'Data/Hora Início',
      [TribunalFamily.TRF]: 'Data/Hora Início',
      [TribunalFamily.SUPERIOR]: 'Data/Hora Início',
    },
    dataFim: {
      [TribunalFamily.TRT]: 'Data/Hora Fim',
      [TribunalFamily.TJ]: 'Data/Hora Fim',
      [TribunalFamily.TRF]: 'Data/Hora Fim',
      [TribunalFamily.SUPERIOR]: 'Data/Hora Fim',
    },
    urlAudienciaVirtual: {
      [TribunalFamily.TRT]: 'Audiência Virtual',
      [TribunalFamily.TJ]: 'Audiência Virtual',
      [TribunalFamily.TRF]: 'Audiência Virtual',
      [TribunalFamily.SUPERIOR]: 'Audiência Virtual',
    },
    tipoDescricao: {
      [TribunalFamily.TRT]: 'Tipo',
      [TribunalFamily.TJ]: 'Tipo',
      [TribunalFamily.TRF]: 'Tipo',
      [TribunalFamily.SUPERIOR]: 'Tipo',
    },
    regiao: {
      [TribunalFamily.TRT]: 'Região',
      [TribunalFamily.TJ]: 'Região',
      [TribunalFamily.TRF]: 'Região',
      [TribunalFamily.SUPERIOR]: 'Região',
    },
    tipo: {
      [TribunalFamily.TRT]: 'Tipo',
      [TribunalFamily.TJ]: 'Tipo',
      [TribunalFamily.TRF]: 'Tipo',
      [TribunalFamily.SUPERIOR]: 'Tipo',
    },
    dataDistribuicao: {
      [TribunalFamily.TRT]: 'Data Distribuição',
      [TribunalFamily.TJ]: 'Data Distribuição',
      [TribunalFamily.TRF]: 'Data Distribuição',
      [TribunalFamily.SUPERIOR]: 'Data Distribuição',
    },
    ultimoMovimento: {
      [TribunalFamily.TRT]: 'Último Movimento',
      [TribunalFamily.TJ]: 'Último Movimento',
      [TribunalFamily.TRF]: 'Último Movimento',
      [TribunalFamily.SUPERIOR]: 'Último Movimento',
    },
  };

  return labels[column]?.[tribunalFamily] || column;
}


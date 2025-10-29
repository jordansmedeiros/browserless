/**
 * Tribunal Sorter
 * Ordena tribunais para execução sequencial otimizada
 */

import type { ScrapeJobTribunal, TribunalConfig, Tribunal } from '@prisma/client';

/**
 * Tribunal com suas relações para ordenação
 */
type TribunalWithRelations = ScrapeJobTribunal & {
  tribunalConfig: TribunalConfig & {
    tribunal: Tribunal;
  };
};

/**
 * Extrai número do código do tribunal (ex: "TRT3" -> 3, "TJ15" -> 15)
 */
function extractTribunalNumber(codigo: string): number | null {
  const match = codigo.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Compara dois tribunais para ordenação
 *
 * Critérios (em ordem de prioridade):
 * 1. TRTs com numeração antes de outros tribunais
 * 2. Ordem numérica crescente (TRT1, TRT2, ..., TRT24)
 * 3. Grau: 1g antes de 2g
 * 4. Ordem alfabética para tribunais sem numeração
 */
function compareTribunals(
  a: TribunalWithRelations,
  b: TribunalWithRelations
): number {
  const aConfig = a.tribunalConfig;
  const bConfig = b.tribunalConfig;
  const aTribunal = aConfig.tribunal;
  const bTribunal = bConfig.tribunal;

  // Extrai números dos códigos
  const aNumber = extractTribunalNumber(aTribunal.codigo);
  const bNumber = extractTribunalNumber(bTribunal.codigo);

  // Ambos têm numeração
  if (aNumber !== null && bNumber !== null) {
    // Primeiro: ordem numérica
    if (aNumber !== bNumber) {
      return aNumber - bNumber;
    }

    // Mesmo número: ordena por grau (1g antes de 2g)
    return aConfig.grau.localeCompare(bConfig.grau);
  }

  // Apenas A tem numeração - A vem primeiro
  if (aNumber !== null) {
    return -1;
  }

  // Apenas B tem numeração - B vem primeiro
  if (bNumber !== null) {
    return 1;
  }

  // Nenhum tem numeração: ordem alfabética
  const codigoCompare = aTribunal.codigo.localeCompare(bTribunal.codigo);
  if (codigoCompare !== 0) {
    return codigoCompare;
  }

  // Mesmo código: ordena por grau
  return aConfig.grau.localeCompare(bConfig.grau);
}

/**
 * Ordena tribunais para execução sequencial otimizada
 *
 * @param tribunals - Lista de tribunais a serem ordenados
 * @returns Lista ordenada de tribunais
 *
 * @example
 * Input: [TRT4 2g, TRT3 1g, TRT3 2g, TST, TRT4 1g]
 * Output: [TRT3 1g, TRT3 2g, TRT4 1g, TRT4 2g, TST]
 */
export async function sortTribunals(
  tribunals: TribunalWithRelations[]
): Promise<TribunalWithRelations[]> {
  // Cria cópia para não modificar o array original
  const sorted = [...tribunals];

  // Ordena usando a função de comparação
  sorted.sort(compareTribunals);

  return sorted;
}

/**
 * Gera descrição legível da ordem de execução
 *
 * @param tribunals - Lista ordenada de tribunais
 * @returns String descrevendo a ordem (ex: "TRT3 1g, TRT3 2g, TRT4 1g, ...")
 */
export function describeExecutionOrder(
  tribunals: TribunalWithRelations[]
): string {
  return tribunals
    .map(jt => `${jt.tribunalConfig.tribunal.codigo} ${jt.tribunalConfig.grau}`)
    .join(' → ');
}

/**
 * Agrupa tribunais por código (ex: todos os TRT3 juntos)
 *
 * @param tribunals - Lista de tribunais
 * @returns Map com código do tribunal como chave e lista de configs como valor
 */
export function groupTribunalsByCode(
  tribunals: TribunalWithRelations[]
): Map<string, TribunalWithRelations[]> {
  const grouped = new Map<string, TribunalWithRelations[]>();

  for (const tribunal of tribunals) {
    const codigo = tribunal.tribunalConfig.tribunal.codigo;
    const existing = grouped.get(codigo) || [];
    existing.push(tribunal);
    grouped.set(codigo, existing);
  }

  return grouped;
}

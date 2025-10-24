/**
 * Seed Data - Tribunal Configs
 * Configurações de URL para todos os TRTs (48 configurações: 24 TRTs × 2 graus)
 */

import type { Grau } from '../../lib/types/tribunal';

export interface TribunalConfigSeedData {
  tribunalCodigo: string;
  grau: Grau;
  urlBase: string;
  urlLoginSeam: string;
  urlApi: string;
}

/**
 * Gera URL do PJE seguindo o padrão padrão
 * @param trtNum Número do TRT (1-24)
 * @param grau Grau da instância ('1g' ou '2g')
 * @param path Caminho adicional (opcional)
 */
export function generatePJEUrl(
  trtNum: number,
  grau: Grau,
  path: string = ''
): string {
  const grauPath = grau === '1g' ? 'primeirograu' : 'segundograu';
  return `https://pje.trt${trtNum}.jus.br/${grauPath}${path}`;
}

/**
 * Gera configuração completa de URLs para um TRT e grau
 */
export function generateTribunalConfig(
  trtNum: number,
  grau: Grau
): Omit<TribunalConfigSeedData, 'tribunalCodigo'> {
  const urlBase = `https://pje.trt${trtNum}.jus.br`;
  const urlLoginSeam = generatePJEUrl(trtNum, grau, '/login.seam');
  const urlApi = `${urlBase}/pje-comum-api/api`;

  return {
    grau,
    urlBase,
    urlLoginSeam,
    urlApi,
  };
}

/**
 * Gera todas as 48 configurações (24 TRTs × 2 graus)
 */
export function generateAllTribunalConfigs(): TribunalConfigSeedData[] {
  const configs: TribunalConfigSeedData[] = [];

  for (let trtNum = 1; trtNum <= 24; trtNum++) {
    const tribunalCodigo = `TRT${trtNum}`;

    // Primeiro grau
    configs.push({
      tribunalCodigo,
      ...generateTribunalConfig(trtNum, '1g'),
    });

    // Segundo grau
    configs.push({
      tribunalCodigo,
      ...generateTribunalConfig(trtNum, '2g'),
    });
  }

  return configs;
}

/**
 * Todas as 48 configurações de URL
 */
export const tribunalConfigsSeed: TribunalConfigSeedData[] =
  generateAllTribunalConfigs();

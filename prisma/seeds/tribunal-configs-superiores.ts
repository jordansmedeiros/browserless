/**
 * Seed Data - Configurações dos Tribunais Superiores
 * URLs e configurações de acesso para TST, STJ e STF
 */

import type { Grau, Sistema } from '../../lib/types/tribunal';

export interface TribunalConfigSeedData {
  tribunalCodigo: string;
  sistema: Sistema;
  grau: Grau;
  urlBase: string;
  urlLoginSeam: string;
  urlApi: string | null;
}

export const tribunalConfigsSuperioresSeed: TribunalConfigSeedData[] = [
  // TST - Tribunal Superior do Trabalho (PJE)
  {
    tribunalCodigo: 'TST',
    sistema: 'PJE',
    grau: 'unico',
    urlBase: 'https://pje.tst.jus.br',
    urlLoginSeam: 'https://pje.tst.jus.br/tst/login.seam',
    urlApi: 'https://pje.tst.jus.br/pje-comum-api/api',
  },

  // STJ - Superior Tribunal de Justiça (Sistema próprio)
  {
    tribunalCodigo: 'STJ',
    sistema: 'PJE', // Usando PJE como placeholder - sistema CPE
    grau: 'unico',
    urlBase: 'https://cpe.web.stj.jus.br',
    urlLoginSeam: 'https://cpe.web.stj.jus.br/#/',
    urlApi: null,
  },

  // STF - Supremo Tribunal Federal (Sistema próprio)
  {
    tribunalCodigo: 'STF',
    sistema: 'PJE', // Usando PJE como placeholder - sistema próprio
    grau: 'unico',
    urlBase: 'https://sistemas.stf.jus.br',
    urlLoginSeam: 'https://sistemas.stf.jus.br/cas/login',
    urlApi: null,
  },
];

/**
 * Seed Data - Configurações dos TRFs
 * URLs e configurações de acesso para todos os TRFs
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

export const tribunalConfigsTRFSeed: TribunalConfigSeedData[] = [
  // TRF1 - PJE
  {
    tribunalCodigo: 'TRF1',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje1g.trf1.jus.br',
    urlLoginSeam: 'https://pje1g.trf1.jus.br/pje/login.seam',
    urlApi: 'https://pje1g.trf1.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TRF1',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje2g.trf1.jus.br',
    urlLoginSeam: 'https://pje2g.trf1.jus.br/pje/login.seam',
    urlApi: 'https://pje2g.trf1.jus.br/pje-comum-api/api',
  },

  // TRF2 - EPROC (Acesso Único)
  {
    tribunalCodigo: 'TRF2',
    sistema: 'EPROC',
    grau: 'unico',
    urlBase: 'https://eproc.trf2.jus.br',
    urlLoginSeam: 'https://eproc.trf2.jus.br/eproc/',
    urlApi: null,
  },

  // TRF3 - PJE
  {
    tribunalCodigo: 'TRF3',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje1g.trf3.jus.br',
    urlLoginSeam: 'https://pje1g.trf3.jus.br/pje/login.seam',
    urlApi: 'https://pje1g.trf3.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TRF3',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje2g.trf3.jus.br',
    urlLoginSeam: 'https://pje2g.trf3.jus.br/pje/login.seam',
    urlApi: 'https://pje2g.trf3.jus.br/pje-comum-api/api',
  },

  // TRF4 - EPROC (Acesso Único)
  {
    tribunalCodigo: 'TRF4',
    sistema: 'EPROC',
    grau: 'unico',
    urlBase: 'https://eproc.trf4.jus.br',
    urlLoginSeam: 'https://eproc.trf4.jus.br/eproc2trf4/',
    urlApi: null,
  },

  // TRF5 - PJE (Acesso Único)
  {
    tribunalCodigo: 'TRF5',
    sistema: 'PJE',
    grau: 'unico',
    urlBase: 'https://pje.trf5.jus.br',
    urlLoginSeam: 'https://pje.trf5.jus.br/pje/login.seam',
    urlApi: 'https://pje.trf5.jus.br/pje-comum-api/api',
  },

  // TRF6 - EPROC
  {
    tribunalCodigo: 'TRF6',
    sistema: 'EPROC',
    grau: '1g',
    urlBase: 'https://eproc1g.trf6.jus.br',
    urlLoginSeam: 'https://eproc1g.trf6.jus.br/eproc/',
    urlApi: null,
  },
  {
    tribunalCodigo: 'TRF6',
    sistema: 'EPROC',
    grau: '2g',
    urlBase: 'https://eproc2g.trf6.jus.br',
    urlLoginSeam: 'https://eproc2g.trf6.jus.br/eproc/',
    urlApi: null,
  },
];

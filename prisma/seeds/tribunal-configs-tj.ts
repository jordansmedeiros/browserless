/**
 * Seed Data - Configurações dos Tribunais de Justiça (TJs)
 * URLs e configurações de acesso para todos os TJs
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

export const tribunalConfigsTJSeed: TribunalConfigSeedData[] = [
  // TJRS - Rio Grande do Sul (EPROC)
  {
    tribunalCodigo: 'TJRS',
    sistema: 'EPROC',
    grau: '1g',
    urlBase: 'https://eproc1g.tjrs.jus.br',
    urlLoginSeam: 'https://eproc1g.tjrs.jus.br/eproc/externo_controlador.php?acao=principal',
    urlApi: null,
  },
  {
    tribunalCodigo: 'TJRS',
    sistema: 'EPROC',
    grau: '2g',
    urlBase: 'https://eproc2g.tjrs.jus.br',
    urlLoginSeam: 'https://eproc2g.tjrs.jus.br/eproc/',
    urlApi: null,
  },

  // TJTO - Tocantins (EPROC)
  {
    tribunalCodigo: 'TJTO',
    sistema: 'EPROC',
    grau: '1g',
    urlBase: 'https://eproc1.tjto.jus.br',
    urlLoginSeam: 'https://eproc1.tjto.jus.br/eprocV2_prod_1grau/',
    urlApi: null,
  },
  {
    tribunalCodigo: 'TJTO',
    sistema: 'EPROC',
    grau: '2g',
    urlBase: 'https://eproc2.tjto.jus.br',
    urlLoginSeam: 'https://eproc2.tjto.jus.br/eprocV2_prod_2grau/',
    urlApi: null,
  },

  // TJSC - Santa Catarina (EPROC)
  {
    tribunalCodigo: 'TJSC',
    sistema: 'EPROC',
    grau: '1g',
    urlBase: 'https://eproc1g.tjsc.jus.br',
    urlLoginSeam: 'https://eproc1g.tjsc.jus.br/eproc/index.php',
    urlApi: null,
  },
  {
    tribunalCodigo: 'TJSC',
    sistema: 'EPROC',
    grau: '2g',
    urlBase: 'https://eproc2g.tjsc.jus.br',
    urlLoginSeam: 'https://eproc2g.tjsc.jus.br/eproc/externo_controlador.php?acao=principal',
    urlApi: null,
  },

  // TJES - Espírito Santo (PJE)
  {
    tribunalCodigo: 'TJES',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjes.jus.br',
    urlLoginSeam: 'https://pje.tjes.jus.br/pje/login.seam',
    urlApi: 'https://pje.tjes.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJES',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje.tjes.jus.br',
    urlLoginSeam: 'https://pje.tjes.jus.br/pje2g/login.seam',
    urlApi: 'https://pje.tjes.jus.br/pje-comum-api/api',
  },

  // TJCE - Ceará (PJE + ESAJ)
  {
    tribunalCodigo: 'TJCE',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjce.jus.br',
    urlLoginSeam: 'https://pje.tjce.jus.br/pje1grau/login.seam',
    urlApi: 'https://pje.tjce.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJCE',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje.tjce.jus.br',
    urlLoginSeam: 'https://pje.tjce.jus.br/pje2grau/login.seam',
    urlApi: 'https://pje.tjce.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJCE',
    sistema: 'ESAJ',
    grau: 'unico',
    urlBase: 'https://esaj.tjce.jus.br',
    urlLoginSeam: 'https://esaj.tjce.jus.br/sajcas/login?service=https%3A%2F%2Fesaj.tjce.jus.br%2Fesaj%2Fj_spring_cas_security_check',
    urlApi: null,
  },

  // TJDFT - Distrito Federal (PJE)
  {
    tribunalCodigo: 'TJDFT',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjdft.jus.br',
    urlLoginSeam: 'https://pje.tjdft.jus.br/pje/login.seam',
    urlApi: 'https://pje.tjdft.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJDFT',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje2i.tjdft.jus.br',
    urlLoginSeam: 'https://pje2i.tjdft.jus.br/pje/login.seam',
    urlApi: 'https://pje2i.tjdft.jus.br/pje-comum-api/api',
  },

  // TJSE - Sergipe (Acesso Único - sistema próprio)
  {
    tribunalCodigo: 'TJSE',
    sistema: 'PJE', // Usando PJE como placeholder - sistema não documentado
    grau: 'unico',
    urlBase: 'https://www.tjse.jus.br',
    urlLoginSeam: 'https://www.tjse.jus.br/portal/consultas/consulta-processual',
    urlApi: null,
  },

  // TJPB - Paraíba (PJE)
  {
    tribunalCodigo: 'TJPB',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjpb.jus.br',
    urlLoginSeam: 'https://pje.tjpb.jus.br/pje/login.seam',
    urlApi: 'https://pje.tjpb.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJPB',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pjesg.tjpb.jus.br',
    urlLoginSeam: 'https://pjesg.tjpb.jus.br/pje2g/login.seam',
    urlApi: 'https://pjesg.tjpb.jus.br/pje-comum-api/api',
  },

  // TJMG - Minas Gerais (PJE + THEMIS + PJE Turma Recursal)
  // NOTA: TJMG NÃO possui API REST - usa HTML parsing
  {
    tribunalCodigo: 'TJMG',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjmg.jus.br',
    urlLoginSeam: 'https://pje.tjmg.jus.br/pje/login.seam',
    urlApi: null, // TJMG não tem API REST, usa scraping HTML
  },
  {
    tribunalCodigo: 'TJMG',
    sistema: 'THEMIS',
    grau: '2g',
    urlBase: 'https://pe.tjmg.jus.br',
    urlLoginSeam: 'https://pe.tjmg.jus.br/rupe/portaljus/intranet/principal.rupe',
    urlApi: null,
  },
  // Nota: PJE Turma Recursal do TJMG não tem grau definido no documento
  // Usando 'unico' por ser uma instância especial

  // TJRJ - Rio de Janeiro (EPROC)
  {
    tribunalCodigo: 'TJRJ',
    sistema: 'EPROC',
    grau: '1g',
    urlBase: 'https://eproc1g.tjrj.jus.br',
    urlLoginSeam: 'https://eproc1g.tjrj.jus.br/eproc/',
    urlApi: null,
  },
  {
    tribunalCodigo: 'TJRJ',
    sistema: 'EPROC',
    grau: '2g',
    urlBase: 'https://eproc2g.tjrj.jus.br',
    urlLoginSeam: 'https://eproc2g.tjrj.jus.br/eproc/',
    urlApi: null,
  },

  // TJRO - Rondônia (PJE)
  {
    tribunalCodigo: 'TJRO',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pjepg.tjro.jus.br',
    urlLoginSeam: 'https://pjepg.tjro.jus.br/login.seam',
    urlApi: 'https://pjepg.tjro.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJRO',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pjesg.tjro.jus.br',
    urlLoginSeam: 'https://pjesg.tjro.jus.br/login.seam',
    urlApi: 'https://pjesg.tjro.jus.br/pje-comum-api/api',
  },

  // TJAP - Amapá (PJE)
  {
    tribunalCodigo: 'TJAP',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjap.jus.br',
    urlLoginSeam: 'https://pje.tjap.jus.br/1g/login.seam',
    urlApi: 'https://pje.tjap.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJAP',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje.tjap.jus.br',
    urlLoginSeam: 'https://pje.tjap.jus.br/2g/login.seam',
    urlApi: 'https://pje.tjap.jus.br/pje-comum-api/api',
  },

  // TJPI - Piauí (PJE)
  {
    tribunalCodigo: 'TJPI',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjpi.jus.br',
    urlLoginSeam: 'https://pje.tjpi.jus.br/1g/login.seam',
    urlApi: 'https://pje.tjpi.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJPI',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje.tjpi.jus.br',
    urlLoginSeam: 'https://pje.tjpi.jus.br/2g/login.seam',
    urlApi: 'https://pje.tjpi.jus.br/pje-comum-api/api',
  },

  // TJGO - Goiás (PROJUDI)
  {
    tribunalCodigo: 'TJGO',
    sistema: 'PROJUDI',
    grau: 'unico',
    urlBase: 'https://projudi.tjgo.jus.br',
    urlLoginSeam: 'https://projudi.tjgo.jus.br/',
    urlApi: null,
  },

  // TJPA - Pará (PJE)
  {
    tribunalCodigo: 'TJPA',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjpa.jus.br',
    urlLoginSeam: 'https://pje.tjpa.jus.br/pje/login.seam',
    urlApi: 'https://pje.tjpa.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJPA',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje.tjpa.jus.br',
    urlLoginSeam: 'https://pje.tjpa.jus.br/pje-2g/login.seam',
    urlApi: 'https://pje.tjpa.jus.br/pje-comum-api/api',
  },

  // TJMT - Mato Grosso (PJE)
  {
    tribunalCodigo: 'TJMT',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjmt.jus.br',
    urlLoginSeam: 'https://pje.tjmt.jus.br/pje/login.seam',
    urlApi: 'https://pje.tjmt.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJMT',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje2.tjmt.jus.br',
    urlLoginSeam: 'https://pje2.tjmt.jus.br/pje2/login.seam',
    urlApi: 'https://pje2.tjmt.jus.br/pje-comum-api/api',
  },

  // TJPE - Pernambuco (PJE)
  {
    tribunalCodigo: 'TJPE',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.cloud.tjpe.jus.br',
    urlLoginSeam: 'https://pje.cloud.tjpe.jus.br/1g/login.seam',
    urlApi: 'https://pje.cloud.tjpe.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJPE',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje.cloud.tjpe.jus.br',
    urlLoginSeam: 'https://pje.cloud.tjpe.jus.br/2g/login.seam',
    urlApi: 'https://pje.cloud.tjpe.jus.br/pje-comum-api/api',
  },

  // TJMA - Maranhão (PJE)
  {
    tribunalCodigo: 'TJMA',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjma.jus.br',
    urlLoginSeam: 'https://pje.tjma.jus.br/pje/login.seam',
    urlApi: 'https://pje.tjma.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJMA',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje2.tjma.jus.br',
    urlLoginSeam: 'https://pje2.tjma.jus.br/pje2g/login.seam',
    urlApi: 'https://pje2.tjma.jus.br/pje-comum-api/api',
  },

  // TJSP - São Paulo (ESAJ)
  {
    tribunalCodigo: 'TJSP',
    sistema: 'ESAJ',
    grau: 'unico',
    urlBase: 'https://esaj.tjsp.jus.br',
    urlLoginSeam: 'https://esaj.tjsp.jus.br/sajcas/login?service=https%3A%2F%2Fesaj.tjsp.jus.br%2Fesaj%2Fj_spring_cas_security_check',
    urlApi: null,
  },

  // TJMS - Mato Grosso do Sul (ESAJ)
  {
    tribunalCodigo: 'TJMS',
    sistema: 'ESAJ',
    grau: 'unico',
    urlBase: 'https://esaj.tjms.jus.br',
    urlLoginSeam: 'https://esaj.tjms.jus.br/sajcas/login?service=https%3A%2F%2Fesaj.tjms.jus.br%2Fesaj%2Fj_spring_cas_security_check',
    urlApi: null,
  },

  // TJAC - Acre (ESAJ)
  {
    tribunalCodigo: 'TJAC',
    sistema: 'ESAJ',
    grau: 'unico',
    urlBase: 'https://esaj.tjac.jus.br',
    urlLoginSeam: 'https://esaj.tjac.jus.br/sajcas/login?service=https%3A%2F%2Fesaj.tjac.jus.br%2Fesaj%2Fj_spring_cas_security_check',
    urlApi: null,
  },

  // TJRR - Roraima (PROJUDI)
  {
    tribunalCodigo: 'TJRR',
    sistema: 'PROJUDI',
    grau: 'unico',
    urlBase: 'https://projudi.tjrr.jus.br',
    urlLoginSeam: 'https://projudi.tjrr.jus.br/projudi/',
    urlApi: null,
  },

  // TJPR - Paraná (PROJUDI)
  {
    tribunalCodigo: 'TJPR',
    sistema: 'PROJUDI',
    grau: 'unico',
    urlBase: 'https://projudi.tjpr.jus.br',
    urlLoginSeam: 'https://projudi.tjpr.jus.br/projudi/',
    urlApi: null,
  },

  // TJAM - Amazonas (ESAJ)
  {
    tribunalCodigo: 'TJAM',
    sistema: 'ESAJ',
    grau: 'unico',
    urlBase: 'https://consultasaj.tjam.jus.br',
    urlLoginSeam: 'https://consultasaj.tjam.jus.br/sajcas/login?service=https%3A%2F%2Fconsultasaj.tjam.jus.br%2Fesaj%2Fj_spring_cas_security_check',
    urlApi: null,
  },

  // TJRN - Rio Grande do Norte (PJE)
  {
    tribunalCodigo: 'TJRN',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje1g.tjrn.jus.br',
    urlLoginSeam: 'https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-tjrn-1g&redirect_uri=https%3A%2F%2Fpje1g.tjrn.jus.br%2Fpje%2Flogin.seam&state=04106332-5540-4396-8977-f2db8c7bfd60&login=true&scope=openid',
    urlApi: 'https://pje1g.tjrn.jus.br/pje-comum-api/api',
  },
  {
    tribunalCodigo: 'TJRN',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje2g.tjrn.jus.br',
    urlLoginSeam: 'https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-tjrn-2g&redirect_uri=https%3A%2F%2Fpje2g.tjrn.jus.br%2Fpje%2Flogin.seam&state=dab58d25-f259-4cab-b156-a501b5129fac&login=true&scope=openid',
    urlApi: 'https://pje2g.tjrn.jus.br/pje-comum-api/api',
  },

  // TJAL - Alagoas (ESAJ)
  {
    tribunalCodigo: 'TJAL',
    sistema: 'ESAJ',
    grau: 'unico',
    urlBase: 'https://www2.tjal.jus.br',
    urlLoginSeam: 'https://www2.tjal.jus.br/sajcas/login?service=https%3A%2F%2Fwww2.tjal.jus.br%2Fesaj%2Fj_spring_cas_security_check',
    urlApi: null,
  },

  // TJBA - Bahia (placeholder - URL não fornecida no documento)
  // Removido por enquanto - aguardando informação
];

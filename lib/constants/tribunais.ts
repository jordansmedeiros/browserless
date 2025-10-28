/**
 * Constantes de Tribunais
 * Lista completa de todos os TRTs disponíveis no sistema
 */

import type { TRTCode, Grau, Regiao, Sistema } from '../types/tribunal';

export interface TribunalConfigConstant {
  id: string; // Formato: "TRT{N}-{sistema}-{grau}" (ex: "TRT3-PJE-1g", "TRT15-PJE-2g")
  codigo: TRTCode;
  sistema: Sistema;
  grau: Grau;
  nome: string; // Nome legível (ex: "TRT3 - 1º Grau")
  nomeCompleto: string; // Nome completo do tribunal
  regiao: Regiao;
  uf: string;
  cidadeSede: string;
}

/**
 * Gera identificador único para um TRT, sistema e grau
 * @deprecated Use getTribunalConfigId from ../types/tribunal instead
 */
export function getTribunalConfigIdLegacy(codigo: TRTCode, sistema: Sistema, grau: Grau): string {
  return `${codigo}-${sistema}-${grau}`;
}

/**
 * Converte grau para nome legível
 * @deprecated Use getGrauLabel from ../types/tribunal instead
 */
export function getGrauNome(grau: Grau): string {
  const labels: Record<Grau, string> = {
    '1g': '1º Grau',
    '2g': '2º Grau',
    'unico': 'Acesso Único',
  };
  return labels[grau] || grau;
}

/**
 * Lista completa de todos os 48 TRTs (24 TRTs × 2 graus)
 * Fonte: Metadados dos Tribunais Regionais do Trabalho do Brasil
 */
export const TRIBUNAL_CONFIGS: TribunalConfigConstant[] = [
  // TRT1 - Rio de Janeiro
  {
    id: 'TRT1-PJE-1g',
    codigo: 'TRT1',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT1 - 1º Grau',
    nomeCompleto: 'TRT da 1ª Região',
    regiao: 'Sudeste',
    uf: 'RJ',
    cidadeSede: 'Rio de Janeiro',
  },
  {
    id: 'TRT1-PJE-2g',
    codigo: 'TRT1',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT1 - 2º Grau',
    nomeCompleto: 'TRT da 1ª Região',
    regiao: 'Sudeste',
    uf: 'RJ',
    cidadeSede: 'Rio de Janeiro',
  },

  // TRT2 - São Paulo (Capital)
  {
    id: 'TRT2-PJE-1g',
    codigo: 'TRT2',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT2 - 1º Grau',
    nomeCompleto: 'TRT da 2ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
  },
  {
    id: 'TRT2-PJE-2g',
    codigo: 'TRT2',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT2 - 2º Grau',
    nomeCompleto: 'TRT da 2ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
  },

  // TRT3 - Minas Gerais
  {
    id: 'TRT3-PJE-1g',
    codigo: 'TRT3',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT3 - 1º Grau',
    nomeCompleto: 'TRT da 3ª Região',
    regiao: 'Sudeste',
    uf: 'MG',
    cidadeSede: 'Belo Horizonte',
  },
  {
    id: 'TRT3-PJE-2g',
    codigo: 'TRT3',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT3 - 2º Grau',
    nomeCompleto: 'TRT da 3ª Região',
    regiao: 'Sudeste',
    uf: 'MG',
    cidadeSede: 'Belo Horizonte',
  },

  // TRT4 - Rio Grande do Sul
  {
    id: 'TRT4-PJE-1g',
    codigo: 'TRT4',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT4 - 1º Grau',
    nomeCompleto: 'TRT da 4ª Região',
    regiao: 'Sul',
    uf: 'RS',
    cidadeSede: 'Porto Alegre',
  },
  {
    id: 'TRT4-PJE-2g',
    codigo: 'TRT4',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT4 - 2º Grau',
    nomeCompleto: 'TRT da 4ª Região',
    regiao: 'Sul',
    uf: 'RS',
    cidadeSede: 'Porto Alegre',
  },

  // TRT5 - Bahia
  {
    id: 'TRT5-PJE-1g',
    codigo: 'TRT5',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT5 - 1º Grau',
    nomeCompleto: 'TRT da 5ª Região',
    regiao: 'Nordeste',
    uf: 'BA',
    cidadeSede: 'Salvador',
  },
  {
    id: 'TRT5-PJE-2g',
    codigo: 'TRT5',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT5 - 2º Grau',
    nomeCompleto: 'TRT da 5ª Região',
    regiao: 'Nordeste',
    uf: 'BA',
    cidadeSede: 'Salvador',
  },

  // TRT6 - Pernambuco
  {
    id: 'TRT6-PJE-1g',
    codigo: 'TRT6',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT6 - 1º Grau',
    nomeCompleto: 'TRT da 6ª Região',
    regiao: 'Nordeste',
    uf: 'PE',
    cidadeSede: 'Recife',
  },
  {
    id: 'TRT6-PJE-2g',
    codigo: 'TRT6',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT6 - 2º Grau',
    nomeCompleto: 'TRT da 6ª Região',
    regiao: 'Nordeste',
    uf: 'PE',
    cidadeSede: 'Recife',
  },

  // TRT7 - Ceará
  {
    id: 'TRT7-PJE-1g',
    codigo: 'TRT7',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT7 - 1º Grau',
    nomeCompleto: 'TRT da 7ª Região',
    regiao: 'Nordeste',
    uf: 'CE',
    cidadeSede: 'Fortaleza',
  },
  {
    id: 'TRT7-PJE-2g',
    codigo: 'TRT7',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT7 - 2º Grau',
    nomeCompleto: 'TRT da 7ª Região',
    regiao: 'Nordeste',
    uf: 'CE',
    cidadeSede: 'Fortaleza',
  },

  // TRT8 - Pará e Amapá
  {
    id: 'TRT8-PJE-1g',
    codigo: 'TRT8',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT8 - 1º Grau',
    nomeCompleto: 'TRT da 8ª Região',
    regiao: 'Norte',
    uf: 'PA',
    cidadeSede: 'Belém',
  },
  {
    id: 'TRT8-PJE-2g',
    codigo: 'TRT8',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT8 - 2º Grau',
    nomeCompleto: 'TRT da 8ª Região',
    regiao: 'Norte',
    uf: 'PA',
    cidadeSede: 'Belém',
  },

  // TRT9 - Paraná
  {
    id: 'TRT9-PJE-1g',
    codigo: 'TRT9',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT9 - 1º Grau',
    nomeCompleto: 'TRT da 9ª Região',
    regiao: 'Sul',
    uf: 'PR',
    cidadeSede: 'Curitiba',
  },
  {
    id: 'TRT9-PJE-2g',
    codigo: 'TRT9',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT9 - 2º Grau',
    nomeCompleto: 'TRT da 9ª Região',
    regiao: 'Sul',
    uf: 'PR',
    cidadeSede: 'Curitiba',
  },

  // TRT10 - Distrito Federal e Tocantins
  {
    id: 'TRT10-PJE-1g',
    codigo: 'TRT10',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT10 - 1º Grau',
    nomeCompleto: 'TRT da 10ª Região',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
  },
  {
    id: 'TRT10-PJE-2g',
    codigo: 'TRT10',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT10 - 2º Grau',
    nomeCompleto: 'TRT da 10ª Região',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
  },

  // TRT11 - Amazonas e Roraima
  {
    id: 'TRT11-PJE-1g',
    codigo: 'TRT11',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT11 - 1º Grau',
    nomeCompleto: 'TRT da 11ª Região',
    regiao: 'Norte',
    uf: 'AM',
    cidadeSede: 'Manaus',
  },
  {
    id: 'TRT11-PJE-2g',
    codigo: 'TRT11',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT11 - 2º Grau',
    nomeCompleto: 'TRT da 11ª Região',
    regiao: 'Norte',
    uf: 'AM',
    cidadeSede: 'Manaus',
  },

  // TRT12 - Santa Catarina
  {
    id: 'TRT12-PJE-1g',
    codigo: 'TRT12',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT12 - 1º Grau',
    nomeCompleto: 'TRT da 12ª Região',
    regiao: 'Sul',
    uf: 'SC',
    cidadeSede: 'Florianópolis',
  },
  {
    id: 'TRT12-PJE-2g',
    codigo: 'TRT12',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT12 - 2º Grau',
    nomeCompleto: 'TRT da 12ª Região',
    regiao: 'Sul',
    uf: 'SC',
    cidadeSede: 'Florianópolis',
  },

  // TRT13 - Paraíba
  {
    id: 'TRT13-PJE-1g',
    codigo: 'TRT13',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT13 - 1º Grau',
    nomeCompleto: 'TRT da 13ª Região',
    regiao: 'Nordeste',
    uf: 'PB',
    cidadeSede: 'João Pessoa',
  },
  {
    id: 'TRT13-PJE-2g',
    codigo: 'TRT13',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT13 - 2º Grau',
    nomeCompleto: 'TRT da 13ª Região',
    regiao: 'Nordeste',
    uf: 'PB',
    cidadeSede: 'João Pessoa',
  },

  // TRT14 - Rondônia e Acre
  {
    id: 'TRT14-PJE-1g',
    codigo: 'TRT14',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT14 - 1º Grau',
    nomeCompleto: 'TRT da 14ª Região',
    regiao: 'Norte',
    uf: 'RO',
    cidadeSede: 'Porto Velho',
  },
  {
    id: 'TRT14-PJE-2g',
    codigo: 'TRT14',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT14 - 2º Grau',
    nomeCompleto: 'TRT da 14ª Região',
    regiao: 'Norte',
    uf: 'RO',
    cidadeSede: 'Porto Velho',
  },

  // TRT15 - São Paulo (Interior)
  {
    id: 'TRT15-PJE-1g',
    codigo: 'TRT15',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT15 - 1º Grau',
    nomeCompleto: 'TRT da 15ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'Campinas',
  },
  {
    id: 'TRT15-PJE-2g',
    codigo: 'TRT15',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT15 - 2º Grau',
    nomeCompleto: 'TRT da 15ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'Campinas',
  },

  // TRT16 - Maranhão
  {
    id: 'TRT16-PJE-1g',
    codigo: 'TRT16',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT16 - 1º Grau',
    nomeCompleto: 'TRT da 16ª Região',
    regiao: 'Nordeste',
    uf: 'MA',
    cidadeSede: 'São Luís',
  },
  {
    id: 'TRT16-PJE-2g',
    codigo: 'TRT16',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT16 - 2º Grau',
    nomeCompleto: 'TRT da 16ª Região',
    regiao: 'Nordeste',
    uf: 'MA',
    cidadeSede: 'São Luís',
  },

  // TRT17 - Espírito Santo
  {
    id: 'TRT17-PJE-1g',
    codigo: 'TRT17',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT17 - 1º Grau',
    nomeCompleto: 'TRT da 17ª Região',
    regiao: 'Sudeste',
    uf: 'ES',
    cidadeSede: 'Vitória',
  },
  {
    id: 'TRT17-PJE-2g',
    codigo: 'TRT17',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT17 - 2º Grau',
    nomeCompleto: 'TRT da 17ª Região',
    regiao: 'Sudeste',
    uf: 'ES',
    cidadeSede: 'Vitória',
  },

  // TRT18 - Goiás
  {
    id: 'TRT18-PJE-1g',
    codigo: 'TRT18',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT18 - 1º Grau',
    nomeCompleto: 'TRT da 18ª Região',
    regiao: 'Centro-Oeste',
    uf: 'GO',
    cidadeSede: 'Goiânia',
  },
  {
    id: 'TRT18-PJE-2g',
    codigo: 'TRT18',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT18 - 2º Grau',
    nomeCompleto: 'TRT da 18ª Região',
    regiao: 'Centro-Oeste',
    uf: 'GO',
    cidadeSede: 'Goiânia',
  },

  // TRT19 - Alagoas
  {
    id: 'TRT19-PJE-1g',
    codigo: 'TRT19',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT19 - 1º Grau',
    nomeCompleto: 'TRT da 19ª Região',
    regiao: 'Nordeste',
    uf: 'AL',
    cidadeSede: 'Maceió',
  },
  {
    id: 'TRT19-PJE-2g',
    codigo: 'TRT19',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT19 - 2º Grau',
    nomeCompleto: 'TRT da 19ª Região',
    regiao: 'Nordeste',
    uf: 'AL',
    cidadeSede: 'Maceió',
  },

  // TRT20 - Sergipe
  {
    id: 'TRT20-PJE-1g',
    codigo: 'TRT20',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT20 - 1º Grau',
    nomeCompleto: 'TRT da 20ª Região',
    regiao: 'Nordeste',
    uf: 'SE',
    cidadeSede: 'Aracaju',
  },
  {
    id: 'TRT20-PJE-2g',
    codigo: 'TRT20',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT20 - 2º Grau',
    nomeCompleto: 'TRT da 20ª Região',
    regiao: 'Nordeste',
    uf: 'SE',
    cidadeSede: 'Aracaju',
  },

  // TRT21 - Rio Grande do Norte
  {
    id: 'TRT21-PJE-1g',
    codigo: 'TRT21',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT21 - 1º Grau',
    nomeCompleto: 'TRT da 21ª Região',
    regiao: 'Nordeste',
    uf: 'RN',
    cidadeSede: 'Natal',
  },
  {
    id: 'TRT21-PJE-2g',
    codigo: 'TRT21',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT21 - 2º Grau',
    nomeCompleto: 'TRT da 21ª Região',
    regiao: 'Nordeste',
    uf: 'RN',
    cidadeSede: 'Natal',
  },

  // TRT22 - Piauí
  {
    id: 'TRT22-PJE-1g',
    codigo: 'TRT22',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT22 - 1º Grau',
    nomeCompleto: 'TRT da 22ª Região',
    regiao: 'Nordeste',
    uf: 'PI',
    cidadeSede: 'Teresina',
  },
  {
    id: 'TRT22-PJE-2g',
    codigo: 'TRT22',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT22 - 2º Grau',
    nomeCompleto: 'TRT da 22ª Região',
    regiao: 'Nordeste',
    uf: 'PI',
    cidadeSede: 'Teresina',
  },

  // TRT23 - Mato Grosso
  {
    id: 'TRT23-PJE-1g',
    codigo: 'TRT23',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT23 - 1º Grau',
    nomeCompleto: 'TRT da 23ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MT',
    cidadeSede: 'Cuiabá',
  },
  {
    id: 'TRT23-PJE-2g',
    codigo: 'TRT23',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT23 - 2º Grau',
    nomeCompleto: 'TRT da 23ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MT',
    cidadeSede: 'Cuiabá',
  },

  // TRT24 - Mato Grosso do Sul
  {
    id: 'TRT24-PJE-1g',
    codigo: 'TRT24',
    sistema: 'PJE',
    grau: '1g',
    nome: 'TRT24 - 1º Grau',
    nomeCompleto: 'TRT da 24ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MS',
    cidadeSede: 'Campo Grande',
  },
  {
    id: 'TRT24-PJE-2g',
    codigo: 'TRT24',
    sistema: 'PJE',
    grau: '2g',
    nome: 'TRT24 - 2º Grau',
    nomeCompleto: 'TRT da 24ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MS',
    cidadeSede: 'Campo Grande',
  },
];

/**
 * Busca config por ID
 */
export function getTribunalConfigById(id: string): TribunalConfigConstant | undefined {
  return TRIBUNAL_CONFIGS.find((tc) => tc.id === id);
}

/**
 * Busca configs por código de TRT
 */
export function getTribunalConfigsByCode(codigo: TRTCode): TribunalConfigConstant[] {
  return TRIBUNAL_CONFIGS.filter((tc) => tc.codigo === codigo);
}

/**
 * Busca configs por região
 */
export function getTribunalConfigsByRegion(regiao: Regiao): TribunalConfigConstant[] {
  return TRIBUNAL_CONFIGS.filter((tc) => tc.regiao === regiao);
}

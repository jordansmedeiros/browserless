/**
 * Constantes de Tribunais
 * Lista completa de todos os TRTs disponíveis no sistema
 */

import type { TRTCode, Grau, Regiao } from '../types/tribunal';

export interface TribunalConfigConstant {
  id: string; // Formato: "TRT{N}-{grau}" (ex: "TRT3-1g", "TRT15-2g")
  codigo: TRTCode;
  grau: Grau;
  nome: string; // Nome legível (ex: "TRT3 - 1º Grau")
  nomeCompleto: string; // Nome completo do tribunal
  regiao: Regiao;
  uf: string;
  cidadeSede: string;
}

/**
 * Gera identificador único para um TRT e grau
 */
export function getTribunalConfigId(codigo: TRTCode, grau: Grau): string {
  return `${codigo}-${grau}`;
}

/**
 * Converte grau para nome legível
 */
export function getGrauNome(grau: Grau): string {
  return grau === '1g' ? '1º Grau' : '2º Grau';
}

/**
 * Lista completa de todos os 48 TRTs (24 TRTs × 2 graus)
 * Fonte: Metadados dos Tribunais Regionais do Trabalho do Brasil
 */
export const TRIBUNAL_CONFIGS: TribunalConfigConstant[] = [
  // TRT1 - Rio de Janeiro
  {
    id: 'TRT1-1g',
    codigo: 'TRT1',
    grau: '1g',
    nome: 'TRT1 - 1º Grau',
    nomeCompleto: 'TRT da 1ª Região',
    regiao: 'Sudeste',
    uf: 'RJ',
    cidadeSede: 'Rio de Janeiro',
  },
  {
    id: 'TRT1-2g',
    codigo: 'TRT1',
    grau: '2g',
    nome: 'TRT1 - 2º Grau',
    nomeCompleto: 'TRT da 1ª Região',
    regiao: 'Sudeste',
    uf: 'RJ',
    cidadeSede: 'Rio de Janeiro',
  },

  // TRT2 - São Paulo (Capital)
  {
    id: 'TRT2-1g',
    codigo: 'TRT2',
    grau: '1g',
    nome: 'TRT2 - 1º Grau',
    nomeCompleto: 'TRT da 2ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
  },
  {
    id: 'TRT2-2g',
    codigo: 'TRT2',
    grau: '2g',
    nome: 'TRT2 - 2º Grau',
    nomeCompleto: 'TRT da 2ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
  },

  // TRT3 - Minas Gerais
  {
    id: 'TRT3-1g',
    codigo: 'TRT3',
    grau: '1g',
    nome: 'TRT3 - 1º Grau',
    nomeCompleto: 'TRT da 3ª Região',
    regiao: 'Sudeste',
    uf: 'MG',
    cidadeSede: 'Belo Horizonte',
  },
  {
    id: 'TRT3-2g',
    codigo: 'TRT3',
    grau: '2g',
    nome: 'TRT3 - 2º Grau',
    nomeCompleto: 'TRT da 3ª Região',
    regiao: 'Sudeste',
    uf: 'MG',
    cidadeSede: 'Belo Horizonte',
  },

  // TRT4 - Rio Grande do Sul
  {
    id: 'TRT4-1g',
    codigo: 'TRT4',
    grau: '1g',
    nome: 'TRT4 - 1º Grau',
    nomeCompleto: 'TRT da 4ª Região',
    regiao: 'Sul',
    uf: 'RS',
    cidadeSede: 'Porto Alegre',
  },
  {
    id: 'TRT4-2g',
    codigo: 'TRT4',
    grau: '2g',
    nome: 'TRT4 - 2º Grau',
    nomeCompleto: 'TRT da 4ª Região',
    regiao: 'Sul',
    uf: 'RS',
    cidadeSede: 'Porto Alegre',
  },

  // TRT5 - Bahia
  {
    id: 'TRT5-1g',
    codigo: 'TRT5',
    grau: '1g',
    nome: 'TRT5 - 1º Grau',
    nomeCompleto: 'TRT da 5ª Região',
    regiao: 'Nordeste',
    uf: 'BA',
    cidadeSede: 'Salvador',
  },
  {
    id: 'TRT5-2g',
    codigo: 'TRT5',
    grau: '2g',
    nome: 'TRT5 - 2º Grau',
    nomeCompleto: 'TRT da 5ª Região',
    regiao: 'Nordeste',
    uf: 'BA',
    cidadeSede: 'Salvador',
  },

  // TRT6 - Pernambuco
  {
    id: 'TRT6-1g',
    codigo: 'TRT6',
    grau: '1g',
    nome: 'TRT6 - 1º Grau',
    nomeCompleto: 'TRT da 6ª Região',
    regiao: 'Nordeste',
    uf: 'PE',
    cidadeSede: 'Recife',
  },
  {
    id: 'TRT6-2g',
    codigo: 'TRT6',
    grau: '2g',
    nome: 'TRT6 - 2º Grau',
    nomeCompleto: 'TRT da 6ª Região',
    regiao: 'Nordeste',
    uf: 'PE',
    cidadeSede: 'Recife',
  },

  // TRT7 - Ceará
  {
    id: 'TRT7-1g',
    codigo: 'TRT7',
    grau: '1g',
    nome: 'TRT7 - 1º Grau',
    nomeCompleto: 'TRT da 7ª Região',
    regiao: 'Nordeste',
    uf: 'CE',
    cidadeSede: 'Fortaleza',
  },
  {
    id: 'TRT7-2g',
    codigo: 'TRT7',
    grau: '2g',
    nome: 'TRT7 - 2º Grau',
    nomeCompleto: 'TRT da 7ª Região',
    regiao: 'Nordeste',
    uf: 'CE',
    cidadeSede: 'Fortaleza',
  },

  // TRT8 - Pará e Amapá
  {
    id: 'TRT8-1g',
    codigo: 'TRT8',
    grau: '1g',
    nome: 'TRT8 - 1º Grau',
    nomeCompleto: 'TRT da 8ª Região',
    regiao: 'Norte',
    uf: 'PA',
    cidadeSede: 'Belém',
  },
  {
    id: 'TRT8-2g',
    codigo: 'TRT8',
    grau: '2g',
    nome: 'TRT8 - 2º Grau',
    nomeCompleto: 'TRT da 8ª Região',
    regiao: 'Norte',
    uf: 'PA',
    cidadeSede: 'Belém',
  },

  // TRT9 - Paraná
  {
    id: 'TRT9-1g',
    codigo: 'TRT9',
    grau: '1g',
    nome: 'TRT9 - 1º Grau',
    nomeCompleto: 'TRT da 9ª Região',
    regiao: 'Sul',
    uf: 'PR',
    cidadeSede: 'Curitiba',
  },
  {
    id: 'TRT9-2g',
    codigo: 'TRT9',
    grau: '2g',
    nome: 'TRT9 - 2º Grau',
    nomeCompleto: 'TRT da 9ª Região',
    regiao: 'Sul',
    uf: 'PR',
    cidadeSede: 'Curitiba',
  },

  // TRT10 - Distrito Federal e Tocantins
  {
    id: 'TRT10-1g',
    codigo: 'TRT10',
    grau: '1g',
    nome: 'TRT10 - 1º Grau',
    nomeCompleto: 'TRT da 10ª Região',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
  },
  {
    id: 'TRT10-2g',
    codigo: 'TRT10',
    grau: '2g',
    nome: 'TRT10 - 2º Grau',
    nomeCompleto: 'TRT da 10ª Região',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
  },

  // TRT11 - Amazonas e Roraima
  {
    id: 'TRT11-1g',
    codigo: 'TRT11',
    grau: '1g',
    nome: 'TRT11 - 1º Grau',
    nomeCompleto: 'TRT da 11ª Região',
    regiao: 'Norte',
    uf: 'AM',
    cidadeSede: 'Manaus',
  },
  {
    id: 'TRT11-2g',
    codigo: 'TRT11',
    grau: '2g',
    nome: 'TRT11 - 2º Grau',
    nomeCompleto: 'TRT da 11ª Região',
    regiao: 'Norte',
    uf: 'AM',
    cidadeSede: 'Manaus',
  },

  // TRT12 - Santa Catarina
  {
    id: 'TRT12-1g',
    codigo: 'TRT12',
    grau: '1g',
    nome: 'TRT12 - 1º Grau',
    nomeCompleto: 'TRT da 12ª Região',
    regiao: 'Sul',
    uf: 'SC',
    cidadeSede: 'Florianópolis',
  },
  {
    id: 'TRT12-2g',
    codigo: 'TRT12',
    grau: '2g',
    nome: 'TRT12 - 2º Grau',
    nomeCompleto: 'TRT da 12ª Região',
    regiao: 'Sul',
    uf: 'SC',
    cidadeSede: 'Florianópolis',
  },

  // TRT13 - Paraíba
  {
    id: 'TRT13-1g',
    codigo: 'TRT13',
    grau: '1g',
    nome: 'TRT13 - 1º Grau',
    nomeCompleto: 'TRT da 13ª Região',
    regiao: 'Nordeste',
    uf: 'PB',
    cidadeSede: 'João Pessoa',
  },
  {
    id: 'TRT13-2g',
    codigo: 'TRT13',
    grau: '2g',
    nome: 'TRT13 - 2º Grau',
    nomeCompleto: 'TRT da 13ª Região',
    regiao: 'Nordeste',
    uf: 'PB',
    cidadeSede: 'João Pessoa',
  },

  // TRT14 - Rondônia e Acre
  {
    id: 'TRT14-1g',
    codigo: 'TRT14',
    grau: '1g',
    nome: 'TRT14 - 1º Grau',
    nomeCompleto: 'TRT da 14ª Região',
    regiao: 'Norte',
    uf: 'RO',
    cidadeSede: 'Porto Velho',
  },
  {
    id: 'TRT14-2g',
    codigo: 'TRT14',
    grau: '2g',
    nome: 'TRT14 - 2º Grau',
    nomeCompleto: 'TRT da 14ª Região',
    regiao: 'Norte',
    uf: 'RO',
    cidadeSede: 'Porto Velho',
  },

  // TRT15 - São Paulo (Interior)
  {
    id: 'TRT15-1g',
    codigo: 'TRT15',
    grau: '1g',
    nome: 'TRT15 - 1º Grau',
    nomeCompleto: 'TRT da 15ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'Campinas',
  },
  {
    id: 'TRT15-2g',
    codigo: 'TRT15',
    grau: '2g',
    nome: 'TRT15 - 2º Grau',
    nomeCompleto: 'TRT da 15ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'Campinas',
  },

  // TRT16 - Maranhão
  {
    id: 'TRT16-1g',
    codigo: 'TRT16',
    grau: '1g',
    nome: 'TRT16 - 1º Grau',
    nomeCompleto: 'TRT da 16ª Região',
    regiao: 'Nordeste',
    uf: 'MA',
    cidadeSede: 'São Luís',
  },
  {
    id: 'TRT16-2g',
    codigo: 'TRT16',
    grau: '2g',
    nome: 'TRT16 - 2º Grau',
    nomeCompleto: 'TRT da 16ª Região',
    regiao: 'Nordeste',
    uf: 'MA',
    cidadeSede: 'São Luís',
  },

  // TRT17 - Espírito Santo
  {
    id: 'TRT17-1g',
    codigo: 'TRT17',
    grau: '1g',
    nome: 'TRT17 - 1º Grau',
    nomeCompleto: 'TRT da 17ª Região',
    regiao: 'Sudeste',
    uf: 'ES',
    cidadeSede: 'Vitória',
  },
  {
    id: 'TRT17-2g',
    codigo: 'TRT17',
    grau: '2g',
    nome: 'TRT17 - 2º Grau',
    nomeCompleto: 'TRT da 17ª Região',
    regiao: 'Sudeste',
    uf: 'ES',
    cidadeSede: 'Vitória',
  },

  // TRT18 - Goiás
  {
    id: 'TRT18-1g',
    codigo: 'TRT18',
    grau: '1g',
    nome: 'TRT18 - 1º Grau',
    nomeCompleto: 'TRT da 18ª Região',
    regiao: 'Centro-Oeste',
    uf: 'GO',
    cidadeSede: 'Goiânia',
  },
  {
    id: 'TRT18-2g',
    codigo: 'TRT18',
    grau: '2g',
    nome: 'TRT18 - 2º Grau',
    nomeCompleto: 'TRT da 18ª Região',
    regiao: 'Centro-Oeste',
    uf: 'GO',
    cidadeSede: 'Goiânia',
  },

  // TRT19 - Alagoas
  {
    id: 'TRT19-1g',
    codigo: 'TRT19',
    grau: '1g',
    nome: 'TRT19 - 1º Grau',
    nomeCompleto: 'TRT da 19ª Região',
    regiao: 'Nordeste',
    uf: 'AL',
    cidadeSede: 'Maceió',
  },
  {
    id: 'TRT19-2g',
    codigo: 'TRT19',
    grau: '2g',
    nome: 'TRT19 - 2º Grau',
    nomeCompleto: 'TRT da 19ª Região',
    regiao: 'Nordeste',
    uf: 'AL',
    cidadeSede: 'Maceió',
  },

  // TRT20 - Sergipe
  {
    id: 'TRT20-1g',
    codigo: 'TRT20',
    grau: '1g',
    nome: 'TRT20 - 1º Grau',
    nomeCompleto: 'TRT da 20ª Região',
    regiao: 'Nordeste',
    uf: 'SE',
    cidadeSede: 'Aracaju',
  },
  {
    id: 'TRT20-2g',
    codigo: 'TRT20',
    grau: '2g',
    nome: 'TRT20 - 2º Grau',
    nomeCompleto: 'TRT da 20ª Região',
    regiao: 'Nordeste',
    uf: 'SE',
    cidadeSede: 'Aracaju',
  },

  // TRT21 - Rio Grande do Norte
  {
    id: 'TRT21-1g',
    codigo: 'TRT21',
    grau: '1g',
    nome: 'TRT21 - 1º Grau',
    nomeCompleto: 'TRT da 21ª Região',
    regiao: 'Nordeste',
    uf: 'RN',
    cidadeSede: 'Natal',
  },
  {
    id: 'TRT21-2g',
    codigo: 'TRT21',
    grau: '2g',
    nome: 'TRT21 - 2º Grau',
    nomeCompleto: 'TRT da 21ª Região',
    regiao: 'Nordeste',
    uf: 'RN',
    cidadeSede: 'Natal',
  },

  // TRT22 - Piauí
  {
    id: 'TRT22-1g',
    codigo: 'TRT22',
    grau: '1g',
    nome: 'TRT22 - 1º Grau',
    nomeCompleto: 'TRT da 22ª Região',
    regiao: 'Nordeste',
    uf: 'PI',
    cidadeSede: 'Teresina',
  },
  {
    id: 'TRT22-2g',
    codigo: 'TRT22',
    grau: '2g',
    nome: 'TRT22 - 2º Grau',
    nomeCompleto: 'TRT da 22ª Região',
    regiao: 'Nordeste',
    uf: 'PI',
    cidadeSede: 'Teresina',
  },

  // TRT23 - Mato Grosso
  {
    id: 'TRT23-1g',
    codigo: 'TRT23',
    grau: '1g',
    nome: 'TRT23 - 1º Grau',
    nomeCompleto: 'TRT da 23ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MT',
    cidadeSede: 'Cuiabá',
  },
  {
    id: 'TRT23-2g',
    codigo: 'TRT23',
    grau: '2g',
    nome: 'TRT23 - 2º Grau',
    nomeCompleto: 'TRT da 23ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MT',
    cidadeSede: 'Cuiabá',
  },

  // TRT24 - Mato Grosso do Sul
  {
    id: 'TRT24-1g',
    codigo: 'TRT24',
    grau: '1g',
    nome: 'TRT24 - 1º Grau',
    nomeCompleto: 'TRT da 24ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MS',
    cidadeSede: 'Campo Grande',
  },
  {
    id: 'TRT24-2g',
    codigo: 'TRT24',
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

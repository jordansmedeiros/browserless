/**
 * Seed Data - Tribunais
 * Metadados dos 24 Tribunais Regionais do Trabalho do Brasil
 */

import type { Regiao } from '../../lib/types/tribunal';

export interface TribunalSeedData {
  codigo: string;
  nome: string;
  regiao: Regiao;
  uf: string;
  cidadeSede: string;
  ativo: boolean;
}

export const tribunaisSeed: TribunalSeedData[] = [
  // Região Sudeste
  {
    codigo: 'TRT1',
    nome: 'TRT da 1ª Região',
    regiao: 'Sudeste',
    uf: 'RJ',
    cidadeSede: 'Rio de Janeiro',
    ativo: true,
  },
  {
    codigo: 'TRT2',
    nome: 'TRT da 2ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
    ativo: true,
  },
  {
    codigo: 'TRT3',
    nome: 'TRT da 3ª Região',
    regiao: 'Sudeste',
    uf: 'MG',
    cidadeSede: 'Belo Horizonte',
    ativo: true,
  },
  {
    codigo: 'TRT15',
    nome: 'TRT da 15ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'Campinas',
    ativo: true,
  },

  // Região Sul
  {
    codigo: 'TRT4',
    nome: 'TRT da 4ª Região',
    regiao: 'Sul',
    uf: 'RS',
    cidadeSede: 'Porto Alegre',
    ativo: true,
  },
  {
    codigo: 'TRT9',
    nome: 'TRT da 9ª Região',
    regiao: 'Sul',
    uf: 'PR',
    cidadeSede: 'Curitiba',
    ativo: true,
  },
  {
    codigo: 'TRT12',
    nome: 'TRT da 12ª Região',
    regiao: 'Sul',
    uf: 'SC',
    cidadeSede: 'Florianópolis',
    ativo: true,
  },

  // Região Nordeste
  {
    codigo: 'TRT5',
    nome: 'TRT da 5ª Região',
    regiao: 'Nordeste',
    uf: 'BA',
    cidadeSede: 'Salvador',
    ativo: true,
  },
  {
    codigo: 'TRT6',
    nome: 'TRT da 6ª Região',
    regiao: 'Nordeste',
    uf: 'PE',
    cidadeSede: 'Recife',
    ativo: true,
  },
  {
    codigo: 'TRT7',
    nome: 'TRT da 7ª Região',
    regiao: 'Nordeste',
    uf: 'CE',
    cidadeSede: 'Fortaleza',
    ativo: true,
  },
  {
    codigo: 'TRT13',
    nome: 'TRT da 13ª Região',
    regiao: 'Nordeste',
    uf: 'PB',
    cidadeSede: 'João Pessoa',
    ativo: true,
  },
  {
    codigo: 'TRT16',
    nome: 'TRT da 16ª Região',
    regiao: 'Nordeste',
    uf: 'MA',
    cidadeSede: 'São Luís',
    ativo: true,
  },
  {
    codigo: 'TRT19',
    nome: 'TRT da 19ª Região',
    regiao: 'Nordeste',
    uf: 'AL',
    cidadeSede: 'Maceió',
    ativo: true,
  },
  {
    codigo: 'TRT22',
    nome: 'TRT da 22ª Região',
    regiao: 'Nordeste',
    uf: 'PI',
    cidadeSede: 'Teresina',
    ativo: true,
  },

  // Região Norte
  {
    codigo: 'TRT8',
    nome: 'TRT da 8ª Região',
    regiao: 'Norte',
    uf: 'PA/AP',
    cidadeSede: 'Belém',
    ativo: true,
  },
  {
    codigo: 'TRT11',
    nome: 'TRT da 11ª Região',
    regiao: 'Norte',
    uf: 'AM/RR',
    cidadeSede: 'Manaus',
    ativo: true,
  },
  {
    codigo: 'TRT14',
    nome: 'TRT da 14ª Região',
    regiao: 'Norte',
    uf: 'RO/AC',
    cidadeSede: 'Porto Velho',
    ativo: true,
  },

  // Região Centro-Oeste
  {
    codigo: 'TRT10',
    nome: 'TRT da 10ª Região',
    regiao: 'Centro-Oeste',
    uf: 'DF/TO',
    cidadeSede: 'Brasília',
    ativo: true,
  },
  {
    codigo: 'TRT18',
    nome: 'TRT da 18ª Região',
    regiao: 'Centro-Oeste',
    uf: 'GO',
    cidadeSede: 'Goiânia',
    ativo: true,
  },
  {
    codigo: 'TRT23',
    nome: 'TRT da 23ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MT',
    cidadeSede: 'Cuiabá',
    ativo: true,
  },

  // TRTs Adicionais (para completar 24)
  {
    codigo: 'TRT17',
    nome: 'TRT da 17ª Região',
    regiao: 'Sudeste',
    uf: 'ES',
    cidadeSede: 'Vitória',
    ativo: true,
  },
  {
    codigo: 'TRT20',
    nome: 'TRT da 20ª Região',
    regiao: 'Nordeste',
    uf: 'SE',
    cidadeSede: 'Aracaju',
    ativo: true,
  },
  {
    codigo: 'TRT21',
    nome: 'TRT da 21ª Região',
    regiao: 'Nordeste',
    uf: 'RN',
    cidadeSede: 'Natal',
    ativo: true,
  },
  {
    codigo: 'TRT24',
    nome: 'TRT da 24ª Região',
    regiao: 'Centro-Oeste',
    uf: 'MS',
    cidadeSede: 'Campo Grande',
    ativo: true,
  },
];

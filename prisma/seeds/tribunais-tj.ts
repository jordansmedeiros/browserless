/**
 * Seed Data - Tribunais de Justiça (TJs)
 * Metadados dos 27 Tribunais de Justiça Estaduais do Brasil
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

export const tribunaisTJSeed: TribunalSeedData[] = [
  // Região Norte
  {
    codigo: 'TJAC',
    nome: 'Tribunal de Justiça do Acre',
    regiao: 'Norte',
    uf: 'AC',
    cidadeSede: 'Rio Branco',
    ativo: true,
  },
  {
    codigo: 'TJAM',
    nome: 'Tribunal de Justiça do Amazonas',
    regiao: 'Norte',
    uf: 'AM',
    cidadeSede: 'Manaus',
    ativo: true,
  },
  {
    codigo: 'TJAP',
    nome: 'Tribunal de Justiça do Amapá',
    regiao: 'Norte',
    uf: 'AP',
    cidadeSede: 'Macapá',
    ativo: true,
  },
  {
    codigo: 'TJPA',
    nome: 'Tribunal de Justiça do Pará',
    regiao: 'Norte',
    uf: 'PA',
    cidadeSede: 'Belém',
    ativo: true,
  },
  {
    codigo: 'TJRO',
    nome: 'Tribunal de Justiça de Rondônia',
    regiao: 'Norte',
    uf: 'RO',
    cidadeSede: 'Porto Velho',
    ativo: true,
  },
  {
    codigo: 'TJRR',
    nome: 'Tribunal de Justiça de Roraima',
    regiao: 'Norte',
    uf: 'RR',
    cidadeSede: 'Boa Vista',
    ativo: true,
  },
  {
    codigo: 'TJTO',
    nome: 'Tribunal de Justiça do Tocantins',
    regiao: 'Norte',
    uf: 'TO',
    cidadeSede: 'Palmas',
    ativo: true,
  },

  // Região Nordeste
  {
    codigo: 'TJAL',
    nome: 'Tribunal de Justiça de Alagoas',
    regiao: 'Nordeste',
    uf: 'AL',
    cidadeSede: 'Maceió',
    ativo: true,
  },
  {
    codigo: 'TJBA',
    nome: 'Tribunal de Justiça da Bahia',
    regiao: 'Nordeste',
    uf: 'BA',
    cidadeSede: 'Salvador',
    ativo: true,
  },
  {
    codigo: 'TJCE',
    nome: 'Tribunal de Justiça do Ceará',
    regiao: 'Nordeste',
    uf: 'CE',
    cidadeSede: 'Fortaleza',
    ativo: true,
  },
  {
    codigo: 'TJMA',
    nome: 'Tribunal de Justiça do Maranhão',
    regiao: 'Nordeste',
    uf: 'MA',
    cidadeSede: 'São Luís',
    ativo: true,
  },
  {
    codigo: 'TJPB',
    nome: 'Tribunal de Justiça da Paraíba',
    regiao: 'Nordeste',
    uf: 'PB',
    cidadeSede: 'João Pessoa',
    ativo: true,
  },
  {
    codigo: 'TJPE',
    nome: 'Tribunal de Justiça de Pernambuco',
    regiao: 'Nordeste',
    uf: 'PE',
    cidadeSede: 'Recife',
    ativo: true,
  },
  {
    codigo: 'TJPI',
    nome: 'Tribunal de Justiça do Piauí',
    regiao: 'Nordeste',
    uf: 'PI',
    cidadeSede: 'Teresina',
    ativo: true,
  },
  {
    codigo: 'TJRN',
    nome: 'Tribunal de Justiça do Rio Grande do Norte',
    regiao: 'Nordeste',
    uf: 'RN',
    cidadeSede: 'Natal',
    ativo: true,
  },
  {
    codigo: 'TJSE',
    nome: 'Tribunal de Justiça de Sergipe',
    regiao: 'Nordeste',
    uf: 'SE',
    cidadeSede: 'Aracaju',
    ativo: true,
  },

  // Região Centro-Oeste
  {
    codigo: 'TJDFT',
    nome: 'Tribunal de Justiça do Distrito Federal e Territórios',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
    ativo: true,
  },
  {
    codigo: 'TJGO',
    nome: 'Tribunal de Justiça de Goiás',
    regiao: 'Centro-Oeste',
    uf: 'GO',
    cidadeSede: 'Goiânia',
    ativo: true,
  },
  {
    codigo: 'TJMS',
    nome: 'Tribunal de Justiça de Mato Grosso do Sul',
    regiao: 'Centro-Oeste',
    uf: 'MS',
    cidadeSede: 'Campo Grande',
    ativo: true,
  },
  {
    codigo: 'TJMT',
    nome: 'Tribunal de Justiça de Mato Grosso',
    regiao: 'Centro-Oeste',
    uf: 'MT',
    cidadeSede: 'Cuiabá',
    ativo: true,
  },

  // Região Sudeste
  {
    codigo: 'TJES',
    nome: 'Tribunal de Justiça do Espírito Santo',
    regiao: 'Sudeste',
    uf: 'ES',
    cidadeSede: 'Vitória',
    ativo: true,
  },
  {
    codigo: 'TJMG',
    nome: 'Tribunal de Justiça de Minas Gerais',
    regiao: 'Sudeste',
    uf: 'MG',
    cidadeSede: 'Belo Horizonte',
    ativo: true,
  },
  {
    codigo: 'TJRJ',
    nome: 'Tribunal de Justiça do Rio de Janeiro',
    regiao: 'Sudeste',
    uf: 'RJ',
    cidadeSede: 'Rio de Janeiro',
    ativo: true,
  },
  {
    codigo: 'TJSP',
    nome: 'Tribunal de Justiça de São Paulo',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
    ativo: true,
  },

  // Região Sul
  {
    codigo: 'TJPR',
    nome: 'Tribunal de Justiça do Paraná',
    regiao: 'Sul',
    uf: 'PR',
    cidadeSede: 'Curitiba',
    ativo: true,
  },
  {
    codigo: 'TJRS',
    nome: 'Tribunal de Justiça do Rio Grande do Sul',
    regiao: 'Sul',
    uf: 'RS',
    cidadeSede: 'Porto Alegre',
    ativo: true,
  },
  {
    codigo: 'TJSC',
    nome: 'Tribunal de Justiça de Santa Catarina',
    regiao: 'Sul',
    uf: 'SC',
    cidadeSede: 'Florianópolis',
    ativo: true,
  },
];

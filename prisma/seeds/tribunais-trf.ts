/**
 * Seed Data - Tribunais Regionais Federais (TRFs)
 * Metadados dos 6 TRFs do Brasil
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

export const tribunaisTRFSeed: TribunalSeedData[] = [
  {
    codigo: 'TRF1',
    nome: 'Tribunal Regional Federal da 1ª Região',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
    ativo: true,
  },
  {
    codigo: 'TRF2',
    nome: 'Tribunal Regional Federal da 2ª Região',
    regiao: 'Sudeste',
    uf: 'RJ',
    cidadeSede: 'Rio de Janeiro',
    ativo: true,
  },
  {
    codigo: 'TRF3',
    nome: 'Tribunal Regional Federal da 3ª Região',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
    ativo: true,
  },
  {
    codigo: 'TRF4',
    nome: 'Tribunal Regional Federal da 4ª Região',
    regiao: 'Sul',
    uf: 'RS',
    cidadeSede: 'Porto Alegre',
    ativo: true,
  },
  {
    codigo: 'TRF5',
    nome: 'Tribunal Regional Federal da 5ª Região',
    regiao: 'Nordeste',
    uf: 'PE',
    cidadeSede: 'Recife',
    ativo: true,
  },
  {
    codigo: 'TRF6',
    nome: 'Tribunal Regional Federal da 6ª Região',
    regiao: 'Sudeste',
    uf: 'MG',
    cidadeSede: 'Belo Horizonte',
    ativo: true,
  },
];

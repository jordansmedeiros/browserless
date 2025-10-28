/**
 * Seed Data - Tribunais Superiores
 * Metadados dos 3 Tribunais Superiores do Brasil
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

export const tribunaisSuperioresSeed: TribunalSeedData[] = [
  {
    codigo: 'TST',
    nome: 'Tribunal Superior do Trabalho',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
    ativo: true,
  },
  {
    codigo: 'STJ',
    nome: 'Superior Tribunal de Justiça',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
    ativo: true,
  },
  {
    codigo: 'STF',
    nome: 'Supremo Tribunal Federal',
    regiao: 'Centro-Oeste',
    uf: 'DF',
    cidadeSede: 'Brasília',
    ativo: true,
  },
];

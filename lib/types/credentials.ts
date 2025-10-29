// Types for PJE Credentials Management System

import { Prisma } from '@prisma/client';

// Tipos base exportados do Prisma
export type Escritorio = Prisma.EscritorioGetPayload<{}>;
export type Advogado = Prisma.AdvogadoGetPayload<{}>;
export type Credencial = Prisma.CredencialGetPayload<{}>;
export type CredencialTribunal = Prisma.CredencialTribunalGetPayload<{}>;

// Tipos de tribunal
export type TipoTribunal = 'TRT' | 'TJ' | 'TRF' | 'Superior';

// Tipos com relações aninhadas
export type CredencialWithRelations = Prisma.CredencialGetPayload<{
  include: {
    tribunais: {
      include: {
        tribunalConfig: {
          include: {
            tribunal: true;
          };
        };
      };
    };
    advogado: {
      include: {
        escritorio: true;
      };
    };
  };
}>;

export type AdvogadoWithCredenciais = Prisma.AdvogadoGetPayload<{
  include: {
    credenciais: {
      include: {
        tribunais: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true;
              };
            };
          };
        };
      };
    };
    escritorio: true;
  };
}>;

export type EscritorioWithAdvogados = Prisma.EscritorioGetPayload<{
  include: {
    advogados: {
      include: {
        credenciais: true;
      };
    };
  };
}>;

// Tipo para dados de credencial usados em login
export interface CredencialParaLogin {
  cpf: string;
  senha: string;
  idAdvogado: string | null;
  advogadoNome: string;
}

// Tipos para forms e DTOs
export interface CreateEscritorioInput {
  nome: string;
}

export interface UpdateEscritorioInput {
  nome: string;
}

export interface CreateAdvogadoInput {
  nome: string;
  oabNumero: string;
  oabUf: string;
  cpf: string;
  escritorioId?: string | null;
}

export interface UpdateAdvogadoInput {
  nome?: string;
  oabNumero?: string;
  oabUf?: string;
  cpf?: string;
  escritorioId?: string | null;
}

export interface CreateCredencialInput {
  advogadoId: string;
  senha: string;
  descricao?: string;
  tribunalConfigIds: string[];
}

export interface UpdateCredencialInput {
  senha?: string;
  descricao?: string;
  tribunalConfigIds?: string[];
}

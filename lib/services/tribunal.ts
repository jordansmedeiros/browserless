/**
 * Tribunal Service Layer
 * Serviço para gerenciar configurações de TRTs
 */

import { prisma } from '@/lib/db';
import type {
  TRTCode,
  Grau,
  Sistema,
  TribunalInfo,
  TribunalConfig,
  TribunalWithConfigs,
  Regiao,
} from '../types/tribunal';
import { isValidTRTCode, getTRTNumber } from '../types/tribunal';

// Cache em memória para otimizar performance
let tribunaisCache: TribunalWithConfigs[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Invalida o cache de tribunais
 */
export function invalidateTribunalCache(): void {
  tribunaisCache = null;
  cacheTimestamp = 0;
}

/**
 * Carrega todos os tribunais do banco de dados com cache
 */
async function loadTribunais(): Promise<TribunalWithConfigs[]> {
  const now = Date.now();

  // Retorna cache se válido
  if (tribunaisCache && now - cacheTimestamp < CACHE_TTL) {
    return tribunaisCache;
  }

  // Busca do banco de dados
  const tribunais = await prisma.tribunal.findMany({
    include: {
      configs: true,
    },
  });

  // Mapeia para o tipo esperado
  tribunaisCache = tribunais.map((t) => ({
    id: t.id,
    codigo: t.codigo as TRTCode,
    nome: t.nome,
    regiao: t.regiao as Regiao,
    uf: t.uf,
    cidadeSede: t.cidadeSede,
    ativo: t.ativo,
    configs: t.configs.map((c) => ({
      id: c.id,
      tribunalId: c.tribunalId,
      sistema: c.sistema as Sistema,
      grau: c.grau as Grau,
      urlBase: c.urlBase,
      urlLoginSeam: c.urlLoginSeam,
      urlApi: c.urlApi,
    })),
  }));

  cacheTimestamp = now;
  return tribunaisCache;
}

/**
 * Obtém a configuração de URL para um TRT e grau específicos
 */
export async function getTribunalConfig(
  trt: TRTCode,
  grau: Grau
): Promise<TribunalConfig> {
  const tribunais = await loadTribunais();
  const tribunal = tribunais.find((t) => t.codigo === trt);

  if (!tribunal) {
    throw new Error(`TRT ${trt} não encontrado no banco de dados`);
  }

  if (!tribunal.ativo) {
    throw new Error(`TRT ${trt} está inativo`);
  }

  const config = tribunal.configs.find((c) => c.grau === grau);

  if (!config) {
    throw new Error(
      `Configuração para ${trt} ${grau} não encontrada no banco de dados`
    );
  }

  return config;
}

/**
 * Valida se um código TRT é válido e retorna o código tipado
 */
export function validateTRTCode(code: string): TRTCode {
  const normalized = normalizeTRTCode(code);

  if (!isValidTRTCode(normalized)) {
    throw new Error(
      `Código TRT inválido: ${code}. Deve ser TRT1 a TRT24.`
    );
  }

  return normalized;
}

/**
 * Normaliza entrada de código TRT para formato padrão
 * Aceita: "trt3", "TRT3", "3", 3 => "TRT3"
 */
export function normalizeTRTCode(input: string | number): TRTCode {
  let normalized: string;

  if (typeof input === 'number') {
    if (input < 1 || input > 24) {
      throw new Error(`Número TRT inválido: ${input}. Deve ser entre 1 e 24.`);
    }
    normalized = `TRT${input}`;
  } else {
    // Remove espaços e converte para uppercase
    normalized = input.trim().toUpperCase();

    // Se for só número, adiciona prefixo TRT
    if (/^\d+$/.test(normalized)) {
      const num = parseInt(normalized, 10);
      if (num < 1 || num > 24) {
        throw new Error(
          `Número TRT inválido: ${num}. Deve ser entre 1 e 24.`
        );
      }
      normalized = `TRT${num}`;
    }

    // Valida formato TRT{N}
    if (!/^TRT\d+$/.test(normalized)) {
      throw new Error(
        `Formato inválido: ${input}. Use TRT1, TRT2, ..., TRT24 ou apenas o número.`
      );
    }
  }

  // Valida se está no range
  const num = getTRTNumber(normalized as TRTCode);
  if (num < 1 || num > 24) {
    throw new Error(`TRT ${num} fora do range. Deve ser entre 1 e 24.`);
  }

  return normalized as TRTCode;
}

/**
 * Lista todos os TRTs disponíveis
 */
export async function listAllTRTs(): Promise<TribunalInfo[]> {
  const tribunais = await loadTribunais();
  return tribunais.map((t) => ({
    id: t.id,
    codigo: t.codigo,
    nome: t.nome,
    regiao: t.regiao,
    uf: t.uf,
    cidadeSede: t.cidadeSede,
    ativo: t.ativo,
  }));
}

/**
 * Busca um TRT específico por código
 */
export async function getTribunalByCode(code: TRTCode): Promise<TribunalInfo> {
  const tribunais = await loadTribunais();
  const tribunal = tribunais.find((t) => t.codigo === code);

  if (!tribunal) {
    throw new Error(`TRT ${code} não encontrado no banco de dados`);
  }

  return {
    id: tribunal.id,
    codigo: tribunal.codigo,
    nome: tribunal.nome,
    regiao: tribunal.regiao,
    uf: tribunal.uf,
    cidadeSede: tribunal.cidadeSede,
    ativo: tribunal.ativo,
  };
}

/**
 * Lista TRTs filtrados por região
 */
export async function listTRTsByRegion(regiao: Regiao): Promise<TribunalInfo[]> {
  const tribunais = await loadTribunais();
  return tribunais
    .filter((t) => t.regiao === regiao)
    .map((t) => ({
      id: t.id,
      codigo: t.codigo,
      nome: t.nome,
      regiao: t.regiao,
      uf: t.uf,
      cidadeSede: t.cidadeSede,
      ativo: t.ativo,
    }));
}

/**
 * Atualiza URLs de um TRT específico (para casos edge)
 */
export async function updateTribunalUrl(
  trt: TRTCode,
  grau: Grau,
  urlOverride: Partial<Omit<TribunalConfig, 'id' | 'tribunalId' | 'grau'>>
): Promise<TribunalConfig> {
  const tribunais = await loadTribunais();
  const tribunal = tribunais.find((t) => t.codigo === trt);

  if (!tribunal) {
    throw new Error(`TRT ${trt} não encontrado`);
  }

  const config = tribunal.configs.find((c) => c.grau === grau);

  if (!config) {
    throw new Error(`Configuração para ${trt} ${grau} não encontrada`);
  }

  // Atualiza no banco de dados
  const updated = await prisma.tribunalConfig.update({
    where: { id: config.id },
    data: {
      urlBase: urlOverride.urlBase ?? config.urlBase,
      urlLoginSeam: urlOverride.urlLoginSeam ?? config.urlLoginSeam,
      urlApi: urlOverride.urlApi ?? config.urlApi,
    },
  });

  // Invalida cache
  invalidateTribunalCache();

  return {
    id: updated.id,
    tribunalId: updated.tribunalId,
    sistema: updated.sistema as Sistema,
    grau: updated.grau as Grau,
    urlBase: updated.urlBase,
    urlLoginSeam: updated.urlLoginSeam,
    urlApi: updated.urlApi,
  };
}

/**
 * Valida se um grau é válido
 */
export function validateGrau(grau: string): Grau {
  if (grau !== '1g' && grau !== '2g') {
    throw new Error(`Grau inválido: ${grau}. Deve ser '1g' ou '2g'.`);
  }
  return grau as Grau;
}

/**
 * Converte grau para nome legível
 */
export function grauToString(grau: Grau): string {
  return grau === '1g' ? 'Primeiro Grau' : 'Segundo Grau';
}

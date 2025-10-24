'use server';

/**
 * Server Actions para PJE
 * Funções server-side que podem ser chamadas diretamente do client
 */

import { executarLoginPJE, rasparProcessosPJE } from '@/lib/api/pje-adapter';
import type { LoginResult, ScrapeResult } from '@/lib/types';
import { z } from 'zod';

// Schema de validação para login
const loginSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Schema de validação para raspagem
const scrapeSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/),
  senha: z.string().min(6),
  idAdvogado: z.number().int().positive(),
  idAgrupamento: z.number().int().positive().optional().default(1),
});

/**
 * Server Action: Login PJE
 */
export async function loginPJEAction(formData: FormData): Promise<LoginResult> {
  try {
    // Extrai dados do FormData
    const cpf = formData.get('cpf')?.toString() || '';
    const senha = formData.get('senha')?.toString() || '';

    // Valida entrada
    const validacao = loginSchema.safeParse({ cpf, senha });

    if (!validacao.success) {
      return {
        success: false,
        message: 'Dados inválidos',
        error: validacao.error.issues[0].message,
      };
    }

    // Executa login
    const resultado = await executarLoginPJE(validacao.data.cpf, validacao.data.senha);

    return resultado;
  } catch (error) {
    console.error('[Server Action] Erro no login:', error);
    return {
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Server Action: Raspar Processos PJE
 */
export async function scrapeProcessosPJEAction(
  cpf: string,
  senha: string,
  idAdvogado: number,
  idAgrupamento?: number
): Promise<ScrapeResult> {
  try {
    // Valida entrada
    const validacao = scrapeSchema.safeParse({ cpf, senha, idAdvogado, idAgrupamento });

    if (!validacao.success) {
      return {
        success: false,
        processos: [],
        total: 0,
        timestamp: new Date().toISOString(),
        error: validacao.error.issues[0].message,
      };
    }

    // Executa raspagem (usa defaults TRT3 e 1g)
    const resultado = await rasparProcessosPJE(
      validacao.data.cpf,
      validacao.data.senha,
      validacao.data.idAdvogado,
      'TRT3', // default TRT
      '1g', // default grau
      validacao.data.idAgrupamento
    );

    return resultado;
  } catch (error) {
    console.error('[Server Action] Erro na raspagem:', error);
    return {
      success: false,
      processos: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Server Action: Testar Conexão PJE
 * Apenas verifica se o PJE está acessível
 */
export async function testConnectionAction(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://pje.trt3.jus.br/primeirograu/login.seam', {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return {
        success: true,
        message: 'PJE está acessível',
      };
    }

    return {
      success: false,
      message: `PJE retornou status ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}

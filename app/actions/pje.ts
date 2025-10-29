'use server';

/**
 * Server Actions para PJE
 * Funções server-side que podem ser chamadas diretamente do client
 */

import { executarLoginPJE, rasparProcessosPJE } from '@/lib/api/pje-adapter';
// Enums precisam ser importados como valores (não type-only) para serem usados em runtime
import {
  ScrapeJobStatus,
  ScrapeType,
  ScrapeSubType,
} from '@/lib/types';
// Types puros podem ser importados como type-only
import type {
  LoginResult,
  ScrapeResult,
  CreateEscritorioInput,
  UpdateEscritorioInput,
  CreateAdvogadoInput,
  UpdateAdvogadoInput,
  CreateCredencialInput,
  UpdateCredencialInput,
  EscritorioWithAdvogados,
  AdvogadoWithCredenciais,
  CredencialWithRelations,
  TestCredencialResult,
  TRTCode,
  Grau,
  CreateScrapeJobInput,
  ScrapeJobWithRelations,
  ListScrapeJobsFilters,
  PaginatedScrapeJobs,
  ScrapeExecutionDetails,
  ScrapeJobProgress,
} from '@/lib/types';
import { z } from 'zod';
import { decompressJSON } from '@/lib/utils/compression';
import { parseTribunalConfigId, getTipoTribunal } from '@/lib/types/tribunal';
import { sanitizeError, maskCPF } from '@/lib/utils/sanitization';

// Lazy load Prisma to avoid edge runtime issues
async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client');

  const globalForPrisma = globalThis as unknown as {
    prisma: InstanceType<typeof PrismaClient> | undefined;
  };

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  return globalForPrisma.prisma;
}

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
        error: {
          type: 'VALIDATION_ERROR',
          category: 'CONFIGURATION',
          message: validacao.error.issues[0].message,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Executa login
    const resultado = await executarLoginPJE(validacao.data.cpf, validacao.data.senha);

    return resultado;
  } catch (error) {
    console.error('[loginPJEAction] Erro:', sanitizeError(error));
    return {
      success: false,
      message: 'Erro interno do servidor',
      error: {
        type: 'UNKNOWN_ERROR',
        category: 'UNKNOWN',
        message: 'Erro interno do servidor',
        retryable: false,
        timestamp: new Date().toISOString(),
      },
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
        error: {
          type: 'VALIDATION_ERROR',
          category: 'CONFIGURATION',
          message: validacao.error.issues[0].message,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
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
    console.error('[scrapeProcessosPJEAction] Erro:', sanitizeError(error));
    return {
      success: false,
      processos: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: {
        type: 'UNKNOWN_ERROR',
        category: 'UNKNOWN',
        message: 'Erro interno do servidor',
        retryable: false,
        timestamp: new Date().toISOString(),
      },
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
      message: 'Erro ao testar conexão',
    };
  }
}

// ============================================================================
// CREDENTIALS MANAGEMENT SERVER ACTIONS
// ============================================================================

// Schemas de validação
const escritorioSchema = z.object({
  nome: z.string().min(1, 'Nome do escritório é obrigatório'),
});

const advogadoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  oabNumero: z.string().regex(/^\d+$/, 'OAB deve conter apenas números'),
  oabUf: z.string().length(2, 'UF deve ter 2 caracteres').toUpperCase(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
  escritorioId: z.string().uuid('ID de escritório inválido'), // Required - all lawyers must belong to a firm
});

const credencialSchema = z.object({
  advogadoId: z.string().uuid('ID de advogado inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  descricao: z.string().optional(),
  tribunalConfigIds: z.array(
    z.string().regex(
      /^[A-Z0-9]{3,6}-(PJE|EPROC|ESAJ|PROJUDI|THEMIS)-(1g|2g|unico)$/,
      'Formato de tribunal inválido. Use: CODIGO-SISTEMA-GRAU (ex: TRT3-PJE-1g)'
    )
  ).min(1, 'Selecione ao menos um tribunal'),
});

// Update schemas
const updateEscritorioSchema = z.object({
  id: z.string().uuid('ID de escritório inválido'),
  nome: z.string().min(1, 'Nome do escritório é obrigatório'),
});

const updateAdvogadoSchema = z.object({
  id: z.string().uuid('ID de advogado inválido'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  oabNumero: z.string().regex(/^\d+$/, 'OAB deve conter apenas números'),
  oabUf: z.string().length(2, 'UF deve ter 2 caracteres').toUpperCase(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
  escritorioId: z.string().uuid('ID de escritório inválido'),
});

const updateCredencialSchema = z.object({
  id: z.string().uuid('ID de credencial inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  descricao: z.string().optional(),
  tribunalConfigIds: z.array(
    z.string().regex(
      /^[A-Z0-9]{3,6}-(PJE|EPROC|ESAJ|PROJUDI|THEMIS)-(1g|2g|unico)$/,
      'Formato de tribunal inválido. Use: CODIGO-SISTEMA-GRAU (ex: TRT3-PJE-1g)'
    )
  ).min(1, 'Selecione ao menos um tribunal'),
});

// ============================================================================
// ESCRITORIO ACTIONS
// ============================================================================

export async function createEscritorioAction(input: CreateEscritorioInput) {
  try {
    const prisma = await getPrisma();
    const validacao = escritorioSchema.safeParse(input);
    if (!validacao.success) {
      return {
        success: false,
        error: validacao.error.issues[0].message,
      };
    }

    const escritorio = await prisma.escritorio.create({
      data: {
        nome: validacao.data.nome,
      },
    });

    return {
      success: true,
      data: escritorio,
    };
  } catch (error) {
    console.error('[createEscritorioAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao criar escritório',
    };
  }
}

export async function listEscritoriosAction() {
  try {
    const prisma = await getPrisma();
    const escritorios = await prisma.escritorio.findMany({
      include: {
        advogados: {
          include: {
            credenciais: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return {
      success: true,
      data: escritorios as EscritorioWithAdvogados[],
    };
  } catch (error) {
    console.error('[listEscritoriosAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao listar escritórios',
      data: [],
    };
  }
}

export async function getEscritorioAction(id: string) {
  try {
    const prisma = await getPrisma();
    const escritorio = await prisma.escritorio.findUnique({
      where: { id },
      include: {
        advogados: {
          include: {
            credenciais: true,
          },
        },
      },
    });

    if (!escritorio) {
      return {
        success: false,
        error: 'Escritório não encontrado',
      };
    }

    return {
      success: true,
      data: escritorio as EscritorioWithAdvogados,
    };
  } catch (error) {
    console.error('[getEscritorioAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar escritório',
    };
  }
}

export async function updateEscritorioAction(id: string, input: UpdateEscritorioInput) {
  try {
    const prisma = await getPrisma();
    const validacao = escritorioSchema.safeParse(input);
    if (!validacao.success) {
      return {
        success: false,
        error: validacao.error.issues[0].message,
      };
    }

    const escritorio = await prisma.escritorio.update({
      where: { id },
      data: {
        nome: validacao.data.nome,
      },
    });

    return {
      success: true,
      data: escritorio,
    };
  } catch (error) {
    console.error('[updateEscritorioAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao atualizar escritório',
    };
  }
}

export async function deleteEscritorioAction(id: string) {
  try {
    const prisma = await getPrisma();
    // Verifica se tem advogados
    const count = await prisma.advogado.count({
      where: { escritorioId: id },
    });

    if (count > 0) {
      return {
        success: false,
        error: 'Não é possível deletar um escritório com advogados. Remova os advogados primeiro.',
      };
    }

    await prisma.escritorio.delete({
      where: { id },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[deleteEscritorioAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao deletar escritório',
    };
  }
}

// ============================================================================
// ADVOGADO ACTIONS
// ============================================================================

export async function createAdvogadoAction(input: CreateAdvogadoInput) {
  try {
    const prisma = await getPrisma();
    const validacao = advogadoSchema.safeParse(input);
    if (!validacao.success) {
      return {
        success: false,
        error: validacao.error.issues[0].message,
      };
    }

    // Verifica OAB duplicado
    const existente = await prisma.advogado.findUnique({
      where: {
        oabNumero_oabUf: {
          oabNumero: validacao.data.oabNumero,
          oabUf: validacao.data.oabUf,
        },
      },
    });

    if (existente) {
      return {
        success: false,
        error: `Já existe um advogado cadastrado com OAB ${validacao.data.oabNumero}/${validacao.data.oabUf}`,
      };
    }

    // Verifica se escritório existe
    if (validacao.data.escritorioId) {
      const escritorio = await prisma.escritorio.findUnique({
        where: { id: validacao.data.escritorioId },
      });

      if (!escritorio) {
        return {
          success: false,
          error: 'Escritório não encontrado',
        };
      }
    }

    const advogado = await prisma.advogado.create({
      data: {
        nome: validacao.data.nome,
        oabNumero: validacao.data.oabNumero,
        oabUf: validacao.data.oabUf,
        cpf: validacao.data.cpf,
        escritorioId: validacao.data.escritorioId,
      },
    });

    return {
      success: true,
      data: advogado,
    };
  } catch (error) {
    console.error('[createAdvogadoAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao criar advogado',
    };
  }
}

export async function listAdvogadosAction(escritorioId?: string) {
  try {
    const prisma = await getPrisma();
    const advogados = await prisma.advogado.findMany({
      where: escritorioId ? { escritorioId } : undefined,
      include: {
        credenciais: {
          include: {
            tribunais: {
              include: {
                tribunalConfig: {
                  include: {
                    tribunal: true,
                  },
                },
              },
            },
          },
        },
        escritorio: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return {
      success: true,
      data: advogados as AdvogadoWithCredenciais[],
    };
  } catch (error) {
    console.error('[listAdvogadosAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao listar advogados',
      data: [],
    };
  }
}

export async function getAdvogadoAction(id: string) {
  try {
    const prisma = await getPrisma();
    const advogado = await prisma.advogado.findUnique({
      where: { id },
      include: {
        credenciais: {
          include: {
            tribunais: {
              include: {
                tribunalConfig: {
                  include: {
                    tribunal: true,
                  },
                },
              },
            },
          },
        },
        escritorio: true,
      },
    });

    if (!advogado) {
      return {
        success: false,
        error: 'Advogado não encontrado',
      };
    }

    return {
      success: true,
      data: advogado as AdvogadoWithCredenciais,
    };
  } catch (error) {
    console.error('[getAdvogadoAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar advogado',
    };
  }
}

export async function updateAdvogadoAction(id: string, input: UpdateAdvogadoInput) {
  try {
    const prisma = await getPrisma();
    const advogado = await prisma.advogado.update({
      where: { id },
      data: {
        nome: input.nome,
        oabNumero: input.oabNumero,
        oabUf: input.oabUf,
        cpf: input.cpf,
        escritorioId: input.escritorioId ?? undefined,
      },
    });

    return {
      success: true,
      data: advogado,
    };
  } catch (error) {
    console.error('[updateAdvogadoAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao atualizar advogado',
    };
  }
}

export async function deleteAdvogadoAction(id: string) {
  try {
    const prisma = await getPrisma();
    // Cascade delete vai remover credenciais automaticamente
    await prisma.advogado.delete({
      where: { id },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[deleteAdvogadoAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao deletar advogado',
    };
  }
}

// ============================================================================
// CREDENCIAL ACTIONS
// ============================================================================

export async function createCredencialAction(input: CreateCredencialInput) {
  try {
    const prisma = await getPrisma();

    const validacao = credencialSchema.safeParse(input);
    if (!validacao.success) {
      return {
        success: false,
        error: validacao.error.issues[0].message,
      };
    }

    // Verifica senha duplicada
    const existente = await prisma.credencial.findUnique({
      where: {
        advogadoId_senha: {
          advogadoId: validacao.data.advogadoId,
          senha: validacao.data.senha,
        },
      },
    });

    if (existente) {
      return {
        success: false,
        error: 'Esta senha já está cadastrada para este advogado',
      };
    }

    // Converte identificadores "CODIGO-SISTEMA-GRAU" para UUIDs do banco
    // Formato: "TRT3-PJE-1g" => busca TribunalConfig onde tribunal.codigo='TRT3' AND sistema='PJE' AND grau='1g'
    const tribunalConfigUUIDs: string[] = [];

    for (const tribunalId of validacao.data.tribunalConfigIds) {
      // Parse do formato "CODIGO-SISTEMA-GRAU"
      try {
        const { codigo, sistema, grau } = parseTribunalConfigId(tribunalId);

        // Busca TribunalConfig no banco
        const tribunalConfig = await prisma.tribunalConfig.findFirst({
          where: {
            tribunal: {
              codigo,
            },
            sistema,
            grau,
          },
          include: {
            tribunal: true,
          },
        });

        if (!tribunalConfig) {
          return {
            success: false,
            error: `Tribunal ${tribunalId} não encontrado. Execute o seed do banco: npx prisma db seed`,
          };
        }

        tribunalConfigUUIDs.push(tribunalConfig.id);
      } catch (error) {
        return {
          success: false,
          error: `ID de tribunal inválido: ${tribunalId}`,
        };
      }
    }

    // Busca configs completas
    const tribunais = await prisma.tribunalConfig.findMany({
      where: {
        id: {
          in: tribunalConfigUUIDs,
        },
      },
      include: {
        tribunal: true,
      },
    });

    // Cria credencial com associações
    const credencial = await prisma.credencial.create({
      data: {
        senha: validacao.data.senha,
        descricao: validacao.data.descricao,
        advogadoId: validacao.data.advogadoId,
        tribunais: {
          create: tribunalConfigUUIDs.map((tribunalConfigId) => {
            const tribunal = tribunais.find((t) => t.id === tribunalConfigId);
            // Determina tipo baseado no código do tribunal
            const codigoTribunal = tribunal?.tribunal.codigo || '';
            const tipoTribunal = getTipoTribunal(codigoTribunal) || 'TRT';

            return {
              tribunalConfigId,
              tipoTribunal,
            };
          }),
        },
      },
      select: {
        id: true,
        descricao: true,
        ativa: true,
        advogadoId: true,
        createdAt: true,
        updatedAt: true,
        tribunais: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        advogado: true,
      },
    });

    return {
      success: true,
      data: credencial as CredencialWithRelations,
    };
  } catch (error) {
    console.error('[createCredencialAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao criar credencial',
    };
  }
}

export async function listCredenciaisAction(advogadoId: string) {
  try {
    const prisma = await getPrisma();
    const credenciais = await prisma.credencial.findMany({
      where: { advogadoId },
      select: {
        id: true,
        descricao: true,
        ativa: true,
        advogadoId: true,
        createdAt: true,
        updatedAt: true,
        tribunais: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        advogado: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: credenciais as CredencialWithRelations[],
    };
  } catch (error) {
    console.error('[listCredenciaisAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao listar credenciais',
      data: [],
    };
  }
}

/**
 * Lista todos os TribunalConfigs disponíveis no banco
 */
export async function listTribunalConfigsAction() {
  try {
    const prisma = await getPrisma();
    const configs = await prisma.tribunalConfig.findMany({
      include: {
        tribunal: true,
      },
      orderBy: [
        { tribunal: { codigo: 'asc' } },
        { sistema: 'asc' },
        { grau: 'asc' },
      ],
    });

    // Transforma para formato compatível com TribunalConfigConstant
    const configsFormatted = configs.map((config) => ({
      id: `${config.tribunal.codigo}-${config.sistema}-${config.grau}`,
      codigo: config.tribunal.codigo,
      sistema: config.sistema,
      grau: config.grau,
      nome: `${config.tribunal.codigo} - ${config.sistema} - ${config.grau === '1g' ? '1º Grau' : config.grau === '2g' ? '2º Grau' : 'Acesso Único'}`,
      nomeCompleto: config.tribunal.nome,
      regiao: config.tribunal.regiao,
      uf: config.tribunal.uf,
      cidadeSede: config.tribunal.cidadeSede,
    }));

    return {
      success: true,
      data: configsFormatted,
    };
  } catch (error) {
    console.error('[listTribunalConfigsAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao listar tribunais',
      data: [],
    };
  }
}

export async function getCredencialAction(id: string) {
  try {
    const prisma = await getPrisma();
    const credencial = await prisma.credencial.findUnique({
      where: { id },
      select: {
        id: true,
        descricao: true,
        ativa: true,
        advogadoId: true,
        createdAt: true,
        updatedAt: true,
        tribunais: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        advogado: true,
      },
    });

    if (!credencial) {
      return {
        success: false,
        error: 'Credencial não encontrada',
      };
    }

    return {
      success: true,
      data: credencial as CredencialWithRelations,
    };
  } catch (error) {
    console.error('[getCredencialAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar credencial',
    };
  }
}

export async function updateCredencialAction(id: string, input: UpdateCredencialInput) {
  try {
    const prisma = await getPrisma();
    const senhaChanged = input.senha !== undefined;

    // Atualiza credencial
    const updateData: any = {};
    if (input.senha) updateData.senha = input.senha;
    if (input.descricao !== undefined) updateData.descricao = input.descricao;

    // Convert tribunal IDs from format "TRT3-PJE-1g" to UUIDs
    let tribunalConfigUUIDs: string[] = [];
    if (input.tribunalConfigIds && input.tribunalConfigIds.length > 0) {
      console.log('[updateCredencialAction] Converting tribunal IDs:', input.tribunalConfigIds);

      // Parse tribunal IDs
      const tribunalQueries = input.tribunalConfigIds.map(idStr => {
        const parts = idStr.split('-');
        if (parts.length !== 3) {
          throw new Error(`ID de tribunal inválido: ${idStr}. Esperado formato: TRT3-PJE-1g`);
        }
        const [codigo, sistema, grau] = parts;
        return { codigo, sistema, grau };
      });

      // Find matching tribunal configs
      const whereClause = {
        OR: tribunalQueries.map(q => ({
          AND: [
            { tribunal: { codigo: q.codigo } },
            { sistema: q.sistema },
            { grau: q.grau },
          ],
        })),
      };

      const matchedTribunals = await prisma.tribunalConfig.findMany({
        where: whereClause,
        include: {
          tribunal: true,
        },
      });

      console.log('[updateCredencialAction] Found tribunals:', matchedTribunals.length);

      if (matchedTribunals.length !== input.tribunalConfigIds.length) {
        const foundIds = matchedTribunals.map(
          (t) => `${t.tribunal.codigo}-${t.sistema}-${t.grau}`
        );
        const missing = input.tribunalConfigIds.filter((id) => !foundIds.includes(id));
        throw new Error(`Tribunais não encontrados: ${missing.join(', ')}`);
      }

      tribunalConfigUUIDs = matchedTribunals.map(t => t.id);
    }

    // Se senha mudou, reseta validações
    if (senhaChanged && tribunalConfigUUIDs.length > 0) {
      // Remove associações antigas
      await prisma.credencialTribunal.deleteMany({
        where: { credencialId: id },
      });

      // Busca tribunais para determinar tipos
      const tribunais = await prisma.tribunalConfig.findMany({
        where: {
          id: {
            in: tribunalConfigUUIDs,
          },
        },
        include: {
          tribunal: true,
        },
      });

      // Helper function to determine tribunal type
      const getTipoTribunal = (codigo: string): string => {
        if (codigo.startsWith('TRT')) return 'TRT';
        if (codigo.startsWith('TJ')) return 'TJ';
        if (codigo.startsWith('TRF')) return 'TRF';
        return 'Superior'; // TST, STJ, STF, etc.
      };

      // Cria novas associações
      updateData.tribunais = {
        create: tribunalConfigUUIDs.map((tribunalConfigId) => {
          const tribunal = tribunais.find((t) => t.id === tribunalConfigId);
          const tipoTribunal = getTipoTribunal(tribunal?.tribunal.codigo || '');

          return {
            tribunalConfigId,
            tipoTribunal,
            validadoEm: null, // Reset validation
          };
        }),
      };
    } else if (tribunalConfigUUIDs.length > 0) {
      // Helper function to determine tribunal type
      const getTipoTribunal = (codigo: string): string => {
        if (codigo.startsWith('TRT')) return 'TRT';
        if (codigo.startsWith('TJ')) return 'TJ';
        if (codigo.startsWith('TRF')) return 'TRF';
        return 'Superior'; // TST, STJ, STF, etc.
      };

      // Apenas atualiza associações sem resetar validações
      const existentes = await prisma.credencialTribunal.findMany({
        where: { credencialId: id },
      });

      const existentesIds = existentes.map((e) => e.tribunalConfigId);
      const novosIds = tribunalConfigUUIDs.filter((uuid) => !existentesIds.includes(uuid));
      const removidosIds = existentesIds.filter((uuid) => !tribunalConfigUUIDs.includes(uuid));

      // Remove não selecionados
      if (removidosIds.length > 0) {
        await prisma.credencialTribunal.deleteMany({
          where: {
            credencialId: id,
            tribunalConfigId: {
              in: removidosIds,
            },
          },
        });
      }

      // Adiciona novos
      if (novosIds.length > 0) {
        const tribunais = await prisma.tribunalConfig.findMany({
          where: {
            id: {
              in: novosIds,
            },
          },
          include: {
            tribunal: true,
          },
        });

        await prisma.credencialTribunal.createMany({
          data: novosIds.map((tribunalConfigId) => {
            const tribunal = tribunais.find((t) => t.id === tribunalConfigId);
            const tipoTribunal = getTipoTribunal(tribunal?.tribunal.codigo || '');

            return {
              credencialId: id,
              tribunalConfigId,
              tipoTribunal,
            };
          }),
        });
      }
    }

    const credencial = await prisma.credencial.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        descricao: true,
        ativa: true,
        advogadoId: true,
        createdAt: true,
        updatedAt: true,
        tribunais: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        advogado: true,
      },
    });

    return {
      success: true,
      data: credencial as CredencialWithRelations,
    };
  } catch (error) {
    console.error('[updateCredencialAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao atualizar credencial',
    };
  }
}

export async function deleteCredencialAction(id: string) {
  try {
    const prisma = await getPrisma();
    await prisma.credencial.delete({
      where: { id },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[deleteCredencialAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao deletar credencial',
    };
  }
}

export async function toggleCredencialAction(id: string) {
  try {
    const prisma = await getPrisma();
    const credencial = await prisma.credencial.findUnique({
      where: { id },
      select: { id: true, ativa: true },
    });

    if (!credencial) {
      return {
        success: false,
        error: 'Credencial não encontrada',
      };
    }

    const updated = await prisma.credencial.update({
      where: { id },
      data: {
        ativa: !credencial.ativa,
      },
      select: {
        id: true,
        descricao: true,
        ativa: true,
        advogadoId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error('[toggleCredencialAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao alterar status da credencial',
    };
  }
}

// ============================================================================
// CREDENTIAL TESTING
// ============================================================================

// Rate limiting - track last test time per credential
const lastTestTimes = new Map<string, number>();
const RATE_LIMIT_MS = 10000; // 10 seconds

/**
 * Testa credencial executando login no PJE
 * Atualiza o timestamp de validação se bem-sucedido
 *
 * @param credencialId ID da credencial
 * @param tribunalConfigId ID do tribunal config para testar
 * @returns Resultado do teste
 */
export async function testCredencialAction(
  credencialId: string,
  tribunalConfigId: string
): Promise<TestCredencialResult> {
  try {
    // Rate limiting
    const now = Date.now();
    const lastTest = lastTestTimes.get(credencialId) || 0;
    const timeSinceLastTest = now - lastTest;

    if (timeSinceLastTest < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastTest) / 1000);
      return {
        success: false,
        message: `Aguarde ${waitTime} segundos antes de testar novamente (proteção anti-bot)`,
      };
    }

    const prisma = await getPrisma();

    // Busca credencial com advogado
    const credencial = await prisma.credencial.findUnique({
      where: { id: credencialId },
      include: {
        advogado: true,
        tribunais: {
          where: {
            tribunalConfigId,
          },
        },
      },
    });

    if (!credencial) {
      return {
        success: false,
        message: 'Credencial não encontrada',
      };
    }

    if (credencial.tribunais.length === 0) {
      return {
        success: false,
        message: 'Esta credencial não está associada ao tribunal selecionado',
      };
    }

    // Busca configuração do tribunal
    const tribunalConfig = await prisma.tribunalConfig.findUnique({
      where: { id: tribunalConfigId },
      include: {
        tribunal: true,
      },
    });

    if (!tribunalConfig) {
      return {
        success: false,
        message: 'Configuração de tribunal não encontrada',
      };
    }

    // Atualiza rate limit
    lastTestTimes.set(credencialId, now);

    // Executa login
    console.log(`[testCredencialAction] Testando credencial para ${credencial.advogado.nome} (CPF: ${maskCPF(credencial.advogado.cpf)}) em ${tribunalConfig.tribunal.codigo}-${tribunalConfig.grau}`);

    const resultado = await executarLoginPJE(
      credencial.advogado.cpf,
      credencial.senha,
      tribunalConfig.tribunal.codigo as TRTCode,
      tribunalConfig.grau as Grau
    );

    if (resultado.success) {
      // Atualiza timestamp de validação
      await prisma.credencialTribunal.updateMany({
        where: {
          credencialId,
          tribunalConfigId,
        },
        data: {
          validadoEm: new Date(),
        },
      });

      return {
        success: true,
        message: `Login realizado com sucesso!`,
        advogadoNome: resultado.perfil?.nome || credencial.advogado.nome,
      };
    } else {
      return {
        success: false,
        message: resultado.message || 'Falha no login',
      };
    }
  } catch (error) {
    console.error('[testCredencialAction] Erro:', sanitizeError(error));
    return {
      success: false,
      message: 'Erro ao testar credencial',
    };
  }
}

// ============================================================================
// SCRAPING JOB MANAGEMENT SERVER ACTIONS
// ============================================================================

// Schema de validação para criação de job
const createScrapeJobSchema = z.object({
  credencialId: z.string().uuid('ID de credencial inválido'),
  // tribunalConfigIds aceita formato "TRT3-1g" ou UUIDs
  tribunalConfigIds: z.array(z.string()).min(1, 'Selecione ao menos um tribunal'),
  scrapeType: z.enum(['acervo_geral', 'pendentes', 'arquivados', 'minha_pauta']),
  scrapeSubType: z.enum(['com_dado_ciencia', 'sem_prazo']).optional(),
});

/**
 * Server Action: Create Scrape Job
 * Creates a new scraping job and enqueues it for execution
 */
export async function createScrapeJobAction(input: CreateScrapeJobInput) {
  try {
    console.log('[createScrapeJobAction] Iniciando criação de job:', {
      credencialId: input.credencialId,
      tribunalCount: input.tribunalConfigIds.length,
      scrapeType: input.scrapeType,
      scrapeSubType: input.scrapeSubType
    });
    const prisma = await getPrisma();

    // Validate input
    const validacao = createScrapeJobSchema.safeParse(input);
    if (!validacao.success) {
      console.error('[createScrapeJobAction] Validação falhou:', validacao.error.issues);
      return {
        success: false,
        error: validacao.error.issues[0].message,
      };
    }

    const { credencialId, tribunalConfigIds, scrapeType, scrapeSubType } = validacao.data;
    console.log('[createScrapeJobAction] Input validado:', { credencialId, tribunalConfigIds, scrapeType, scrapeSubType });

    // Validate that 'pendentes' has a subtype
    if (scrapeType === 'pendentes' && !scrapeSubType) {
      console.error('[createScrapeJobAction] Pendentes sem subtipo');
      return {
        success: false,
        error: 'Para raspagem de "Pendentes", selecione um sub-tipo',
      };
    }

    // Step 1: Validate credential exists and is active
    console.log('[createScrapeJobAction] Validando credencial...');
    const credencial = await prisma.credencial.findUnique({
      where: { id: credencialId },
      include: {
        advogado: true,
        tribunais: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
      },
    });

    if (!credencial) {
      console.error('[createScrapeJobAction] Credencial não encontrada');
      return {
        success: false,
        error: 'Credencial não encontrada',
      };
    }

    if (!credencial.ativa) {
      console.error('[createScrapeJobAction] Credencial inativa');
      return {
        success: false,
        error: 'Credencial inativa. Ative a credencial antes de criar o job.',
      };
    }

    console.log('[createScrapeJobAction] Credencial validada:', {
      id: credencial.id,
      advogado: credencial.advogado.nome,
      cpf: maskCPF(credencial.advogado.cpf),
      tribunaisCount: credencial.tribunais.length,
    });

    // Step 2: Parse tribunal IDs from format "TRT3-PJE-1g" to components
    console.log('[createScrapeJobAction] Parseando IDs de tribunais...');
    const tribunalQueries = tribunalConfigIds.map(id => {
      const parts = id.split('-');
      if (parts.length !== 3) {
        throw new Error(`ID de tribunal inválido: ${id}. Esperado formato: TRT3-PJE-1g`);
      }
      const [codigo, sistema, grau] = parts;
      return { codigo, sistema, grau, originalId: id };
    });
    console.log('[createScrapeJobAction] Tribunais parseados:', tribunalQueries);

    // Step 3: Get tribunal configs associated with this credential
    const credentialTribunalConfigIds = credencial.tribunais.map(
      (ct) => ct.tribunalConfigId
    );

    console.log('[createScrapeJobAction] IDs de tribunais da credencial:', credentialTribunalConfigIds);

    // Step 4: Find matching tribunal configs that belong to this credential
    const whereClause = {
      AND: [
        {
          id: {
            in: credentialTribunalConfigIds,
          },
        },
        {
          OR: tribunalQueries.map(q => ({
            AND: [
              { tribunal: { codigo: q.codigo } },
              { sistema: q.sistema },
              { grau: q.grau },
            ],
          })),
        },
      ],
    };

    console.log('[createScrapeJobAction] Query WHERE clause:', JSON.stringify(whereClause, null, 2));

    const matchedTribunals = await prisma.tribunalConfig.findMany({
      where: whereClause,
      include: {
        tribunal: true,
      },
    });

    console.log('[createScrapeJobAction] Tribunais encontrados:', matchedTribunals.length);

    // Step 5: Validate all requested tribunals were found
    if (matchedTribunals.length !== tribunalConfigIds.length) {
      const foundIds = matchedTribunals.map(
        (t) => `${t.tribunal.codigo}-${t.sistema}-${t.grau}`
      );
      const missing = tribunalConfigIds.filter((id) => !foundIds.includes(id));

      console.error('[createScrapeJobAction] Tribunais não associados à credencial:', missing);
      return {
        success: false,
        error: `Os seguintes tribunais não estão associados à credencial selecionada: ${missing.join(', ')}`,
      };
    }

    // Step 6: Create job using real UUIDs from database
    console.log('[createScrapeJobAction] Criando job de raspagem...');
    const job = await prisma.scrapeJob.create({
      data: {
        status: ScrapeJobStatus.PENDING,
        scrapeType: scrapeType as string,
        scrapeSubType: scrapeSubType as string | undefined,
        tribunals: {
          create: matchedTribunals.map(tc => ({
            tribunalConfigId: tc.id, // Use real UUID from database
            status: ScrapeJobStatus.PENDING,
          })),
        },
      },
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
      },
    });

    console.log(`[createScrapeJobAction] Job ${job.id} created with status 'pending' - will be picked up by orchestrator`);

    return {
      success: true,
      data: {
        jobId: job.id,
        tribunalCount: tribunalConfigIds.length,
      },
    };
  } catch (error) {
    console.error('[createScrapeJobAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao criar job de raspagem',
    };
  }
}

/**
 * Server Action: List Scrape Jobs
 * Lists scraping jobs with filtering and pagination
 */
export async function listScrapeJobsAction(filters?: ListScrapeJobsFilters) {
  try {
    const prisma = await getPrisma();

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (filters?.status && filters.status.length > 0) {
      where.status = {
        in: filters.status,
      };
    }

    if (filters?.scrapeType && filters.scrapeType.length > 0) {
      where.scrapeType = {
        in: filters.scrapeType,
      };
    }

    if (filters?.startDate) {
      where.createdAt = {
        gte: filters.startDate,
      };
    }

    if (filters?.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: filters.endDate,
      };
    }

    // Tribunal search
    if (filters?.tribunalSearch) {
      where.tribunals = {
        some: {
          tribunalConfig: {
            tribunal: {
              OR: [
                { codigo: { contains: filters.tribunalSearch } },
                { nome: { contains: filters.tribunalSearch } },
              ],
            },
          },
        },
      };
    }

    // Get total count
    const total = await prisma.scrapeJob.count({ where });

    // Get jobs
    const jobs = await prisma.scrapeJob.findMany({
      where,
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        executions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    const result: PaginatedScrapeJobs = {
      jobs: jobs as ScrapeJobWithRelations[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[listScrapeJobsAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao listar jobs',
      data: {
        jobs: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      } as PaginatedScrapeJobs,
    };
  }
}

/**
 * Server Action: Get Scrape Job
 * Gets detailed information about a specific scraping job
 */
export async function getScrapeJobAction(jobId: string) {
  try {
    const prisma = await getPrisma();

    const job = await prisma.scrapeJob.findUnique({
      where: { id: jobId },
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        executions: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return {
        success: false,
        error: 'Job não encontrado',
      };
    }

    return {
      success: true,
      data: job as ScrapeJobWithRelations,
    };
  } catch (error) {
    console.error('[getScrapeJobAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar job',
    };
  }
}

/**
 * Server Action: Get Scrape Execution
 * Gets detailed information about a specific execution including decompressed results
 */
export async function getScrapeExecutionAction(executionId: string) {
  try {
    const prisma = await getPrisma();

    const execution = await prisma.scrapeExecution.findUnique({
      where: { id: executionId },
      include: {
        tribunalConfig: {
          include: {
            tribunal: true,
          },
        },
      },
    });

    if (!execution) {
      return {
        success: false,
        error: 'Execução não encontrada',
      };
    }

    // Decompress result data if present
    let resultDataDecoded;
    if (execution.resultData) {
      try {
        resultDataDecoded = decompressJSON(execution.resultData);
      } catch (err) {
        console.error('[getScrapeExecutionAction] Failed to decompress result data:', err);
      }
    }

    const result: ScrapeExecutionDetails = {
      ...execution,
      resultDataDecoded,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[getScrapeExecutionAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar execução',
    };
  }
}

/**
 * Server Action: Get Scrape Execution Processes
 * Gets processes from an execution using hybrid loading strategy:
 * 1. Tries to load from type-specific tables (preferred)
 * 2. Falls back to compressed resultData if tables are empty
 */
export async function getScrapeExecutionProcessesAction(
  executionId: string,
  scrapeType: string
) {
  try {
    const { loadProcessosFromExecution } = await import('@/lib/services/scrape-data-loader');
    const { ScrapeType } = await import('@/lib/types/scraping');
    const prisma = await getPrisma();

    // Validate scrape type
    const validTypes = Object.values(ScrapeType);
    if (!validTypes.includes(scrapeType as ScrapeType)) {
      return {
        success: false,
        error: `Tipo de raspagem inválido: ${scrapeType}`,
      };
    }

    // Get execution to fetch resultData (for fallback)
    const execution = await prisma.scrapeExecution.findUnique({
      where: { id: executionId },
      select: { resultData: true },
    });

    if (!execution) {
      return {
        success: false,
        error: 'Execução não encontrada',
      };
    }

    // Load processes using hybrid strategy
    const processos = await loadProcessosFromExecution(
      executionId,
      scrapeType as ScrapeType,
      execution.resultData
    );

    return {
      success: true,
      data: processos,
    };
  } catch (error) {
    console.error('[getScrapeExecutionProcessesAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao carregar processos',
    };
  }
}

/**
 * Server Action: Get All Processes from Scrape Job
 * Gets all processes from all executions of a job using hybrid loading strategy
 */
export async function getScrapeJobProcessesAction(jobId: string) {
  try {
    const { loadAllProcessosFromJob } = await import('@/lib/services/scrape-data-loader');
    const prisma = await getPrisma();

    // Get job with executions
    const job = await prisma.scrapeJob.findUnique({
      where: { id: jobId },
      select: {
        scrapeType: true,
        executions: {
          select: {
            id: true,
            resultData: true,
          },
        },
      },
    });

    if (!job) {
      return {
        success: false,
        error: 'Job não encontrado',
      };
    }

    // Load all processes using hybrid strategy
    const processos = await loadAllProcessosFromJob(
      job.executions,
      job.scrapeType as any
    );

    return {
      success: true,
      data: processos,
    };
  } catch (error) {
    console.error('[getScrapeJobProcessesAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao carregar processos',
    };
  }
}

/**
 * Server Action: Delete Scrape Job
 * Deletes a scrape job and all its related data
 */
export async function deleteScrapeJobAction(jobId: string) {
  try {
    const prisma = await getPrisma();

    // Verify job exists
    const job = await prisma.scrapeJob.findUnique({
      where: { id: jobId },
      select: { id: true, scrapeType: true },
    });

    if (!job) {
      return {
        success: false,
        error: 'Job não encontrado',
      };
    }

    // Delete job (cascade will delete related records)
    await prisma.scrapeJob.delete({
      where: { id: jobId },
    });

    console.log(`[deleteScrapeJobAction] Job ${jobId} deletado com sucesso`);

    return {
      success: true,
      message: 'Job deletado com sucesso',
    };
  } catch (error) {
    console.error('[deleteScrapeJobAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao deletar job',
    };
  }
}

/**
 * Server Action: Retry Scrape Execution
 * Retries a failed execution for a specific tribunal
 */
export async function retryScrapeExecutionAction(executionId: string) {
  try {
    const prisma = await getPrisma();

    // Find the original execution
    const originalExecution = await prisma.scrapeExecution.findUnique({
      where: { id: executionId },
      include: {
        tribunalConfig: {
          include: {
            tribunal: true,
            credenciais: true,
          },
        },
        scrapeJob: true,
      },
    });

    if (!originalExecution) {
      return {
        success: false,
        error: 'Execução não encontrada',
      };
    }

    // Only allow retry for failed executions
    if (originalExecution.status !== ScrapeJobStatus.FAILED) {
      return {
        success: false,
        error: 'Apenas execuções falhadas podem ser reexecutadas',
      };
    }

    // Ensure we have credentials
    if (!originalExecution.tribunalConfig.credenciais || originalExecution.tribunalConfig.credenciais.length === 0) {
      return {
        success: false,
        error: 'Credenciais não encontradas para este tribunal',
      };
    }

    // Create a new execution record with incremented retry attempt
    const previousAttempt = originalExecution.retryAttempt ?? 0;
    const nextAttempt = previousAttempt + 1;

    console.log(`[retryScrapeExecutionAction] Retrying execution ${executionId}: attempt ${previousAttempt} -> ${nextAttempt}`);

    const newExecution = await prisma.scrapeExecution.create({
      data: {
        scrapeJobId: originalExecution.scrapeJobId,
        tribunalConfigId: originalExecution.tribunalConfigId,
        status: ScrapeJobStatus.PENDING,
        retryAttempt: nextAttempt,
      },
    });

    // Update the tribunal status back to pending
    // Usa updateMany com filtro correto ao invés de update com ID errado
    await prisma.scrapeJobTribunal.updateMany({
      where: {
        scrapeJobId: originalExecution.scrapeJobId,
        tribunalConfigId: originalExecution.tribunalConfigId,
      },
      data: {
        status: ScrapeJobStatus.PENDING,
      },
    });

    // If the job was marked as failed/completed, update it back to pending
    if (originalExecution.scrapeJob.status === ScrapeJobStatus.FAILED || originalExecution.scrapeJob.status === ScrapeJobStatus.COMPLETED) {
      await prisma.scrapeJob.update({
        where: { id: originalExecution.scrapeJobId },
        data: {
          status: ScrapeJobStatus.PENDING,
          completedAt: null,
        },
      });

      console.log(`[retryScrapeExecutionAction] Job ${originalExecution.scrapeJobId} marked as pending - will be picked up by orchestrator`);
    }

    console.log(`[retryScrapeExecutionAction] Created new execution ${newExecution.id} to retry ${executionId}`);

    return {
      success: true,
      data: {
        newExecutionId: newExecution.id,
        jobId: originalExecution.scrapeJobId,
      },
    };
  } catch (error) {
    console.error('[retryScrapeExecutionAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao reexecutar',
    };
  }
}

/**
 * Server Action: Cancel Scrape Job
 * Cancels a pending or running scraping job
 */
export async function cancelScrapeJobAction(jobId: string) {
  try {
    const prisma = await getPrisma();

    // Check if job exists and can be canceled
    const job = await prisma.scrapeJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return {
        success: false,
        error: 'Job não encontrado',
      };
    }

    if (job.status === ScrapeJobStatus.COMPLETED || job.status === ScrapeJobStatus.CANCELED || job.status === ScrapeJobStatus.FAILED) {
      return {
        success: false,
        error: 'Job já foi finalizado e não pode ser cancelado',
      };
    }

    // Update job status
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: ScrapeJobStatus.CANCELED,
        completedAt: new Date(),
      },
    });

    // Update pending tribunals
    await prisma.scrapeJobTribunal.updateMany({
      where: {
        scrapeJobId: jobId,
        status: ScrapeJobStatus.PENDING,
      },
      data: {
        status: ScrapeJobStatus.CANCELED,
      },
    });

    console.log(`[cancelScrapeJobAction] Job ${jobId} canceled`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('[cancelScrapeJobAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao cancelar job',
    };
  }
}

/**
 * Server Action: Get Active Jobs Status
 * Gets status of active jobs for client-side polling
 */
export async function getActiveJobsStatusAction(jobIds: string[]) {
  try {
    const prisma = await getPrisma();

    const jobs = await prisma.scrapeJob.findMany({
      where: {
        id: {
          in: jobIds,
        },
      },
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
        executions: true,
      },
    });

    // Return full jobs instead of just progress data
    return {
      success: true,
      data: jobs,
    };
  } catch (error) {
    console.error('[getActiveJobsStatusAction] Erro:', error);
    return {
      success: false,
      error: 'Erro ao buscar status',
      data: [],
    };
  }
}

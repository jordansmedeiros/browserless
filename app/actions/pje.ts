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
  TribunalFamily,
} from '@/lib/types';
import { getTribunalFamily } from '@/lib/utils/tribunal-helpers';
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
  TRTCode,
  Grau,
  CreateScrapeJobInput,
  ScrapeJobWithRelations,
  ListScrapeJobsFilters,
  PaginatedScrapeJobs,
  ScrapeExecutionDetails,
  ScrapeJobProgress,
  CreateScheduledScrapeInput,
  UpdateScheduledScrapeInput,
  ScheduledScrapeWithRelations,
  PaginatedScheduledScrapes,
  ListProcessosFilters,
  PaginatedProcessos,
  ProcessoUnificado,
} from '@/lib/types';
import { z } from 'zod';
import { decompressJSON } from '@/lib/utils/compression';
import { parseTribunalConfigId, getTipoTribunal } from '@/lib/types/tribunal';
import { sanitizeError, maskCPF } from '@/lib/utils/sanitization';
import { validateCronExpression, getNextRunTime } from '@/lib/utils/cron-helpers.server';
import { addSchedule, updateSchedule, removeSchedule, pauseSchedule, resumeSchedule } from '@/lib/services/scheduled-scrape-service';
import { SCHEDULED_SCRAPES_CONFIG, isSupportedTimezone } from '@/config/scraping';
import { loadProcessosFromExecution, loadAllProcessosFromJob, normalizeProcessoToUnificado } from '@/lib/services/scrape-data-loader';

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
    // Inclui UUID real para uso em filtros que requerem UUID
    const configsFormatted = configs.map((config) => ({
      id: `${config.tribunal.codigo}-${config.sistema}-${config.grau}`,
      uuid: config.id, // UUID real do banco para uso em filtros
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
    console.error('[createScrapeJobAction] ERRO DETALHADO:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      fullError: error,
    });
    return {
      success: false,
      error: `Erro ao criar job de raspagem: ${error instanceof Error ? error.message : String(error)}`,
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
        resultDataDecoded = await decompressJSON(execution.resultData);
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
      prisma,
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
      prisma,
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
 * Schema de validação para listagem de processos
 */
const listProcessosSchema = z.object({
  tribunalConfigIds: z.array(z.string().uuid()).optional(),
  scrapeTypes: z.array(z.enum(['acervo_geral', 'pendentes', 'arquivados', 'minha_pauta'])).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  searchTerm: z.string().min(2, 'Busca deve ter ao menos 2 caracteres').optional(),
  sortBy: z.enum(['dataAutuacao', 'dataUltimaAtualizacao', 'numeroProcesso']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(10).max(200).default(50),
  tribunalFamily: z.enum(['TRT', 'TJ', 'TRF', 'SUPERIOR']).optional(),
});

/**
 * Helper para normalizar número CNJ removendo caracteres não numéricos para comparação
 */
function normalizeCNJ(num: string): string {
  return num.replace(/\D/g, '');
}

/**
 * Server Action: List Processos
 * Agrega processos únicos de 5 tabelas diferentes, identificados por idPje + tribunalConfigId
 */
export async function listProcessosAction(filters?: ListProcessosFilters): Promise<{
  success: boolean;
  data?: PaginatedProcessos;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const prisma = await getPrisma();

    // Validação de entrada
    const validation = listProcessosSchema.safeParse(filters || {});
    if (!validation.success) {
      console.error('[listProcessosAction] Validação falhou:', validation.error.issues);
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Dados inválidos',
        data: {
          processos: [],
          total: 0,
          page: 1,
          pageSize: 50,
          totalPages: 0,
          stats: {
            porTribunal: {},
            porTipo: {} as Record<ScrapeType, number>,
            ultimaAtualizacao: null,
          },
        },
      };
    }

    const validatedFilters = validation.data;
    console.log('[listProcessosAction] Iniciando listagem com filtros:', validatedFilters);

    // Construir filtros base comuns a todas as tabelas
    const whereBase: any = {};
    const scrapeExecutionFilters: any = {};

    // Filtro por data de criação da execução
    if (validatedFilters.startDate || validatedFilters.endDate) {
      scrapeExecutionFilters.createdAt = {};
      if (validatedFilters.startDate) {
        scrapeExecutionFilters.createdAt.gte = validatedFilters.startDate;
      }
      if (validatedFilters.endDate) {
        scrapeExecutionFilters.createdAt.lte = validatedFilters.endDate;
      }
    }

    // Filtro por tribunal
    if (validatedFilters.tribunalConfigIds && validatedFilters.tribunalConfigIds.length > 0) {
      scrapeExecutionFilters.tribunalConfigId = {
        in: validatedFilters.tribunalConfigIds,
      };
    }

    // Filtro por tipo de raspagem - aninhar scrapeJob dentro de is
    if (validatedFilters.scrapeTypes && validatedFilters.scrapeTypes.length > 0) {
      scrapeExecutionFilters.scrapeJob = {
        is: {
          scrapeType: {
            in: validatedFilters.scrapeTypes,
          },
        },
      };
    }

    // Filtro por família de tribunal
    if (validatedFilters.tribunalFamily) {
      console.log(`[listProcessosAction] Aplicando filtro por família: ${validatedFilters.tribunalFamily}`);
      
      let configIds: string[] = [];
      
      // Buscar todos os tribunalConfigs da família
      if (validatedFilters.tribunalFamily === 'SUPERIOR') {
        // Para SUPERIOR, usar lista específica de códigos
        const superiorCodes = ['TST', 'STJ', 'STF'];
        const tribunaisQuery = await prisma.tribunal.findMany({
          where: {
            codigo: { in: superiorCodes }
          },
          select: { id: true }
        });
        
        const tribunalIds = tribunaisQuery.map(t => t.id);
        
        // Buscar configs desses tribunais
        const configs = await prisma.tribunalConfig.findMany({
          where: { tribunalId: { in: tribunalIds } },
          select: { id: true }
        });
        
        configIds = configs.map(c => c.id);
      } else {
        // Para TRT, TJ, TRF, usar startsWith
        const prefix = validatedFilters.tribunalFamily;
        const tribunaisQuery = await prisma.tribunal.findMany({
          where: {
            codigo: {
              startsWith: prefix
            }
          },
          select: { id: true }
        });
        
        const tribunalIds = tribunaisQuery.map(t => t.id);
        
        // Buscar configs desses tribunais
        const configs = await prisma.tribunalConfig.findMany({
          where: { tribunalId: { in: tribunalIds } },
          select: { id: true }
        });
        
        configIds = configs.map(c => c.id);
      }
      
      // Aplicar filtro
      if (scrapeExecutionFilters.tribunalConfigId) {
        // Intersecção com filtro existente
        const existing = Array.isArray(scrapeExecutionFilters.tribunalConfigId.in) 
          ? scrapeExecutionFilters.tribunalConfigId.in 
          : [scrapeExecutionFilters.tribunalConfigId.in];
        const finalIds = existing.filter(id => configIds.includes(id));
        
        // Comentário 6: Se array final estiver vazio, retornar imediatamente
        if (finalIds.length === 0) {
          console.log('[listProcessosAction] Nenhum tribunal encontrado após interseção, retornando lista vazia');
          return {
            success: true,
            data: {
              processos: [],
              total: 0,
              page: validatedFilters.page,
              pageSize: validatedFilters.pageSize,
              totalPages: 0,
              stats: {
                porTribunal: {},
                porTipo: {} as Record<ScrapeType, number>,
                ultimaAtualizacao: null,
              },
            },
          };
        }
        
        scrapeExecutionFilters.tribunalConfigId = {
          in: finalIds
        };
      } else {
        // Comentário 6: Se configIds estiver vazio, retornar imediatamente
        if (configIds.length === 0) {
          console.log('[listProcessosAction] Nenhum tribunal encontrado para a família, retornando lista vazia');
          return {
            success: true,
            data: {
              processos: [],
              total: 0,
              page: validatedFilters.page,
              pageSize: validatedFilters.pageSize,
              totalPages: 0,
              stats: {
                porTribunal: {},
                porTipo: {} as Record<ScrapeType, number>,
                ultimaAtualizacao: null,
              },
            },
          };
        }
        
        scrapeExecutionFilters.tribunalConfigId = { in: configIds };
      }
    }

    // Só adicionar scrapeExecution ao whereBase se houver filtros
    if (Object.keys(scrapeExecutionFilters).length > 0) {
      whereBase.scrapeExecution = { is: scrapeExecutionFilters };
    }

    // Selecionar apenas campos necessários para reduzir payload
    const selectRelations = {
      scrapeExecution: {
        select: {
          id: true,
          createdAt: true,
          scrapeJobId: true,
          tribunalConfig: {
            select: {
              id: true,
              grau: true,
              sistema: true,
              tribunal: {
                select: {
                  codigo: true,
                  nome: true,
                },
              },
            },
          },
          scrapeJob: {
            select: {
              scrapeType: true,
              scrapeSubType: true,
            },
          },
        },
      },
    };

    // Query agregada por tabela - executar em paralelo
    console.log('[listProcessosAction] Executando queries em paralelo...');
    const queryStartTime = Date.now();

    const [
      pendentesManifestacao,
      processos,
      processosArquivados,
      minhaPauta,
      processosTJMG,
    ] = await Promise.all([
      // PendentesManifestacao
      prisma.pendentesManifestacao.findMany({
        where: {
          ...whereBase,
          ...(validatedFilters.searchTerm
            ? {
                OR: [
                  { numeroProcesso: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { nomeParteAutora: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { nomeParteRe: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { descricaoOrgaoJulgador: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { siglaOrgaoJulgador: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          idPje: true,
          numeroProcesso: true,
          dataAutuacao: true,
          nomeParteAutora: true,
          nomeParteRe: true,
          classeJudicial: true,
          descricaoOrgaoJulgador: true,
          siglaOrgaoJulgador: true,
          dataCienciaParte: true,
          dataPrazoLegalParte: true,
          prazoVencido: true,
          idDocumento: true,
          updatedAt: true,
          createdAt: true,
          ...selectRelations,
        },
        take: 10000, // Limitar resultados aos 10000 mais recentes por tabela (ordenado por updatedAt desc)
        orderBy: { updatedAt: 'desc' },
      }),

      // Processos
      prisma.processos.findMany({
        where: {
          ...whereBase,
          ...(validatedFilters.searchTerm
            ? {
                OR: [
                  { numeroProcesso: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { nomeParteAutora: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { nomeParteRe: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { descricaoOrgaoJulgador: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { siglaOrgaoJulgador: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          idPje: true,
          numeroProcesso: true,
          dataAutuacao: true,
          nomeParteAutora: true,
          nomeParteRe: true,
          classeJudicial: true,
          descricaoOrgaoJulgador: true,
          siglaOrgaoJulgador: true,
          metadados: true,
          updatedAt: true,
          createdAt: true,
          ...selectRelations,
        },
        take: 10000,
        orderBy: { updatedAt: 'desc' },
      }),

      // ProcessosArquivados
      prisma.processosArquivados.findMany({
        where: {
          ...whereBase,
          ...(validatedFilters.searchTerm
            ? {
                OR: [
                  { numeroProcesso: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { nomeParteAutora: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { nomeParteRe: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { descricaoOrgaoJulgador: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { siglaOrgaoJulgador: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          idPje: true,
          numeroProcesso: true,
          dataAutuacao: true,
          nomeParteAutora: true,
          nomeParteRe: true,
          classeJudicial: true,
          descricaoOrgaoJulgador: true,
          siglaOrgaoJulgador: true,
          metadados: true,
          updatedAt: true,
          createdAt: true,
          ...selectRelations,
        },
        take: 10000,
        orderBy: { updatedAt: 'desc' },
      }),

      // MinhaPauta
      prisma.minhaPauta.findMany({
        where: {
          ...whereBase,
          ...(validatedFilters.searchTerm
            ? {
                OR: [
                  { nrProcesso: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { tipoDescricao: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { urlAudienciaVirtual: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          idPje: true,
          nrProcesso: true,
          dataInicio: true,
          dataFim: true,
          urlAudienciaVirtual: true,
          tipoDescricao: true,
          tipoCodigo: true,
          processoMetadados: true,
          poloAtivo: true,
          poloPassivo: true,
          metadados: true,
          updatedAt: true,
          createdAt: true,
          ...selectRelations,
        },
        take: 10000,
        orderBy: { updatedAt: 'desc' },
      }),

      // ProcessosTJMG
      prisma.processosTJMG.findMany({
        where: {
          ...whereBase,
          ...(validatedFilters.searchTerm
            ? {
                OR: [
                  { numero: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { partes: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                  { vara: { contains: validatedFilters.searchTerm, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          numero: true,
          regiao: true,
          tipo: true,
          partes: true,
          vara: true,
          dataDistribuicao: true,
          ultimoMovimento: true,
          updatedAt: true,
          createdAt: true,
          ...selectRelations,
        },
        take: 10000,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const queryTime = Date.now() - queryStartTime;
    console.log(`[listProcessosAction] Queries concluídas em ${queryTime}ms`);
    console.log(`[listProcessosAction] Resultados: Pendentes=${pendentesManifestacao.length}, Processos=${processos.length}, Arquivados=${processosArquivados.length}, MinhaPauta=${minhaPauta.length}, TJMG=${processosTJMG.length}`);

    // Normalização e deduplicação
    console.log('[listProcessosAction] Normalizando e deduplicando processos...');
    const normalizeStartTime = Date.now();
    
    const processosUnificadosMap = new Map<string, ProcessoUnificado>();

    // Normalizar cada resultado
    for (const p of pendentesManifestacao) {
      const normalizado = normalizeProcessoToUnificado(p, p.scrapeExecution as any, 'PendentesManifestacao');
      const chave = `${normalizado.tribunalConfigId}-${normalizado.idPje}`;
      
      // Se mesmo processo aparecer em múltiplas execuções, manter o mais recente
      const existente = processosUnificadosMap.get(chave);
      if (!existente || normalizado.dataUltimaAtualizacao > existente.dataUltimaAtualizacao) {
        processosUnificadosMap.set(chave, normalizado);
      }
    }

    for (const p of processos) {
      const normalizado = normalizeProcessoToUnificado(p, p.scrapeExecution as any, 'Processos');
      const chave = `${normalizado.tribunalConfigId}-${normalizado.idPje}`;
      
      const existente = processosUnificadosMap.get(chave);
      if (!existente || normalizado.dataUltimaAtualizacao > existente.dataUltimaAtualizacao) {
        processosUnificadosMap.set(chave, normalizado);
      }
    }

    for (const p of processosArquivados) {
      const normalizado = normalizeProcessoToUnificado(p, p.scrapeExecution as any, 'ProcessosArquivados');
      const chave = `${normalizado.tribunalConfigId}-${normalizado.idPje}`;
      
      const existente = processosUnificadosMap.get(chave);
      if (!existente || normalizado.dataUltimaAtualizacao > existente.dataUltimaAtualizacao) {
        processosUnificadosMap.set(chave, normalizado);
      }
    }

    for (const p of minhaPauta) {
      const normalizado = normalizeProcessoToUnificado(p, p.scrapeExecution as any, 'MinhaPauta');
      const chave = `${normalizado.tribunalConfigId}-${normalizado.idPje}`;
      
      const existente = processosUnificadosMap.get(chave);
      if (!existente || normalizado.dataUltimaAtualizacao > existente.dataUltimaAtualizacao) {
        processosUnificadosMap.set(chave, normalizado);
      }
    }

    for (const p of processosTJMG) {
      const normalizado = normalizeProcessoToUnificado(p, p.scrapeExecution as any, 'ProcessosTJMG');
      // Para TJMG, usar número do processo como chave já que idPje pode ser 0
      const chave = `${normalizado.tribunalConfigId}-${normalizado.numeroProcesso}`;
      
      const existente = processosUnificadosMap.get(chave);
      if (!existente || normalizado.dataUltimaAtualizacao > existente.dataUltimaAtualizacao) {
        processosUnificadosMap.set(chave, normalizado);
      }
    }

    const normalizeTime = Date.now() - normalizeStartTime;
    console.log(`[listProcessosAction] Normalização concluída em ${normalizeTime}ms, processos únicos: ${processosUnificadosMap.size}`);

    // Converter Map para Array
    let processosUnificados = Array.from(processosUnificadosMap.values());

    // Ordenação
    const sortBy = validatedFilters.sortBy || 'dataUltimaAtualizacao';
    const sortDirection = validatedFilters.sortDirection || 'desc';

    console.log(`[listProcessosAction] Ordenando por ${sortBy} ${sortDirection}...`);
    processosUnificados.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'dataAutuacao') {
        const dateA = a.dataAutuacao?.getTime() || 0;
        const dateB = b.dataAutuacao?.getTime() || 0;
        comparison = dateA - dateB;
      } else if (sortBy === 'dataUltimaAtualizacao') {
        comparison = a.dataUltimaAtualizacao.getTime() - b.dataUltimaAtualizacao.getTime();
      } else if (sortBy === 'numeroProcesso') {
        // Normalizar antes de comparar para ordenação consistente
        comparison = normalizeCNJ(a.numeroProcesso).localeCompare(normalizeCNJ(b.numeroProcesso));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Estatísticas (calcular antes da paginação)
    const stats = {
      porTribunal: {} as Record<string, number>,
      porTipo: {} as Record<ScrapeType, number>,
      ultimaAtualizacao: null as Date | null,
    };

    for (const processo of processosUnificados) {
      // Por tribunal
      stats.porTribunal[processo.tribunalCodigo] = (stats.porTribunal[processo.tribunalCodigo] || 0) + 1;
      
      // Por tipo
      stats.porTipo[processo.tipoRaspagem] = (stats.porTipo[processo.tipoRaspagem] || 0) + 1;
      
      // Última atualização
      if (!stats.ultimaAtualizacao || processo.dataUltimaAtualizacao > stats.ultimaAtualizacao) {
        stats.ultimaAtualizacao = processo.dataUltimaAtualizacao;
      }
    }

    // Paginação
    const page = validatedFilters.page;
    const pageSize = validatedFilters.pageSize;
    const total = processosUnificados.length;
    const skip = (page - 1) * pageSize;
    
    console.log(`[listProcessosAction] Aplicando paginação: página ${page}, tamanho ${pageSize}, skip ${skip}`);
    processosUnificados = processosUnificados.slice(skip, skip + pageSize);

    const totalTime = Date.now() - startTime;
    console.log(`[listProcessosAction] Concluído em ${totalTime}ms (queries: ${queryTime}ms, normalização: ${normalizeTime}ms)`);

    const result: PaginatedProcessos = {
      processos: processosUnificados,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[listProcessosAction] Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar processos',
      data: {
        processos: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
        stats: {
          porTribunal: {},
          porTipo: {} as Record<ScrapeType, number>,
          ultimaAtualizacao: null,
        },
      },
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

// ============================================================================
// SCHEDULED SCRAPES MANAGEMENT SERVER ACTIONS
// ============================================================================

// Schema de validação para criação de raspagem programada
const createScheduledScrapeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(100),
  description: z.string().max(500).optional(),
  credencialId: z.string().uuid('ID de credencial inválido'),
  tribunalConfigIds: z.array(z.string()).min(1, 'Selecione ao menos um tribunal'),
  scrapeType: z.enum(['acervo_geral', 'pendentes', 'arquivados', 'minha_pauta']),
  scrapeSubType: z.enum(['com_dado_ciencia', 'sem_prazo']).optional(),
  cronExpression: z.string().min(9, 'Expressão cron inválida'),
  timezone: z.string().default('America/Sao_Paulo'),
  active: z.boolean().default(true),
});

const updateScheduledScrapeSchema = createScheduledScrapeSchema.partial();

/**
 * Cria um agendamento de raspagem
 */
export async function createScheduledScrapeAction(
  input: CreateScheduledScrapeInput
): Promise<{ success: boolean; data?: { scheduleId: string }; error?: string }> {
  try {
    console.log('[createScheduledScrapeAction] Criando agendamento:', input.name);

    // Validar input
    const validation = createScheduledScrapeSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Dados inválidos',
      };
    }

    // Normalizar timezone: se ausente ou não suportado, usar default
    let tz = input.timezone || SCHEDULED_SCRAPES_CONFIG.defaultTimezone;
    if (!isSupportedTimezone(tz)) {
      console.warn(`[createScheduledScrapeAction] Timezone não suportado: ${tz}, usando padrão ${SCHEDULED_SCRAPES_CONFIG.defaultTimezone}`);
      tz = SCHEDULED_SCRAPES_CONFIG.defaultTimezone;
    }

    // Validar cron expression
    const cronValidation = validateCronExpression(input.cronExpression);
    if (!cronValidation.valid) {
      return {
        success: false,
        error: cronValidation.error,
      };
    }

    const prisma = await getPrisma();

    // Validar maxSchedulesPerCredential
    if (SCHEDULED_SCRAPES_CONFIG.maxSchedulesPerCredential > 0) {
      const existingSchedulesCount = await prisma.scheduledScrape.count({
        where: { credencialId: input.credencialId },
      });

      if (existingSchedulesCount >= SCHEDULED_SCRAPES_CONFIG.maxSchedulesPerCredential) {
        return {
          success: false,
          error: `Limite de agendamentos por credencial atingido (máximo: ${SCHEDULED_SCRAPES_CONFIG.maxSchedulesPerCredential})`,
        };
      }
    }

    // Validar minIntervalMinutes usando cron-parser
    if (SCHEDULED_SCRAPES_CONFIG.minIntervalMinutes > 0) {
      try {
        const parser = require('cron-parser');
        const interval = parser.parseExpression(input.cronExpression, {
          currentDate: new Date(),
          tz,
        });

        // Obter próximas duas execuções
        const firstRun = interval.next().toDate();
        const secondRun = interval.next().toDate();

        // Calcular diferença em minutos
        const diffMinutes = (secondRun.getTime() - firstRun.getTime()) / (1000 * 60);

        if (diffMinutes < SCHEDULED_SCRAPES_CONFIG.minIntervalMinutes) {
          return {
            success: false,
            error: `O intervalo entre execuções (${Math.round(diffMinutes)} minutos) é menor que o mínimo permitido (${SCHEDULED_SCRAPES_CONFIG.minIntervalMinutes} minutos)`,
          };
        }
      } catch (error) {
        console.error('[createScheduledScrapeAction] Erro ao validar intervalo:', error);
        return {
          success: false,
          error: 'Erro ao validar intervalo da expressão cron',
        };
      }
    }

    // Validar que credencial existe e está ativa
    const credencial = await prisma.credencial.findUnique({
      where: { id: input.credencialId },
      include: {
        tribunais: true,
      },
    });

    if (!credencial) {
      return {
        success: false,
        error: 'Credencial não encontrada',
      };
    }

    if (!credencial.ativa) {
      return {
        success: false,
        error: 'Credencial está inativa',
      };
    }

    // Validar que tribunais estão associados à credencial
    // Usa mesma lógica de createScrapeJobAction: parse tribunalConfigIds formato "TRT3-PJE-1g"
    const tribunalQueries = input.tribunalConfigIds.map(id => {
      const parts = id.split('-');
      if (parts.length !== 3) {
        throw new Error(`ID de tribunal inválido: ${id}. Esperado formato: TRT3-PJE-1g`);
      }
      const [codigo, sistema, grau] = parts;
      return { codigo, sistema, grau, originalId: id };
    });

    // Buscar TribunalConfig correspondentes
    const credentialTribunalConfigIds = credencial.tribunais.map(ct => ct.tribunalConfigId);

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

    const matchedTribunals = await prisma.tribunalConfig.findMany({
      where: whereClause,
      include: {
        tribunal: true,
      },
    });

    // Validar que todos os tribunais foram encontrados e estão associados à credencial
    if (matchedTribunals.length !== input.tribunalConfigIds.length) {
      const foundIds = matchedTribunals.map(
        t => `${t.tribunal.codigo}-${t.sistema}-${t.grau}`
      );
      const missing = input.tribunalConfigIds.filter(id => !foundIds.includes(id));

      return {
        success: false,
        error: `Os seguintes tribunais não estão associados à credencial selecionada: ${missing.join(', ')}`,
      };
    }

    // Calcular próxima execução usando timezone normalizado
    const nextRunAt = getNextRunTime(input.cronExpression, tz);

    // Criar agendamento
    const schedule = await prisma.scheduledScrape.create({
      data: {
        name: input.name,
        description: input.description,
        credencialId: input.credencialId,
        scrapeType: input.scrapeType,
        scrapeSubType: input.scrapeSubType,
        tribunalConfigIds: input.tribunalConfigIds,
        cronExpression: input.cronExpression,
        timezone: tz,
        active: input.active ?? true,
        nextRunAt,
      },
    });

    // Registrar cron job se ativo
    if (schedule.active) {
      try {
        addSchedule(schedule);
      } catch (error) {
        console.error('[createScheduledScrapeAction] Erro ao registrar cron job:', error);
        // Não falhar a criação se o scheduler falhar
      }
    }

    console.log('[createScheduledScrapeAction] Agendamento criado:', schedule.id);

    return {
      success: true,
      data: { scheduleId: schedule.id },
    };
  } catch (error) {
    console.error('[createScheduledScrapeAction] Erro:', error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
}

/**
 * Lista agendamentos de raspagem com paginação
 */
export async function listScheduledScrapesAction(
  filters?: { active?: boolean; page?: number; pageSize?: number }
): Promise<{ success: boolean; data?: PaginatedScheduledScrapes; error?: string }> {
  try {
    const prisma = await getPrisma();

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where = filters?.active !== undefined ? { active: filters.active } : {};

    const [schedules, total] = await Promise.all([
      prisma.scheduledScrape.findMany({
        where,
        include: {
          credencial: {
            include: {
              advogado: {
                select: {
                  nome: true,
                  oabNumero: true,
                  oabUf: true,
                },
              },
            },
          },
        },
        orderBy: { nextRunAt: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.scheduledScrape.count({ where }),
    ]);

    return {
      success: true,
      data: {
        schedules: schedules as ScheduledScrapeWithRelations[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error('[listScheduledScrapesAction] Erro:', error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
}

/**
 * Busca um agendamento por ID
 */
export async function getScheduledScrapeAction(
  scheduleId: string
): Promise<{ success: boolean; data?: ScheduledScrapeWithRelations; error?: string }> {
  try {
    const prisma = await getPrisma();

    const schedule = await prisma.scheduledScrape.findUnique({
      where: { id: scheduleId },
      include: {
        credencial: {
          include: {
            advogado: {
              select: {
                nome: true,
                oabNumero: true,
                oabUf: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      return {
        success: false,
        error: 'Agendamento não encontrado',
      };
    }

    return {
      success: true,
      data: schedule as ScheduledScrapeWithRelations,
    };
  } catch (error) {
    console.error('[getScheduledScrapeAction] Erro:', error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
}

/**
 * Atualiza um agendamento
 */
export async function updateScheduledScrapeAction(
  scheduleId: string,
  input: UpdateScheduledScrapeInput
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[updateScheduledScrapeAction] Atualizando agendamento:', scheduleId);

    // Validar input
    const validation = updateScheduledScrapeSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Dados inválidos',
      };
    }

    const prisma = await getPrisma();

    // Buscar agendamento existente
    const existingSchedule = await prisma.scheduledScrape.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      return {
        success: false,
        error: 'Agendamento não encontrado',
      };
    }

    // Normalizar timezone se fornecido
    let tz: string | undefined;
    if (input.timezone !== undefined) {
      tz = input.timezone || SCHEDULED_SCRAPES_CONFIG.defaultTimezone;
      if (!isSupportedTimezone(tz)) {
        console.warn(`[updateScheduledScrapeAction] Timezone não suportado: ${tz}, usando padrão ${SCHEDULED_SCRAPES_CONFIG.defaultTimezone}`);
        tz = SCHEDULED_SCRAPES_CONFIG.defaultTimezone;
      }
    }

    // Determinar timezone efetivo para validações
    const effectiveTimezone = tz || existingSchedule.timezone;

    // Se cronExpression mudou, validar
    if (input.cronExpression) {
      const cronValidation = validateCronExpression(input.cronExpression);
      if (!cronValidation.valid) {
        return {
          success: false,
          error: cronValidation.error,
        };
      }

      // Validar minIntervalMinutes usando cron-parser
      if (SCHEDULED_SCRAPES_CONFIG.minIntervalMinutes > 0) {
        try {
          const parser = require('cron-parser');
          const interval = parser.parseExpression(input.cronExpression, {
            currentDate: new Date(),
            tz: effectiveTimezone,
          });

          // Obter próximas duas execuções
          const firstRun = interval.next().toDate();
          const secondRun = interval.next().toDate();

          // Calcular diferença em minutos
          const diffMinutes = (secondRun.getTime() - firstRun.getTime()) / (1000 * 60);

          if (diffMinutes < SCHEDULED_SCRAPES_CONFIG.minIntervalMinutes) {
            return {
              success: false,
              error: `O intervalo entre execuções (${Math.round(diffMinutes)} minutos) é menor que o mínimo permitido (${SCHEDULED_SCRAPES_CONFIG.minIntervalMinutes} minutos)`,
            };
          }
        } catch (error) {
          console.error('[updateScheduledScrapeAction] Erro ao validar intervalo:', error);
          return {
            success: false,
            error: 'Erro ao validar intervalo da expressão cron',
          };
        }
      }
    }

    // Se credencial mudou, validar
    if (input.credencialId && input.credencialId !== existingSchedule.credencialId) {
      const credencial = await prisma.credencial.findUnique({
        where: { id: input.credencialId },
        include: { tribunais: true },
      });

      if (!credencial) {
        return {
          success: false,
          error: 'Credencial não encontrada',
        };
      }

      if (!credencial.ativa) {
        return {
          success: false,
          error: 'Credencial está inativa',
        };
      }
    }

    // Calcular novo nextRunAt se cron ou timezone mudou
    let nextRunAt: Date | undefined;
    if (input.cronExpression || tz !== undefined) {
      const cronToUse = input.cronExpression || existingSchedule.cronExpression;
      nextRunAt = getNextRunTime(cronToUse, effectiveTimezone);
    }

    // Preparar dados de atualização
    const updateData: any = {
      ...input,
    };

    // Sobrescrever timezone com valor normalizado se foi fornecido
    if (tz !== undefined) {
      updateData.timezone = tz;
    }

    // Adicionar nextRunAt se foi calculado
    if (nextRunAt) {
      updateData.nextRunAt = nextRunAt;
    }

    // Atualizar no banco
    const updatedSchedule = await prisma.scheduledScrape.update({
      where: { id: scheduleId },
      data: updateData,
    });

    // Atualizar cron job se ativo
    if (updatedSchedule.active) {
      try {
        updateSchedule(scheduleId, updatedSchedule);
      } catch (error) {
        console.error('[updateScheduledScrapeAction] Erro ao atualizar cron job:', error);
      }
    }

    console.log('[updateScheduledScrapeAction] Agendamento atualizado:', scheduleId);

    return { success: true };
  } catch (error) {
    console.error('[updateScheduledScrapeAction] Erro:', error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
}

/**
 * Deleta um agendamento
 */
export async function deleteScheduledScrapeAction(
  scheduleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[deleteScheduledScrapeAction] Deletando agendamento:', scheduleId);

    const prisma = await getPrisma();

    // Verificar se existe
    const schedule = await prisma.scheduledScrape.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return {
        success: false,
        error: 'Agendamento não encontrado',
      };
    }

    // Parar cron job
    try {
      removeSchedule(scheduleId);
    } catch (error) {
      console.error('[deleteScheduledScrapeAction] Erro ao remover cron job:', error);
    }

    // Deletar do banco
    await prisma.scheduledScrape.delete({
      where: { id: scheduleId },
    });

    console.log('[deleteScheduledScrapeAction] Agendamento deletado:', scheduleId);

    return { success: true };
  } catch (error) {
    console.error('[deleteScheduledScrapeAction] Erro:', error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
}

/**
 * Ativa ou pausa um agendamento
 */
export async function toggleScheduledScrapeAction(
  scheduleId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[toggleScheduledScrapeAction] Alterando status:', scheduleId, active);

    const prisma = await getPrisma();

    // Atualizar no banco
    await prisma.scheduledScrape.update({
      where: { id: scheduleId },
      data: { active },
    });

    // Atualizar cron job
    try {
      if (active) {
        await resumeSchedule(scheduleId);
      } else {
        await pauseSchedule(scheduleId);
      }
    } catch (error) {
      console.error('[toggleScheduledScrapeAction] Erro ao alterar cron job:', error);
    }

    console.log('[toggleScheduledScrapeAction] Status alterado:', scheduleId, active);

    return { success: true };
  } catch (error) {
    console.error('[toggleScheduledScrapeAction] Erro:', error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
}

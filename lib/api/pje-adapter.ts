/**
 * Adaptador para Scripts PJE
 * Converte os scripts Node.js em funções TypeScript que retornam Promises
 */

import type {
  LoginResult,
  ScrapeResult,
  ProcessoPJE,
  TRTCode,
  Grau,
} from '@/lib/types';
import { getTribunalConfig } from '@/lib/services/tribunal';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Lazy load puppeteer to avoid initialization issues with Next.js
let puppeteerInstance: any = null;

async function getPuppeteer() {
  if (!puppeteerInstance) {
    const puppeteer = (await import('puppeteer-extra')).default;
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
    puppeteer.use(StealthPlugin());
    puppeteerInstance = puppeteer;
  }
  return puppeteerInstance;
}

/**
 * Executa login no PJE e retorna resultado
 * @param cpf CPF do usuário
 * @param senha Senha do usuário
 * @param trt Código do TRT (default: TRT3)
 * @param grau Grau da instância (default: 1g)
 */
export async function executarLoginPJE(
  cpf: string,
  senha: string,
  trt: TRTCode = 'TRT3',
  grau: Grau = '1g'
): Promise<LoginResult> {
  let browser;

  try {
    console.log(`[PJE Adapter] Iniciando login em ${trt} ${grau}...`);

    // Validação de entrada
    if (!cpf || !senha) {
      return {
        success: false,
        message: 'CPF e senha são obrigatórios',
        error: {
          type: 'MISSING_CREDENTIALS',
          category: 'CONFIGURATION',
          message: 'CPF e senha são obrigatórios',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Obtém configuração do TRT
    const config = await getTribunalConfig(trt, grau);
    console.log(`[PJE Adapter] URL de login: ${config.urlLoginSeam}`);

    // Lança navegador
    const puppeteer = await getPuppeteer();
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    // Configuração anti-detecção
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      (window as any).chrome = { runtime: {} };
    });

    // Navega para página de login
    await page.goto(config.urlLoginSeam, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await delay(1500);

    // Clica em "Entrar com PDPJ"
    await page.waitForSelector('#btnSsoPdpj', { visible: true, timeout: 10000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('#btnSsoPdpj'),
    ]);

    // Preenche CPF
    await delay(2000);
    await page.waitForSelector('#username', { visible: true, timeout: 10000 });
    await page.type('#username', cpf, { delay: 50 });
    await delay(1000);

    // Preenche senha
    await page.waitForSelector('#password', { visible: true, timeout: 10000 });
    await page.type('#password', senha, { delay: 50 });
    await delay(1500);

    // Clica em Entrar
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    await delay(5000);

    // Verifica resultado
    const finalUrl = page.url();
    const title = await page.title();

    console.log('[PJE Adapter] URL final:', finalUrl);
    console.log('[PJE Adapter] Título:', title);

    if (finalUrl.includes('403') || title.includes('403')) {
      return {
        success: false,
        message: 'CloudFront bloqueou o acesso (403)',
        error: {
          type: 'BLOCKED_BY_CLOUDFRONT',
          category: 'PERMISSION',
          message: 'CloudFront bloqueou o acesso (403)',
          retryable: true,
          timestamp: new Date().toISOString(),
          details: { url: finalUrl, title },
        },
      };
    }

    // Verifica se está na página do PJE (não mais no SSO)
    const trtDomain = config.urlBase.replace('https://', '');
    if (finalUrl.includes(trtDomain) && !finalUrl.includes('sso.cloud')) {
      // Tenta obter perfil do usuário
      try {
        const perfil = await page.evaluate(async () => {
          const response = await fetch('/pje-seguranca/api/token/perfis');
          if (response.ok) {
            const data = await response.json();
            return data[0]; // Primeiro perfil
          }
          return null;
        });

        return {
          success: true,
          message: 'Login realizado com sucesso',
          perfil: perfil
            ? {
                id: perfil.id?.toString() || '',
                nome: perfil.nome || '',
                oab: perfil.oab || '',
                tribunal: trt,
                trt: trt,
                grau: grau,
              }
            : undefined,
        };
      } catch (e) {
        // Mesmo sem conseguir obter perfil, login foi bem-sucedido
        return {
          success: true,
          message: 'Login realizado (perfil não obtido)',
        };
      }
    }

    if (finalUrl.includes('sso.cloud.pje.jus.br')) {
      return {
        success: false,
        message: 'Credenciais incorretas',
        error: {
          type: 'INVALID_CREDENTIALS',
          category: 'CREDENTIALS',
          message: 'Credenciais incorretas',
          retryable: false,
          timestamp: new Date().toISOString(),
          details: { url: finalUrl },
        },
      };
    }

    return {
      success: false,
      message: 'Resultado inesperado',
      error: {
        type: 'UNEXPECTED_RESULT',
        category: 'UNKNOWN',
        message: 'Resultado inesperado',
        retryable: true,
        timestamp: new Date().toISOString(),
        details: { url: finalUrl, title },
      },
    };

  } catch (error) {
    console.error('[PJE Adapter] Erro:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      error: {
        type: 'UNKNOWN_ERROR',
        category: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        retryable: false,
        timestamp: new Date().toISOString(),
      },
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Raspa processos do PJE
 * @param cpf CPF do usuário
 * @param senha Senha do usuário
 * @param idAdvogado ID do advogado no sistema PJE
 * @param trt Código do TRT (default: TRT3)
 * @param grau Grau da instância (default: 1g)
 * @param idAgrupamento ID do agrupamento (default: 1 - Acervo Geral)
 */
export async function rasparProcessosPJE(
  cpf: string,
  senha: string,
  idAdvogado: number,
  trt: TRTCode = 'TRT3',
  grau: Grau = '1g',
  idAgrupamento: number = 1
): Promise<ScrapeResult> {
  let browser;

  try {
    console.log(
      `[PJE Adapter] Iniciando raspagem de processos em ${trt} ${grau}...`
    );

    // Obtém configuração do TRT
    const config = await getTribunalConfig(trt, grau);

    // Lança navegador
    const puppeteer = await getPuppeteer();
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();

    // Configuração anti-detecção
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      (window as any).chrome = { runtime: {} };
    });

    // Login
    await page.goto(config.urlLoginSeam, { waitUntil: 'networkidle2' });
    await delay(1500);

    await page.waitForSelector('#btnSsoPdpj', { visible: true });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#btnSsoPdpj'),
    ]);

    await delay(2000);
    await page.waitForSelector('#username', { visible: true });
    await page.type('#username', cpf);
    await delay(1000);

    await page.waitForSelector('#password', { visible: true });
    await page.type('#password', senha);
    await delay(1500);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    await delay(5000);

    console.log('[PJE Adapter] Login realizado, iniciando raspagem...');

    // Raspa processos
    const processos = await rasparAgrupamento(page, idAdvogado, idAgrupamento);

    return {
      success: true,
      processos: processos as ProcessoPJE[],
      total: processos.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[PJE Adapter] Erro na raspagem:', error);
    return {
      success: false,
      processos: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: {
        type: 'UNKNOWN_ERROR',
        category: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        retryable: false,
        timestamp: new Date().toISOString(),
      },
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Raspa todos os processos de um agrupamento
 */
async function rasparAgrupamento(page: any, idAdvogado: number, idAgrupamento: number) {
  const todosProcessos: any[] = [];
  let paginaAtual = 1;
  const tamanhoPagina = 100;
  let totalPaginas: number | null = null;

  while (true) {
    console.log(`[PJE Adapter] Raspando página ${paginaAtual}/${totalPaginas || '?'}...`);

    const resultado = await page.evaluate(
      async (id: number, agrupamento: number, pagina: number, tamanho: number) => {
        try {
          const url = `/pje-comum-api/api/paineladvogado/${id}/processos?idAgrupamentoProcessoTarefa=${agrupamento}&pagina=${pagina}&tamanhoPagina=${tamanho}`;
          const response = await fetch(url);

          if (!response.ok) {
            return { error: `HTTP ${response.status}` };
          }

          return await response.json();
        } catch (e: any) {
          return { error: e.message };
        }
      },
      idAdvogado,
      idAgrupamento,
      paginaAtual,
      tamanhoPagina
    );

    if (resultado.error) {
      console.error(`[PJE Adapter] Erro na página ${paginaAtual}:`, resultado.error);
      break;
    }

    // Primeira página - descobre total
    if (totalPaginas === null) {
      totalPaginas = resultado.qtdPaginas || 1;
      console.log(`[PJE Adapter] Total de páginas: ${totalPaginas}`);
      console.log(`[PJE Adapter] Total de processos: ${resultado.totalRegistros || '?'}`);
    }

    // Adiciona processos
    if (resultado.resultado && Array.isArray(resultado.resultado)) {
      todosProcessos.push(...resultado.resultado);
    }

    // Última página?
    if (totalPaginas !== null && paginaAtual >= totalPaginas) {
      break;
    }

    paginaAtual++;
    await delay(500);
  }

  return todosProcessos;
}

// ============================================================================
// CREDENTIAL MANAGEMENT UTILITIES
// ============================================================================

import { prisma } from '@/lib/db';
import type { CredencialParaLogin } from '@/lib/types';

/**
 * Busca credencial ativa para um TribunalConfig específico
 * Retorna a credencial mais recentemente validada se houver múltiplas
 *
 * @param tribunalConfigId ID do TribunalConfig
 * @returns Credencial com CPF, senha e idAdvogado ou erro
 */
export async function getCredencialParaTribunalConfig(
  tribunalConfigId: string
): Promise<CredencialParaLogin> {
  try {
    console.log(`[Credential] Buscando credencial para tribunalConfigId: ${tribunalConfigId}`);

    // Busca credenciais ativas associadas a este tribunal config
    const credenciaisTribunal = await prisma.credencialTribunal.findMany({
      where: {
        tribunalConfigId,
        credencial: {
          ativa: true,
        },
      },
      include: {
        credencial: {
          include: {
            advogado: true,
          },
        },
      },
      orderBy: {
        validadoEm: 'desc', // Mais recentemente validado primeiro
      },
    });

    if (credenciaisTribunal.length === 0) {
      const error = new Error(
        `Nenhuma credencial ativa encontrada para este tribunal.\n\n` +
        `Configure credenciais em: /pje/credentials`
      );
      console.error('[Credential] Erro:', error.message);
      throw error;
    }

    // Pega a primeira (mais recentemente validada)
    const credencialTribunal = credenciaisTribunal[0];
    const { credencial } = credencialTribunal;
    const { advogado } = credencial;

    console.log(`[Credential] Credencial encontrada para advogado: ${advogado.nome} (${advogado.oabNumero}/${advogado.oabUf})`);

    return {
      cpf: advogado.cpf,
      senha: credencial.senha,
      idAdvogado: advogado.idAdvogado,
      advogadoNome: advogado.nome,
    };
  } catch (error) {
    console.error('[Credential] Erro ao buscar credencial:', error);
    throw error;
  }
}

/**
 * Detecta e salva automaticamente o idAdvogado do PJE
 * Chamado após login bem-sucedido se o idAdvogado ainda for NULL
 *
 * @param advogadoId ID do advogado no banco de dados
 * @param page Página do Puppeteer após login bem-sucedido
 */
export async function detectAndSaveIdAdvogado(
  advogadoId: string,
  page: any
): Promise<void> {
  try {
    console.log(`[Auto-detect] Detectando idAdvogado para advogadoId: ${advogadoId}`);

    // Verifica se já tem idAdvogado
    const advogado = await prisma.advogado.findUnique({
      where: { id: advogadoId },
    });

    if (!advogado) {
      console.error('[Auto-detect] Advogado não encontrado');
      return;
    }

    if (advogado.idAdvogado) {
      console.log(`[Auto-detect] idAdvogado já existe: ${advogado.idAdvogado}`);
      return;
    }

    // Busca perfil no PJE
    const perfil = await page.evaluate(async () => {
      try {
        const response = await fetch('/pje-seguranca/api/token/perfis');
        if (response.ok) {
          const data = await response.json();
          return data[0]; // Primeiro perfil
        }
        return null;
      } catch (e) {
        return null;
      }
    });

    if (!perfil || !perfil.id) {
      console.warn('[Auto-detect] Não foi possível obter idAdvogado do PJE');
      return;
    }

    const idAdvogadoPJE = perfil.id.toString();

    // Salva no banco
    await prisma.advogado.update({
      where: { id: advogadoId },
      data: {
        idAdvogado: idAdvogadoPJE,
      },
    });

    console.log(`[Auto-detect] idAdvogado detectado e salvo: ${idAdvogadoPJE}`);
  } catch (error) {
    console.error('[Auto-detect] Erro ao detectar idAdvogado:', error);
    // Não propaga erro - apenas loga e deixa NULL para tentar na próxima vez
  }
}

/**
 * Adaptador para Scripts PJE
 * Converte os scripts Node.js em funções TypeScript que retornam Promises
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { LoginResult, ScrapeResult, ProcessoPJE } from '@/lib/types';

puppeteer.use(StealthPlugin());

const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executa login no PJE e retorna resultado
 */
export async function executarLoginPJE(cpf: string, senha: string): Promise<LoginResult> {
  let browser;

  try {
    console.log('[PJE Adapter] Iniciando login...');

    // Validação de entrada
    if (!cpf || !senha) {
      return {
        success: false,
        message: 'CPF e senha são obrigatórios',
        error: 'MISSING_CREDENTIALS'
      };
    }

    // Lança navegador
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
    });

    // Navega para página de login
    await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
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
        error: 'BLOCKED_BY_CLOUDFRONT'
      };
    }

    if (finalUrl.includes('pje.trt3.jus.br') && !finalUrl.includes('sso.cloud')) {
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
          perfil: perfil ? {
            id: perfil.id?.toString() || '',
            nome: perfil.nome || '',
            oab: perfil.oab || '',
            tribunal: 'TRT3'
          } : undefined
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
        error: 'INVALID_CREDENTIALS'
      };
    }

    return {
      success: false,
      message: 'Resultado inesperado',
      error: 'UNEXPECTED_RESULT'
    };

  } catch (error) {
    console.error('[PJE Adapter] Erro:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      error: 'UNKNOWN_ERROR'
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Raspa processos do PJE
 */
export async function rasparProcessosPJE(
  cpf: string,
  senha: string,
  idAdvogado: number,
  idAgrupamento: number = 1
): Promise<ScrapeResult> {
  let browser;

  try {
    console.log('[PJE Adapter] Iniciando raspagem de processos...');

    // Lança navegador
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
    });

    // Login
    await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2' });
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
      error: error instanceof Error ? error.message : 'Erro desconhecido'
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
    if (paginaAtual >= totalPaginas) {
      break;
    }

    paginaAtual++;
    await delay(500);
  }

  return todosProcessos;
}

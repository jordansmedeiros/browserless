/**
 * Script de Teste: TRTs com Falha
 *
 * Este script testa apenas os TRTs que falharam no teste completo
 * para facilitar a depuração e correção de problemas específicos.
 *
 * TRTs testados:
 * - TRT14: SERVER_UNAVAILABLE (HTTP 401)
 * - TRT17: SSO_STRUCTURE_DIFFERENT (timeout #username)
 * - TRT23: UNEXPECTED_REDIRECT (chrome-error)
 *
 * COMO USAR:
 * node --loader ts-node/esm scripts/test-failed-trts.ts
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getTribunalConfig, getTribunalByCode } from '../lib/services/tribunal.js';
import type { TRTCode, TribunalInfo } from '../lib/types/tribunal.js';
import { PJEErrorType, PJEErrorCategory } from '../lib/types/pje-errors.js';
import {
  detectErrorFromPage,
  detectStructureError,
  detectNetworkError,
  detectScrapeError,
  isLoginSuccessful,
  formatErrorForConsole,
} from '../lib/utils/pje-error-detector.js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente do .env.dev
dotenv.config({ path: '.env.dev' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

puppeteer.use(StealthPlugin());

// Configurações
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;
const ID_ADVOGADO = parseInt(process.env.PJE_ID_ADVOGADO || '0', 10);

const BASE_DATA_DIR = 'data/test-failed-trts';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// TRTs com falha para testar
const FAILED_TRTS: TRTCode[] = ['TRT14', 'TRT17', 'TRT23'];

// Tipos para relatório
interface TestResult {
  trt: TRTCode;
  nome: string;
  regiao: string;
  urlTested: string;
  success: boolean;
  loginSuccess?: boolean;
  scrapeSuccess?: boolean;
  processos?: number;
  errorType?: PJEErrorType;
  errorCategory?: PJEErrorCategory;
  errorMessage?: string;
  userMessage?: string;
  retryable?: boolean;
  pageTitle?: string;
  finalUrl?: string;
  duration?: number;
}

interface TestReport {
  timestamp: string;
  totalTRTs: number;
  successCount: number;
  failureCount: number;
  results: TestResult[];
  summary: {
    loginSuccessful: string[];
    loginFailed: string[];
    scrapeSuccessful: string[];
    scrapeFailed: string[];
    differentPageStructure: string[];
    authenticationIssues: string[];
    serverUnavailable: string[];
    blockedByCloudFront: string[];
    retryableErrors: string[];
  };
}

/**
 * Valida credenciais
 */
function validarCredenciais(): boolean {
  if (!CPF || !SENHA || !ID_ADVOGADO) {
    console.error('\n❌ ERRO: Credenciais PJE não configuradas no .env');
    console.error('Necessário: PJE_CPF, PJE_SENHA, PJE_ID_ADVOGADO\n');
    return false;
  }
  return true;
}

/**
 * Cria estrutura de diretórios
 */
async function criarDiretorios(trt: TRTCode) {
  const trtDir = path.join(BASE_DATA_DIR, trt.toLowerCase(), '1g', 'pendentes');
  await fs.mkdir(trtDir, { recursive: true });
  return trtDir;
}

/**
 * Testa login em um TRT específico
 */
async function testarLoginTRT(
  trt: TRTCode,
  tribunalInfo: TribunalInfo
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    trt,
    nome: tribunalInfo.nome,
    regiao: tribunalInfo.regiao,
    urlTested: '',
    success: false,
  };

  let browser;

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 Testando ${trt} - ${tribunalInfo.nome}`);
    console.log(`   Região: ${tribunalInfo.regiao} (${tribunalInfo.uf})`);
    console.log(`${'='.repeat(70)}`);

    // Obtém configuração do TRT
    const config = await getTribunalConfig(trt, '1g');
    result.urlTested = config.urlLoginSeam;

    console.log(`📍 URL de Login: ${config.urlLoginSeam}`);

    // Lança navegador (não-headless para facilitar debug)
    browser = await puppeteer.launch({
      headless: false,  // Modo visível para debug
      defaultViewport: null,
      args: [
        '--start-maximized',
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
    console.log('🌐 Navegando para página de login...');
    await page.goto(config.urlLoginSeam, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await delay(1500);

    // Verifica se página carregou
    result.pageTitle = await page.title();
    console.log(`📄 Título da página: ${result.pageTitle}`);

    // Verifica se existe botão de login PDPJ
    const btnError = await detectStructureError(page, '#btnSsoPdpj', 'login');
    if (btnError) {
      result.errorType = btnError.type;
      result.errorCategory = btnError.category;
      result.errorMessage = btnError.message;
      result.userMessage = btnError.userMessage;
      result.retryable = btnError.retryable;
      console.log(formatErrorForConsole(btnError));
      return result;
    }

    console.log('✅ Botão de login SSO encontrado');

    // Clica em "Entrar com PDPJ"
    console.log('🔐 Iniciando autenticação SSO...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('#btnSsoPdpj'),
    ]);

    // Aguarda e verifica campo CPF (detectStructureError já aguarda até 15s)
    console.log('⏳ Aguardando página SSO carregar...');
    const usernameError = await detectStructureError(page, '#username', 'sso', 20000); // 20s para TRTs lentos
    if (usernameError) {
      result.errorType = usernameError.type;
      result.errorCategory = usernameError.category;
      result.errorMessage = usernameError.message;
      result.userMessage = usernameError.userMessage;
      result.retryable = usernameError.retryable;
      console.log(formatErrorForConsole(usernameError));

      // Tira screenshot para debug
      const screenshotPath = path.join(BASE_DATA_DIR, `${trt.toLowerCase()}-sso-error.png`);
      await fs.mkdir(BASE_DATA_DIR, { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot salvo: ${screenshotPath}`);

      return result;
    }

    // Verifica campo senha
    const passwordError = await detectStructureError(page, '#password', 'sso', 5000);
    if (passwordError) {
      result.errorType = passwordError.type;
      result.errorCategory = passwordError.category;
      result.errorMessage = passwordError.message;
      result.userMessage = passwordError.userMessage;
      result.retryable = passwordError.retryable;
      console.log(formatErrorForConsole(passwordError));
      return result;
    }

    // Preenche credenciais
    console.log('📝 Preenchendo credenciais...');
    await page.type('#username', CPF!, { delay: 50 });
    console.log('✅ CPF preenchido');
    await delay(500);

    await page.type('#password', SENHA!, { delay: 50 });
    console.log('✅ Senha preenchida');
    await delay(1500);

    // Clica em Entrar
    console.log('🔑 Realizando login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    await delay(5000);

    // Verifica resultado
    const finalUrl = page.url();
    const title = await page.title();
    result.finalUrl = finalUrl;
    result.pageTitle = title;

    console.log(`📍 URL final: ${finalUrl}`);
    console.log(`📄 Título final: ${title}`);

    // Detecta erros na página
    const trtDomain = config.urlBase.replace('https://', '');
    const pageError = await detectErrorFromPage(page, trtDomain);

    if (pageError) {
      // Há erro - login falhou
      result.errorType = pageError.type;
      result.errorCategory = pageError.category;
      result.errorMessage = pageError.message;
      result.userMessage = pageError.userMessage;
      result.retryable = pageError.retryable;
      result.loginSuccess = false;
      console.log(formatErrorForConsole(pageError));

      // Tira screenshot para debug
      const screenshotPath = path.join(BASE_DATA_DIR, `${trt.toLowerCase()}-login-error.png`);
      await fs.mkdir(BASE_DATA_DIR, { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot salvo: ${screenshotPath}`);

      return result;
    }

    // Nenhum erro detectado - verifica se login foi bem-sucedido
    if (isLoginSuccessful(finalUrl, trtDomain)) {
      result.loginSuccess = true;
      console.log('✅ Login realizado com sucesso!');

      // Tenta raspar processos
      try {
        console.log('📊 Iniciando raspagem de processos pendentes...');
        const processos = await rasparProcessosPendentes(page, trt);

        result.scrapeSuccess = true;
        result.processos = processos.length;
        result.success = true;

        console.log(`✅ Raspagem concluída: ${processos.length} processos encontrados`);

        // Salva JSON de auditoria
        const dataDir = await criarDiretorios(trt);
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        const filename = `test-pendentes-${timestamp}.json`;
        const filepath = path.join(dataDir, filename);

        await fs.writeFile(
          filepath,
          JSON.stringify(processos, null, 2),
          'utf-8'
        );

        console.log(`💾 JSON salvo: ${filepath}`);
      } catch (scrapeError) {
        const scrapeErr = detectScrapeError(
          scrapeError instanceof Error ? scrapeError : new Error(String(scrapeError)),
          'pendentes'
        );
        result.scrapeSuccess = false;
        result.errorType = scrapeErr.type;
        result.errorCategory = scrapeErr.category;
        result.errorMessage = scrapeErr.message;
        result.userMessage = scrapeErr.userMessage;
        result.retryable = scrapeErr.retryable;
        console.log(formatErrorForConsole(scrapeErr));
      }
    } else {
      // Login não foi bem-sucedido mas também não detectou erro específico
      result.errorType = PJEErrorType.UNEXPECTED_REDIRECT;
      result.errorCategory = PJEErrorCategory.UNKNOWN;
      result.errorMessage = `Login falhou - URL inesperada: ${finalUrl}`;
      result.loginSuccess = false;
      console.log('⚠️  Redirecionamento inesperado');

      // Tira screenshot para debug
      const screenshotPath = path.join(BASE_DATA_DIR, `${trt.toLowerCase()}-unexpected-redirect.png`);
      await fs.mkdir(BASE_DATA_DIR, { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot salvo: ${screenshotPath}`);
    }
  } catch (error) {
    const netErr = detectNetworkError(
      error instanceof Error ? error : new Error(String(error))
    );
    result.errorType = netErr.type;
    result.errorCategory = netErr.category;
    result.errorMessage = netErr.message;
    result.userMessage = netErr.userMessage;
    result.retryable = netErr.retryable;
    console.log(formatErrorForConsole(netErr));
  } finally {
    if (browser) {
      console.log('\n👁️  Navegador ficará aberto para inspeção manual.');
      console.log('    Pressione Ctrl+C para fechar e continuar com próximo TRT.\n');

      // Aguarda 30 segundos para inspeção antes de fechar
      await delay(30000);
      await browser.close();
    }
    result.duration = Date.now() - startTime;
    console.log(`⏱️  Duração: ${(result.duration / 1000).toFixed(2)}s`);
  }

  return result;
}

/**
 * Raspa processos pendentes (No prazo + Dada ciência)
 */
async function rasparProcessosPendentes(page: any, trt: TRTCode): Promise<any[]> {
  const todosProcessos: any[] = [];
  let paginaAtual = 1; // Paginação base-1 para esta API
  let totalPaginas: number | null = null;

  console.log(`   📄 Raspando processos pendentes (No prazo + Dada ciência)...`);

  while (true) {
    const params = {
      idAdvogado: ID_ADVOGADO,
      tipoPainelAdvogado: 2,
      idPainelAdvogadoEnum: 2,
      ordenacaoCrescente: false,
      pagina: paginaAtual,
      tamanhoPagina: 100,
      filtros: {
        prazo: 'N',      // N = No prazo (on time)
        ciencia: 'C',    // C = Ciência dada (awareness given)
      },
    };

    const resultado = await page.evaluate(
      async (p: any) => {
        try {
          // Monta URLSearchParams com filtros agrupadorExpediente
          const searchParams = new URLSearchParams({
            idAdvogado: p.idAdvogado.toString(),
            tipoPainelAdvogado: p.tipoPainelAdvogado.toString(),
            idPainelAdvogadoEnum: p.idPainelAdvogadoEnum.toString(),
            ordenacaoCrescente: p.ordenacaoCrescente.toString(),
            pagina: p.pagina.toString(),
            tamanhoPagina: p.tamanhoPagina.toString(),
          });

          // Adiciona filtros de agrupadorExpediente
          searchParams.append('agrupadorExpediente', p.filtros.prazo);
          searchParams.append('agrupadorExpediente', p.filtros.ciencia);

          const url = `/pje-comum-api/api/paineladvogado/${p.idAdvogado}/processos?${searchParams.toString()}`;
          const response = await fetch(url);

          if (!response.ok) {
            return { error: `HTTP ${response.status}` };
          }

          return await response.json();
        } catch (e: any) {
          return { error: e.message };
        }
      },
      params
    );

    if (resultado.error) {
      throw new Error(`Erro na página ${paginaAtual}: ${resultado.error}`);
    }

    // Primeira página - descobre total
    if (totalPaginas === null) {
      totalPaginas = resultado.qtdPaginas || 1;
      console.log(`   📄 Total de páginas: ${totalPaginas}`);
      console.log(`   📊 Total de processos: ${resultado.totalRegistros || '?'}`);
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

/**
 * Gera relatório consolidado
 */
async function gerarRelatorio(results: TestResult[]): Promise<TestReport> {
  const report: TestReport = {
    timestamp: new Date().toISOString(),
    totalTRTs: results.length,
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
    results,
    summary: {
      loginSuccessful: [],
      loginFailed: [],
      scrapeSuccessful: [],
      scrapeFailed: [],
      differentPageStructure: [],
      authenticationIssues: [],
      serverUnavailable: [],
      blockedByCloudFront: [],
      retryableErrors: [],
    },
  };

  // Popula resumo
  results.forEach((r) => {
    if (r.loginSuccess) {
      report.summary.loginSuccessful.push(r.trt);
    } else if (r.loginSuccess === false) {
      report.summary.loginFailed.push(r.trt);
    }

    if (r.scrapeSuccess) {
      report.summary.scrapeSuccessful.push(r.trt);
    } else if (r.scrapeSuccess === false) {
      report.summary.scrapeFailed.push(r.trt);
    }

    if (
      r.errorType === PJEErrorType.PAGE_STRUCTURE_DIFFERENT ||
      r.errorType === PJEErrorType.SSO_STRUCTURE_DIFFERENT
    ) {
      report.summary.differentPageStructure.push(r.trt);
    }

    if (r.errorType === PJEErrorType.AUTHENTICATION_FAILED) {
      report.summary.authenticationIssues.push(r.trt);
    }

    if (
      r.errorType === PJEErrorType.SERVER_UNAVAILABLE ||
      r.errorType === PJEErrorType.SERVER_ERROR
    ) {
      report.summary.serverUnavailable.push(r.trt);
    }

    if (r.errorType === PJEErrorType.BLOCKED_BY_CLOUDFRONT) {
      report.summary.blockedByCloudFront.push(r.trt);
    }

    if (r.retryable) {
      report.summary.retryableErrors.push(r.trt);
    }
  });

  // Salva relatório
  const reportDir = path.join(BASE_DATA_DIR, 'reports');
  await fs.mkdir(reportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const reportPath = path.join(reportDir, `test-failed-trts-${timestamp}.json`);

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n💾 Relatório salvo: ${reportPath}`);

  return report;
}

/**
 * Exibe relatório no console
 */
function exibirRelatorio(report: TestReport) {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RELATÓRIO - TESTE TRTs COM FALHA');
  console.log('═'.repeat(70));

  console.log(`\n🕒 Timestamp: ${report.timestamp}`);
  console.log(`📋 TRTs testados: ${report.totalTRTs}`);
  console.log(`✅ Sucessos: ${report.successCount}`);
  console.log(`❌ Falhas: ${report.failureCount}`);

  console.log('\n📝 DETALHES:');
  console.log('─'.repeat(70));

  report.results.forEach((r) => {
    const status = r.success ? '✅' : '❌';
    const processos = r.processos !== undefined ? ` (${r.processos} processos)` : '';
    const retryableTag = r.retryable ? ' [retryable]' : '';
    console.log(`\n${status} ${r.trt}: ${r.nome}${processos}`);
    console.log(`   📍 URL: ${r.urlTested}`);
    console.log(`   📄 Título: ${r.pageTitle}`);
    if (r.finalUrl) {
      console.log(`   🔗 URL Final: ${r.finalUrl}`);
    }
    if (!r.success && r.errorMessage) {
      console.log(`   └─ Tipo: ${r.errorType}${retryableTag}`);
      console.log(`   └─ Categoria: ${r.errorCategory}`);
      console.log(`   └─ Técnico: ${r.errorMessage}`);
      if (r.userMessage) {
        console.log(`   └─ Usuário: ${r.userMessage}`);
      }
    }
  });

  console.log('\n' + '═'.repeat(70));
}

/**
 * Função principal
 */
async function main() {
  console.log('\n' + '╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(15) + 'TESTE: TRTs COM FALHA' + ' '.repeat(32) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  // Valida credenciais
  if (!validarCredenciais()) {
    process.exit(1);
  }

  console.log('✅ Credenciais validadas');
  console.log(`👤 CPF: ${CPF?.substring(0, 3)}***${CPF?.substring(9)}`);
  console.log(`🆔 ID Advogado: ${ID_ADVOGADO}\n`);

  console.log('📋 TRTs a testar:', FAILED_TRTS.join(', '));
  console.log('🔍 Modo: Debug (navegador visível com pausa para inspeção)\n');

  const results: TestResult[] = [];

  // Testa cada TRT com erro
  for (let i = 0; i < FAILED_TRTS.length; i++) {
    const trtCode = FAILED_TRTS[i];

    console.log(`\n[${i + 1}/${FAILED_TRTS.length}] Testando ${trtCode}...`);

    const tribunalInfo = await getTribunalByCode(trtCode);
    const result = await testarLoginTRT(trtCode, tribunalInfo);
    results.push(result);

    // Aguarda entre testes
    if (i < FAILED_TRTS.length - 1) {
      console.log('\n⏳ Aguardando 5 segundos antes do próximo teste...');
      await delay(5000);
    }
  }

  // Gera e exibe relatório
  const report = await gerarRelatorio(results);
  exibirRelatorio(report);

  console.log('\n✅ Teste concluído!\n');
}

// Executa
main().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

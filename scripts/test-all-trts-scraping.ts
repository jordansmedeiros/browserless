/**
 * Script de Teste Automatizado: Multi-TRT Scraping
 *
 * Este script testa o login e raspagem em TODOS os 24 TRTs (primeiro grau)
 * para validar que todos seguem o mesmo padrão de URL e autenticação.
 *
 * FUNCIONALIDADES:
 * 1. Testa login em todos os 24 TRTs (1º grau)
 * 2. Verifica se as URLs seguem o padrão esperado
 * 3. Para cada TRT com sucesso, raspa processos pendentes
 * 4. Salva JSONs de auditoria em data/test-multi-trt/
 * 5. Gera relatório detalhado de sucessos e falhas
 *
 * COMO USAR:
 * node --loader ts-node/esm scripts/test-all-trts-scraping.ts
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getTribunalConfig, listAllTRTs } from '../lib/services/tribunal.js';
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

const BASE_DATA_DIR = 'data/test-multi-trt';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  userMessage?: string;       // Mensagem amigável para o usuário
  retryable?: boolean;         // Indica se vale a pena tentar novamente
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
    serverUnavailable: string[];        // TRTs com servidor indisponível
    blockedByCloudFront: string[];      // TRTs bloqueados pelo CloudFront
    retryableErrors: string[];          // TRTs com erros que podem ser retentados
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

    // Aguarda e verifica campo CPF (detectStructureError já aguarda até 10s)
    console.log('⏳ Aguardando página SSO carregar...');
    const usernameError = await detectStructureError(page, '#username', 'sso', 15000);
    if (usernameError) {
      result.errorType = usernameError.type;
      result.errorCategory = usernameError.category;
      result.errorMessage = usernameError.message;
      result.userMessage = usernameError.userMessage;
      result.retryable = usernameError.retryable;
      console.log(formatErrorForConsole(usernameError));
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
      await browser.close();
    }
    result.duration = Date.now() - startTime;
    console.log(`⏱️  Duração: ${(result.duration / 1000).toFixed(2)}s`);
  }

  return result;
}

/**
 * Raspa processos pendentes de um TRT
 */
async function rasparProcessosPendentes(page: any, trt: TRTCode): Promise<any[]> {
  const todosProcessos: any[] = [];
  let paginaAtual = 1;
  const tamanhoPagina = 100;
  let totalPaginas: number | null = null;

  // Parâmetros da API para pendentes sem prazo
  const params = {
    idAdvogado: ID_ADVOGADO,
    tipoPainelAdvogado: 2,
    idPainelAdvogadoEnum: 2,
    ordenacaoCrescente: false,
    pagina: 1,
    tamanhoPagina: 100,
  };

  while (true) {
    const resultado = await page.evaluate(
      async (p: any) => {
        try {
          const queryString = new URLSearchParams({
            tipoPainelAdvogado: p.tipoPainelAdvogado.toString(),
            idPainelAdvogadoEnum: p.idPainelAdvogadoEnum.toString(),
            ordenacaoCrescente: p.ordenacaoCrescente.toString(),
            pagina: p.pagina.toString(),
            tamanhoPagina: p.tamanhoPagina.toString(),
          }).toString();

          const url = `/pje-comum-api/api/paineladvogado/${p.idAdvogado}/processos?${queryString}`;
          const response = await fetch(url);

          if (!response.ok) {
            return { error: `HTTP ${response.status}` };
          }

          return await response.json();
        } catch (e: any) {
          return { error: e.message };
        }
      },
      { ...params, pagina: paginaAtual }
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
  const reportPath = path.join(reportDir, `test-report-${timestamp}.json`);

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n💾 Relatório salvo: ${reportPath}`);

  return report;
}

/**
 * Exibe relatório no console
 */
function exibirRelatorio(report: TestReport) {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RELATÓRIO FINAL - TESTE MULTI-TRT');
  console.log('═'.repeat(70));

  console.log(`\n🕒 Timestamp: ${report.timestamp}`);
  console.log(`📋 Total de TRTs testados: ${report.totalTRTs}`);
  console.log(`✅ Sucessos: ${report.successCount} (${((report.successCount / report.totalTRTs) * 100).toFixed(1)}%)`);
  console.log(`❌ Falhas: ${report.failureCount} (${((report.failureCount / report.totalTRTs) * 100).toFixed(1)}%)`);

  console.log('\n📊 RESUMO POR CATEGORIA:');
  console.log('─'.repeat(70));

  console.log(`\n✅ Login Bem-Sucedido (${report.summary.loginSuccessful.length}):`);
  if (report.summary.loginSuccessful.length > 0) {
    console.log(`   ${report.summary.loginSuccessful.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log(`\n❌ Login Falhado (${report.summary.loginFailed.length}):`);
  if (report.summary.loginFailed.length > 0) {
    console.log(`   ${report.summary.loginFailed.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log(`\n📊 Raspagem Bem-Sucedida (${report.summary.scrapeSuccessful.length}):`);
  if (report.summary.scrapeSuccessful.length > 0) {
    console.log(`   ${report.summary.scrapeSuccessful.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log(`\n⚠️  Raspagem Falhada (${report.summary.scrapeFailed.length}):`);
  if (report.summary.scrapeFailed.length > 0) {
    console.log(`   ${report.summary.scrapeFailed.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log(`\n🔍 Estrutura de Página Diferente (${report.summary.differentPageStructure.length}):`);
  if (report.summary.differentPageStructure.length > 0) {
    console.log(`   ${report.summary.differentPageStructure.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log(`\n🔐 Problemas de Autenticação (${report.summary.authenticationIssues.length}):`);
  if (report.summary.authenticationIssues.length > 0) {
    console.log(`   ${report.summary.authenticationIssues.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log(`\n⏳ Servidor Indisponível (${report.summary.serverUnavailable.length}):`);
  if (report.summary.serverUnavailable.length > 0) {
    console.log(`   ${report.summary.serverUnavailable.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log(`\n🛡️  Bloqueado por CloudFront (${report.summary.blockedByCloudFront.length}):`);
  if (report.summary.blockedByCloudFront.length > 0) {
    console.log(`   ${report.summary.blockedByCloudFront.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log(`\n🔄 Erros Retryable (${report.summary.retryableErrors.length}):`);
  if (report.summary.retryableErrors.length > 0) {
    console.log(`   ${report.summary.retryableErrors.join(', ')}`);
  } else {
    console.log('   Nenhum');
  }

  console.log('\n📝 DETALHES POR TRT:');
  console.log('─'.repeat(70));

  report.results.forEach((r) => {
    const status = r.success ? '✅' : '❌';
    const processos = r.processos !== undefined ? ` (${r.processos} processos)` : '';
    const retryableTag = r.retryable ? ' [retryable]' : '';
    console.log(`${status} ${r.trt}: ${r.nome}${processos}`);
    if (!r.success && r.errorMessage) {
      console.log(`   └─ Tipo: ${r.errorType}${retryableTag}`);
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
  console.log('║' + ' '.repeat(10) + 'TESTE AUTOMATIZADO: MULTI-TRT SCRAPING' + ' '.repeat(20) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  // Valida credenciais
  if (!validarCredenciais()) {
    process.exit(1);
  }

  console.log('✅ Credenciais validadas');
  console.log(`👤 CPF: ${CPF?.substring(0, 3)}***${CPF?.substring(9)}`);
  console.log(`🆔 ID Advogado: ${ID_ADVOGADO}\n`);

  // Lista todos os TRTs
  const tribunais = await listAllTRTs();
  console.log(`📋 Total de TRTs a testar: ${tribunais.length}\n`);

  const results: TestResult[] = [];

  // Testa cada TRT
  for (let i = 0; i < tribunais.length; i++) {
    const tribunal = tribunais[i];

    console.log(`\n[${i + 1}/${tribunais.length}] Testando ${tribunal.codigo}...`);

    const result = await testarLoginTRT(tribunal.codigo, tribunal);
    results.push(result);

    // Aguarda entre testes para não sobrecarregar
    if (i < tribunais.length - 1) {
      console.log('\n⏳ Aguardando 3 segundos antes do próximo teste...');
      await delay(3000);
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

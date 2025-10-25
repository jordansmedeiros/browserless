/**
 * Raspagem de Processos do Acervo Geral - PJE (GENÉRICO)
 *
 * Este script funciona com qualquer tribunal através de variáveis de ambiente.
 * Usado pelo sistema de fila de raspagem.
 *
 * VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS:
 * - PJE_CPF: CPF do advogado
 * - PJE_SENHA: Senha do advogado
 * - PJE_ID_ADVOGADO: ID do advogado no PJE
 * - PJE_LOGIN_URL: URL de login do tribunal (ex: https://pje.trt3.jus.br/primeirograu/login.seam)
 * - PJE_BASE_URL: URL base do tribunal (ex: https://pje.trt3.jus.br)
 * - PJE_API_URL: URL da API do tribunal (ex: https://pje.trt3.jus.br/pje-comum-api/api)
 *
 * VARIÁVEIS OPCIONAIS:
 * - PJE_OUTPUT_FILE: Se vazio, não salva arquivo (apenas stdout)
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

puppeteer.use(StealthPlugin());

// Validação de credenciais e URLs
function validarVariaveisAmbiente() {
  const variaveis = [
    'PJE_CPF',
    'PJE_SENHA',
    'PJE_ID_ADVOGADO',
    'PJE_LOGIN_URL',
    'PJE_BASE_URL',
    'PJE_API_URL',
  ];

  const faltando = variaveis.filter(v => !process.env[v]);

  if (faltando.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO: Variáveis de ambiente não configuradas');
    console.error('='.repeat(70));
    console.error('\nVariáveis faltando:', faltando.join(', '));
    console.error('\n='.repeat(70) + '\n');
    process.exit(1);
  }
}

// Valida antes de prosseguir
validarVariaveisAmbiente();

// Lê configurações das variáveis de ambiente
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;
const ID_ADVOGADO = parseInt(process.env.PJE_ID_ADVOGADO, 10);
const PJE_LOGIN_URL = process.env.PJE_LOGIN_URL;
const PJE_BASE_URL = process.env.PJE_BASE_URL;
const PJE_API_URL = process.env.PJE_API_URL;

const DATA_DIR = 'data/pje/processos';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';

// ID do agrupamento Acervo Geral
const ID_ACERVO_GERAL = 1;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function rasparAcervoGeral() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     RASPAGEM: ACERVO GERAL (GENÉRICO)                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
  console.log(`🌐 Tribunal: ${PJE_BASE_URL}`);
  console.log(`👤 ID Advogado: ${ID_ADVOGADO}\n`);

  // Criar diretórios (se for salvar arquivo)
  if (!SKIP_FILE_OUTPUT) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();

  try {
    // ====================================================================
    // PASSO 1: LOGIN NO PJE
    // ====================================================================

    console.log('🔐 Fazendo login no PJE...\n');

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
    });

    await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2' });
    await delay(1500);

    // Clica em "Entrar com PDPJ"
    await page.waitForSelector('#btnSsoPdpj', { visible: true });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#btnSsoPdpj'),
    ]);

    // Preenche credenciais
    console.log('⏳ Aguardando página SSO carregar...');
    await page.waitForSelector('#username', { visible: true, timeout: 15000 });
    await page.type('#username', CPF);
    console.log('✅ CPF preenchido');
    await delay(1000);

    await page.waitForSelector('#password', { visible: true, timeout: 10000 });
    await page.type('#password', SENHA);
    console.log('✅ Senha preenchida');
    await delay(1500);

    // Clica em Entrar
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    console.log('✅ Login realizado!\n');
    await delay(5000);

    // ====================================================================
    // PASSO 2: BUSCAR TOTALIZADORES
    // ====================================================================

    console.log('📊 Verificando quantidade de processos...\n');

    const totalizadores = await page.evaluate(async (id) => {
      const response = await fetch(`/pje-comum-api/api/paineladvogado/${id}/totalizadores?tipoPainelAdvogado=0`);
      return await response.json();
    }, ID_ADVOGADO);

    const totalizadorAcervo = totalizadores.find(t => t.idAgrupamentoProcessoTarefa === ID_ACERVO_GERAL);

    if (totalizadorAcervo) {
      console.log(`📋 Total de processos no acervo geral: ${totalizadorAcervo.quantidadeProcessos}\n`);
    }

    // ====================================================================
    // PASSO 3: RASPAR TODOS OS PROCESSOS
    // ====================================================================

    console.log('🔄 Iniciando raspagem...\n');

    const processos = await rasparAgrupamento(page, ID_ADVOGADO, ID_ACERVO_GERAL);

    // ====================================================================
    // PASSO 4: SALVAR RESULTADOS
    // ====================================================================

    // Salvar em arquivo (opcional)
    if (!SKIP_FILE_OUTPUT) {
      const filename = `${DATA_DIR}/acervo-geral.json`;
      await fs.writeFile(filename, JSON.stringify(processos, null, 2));
      console.log(`📁 Arquivo salvo: ${filename}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(70) + '\n');
    console.log(`Data da raspagem: ${new Date().toISOString()}`);
    console.log(`Total de processos raspados: ${processos.length}\n`);

    if (processos.length > 0 && processos.length <= 3) {
      console.log('Processos:');
      processos.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.numeroProcesso} - ${p.nomeParteAutora}`);
      });
      console.log('');
    } else if (processos.length > 3) {
      console.log('Primeiros 3 processos:');
      processos.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.numeroProcesso} - ${p.nomeParteAutora}`);
      });
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('✅ RASPAGEM CONCLUÍDA!');
    console.log('='.repeat(70) + '\n');

    // Saída JSON para stdout (ÚLTIMA LINHA - será parseada pelo executor)
    const resultado = {
      success: true,
      processosCount: processos.length,
      processos: processos,
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(resultado));

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);

    // Saída JSON de erro para stdout
    const resultadoErro = {
      success: false,
      processosCount: 0,
      processos: [],
      timestamp: new Date().toISOString(),
      error: {
        type: 'script_error',
        category: 'execution',
        message: error.message,
        technicalMessage: error.stack,
        retryable: false,
        timestamp: new Date().toISOString()
      }
    };
    console.log(JSON.stringify(resultadoErro));
    process.exit(1);
  } finally {
    await browser.close();
  }
}

/**
 * Raspa todos os processos de um agrupamento específico
 */
async function rasparAgrupamento(page, idAdvogado, idAgrupamento) {
  const todosProcessos = [];
  let paginaAtual = 1;
  const tamanhoPagina = 100;
  let totalPaginas = null;

  while (true) {
    console.log(`   Página ${paginaAtual}/${totalPaginas || '?'}...`);

    const resultado = await page.evaluate(async (id, agrupamento, pagina, tamanho) => {
      try {
        const url = `/pje-comum-api/api/paineladvogado/${id}/processos?idAgrupamentoProcessoTarefa=${agrupamento}&pagina=${pagina}&tamanhoPagina=${tamanho}`;
        const response = await fetch(url);

        if (!response.ok) {
          return { error: `HTTP ${response.status}` };
        }

        return await response.json();
      } catch (e) {
        return { error: e.message };
      }
    }, idAdvogado, idAgrupamento, paginaAtual, tamanhoPagina);

    if (resultado.error) {
      console.error(`   ❌ Erro na página ${paginaAtual}: ${resultado.error}`);
      break;
    }

    // Primeira página - descobre total de páginas
    if (totalPaginas === null) {
      totalPaginas = resultado.qtdPaginas || 1;
      console.log(`   Total de páginas: ${totalPaginas}`);
      console.log(`   Total de processos: ${resultado.totalRegistros || '?'}\n`);
    }

    // Adiciona processos desta página
    if (resultado.resultado && Array.isArray(resultado.resultado)) {
      todosProcessos.push(...resultado.resultado);
      console.log(`   ✅ ${resultado.resultado.length} processos capturados`);
    }

    // Verifica se chegou na última página
    if (paginaAtual >= totalPaginas) {
      break;
    }

    paginaAtual++;

    // Delay entre requisições
    await delay(500);
  }

  return todosProcessos;
}

// Executa
rasparAcervoGeral().catch(console.error);

/**
 * Raspagem de Processos do Acervo Geral - PJE
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Obtém todos os processos do acervo geral (todas as páginas)
 * 3. Salva em JSON
 *
 * COMO USAR:
 * 1. Atualize CPF e SENHA
 * 2. Execute: node scripts/pje/raspar-acervo-geral.js
 * 3. Veja resultados em: data/pje/processos/acervo-geral.json
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

puppeteer.use(StealthPlugin());

// ⚠️ ATUALIZE SUAS CREDENCIAIS:
const CPF = '07529294610';
const SENHA = '12345678A@';

const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';
const DATA_DIR = 'data/pje/processos';

// ID do agrupamento Acervo Geral
const ID_ACERVO_GERAL = 1;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function rasparAcervoGeral() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     RASPAGEM: ACERVO GERAL                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Criar diretórios
  await fs.mkdir(DATA_DIR, { recursive: true });

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
    await delay(2000);
    await page.waitForSelector('#username', { visible: true });
    await page.type('#username', CPF);
    await delay(1000);

    await page.waitForSelector('#password', { visible: true });
    await page.type('#password', SENHA);
    await delay(1500);

    // Clica em Entrar
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    console.log('✅ Login realizado!\n');
    await delay(5000);

    // ====================================================================
    // PASSO 2: DEFINIR ID DO ADVOGADO
    // ====================================================================

    console.log('👤 Configurando ID do advogado...\n');

    // Usando ID conhecido (descoberto através da análise das APIs)
    const idAdvogado = 29203;
    console.log(`✅ ID do advogado: ${idAdvogado}\n`);

    // ====================================================================
    // PASSO 3: BUSCAR TOTALIZADORES (para confirmar quantidade)
    // ====================================================================

    console.log('📊 Verificando quantidade de processos do acervo geral...\n');

    const totalizadores = await page.evaluate(async (id) => {
      const response = await fetch(`/pje-comum-api/api/paineladvogado/${id}/totalizadores?tipoPainelAdvogado=0`);
      return await response.json();
    }, idAdvogado);

    const totalizadorAcervo = totalizadores.find(t => t.idAgrupamentoProcessoTarefa === ID_ACERVO_GERAL);

    if (totalizadorAcervo) {
      console.log(`📋 Total de processos no acervo geral: ${totalizadorAcervo.quantidadeProcessos}\n`);
    }

    // ====================================================================
    // PASSO 4: RASPAR TODOS OS PROCESSOS DO ACERVO GERAL
    // ====================================================================

    console.log('🔄 Iniciando raspagem de processos do acervo geral...\n');

    const processos = await rasparAgrupamento(page, idAdvogado, ID_ACERVO_GERAL);

    // ====================================================================
    // PASSO 5: SALVAR RESULTADOS
    // ====================================================================

    const filename = `${DATA_DIR}/acervo-geral.json`;
    await fs.writeFile(filename, JSON.stringify(processos, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(70) + '\n');
    console.log(`Data da raspagem: ${new Date().toISOString()}`);
    console.log(`Total de processos raspados: ${processos.length}`);
    console.log(`Arquivo salvo: ${filename}\n`);

    if (processos.length > 0) {
      console.log('Primeiros 3 processos:');
      processos.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.numeroProcesso} - ${p.nomeParteAutora}`);
      });
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('✅ RASPAGEM CONCLUÍDA!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);
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

    // Delay entre requisições para não sobrecarregar o servidor
    await delay(500);
  }

  return todosProcessos;
}

// Executa
rasparAcervoGeral().catch(console.error);

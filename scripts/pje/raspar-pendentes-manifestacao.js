/**
 * Raspagem de Processos Pendentes de Manifestação - PJE
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Obtém processos pendentes de manifestação (todas as páginas)
 * 3. Salva em JSON
 *
 * COMO USAR:
 * 1. Atualize CPF e SENHA
 * 2. Execute: node scripts/pje/raspar-pendentes-manifestacao.js
 * 3. Veja resultados em: data/pje/processos/pendentes-manifestacao.json
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

// Configurações para Pendentes de Manifestação
const CONFIG_PENDENTES_MANIFESTACAO = {
  tipoPainelAdvogado: 2,
  idPainelAdvogadoEnum: 2,
  agrupadorExpediente: ['I', 'N'], // I=Intimação, N=Notificação
  ordenacaoCrescente: false,
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function rasparPendentesManifestation() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     RASPAGEM: PENDENTES DE MANIFESTAÇÃO                           ║');
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
    // PASSO 3: RASPAR TODOS OS PROCESSOS PENDENTES (COM EXPEDIENTE)
    // ====================================================================

    console.log('🔄 Iniciando raspagem de processos pendentes (com expediente)...\n');

    const processos = await rasparAgrupamento(page, idAdvogado, CONFIG_PENDENTES_MANIFESTACAO);

    // ====================================================================
    // PASSO 4: SALVAR RESULTADOS
    // ====================================================================

    const filename = `${DATA_DIR}/pendentes-manifestacao.json`;
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
 * Raspa todos os processos de um painel específico (COM EXPEDIENTES)
 */
async function rasparAgrupamento(page, idAdvogado, config) {
  const todosProcessos = [];
  let paginaAtual = 1;
  const tamanhoPagina = 100;
  let totalPaginas = null;

  while (true) {
    console.log(`   Página ${paginaAtual}/${totalPaginas || '?'}...`);

    const resultado = await page.evaluate(async (id, cfg, pagina, tamanho) => {
      try {
        // Monta URL com múltiplos agrupadorExpediente
        const params = new URLSearchParams();
        cfg.agrupadorExpediente.forEach(ag => params.append('agrupadorExpediente', ag));
        params.append('pagina', pagina);
        params.append('tamanhoPagina', tamanho);
        params.append('tipoPainelAdvogado', cfg.tipoPainelAdvogado);
        params.append('ordenacaoCrescente', cfg.ordenacaoCrescente);
        params.append('idPainelAdvogadoEnum', cfg.idPainelAdvogadoEnum);

        const url = `/pje-comum-api/api/paineladvogado/${id}/processos?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          return { error: `HTTP ${response.status}` };
        }

        return await response.json();
      } catch (e) {
        return { error: e.message };
      }
    }, idAdvogado, config, paginaAtual, tamanhoPagina);

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
rasparPendentesManifestation().catch(console.error);

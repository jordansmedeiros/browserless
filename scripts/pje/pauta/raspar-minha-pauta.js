/**
 * Raspagem PJE - Minha Pauta
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Busca audiências/sessões da pauta
 * 3. Período: hoje até hoje + 365 dias (1 ano exato)
 * 4. Salva em JSON com nomenclatura padronizada
 *
 * COMO USAR:
 * 1. Atualize CPF e SENHA
 * 2. Execute: node scripts/pje/pauta/raspar-minha-pauta.js
 * 3. Veja resultados em: data/pje/trt3/1g/pauta/
 *
 * PADRÃO DE NOMENCLATURA:
 * pauta-{timestamp}.json
 * - pauta = Minha Pauta
 * - timestamp = YYYYMMDD-HHMMSS
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';

puppeteer.use(StealthPlugin());

// ⚠️ ATUALIZE SUAS CREDENCIAIS:
const CPF = '07529294610';
const SENHA = '12345678A@';

const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';
const DATA_DIR = 'data/pje/trt3/1g/pauta';

// Configurações do raspador
const CONFIG = {
  trt: 'trt3',
  grau: '1g',
  agrupador: 'pauta',
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gera nome do arquivo baseado no padrão
 */
function gerarNomeArquivo() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .split('.')[0]; // YYYYMMDD-HHMMSS

  return `${CONFIG.agrupador}-${timestamp}.json`;
}

/**
 * Calcula datas para o período de 1 ano
 */
function calcularPeriodo() {
  const hoje = new Date();

  // Data inicial: hoje
  const dataInicio = hoje.toISOString().split('T')[0]; // YYYY-MM-DD

  // Data final: hoje + 365 dias
  const dataFim = new Date(hoje);
  dataFim.setDate(dataFim.getDate() + 365);
  const dataFimStr = dataFim.toISOString().split('T')[0]; // YYYY-MM-DD

  return { dataInicio, dataFim: dataFimStr };
}

async function rasparMinhaPauta() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   RASPAGEM: MINHA PAUTA                                           ║');
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
    // PASSO 2: BUSCAR PAUTA
    // ====================================================================

    const { dataInicio, dataFim } = calcularPeriodo();

    console.log('📅 Período de busca:');
    console.log(`   Data inicial: ${dataInicio}`);
    console.log(`   Data final: ${dataFim} (1 ano)\n`);
    console.log('🔄 Iniciando raspagem...\n');

    const audiencias = await buscarPauta(page, dataInicio, dataFim);

    // ====================================================================
    // PASSO 3: DELETAR ARQUIVOS ANTIGOS
    // ====================================================================

    console.log('\n🗑️  Limpando arquivos antigos...\n');

    const arquivos = await fs.readdir(DATA_DIR);
    const padrao = new RegExp(`^${CONFIG.agrupador}-`);

    for (const arquivo of arquivos) {
      if (padrao.test(arquivo)) {
        const caminhoCompleto = path.join(DATA_DIR, arquivo);
        await fs.unlink(caminhoCompleto);
        console.log(`   ❌ Deletado: ${arquivo}`);
      }
    }

    // ====================================================================
    // PASSO 4: SALVAR RESULTADOS
    // ====================================================================

    const nomeArquivo = gerarNomeArquivo();
    const caminhoArquivo = path.join(DATA_DIR, nomeArquivo);

    await fs.writeFile(caminhoArquivo, JSON.stringify(audiencias, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(70) + '\n');
    console.log(`TRT: ${CONFIG.trt.toUpperCase()}`);
    console.log(`Grau: ${CONFIG.grau.toUpperCase()}`);
    console.log(`Tipo: Minha Pauta`);
    console.log(`Período: ${dataInicio} a ${dataFim}`);
    console.log(`Data da raspagem: ${new Date().toISOString()}`);
    console.log(`Total de audiências: ${audiencias.length}`);
    console.log(`Arquivo: ${nomeArquivo}\n`);

    if (audiencias.length > 0) {
      console.log('Primeiras 3 audiências:');
      audiencias.slice(0, 3).forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.numeroProcesso || a.id} - ${a.dataAudiencia || a.data || 'Sem data'}`);
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
 * Busca audiências/sessões da pauta com paginação
 */
async function buscarPauta(page, dataInicio, dataFim) {
  const todasAudiencias = [];
  let paginaAtual = 1;
  const tamanhoPagina = 100;
  let totalPaginas = null;

  while (true) {
    console.log(`   Página ${paginaAtual}/${totalPaginas || '?'}...`);

    const resultado = await page.evaluate(async (dataIni, dataFi, pagina, tamanho) => {
      try {
        const params = new URLSearchParams();
        params.append('dataInicio', dataIni);
        params.append('dataFim', dataFi);
        params.append('codigoSituacao', 'M'); // M = Marcada (padrão)
        params.append('numeroPagina', pagina);
        params.append('tamanhoPagina', tamanho);
        params.append('ordenacao', 'asc');

        const url = `/pje-comum-api/api/pauta-usuarios-externos?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          return { error: `HTTP ${response.status}: ${errorText}` };
        }

        return await response.json();
      } catch (e) {
        return { error: e.message };
      }
    }, dataInicio, dataFim, paginaAtual, tamanhoPagina);

    if (resultado.error) {
      console.error(`   ❌ Erro na página ${paginaAtual}: ${resultado.error}`);
      break;
    }

    // Verifica se é uma resposta de erro do PJE
    if (resultado.codigoErro) {
      console.error(`   ❌ Erro PJE: ${resultado.mensagem}`);
      break;
    }

    // Primeira página - descobre total de páginas
    if (totalPaginas === null && resultado.totalPaginas) {
      totalPaginas = resultado.totalPaginas;
      console.log(`   Total de páginas: ${totalPaginas}`);
      console.log(`   Total de audiências: ${resultado.totalRegistros || '?'}\n`);
    }

    // Adiciona audiências desta página
    if (resultado.resultado && Array.isArray(resultado.resultado)) {
      todasAudiencias.push(...resultado.resultado);
      console.log(`   ✅ ${resultado.resultado.length} audiências capturadas`);
    } else if (Array.isArray(resultado)) {
      // Caso a resposta seja diretamente um array
      todasAudiencias.push(...resultado);
      console.log(`   ✅ ${resultado.length} audiências capturadas`);
      break; // Se não tem paginação, para aqui
    }

    // Verifica se chegou na última página
    if (totalPaginas && paginaAtual >= totalPaginas) {
      break;
    }

    // Se não tem mais resultados
    if (resultado.resultado && resultado.resultado.length === 0) {
      break;
    }

    paginaAtual++;

    // Delay entre requisições
    await delay(500);
  }

  return todasAudiencias;
}

// Executa
rasparMinhaPauta().catch(console.error);

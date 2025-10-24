/**
 * Raspagem de Processos Arquivados - PJE
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Obtém todos os processos arquivados (todas as páginas)
 * 3. Salva em JSON
 *
 * COMO USAR:
 * 1. Configure as credenciais no arquivo .env (PJE_CPF, PJE_SENHA, PJE_ID_ADVOGADO)
 * 2. Execute: node scripts/pje-trt/trt3/1g/arquivados/raspar-arquivados.js
 * 3. Veja resultados em: data/pje/processos/arquivados.json
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

puppeteer.use(StealthPlugin());

// Validação de credenciais
function validarCredenciais() {
  const credenciaisFaltando = [];

  if (!process.env.PJE_CPF) credenciaisFaltando.push('PJE_CPF');
  if (!process.env.PJE_SENHA) credenciaisFaltando.push('PJE_SENHA');
  if (!process.env.PJE_ID_ADVOGADO) credenciaisFaltando.push('PJE_ID_ADVOGADO');

  if (credenciaisFaltando.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO: Credenciais PJE não configuradas');
    console.error('='.repeat(70));
    console.error('\nVariáveis de ambiente faltando:');
    credenciaisFaltando.forEach(v => console.error(`  - ${v}`));
    console.error('\n💡 Como configurar:');
    console.error('  1. Copie o arquivo .env.example para .env');
    console.error('  2. Preencha as variáveis PJE_CPF, PJE_SENHA e PJE_ID_ADVOGADO');
    console.error('  3. Execute o script novamente');
    console.error('\n📖 Consulte o README para mais informações.\n');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
}

// Valida credenciais antes de prosseguir
validarCredenciais();

// Lê credenciais das variáveis de ambiente
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;
const ID_ADVOGADO = parseInt(process.env.PJE_ID_ADVOGADO, 10);

const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';
const DATA_DIR = 'data/pje/processos';

// ID do agrupamento Arquivados
const ID_ARQUIVADOS = 5;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function rasparArquivados() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     RASPAGEM: ARQUIVADOS                                          ║');
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

    // Usando ID da variável de ambiente
    const idAdvogado = ID_ADVOGADO;
    console.log(`✅ ID do advogado: ${idAdvogado}\n`);

    // ====================================================================
    // PASSO 3: BUSCAR TOTALIZADORES (para confirmar quantidade)
    // ====================================================================

    console.log('📊 Verificando quantidade de processos arquivados...\n');

    const totalizadores = await page.evaluate(async (id) => {
      const response = await fetch(`/pje-comum-api/api/paineladvogado/${id}/totalizadores?tipoPainelAdvogado=0`);
      return await response.json();
    }, idAdvogado);

    const totalizadorArquivados = totalizadores.find(t => t.idAgrupamentoProcessoTarefa === ID_ARQUIVADOS);

    if (totalizadorArquivados) {
      console.log(`📋 Total de processos arquivados: ${totalizadorArquivados.quantidadeProcessos}\n`);
    }

    // ====================================================================
    // PASSO 4: RASPAR TODOS OS PROCESSOS ARQUIVADOS
    // ====================================================================

    console.log('🔄 Iniciando raspagem de processos arquivados...\n');

    const processos = await rasparAgrupamento(page, idAdvogado, ID_ARQUIVADOS);

    // ====================================================================
    // PASSO 5: SALVAR RESULTADOS
    // ====================================================================

    const filename = `${DATA_DIR}/arquivados.json`;
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
rasparArquivados().catch(console.error);

/**
 * Raspagem Completa de Processos do PJE
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Obtém todos os processos (todas as páginas)
 * 3. Salva por categoria (Pendentes, Acervo Geral, Arquivados)
 * 4. Gera relatório resumido
 *
 * COMO USAR:
 * 1. Atualize CPF e SENHA
 * 2. Execute: node scripts/pje/raspar-todos-processos.js
 * 3. Veja resultados em: data/pje/processos/
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
const DATA_DIR = 'data/pje/processos';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// IDs dos agrupamentos descobertos
const AGRUPAMENTOS = {
  ACERVO_GERAL: { id: 1, nome: 'Acervo Geral' },
  PENDENTES_MANIFESTACAO: { id: 2, nome: 'Pendentes de Manifestação' },
  ARQUIVADOS: { id: 5, nome: 'Arquivados' },
};

async function rasparTodosProcessos() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║        RASPAGEM COMPLETA DE PROCESSOS DO PJE                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Criar diretórios
  await fs.mkdir(DATA_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,  // Rodar sem interface para ser mais rápido
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
    // PASSO 2: OBTER ID DO ADVOGADO
    // ====================================================================

    console.log('👤 Obtendo informações do usuário...\n');

    const perfis = await page.evaluate(async () => {
      const response = await fetch('/pje-seguranca/api/token/perfis');
      return await response.json();
    });

    let idAdvogado = 29203; // Fallback
    if (perfis && perfis.length > 0) {
      const perfilAdvogado = perfis.find(p => p.identificadorPapel === 'ADVOGADO');
      if (perfilAdvogado && perfilAdvogado.idPerfil) {
        idAdvogado = perfilAdvogado.idPerfil;
      }
    }

    console.log(`✅ ID do advogado: ${idAdvogado}\n`);

    // ====================================================================
    // PASSO 3: BUSCAR TOTALIZADORES
    // ====================================================================

    console.log('📊 Buscando totalizadores...\n');

    const totalizadores = await page.evaluate(async (id) => {
      const response = await fetch(`/pje-comum-api/api/paineladvogado/${id}/totalizadores?tipoPainelAdvogado=0`);
      return await response.json();
    }, idAdvogado);

    console.log('Totalizadores:');
    totalizadores.forEach(t => {
      console.log(`  • ${t.nomeAgrupamentoTarefa}: ${t.quantidadeProcessos} processos`);
    });
    console.log('');

    // Salva totalizadores
    await fs.writeFile(
      `${DATA_DIR}/totalizadores.json`,
      JSON.stringify(totalizadores, null, 2)
    );

    // ====================================================================
    // PASSO 4: RASPAR TODOS OS PROCESSOS DE CADA CATEGORIA
    // ====================================================================

    const relatorio = {
      dataRaspagem: new Date().toISOString(),
      idAdvogado,
      totalizadores: {},
      processosRaspados: {},
    };

    // Raspa cada categoria
    for (const [key, agrupamento] of Object.entries(AGRUPAMENTOS)) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📁 Raspando: ${agrupamento.nome} (ID: ${agrupamento.id})`);
      console.log('='.repeat(70) + '\n');

      const processos = await rasparAgrupamento(page, idAdvogado, agrupamento.id);

      // Salva processos desta categoria
      const filename = `${DATA_DIR}/${key.toLowerCase()}.json`;
      await fs.writeFile(filename, JSON.stringify(processos, null, 2));

      console.log(`\n✅ ${processos.length} processos salvos em: ${filename}\n`);

      // Atualiza relatório
      relatorio.totalizadores[agrupamento.nome] = processos.length;
      relatorio.processosRaspados[agrupamento.nome] = processos.length;
    }

    // ====================================================================
    // PASSO 5: GERAR RELATÓRIO FINAL
    // ====================================================================

    console.log('\n' + '='.repeat(70));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(70) + '\n');

    console.log(`Data da raspagem: ${relatorio.dataRaspagem}\n`);
    console.log('Processos raspados por categoria:');
    for (const [categoria, quantidade] of Object.entries(relatorio.processosRaspados)) {
      console.log(`  • ${categoria}: ${quantidade} processos`);
    }

    const totalRaspado = Object.values(relatorio.processosRaspados).reduce((a, b) => a + b, 0);
    console.log(`\n📊 TOTAL: ${totalRaspado} processos\n`);

    // Salva relatório
    await fs.writeFile(
      `${DATA_DIR}/relatorio.json`,
      JSON.stringify(relatorio, null, 2)
    );

    console.log(`💾 Relatório salvo em: ${DATA_DIR}/relatorio.json\n`);

    console.log('='.repeat(70));
    console.log('✅ RASPAGEM COMPLETA CONCLUÍDA!');
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
rasparTodosProcessos().catch(console.error);

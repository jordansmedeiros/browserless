/**
 * Raspagem de Processos do PJE
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Obtém o token de autenticação
 * 3. Busca processos via API REST
 * 4. Salva os dados em JSON
 *
 * COMO USAR:
 * 1. Atualize CPF e SENHA
 * 2. Execute: node scripts/pje/raspar-processos.js
 * 3. Veja os resultados em: data/pje/processos/
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

puppeteer.use(StealthPlugin());

// ⚠️ ATUALIZE SUAS CREDENCIAIS:
const CPF = '07529294610';
const SENHA = '12345678A@';

const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';
const API_BASE = 'https://pje.trt3.jus.br/pje-comum-api/api';
const DATA_DIR = 'data/pje/processos';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// IDs dos agrupamentos
const AGRUPAMENTOS = {
  ACERVO_GERAL: 1,
  PENDENTES_MANIFESTACAO: 2,
  ARQUIVADOS: 5,
};

async function rasparProcessos() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║           RASPAGEM DE PROCESSOS DO PJE                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Criar diretórios
  await fs.mkdir(DATA_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
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
    // PASSO 2: OBTER COOKIES E TOKEN
    // ====================================================================

    console.log('🔑 Obtendo token de autenticação...\n');

    const cookies = await page.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    console.log(`✅ Cookies capturados (${cookies.length} cookies)\n`);

    // ====================================================================
    // PASSO 3: BUSCAR ID DO ADVOGADO E TOTALIZADORES
    // ====================================================================

    console.log('👤 Buscando informações do painel...\n');

    // Faz requisição diretamente via API usando fetch
    const totalizadores = await page.evaluate(async () => {
      try {
        // Primeiro, vamos pegar o ID do advogado da URL ou de algum elemento
        // A URL dos totalizadores já contém o ID: /api/paineladvogado/29203/totalizadores

        // Vamos tentar descobrir o ID do usuário logado
        const response = await fetch('/pje-seguranca/api/token/perfis');
        const perfis = await response.json();

        return perfis;
      } catch (e) {
        return null;
      }
    });

    console.log('📊 Perfis do usuário:', JSON.stringify(totalizadores, null, 2), '\n');

    // Extrai o ID do advogado
    let idAdvogado = null;
    if (totalizadores && totalizadores.length > 0) {
      // Procura pelo perfil de advogado
      const perfilAdvogado = totalizadores.find(p =>
        p.nome && p.nome.toLowerCase().includes('advogado')
      );

      if (perfilAdvogado && perfilAdvogado.id) {
        idAdvogado = perfilAdvogado.id;
      }
    }

    // Se não encontrou, usa o ID fixo que descobrimos
    if (!idAdvogado) {
      idAdvogado = 29203;
      console.log(`⚠️  Usando ID fixo: ${idAdvogado}\n`);
    } else {
      console.log(`✅ ID do advogado: ${idAdvogado}\n`);
    }

    // Busca os totalizadores
    console.log('📊 Buscando total izadores...\n');

    const totaisData = await page.evaluate(async (id) => {
      const response = await fetch(`/pje-comum-api/api/paineladvogado/${id}/totalizadores?tipoPainelAdvogado=0`);
      return await response.json();
    }, idAdvogado);

    console.log('Totalizadores:');
    totaisData.forEach(t => {
      console.log(`  • ${t.nomeAgrupamentoTarefa}: ${t.quantidadeProcessos} processos`);
    });
    console.log('');

    // Salva totalizadores
    await fs.writeFile(
      `${DATA_DIR}/totalizadores.json`,
      JSON.stringify(totaisData, null, 2)
    );

    // ====================================================================
    // PASSO 4: BUSCAR LISTA DE PROCESSOS
    // ====================================================================

    console.log('📁 Buscando lista de processos...\n');

    // Tenta diferentes endpoints possíveis para buscar processos
    const possiveisEndpoints = [
      `/api/paineladvogado/${idAdvogado}/processos?idAgrupamentoProcessoTarefa=2&pagina=1&tamanhoPagina=100`,
      `/api/processos/painel/${idAdvogado}?idAgrupamento=2&pagina=1&tamanhoPagina=100`,
      `/api/painel/processos?idAdvogado=${idAdvogado}&idAgrupamento=2`,
      `/api/paineladvogado/${idAdvogado}/listar?idAgrupamento=2`,
    ];

    let processos = null;
    let endpointFuncionou = null;

    for (const endpoint of possiveisEndpoints) {
      console.log(`🔍 Tentando: ${endpoint}`);

      try {
        const result = await page.evaluate(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              return { error: `HTTP ${response.status}` };
            }
            const data = await response.json();
            return { success: true, data, status: response.status };
          } catch (e) {
            return { error: e.message };
          }
        }, `/pje-comum-api${endpoint}`);

        if (result.success && result.data) {
          processos = result.data;
          endpointFuncionou = endpoint;
          console.log(`✅ Funcionou! Dados recebidos.\n`);
          break;
        } else {
          console.log(`   ❌ ${result.error || 'Sem dados'}`);
        }
      } catch (e) {
        console.log(`   ❌ Erro: ${e.message}`);
      }
    }

    if (processos) {
      console.log(`\n✅ Lista de processos obtida via: ${endpointFuncionou}\n`);

      // Salva lista completa
      await fs.writeFile(
        `${DATA_DIR}/processos-pendentes.json`,
        JSON.stringify(processos, null, 2)
      );

      // Mostra resumo
      if (Array.isArray(processos)) {
        console.log(`📊 Total de processos: ${processos.length}\n`);

        if (processos.length > 0) {
          console.log('Primeiros 5 processos:');
          processos.slice(0, 5).forEach((p, i) => {
            console.log(`${i + 1}. ${p.numeroProcesso || p.numero || JSON.stringify(p).substring(0, 100)}`);
          });
        }
      } else if (processos.content && Array.isArray(processos.content)) {
        // Formato paginado
        console.log(`📊 Total de processos: ${processos.content.length} (página 1 de ${processos.totalPages || '?'})\n`);

        console.log('Primeiros 5 processos:');
        processos.content.slice(0, 5).forEach((p, i) => {
          console.log(`${i + 1}. ${p.numeroProcesso || p.numero || JSON.stringify(p).substring(0, 100)}`);
        });
      } else {
        console.log('Estrutura de dados:');
        console.log(JSON.stringify(processos, null, 2).substring(0, 500));
      }

      console.log(`\n💾 Processos salvos em: ${DATA_DIR}/processos-pendentes.json\n`);

    } else {
      console.log('\n❌ Não foi possível encontrar o endpoint correto para listar processos.\n');
      console.log('💡 Solução: Abra o navegador (que está aberto) e navegue manualmente até');
      console.log('   "Pendentes de Manifestação". Veja no Network (F12) qual API é chamada.\n');
    }

    console.log('👁️  Navegador ficará aberto para inspeção manual.');
    console.log('    Pressione Ctrl+C quando terminar.\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);
  }

  // Navegador fica aberto
  // await browser.close();
}

rasparProcessos().catch(console.error);

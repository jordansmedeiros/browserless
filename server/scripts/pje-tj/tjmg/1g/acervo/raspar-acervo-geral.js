/**
 * Raspagem de Processos do Acervo Geral - PJE TJMG 1º Grau
 *
 * ⚠️ DIFERENÇAS DO TRT:
 * - TJMG NÃO usa API REST - dados vêm renderizados no HTML
 * - Após login, aparece "Bad Request" - precisa fazer refresh (F5)
 * - Precisa navegar manualmente: Menu → Painel → Acervo
 * - Precisa expandir cada região e clicar em "Caixa de entrada"
 * - Dados extraídos do HTML via parsing (não JSON)
 *
 * FLUXO:
 * 1. Login no SSO
 * 2. Lidar com Bad Request (F5)
 * 3. Navegar: Menu sanduíche → Painel → Painel do Representante → ACERVO
 * 4. Para cada região na lista:
 *    a. Expandir região
 *    b. Clicar em "Caixa de entrada"
 *    c. Extrair processos da página (HTML parsing)
 *    d. Navegar pelas páginas (paginação)
 * 5. Salvar todos os processos em JSON
 *
 * COMO USAR:
 * 1. Configure credenciais: PJE_CPF e PJE_SENHA no .env
 * 2. Execute: node server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js
 * 3. Resultados em: data/pje/tjmg/acervo-geral.json
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import { validarCredenciais } from '../../common/auth-helpers.js';

puppeteer.use(StealthPlugin());

validarCredenciais(false);

const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;

const PJE_LOGIN_URL = process.env.PJE_LOGIN_URL || 'https://pje.tjmg.jus.br/pje/login.seam';
const PJE_BASE_URL = process.env.PJE_BASE_URL || 'https://pje.tjmg.jus.br';

const DATA_DIR = 'data/pje/tjmg/acervo';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Realiza login no PJE TJMG e lida com o Bad Request
 */
async function fazerLogin(page) {
  console.error('🔐 Fazendo login no PJE TJMG...\n');

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
  });

  await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  console.error('✅ Página inicial carregada');
  await delay(2000);

  // Procurar iframe SSO
  console.error('🔍 Procurando iframe SSO...');
  const frames = page.frames();
  const ssoFrame = frames.find(f => f.url().includes('sso.cloud.pje.jus.br'));

  if (!ssoFrame) {
    throw new Error('Iframe SSO não encontrado!');
  }

  console.error('✅ Iframe SSO encontrado');

  // Preencher CPF
  await ssoFrame.waitForSelector('input[name="username"]', { visible: true, timeout: 15000 });
  await ssoFrame.type('input[name="username"]', CPF);
  console.error('✅ CPF preenchido');
  await delay(1000);

  // Preencher senha
  await ssoFrame.waitForSelector('input[name="password"]', { visible: true, timeout: 10000 });
  await ssoFrame.type('input[name="password"]', SENHA);
  console.error('✅ Senha preenchida');
  await delay(1500);

  // Clicar em Entrar
  console.error('⏳ Clicando em Entrar...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
    ssoFrame.click('#kc-login'),
  ]);

  await delay(3000);

  // ⚠️ COMPORTAMENTO ESPECÍFICO DO TJMG: Bad Request
  const pageContent = await page.content();
  if (pageContent.toLowerCase().includes('bad request') || page.url().includes('400')) {
    console.error('⚠️  Detectado "Bad Request" (esperado no TJMG)');
    console.error('🔄 Fazendo refresh da página...');

    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await delay(3000);

    console.error('✅ Página recarregada com sucesso!');
  }

  console.error('✅ Login realizado!\n');
}

/**
 * Navega até o Acervo através dos menus
 */
async function navegarParaAcervo(page) {
  console.error('🧭 Navegando para Acervo...\n');

  // Passo 1: Abrir menu sanduíche
  console.error('📂 Abrindo menu sanduíche...');
  await page.evaluate(() => {
    const menuButton = document.querySelector('a.botao-menu');
    if (menuButton) menuButton.click();
  });
  await delay(1500);

  // Passo 2: Clicar em "Painel"
  console.error('📂 Clicando em Painel...');
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, li, button'));
    const painelLink = links.find(el => el.textContent.trim() === 'Painel');
    if (painelLink) painelLink.click();
  });
  await delay(1500);

  // Passo 3: Clicar em "Painel do representante processual"
  console.error('📂 Clicando em Painel do representante processual...');
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const painelRepLink = links.find(el =>
      el.textContent.toLowerCase().includes('painel do representante processual')
    );
    if (painelRepLink) painelRepLink.click();
  });

  // Aguarda navegação
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
  await delay(3000);

  console.error('✅ Painel do Advogado carregado');

  // Passo 4: Clicar no botão "ACERVO"
  console.error('📂 Clicando no botão ACERVO...');
  await page.evaluate(() => {
    const acervoElements = Array.from(document.querySelectorAll('*'));
    const acervoBtn = acervoElements.find(el => el.textContent.trim() === 'Acervo');
    if (acervoBtn) acervoBtn.click();
  });

  await delay(3000);
  console.error('✅ Acervo carregado!\n');
}

/**
 * Obtém lista de todas as regiões/jurisdições disponíveis
 */
async function obterRegioes(page) {
  console.error('🗺️  Obtendo lista de regiões...\n');

  const regioes = await page.evaluate(() => {
    const regioesList = [];
    const pageText = document.body.innerText;
    const linhas = pageText.split('\n');

    // Procurar por padrões de região com número de processos
    for (const linha of linhas) {
      // Padrão: "Nome da Região" seguido de número
      const match = linha.match(/^([A-Za-zÀ-ÿ\s\-]+?)\s+(\d+)$/);
      if (match) {
        const nome = match[1].trim();
        const quantidade = parseInt(match[2], 10);

        // Filtrar apenas regiões com processos
        if (quantidade > 0 && !nome.includes('Caixa de entrada')) {
          regioesList.push({ nome, quantidade });
        }
      }
    }

    return regioesList;
  });

  console.error(`✅ Encontradas ${regioes.length} regiões com processos\n`);
  return regioes;
}

/**
 * Extrai processos da página atual
 */
async function extrairProcessosDaPagina(page, regiao) {
  return await page.evaluate((nomeRegiao) => {
    const processos = [];
    const pageText = document.body.innerText;

    // Encontrar números de processo
    const regex = /(ProceComCiv|ExTEx|PAP|MSCiv|ExFis)\s+([\d\-\.]+)/g;
    let match;

    const linhas = pageText.split('\n');
    let processoAtual = null;

    for (const linha of linhas) {
      const linhaLimpa = linha.trim();

      // Detectar início de novo processo
      const matchNumero = linhaLimpa.match(/(ProceComCiv|ExTEx|PAP|MSCiv|ExFis)\s+([\d\-\.]+)/);
      if (matchNumero) {
        // Salvar processo anterior se existir
        if (processoAtual) {
          processos.push(processoAtual);
        }

        // Iniciar novo processo
        processoAtual = {
          numero: matchNumero[0],
          regiao: nomeRegiao,
          tipo: '',
          partes: '',
          vara: '',
          dataDistribuicao: '',
          ultimoMovimento: '',
          textoCompleto: []
        };
      }

      // Acumular linhas do processo atual
      if (processoAtual && linhaLimpa.length > 0) {
        processoAtual.textoCompleto.push(linhaLimpa);

        // Detectar campos específicos
        if (linhaLimpa.includes('Vara') || linhaLimpa.includes('Comarca')) {
          processoAtual.vara = linhaLimpa;
        }

        if (linhaLimpa.includes('Distribuído em')) {
          processoAtual.dataDistribuicao = linhaLimpa;
        }

        if (linhaLimpa.includes('Último movimento:')) {
          processoAtual.ultimoMovimento = linhaLimpa;
        }

        // Detectar partes (X na linha indica autor X réu)
        if (linhaLimpa.includes(' X ') && linhaLimpa.length > 20) {
          processoAtual.partes = linhaLimpa;
        }
      }
    }

    // Adicionar último processo
    if (processoAtual) {
      processos.push(processoAtual);
    }

    // Limpar textoCompleto (juntar em string única)
    return processos.map(p => ({
      ...p,
      textoCompleto: p.textoCompleto.join(' | ')
    }));
  }, regiao);
}

/**
 * Verifica se existe próxima página na paginação
 */
async function temProximaPagina(page) {
  return await page.evaluate(() => {
    const pageText = document.body.innerText;
    // Procurar por indicadores de paginação como "2 3 »" ou "Próxima"
    return pageText.includes('»') || pageText.includes('›');
  });
}

/**
 * Clica no botão de próxima página
 */
async function irParaProximaPagina(page) {
  await page.evaluate(() => {
    // Procurar por link/botão de próxima página
    const links = Array.from(document.querySelectorAll('a'));
    const proximaLink = links.find(link =>
      link.textContent.includes('»') ||
      link.textContent.includes('›') ||
      link.getAttribute('title')?.toLowerCase().includes('próxima')
    );

    if (proximaLink) {
      proximaLink.click();
    }
  });

  await delay(3000);
}

/**
 * Raspa todos os processos de uma região específica
 */
async function rasparRegiao(page, regiao) {
  console.error(`\n📦 Raspando região: ${regiao.nome} (${regiao.quantidade} processos)`);

  let todosProcessos = [];
  let paginaAtual = 1;

  try {
    // Expandir região
    console.error('   🔽 Expandindo região...');
    await page.evaluate((nomeRegiao) => {
      const elements = Array.from(document.querySelectorAll('*'));
      const regiaoElement = elements.find(el =>
        el.textContent.includes(nomeRegiao) &&
        el.querySelector && el.querySelector('a[href="#"]')
      );

      if (regiaoElement) {
        const expandLink = regiaoElement.querySelector('a[href="#"]');
        if (expandLink) expandLink.click();
      }
    }, regiao.nome);

    await delay(2000);

    // Clicar em "Caixa de entrada"
    console.error('   📥 Clicando em Caixa de entrada...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const caixaLink = links.find(link =>
        link.textContent.includes('Caixa de entrada')
      );

      if (caixaLink) caixaLink.click();
    });

    await delay(4000);

    // Extrair processos página por página
    while (true) {
      console.error(`   📄 Extraindo página ${paginaAtual}...`);

      const processosPagina = await extrairProcessosDaPagina(page, regiao.nome);
      todosProcessos = todosProcessos.concat(processosPagina);

      console.error(`      ✅ ${processosPagina.length} processos extraídos`);

      // Verificar se tem próxima página
      const temProxima = await temProximaPagina(page);
      if (!temProxima) {
        break;
      }

      // Ir para próxima página
      await irParaProximaPagina(page);
      paginaAtual++;
    }

    console.error(`   ✅ Total: ${todosProcessos.length} processos raspados\n`);

  } catch (error) {
    console.error(`   ❌ Erro ao raspar região ${regiao.nome}: ${error.message}\n`);
  }

  return todosProcessos;
}

/**
 * Função principal
 */
async function rasparAcervoGeralTJMG() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║     RASPAGEM: ACERVO GERAL - PJE TJMG 1º GRAU                    ║');
  console.error('╚═══════════════════════════════════════════════════════════════════╝\n');

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
    // Passo 1: Login
    await fazerLogin(page);

    // Passo 2: Navegar para Acervo
    await navegarParaAcervo(page);

    // Passo 3: Obter lista de regiões
    const regioes = await obterRegioes(page);

    // Passo 4: Raspar cada região
    const todosProcessos = [];

    for (const regiao of regioes) {
      const processosRegiao = await rasparRegiao(page, regiao);
      todosProcessos.push(...processosRegiao);
    }

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL:');
    console.error('='.repeat(70));
    console.error(`Total de regiões processadas: ${regioes.length}`);
    console.error(`Total de processos extraídos: ${todosProcessos.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/acervo-geral-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJMG',
        grau: '1g',
        totalProcessos: todosProcessos.length,
        totalRegioes: regioes.length,
        regioes: regioes,
        processos: todosProcessos
      }, null, 2));

      console.error(`💾 Dados salvos em: ${outputFile}\n`);
    }

    // Output para stdout (JSON puro)
    console.log(JSON.stringify(todosProcessos));

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

rasparAcervoGeralTJMG().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

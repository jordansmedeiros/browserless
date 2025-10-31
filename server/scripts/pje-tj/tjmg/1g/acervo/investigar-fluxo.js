/**
 * Script de Investigação - Fluxo de Navegação PJE TJMG 1º Grau
 * 
 * Objetivo: Mapear o fluxo correto pós-login e identificar seletores corretos
 * 
 * Execução: node server/scripts/pje-tj/tjmg/1g/acervo/investigar-fluxo.js
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();
puppeteer.use(StealthPlugin());

const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;
const PJE_LOGIN_URL = 'https://pje.tjmg.jus.br/pje/login.seam';
const DEBUG_DIR = 'server/scripts/pje-tj/tjmg/1g/acervo/debug';

if (!CPF || !SENHA) {
  console.error('❌ Configure PJE_CPF e PJE_SENHA no .env');
  process.exit(1);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Armazenar requisições de rede
const networkLog = [];

/**
 * Captura screenshot e salva informações da página
 */
async function capturarEstado(page, step, descricao) {
  console.error(`\n${'='.repeat(70)}`);
  console.error(`📸 STEP ${step}: ${descricao}`);
  console.error('='.repeat(70));

  const screenshotPath = `${DEBUG_DIR}/tjmg-step${step}-${descricao.toLowerCase().replace(/\s+/g, '-')}.png`;
  
  try {
    // Screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`✅ Screenshot: ${screenshotPath}`);

    // URL atual
    const url = page.url();
    console.error(`📍 URL: ${url}`);

    // Título
    const title = await page.title();
    console.error(`📄 Título: ${title}`);

    // Extrair estrutura HTML relevante
    const pageInfo = await page.evaluate(() => {
      // Função auxiliar para obter seletor CSS de um elemento
      const getSelector = (element) => {
        if (element.id) return `#${element.id}`;
        if (element.className && typeof element.className === 'string') {
          const classes = element.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) return `.${classes.join('.')}`;
        }
        return element.tagName.toLowerCase();
      };

      // Extrair todos os links visíveis
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent.trim(),
        href: a.href,
        selector: getSelector(a),
        visible: a.offsetParent !== null,
        classes: a.className,
        id: a.id
      })).filter(l => l.visible && l.text.length > 0);

      // Extrair botões visíveis
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        selector: getSelector(btn),
        visible: btn.offsetParent !== null,
        classes: btn.className,
        id: btn.id,
        type: btn.type
      })).filter(b => b.visible && b.text.length > 0);

      // Extrair elementos de menu/navbar
      const menus = Array.from(document.querySelectorAll('nav, .navbar, .menu, [role="navigation"]')).map(menu => ({
        selector: getSelector(menu),
        html: menu.innerHTML.substring(0, 500), // Primeiros 500 chars
        classes: menu.className
      }));

      // Extrair elementos com texto "painel", "acervo", "processos"
      const keywords = ['painel', 'acervo', 'processo', 'caixa', 'entrada'];
      const relevantElements = [];
      
      for (const keyword of keywords) {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent.toLowerCase();
          return text.includes(keyword) && el.children.length < 5; // Evitar containers grandes
        }).slice(0, 10); // Limitar a 10 por keyword

        elements.forEach(el => {
          relevantElements.push({
            keyword,
            text: el.textContent.trim().substring(0, 100),
            tag: el.tagName,
            selector: getSelector(el),
            classes: el.className,
            id: el.id
          });
        });
      }

      return {
        links: links.slice(0, 50), // Limitar output
        buttons: buttons.slice(0, 30),
        menus,
        relevantElements
      };
    });

    // Salvar informações em JSON
    const infoPath = `${DEBUG_DIR}/tjmg-step${step}-info.json`;
    await fs.writeFile(infoPath, JSON.stringify({
      step,
      descricao,
      url,
      title,
      timestamp: new Date().toISOString(),
      pageInfo,
      recentNetworkRequests: networkLog.slice(-10) // Últimas 10 requisições
    }, null, 2));
    console.error(`✅ Info salva: ${infoPath}`);

    // Log de elementos relevantes encontrados
    console.error(`\n📋 Elementos encontrados:`);
    console.error(`   Links visíveis: ${pageInfo.links.length}`);
    console.error(`   Botões visíveis: ${pageInfo.buttons.length}`);
    console.error(`   Menus/navbars: ${pageInfo.menus.length}`);
    console.error(`   Elementos relevantes: ${pageInfo.relevantElements.length}`);

    // Mostrar links com "painel" ou "acervo"
    const painelLinks = pageInfo.links.filter(l => 
      l.text.toLowerCase().includes('painel') || 
      l.text.toLowerCase().includes('acervo')
    );
    if (painelLinks.length > 0) {
      console.error(`\n🔍 Links com "painel" ou "acervo":`);
      painelLinks.forEach(link => {
        console.error(`   - "${link.text}" | Selector: ${link.selector}`);
      });
    }

  } catch (error) {
    console.error(`❌ Erro ao capturar estado: ${error.message}`);
  }

  console.error('='.repeat(70));
}

/**
 * Login no PJE TJMG
 */
async function fazerLogin(page) {
  console.error('🔐 Iniciando login...\n');

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
  });

  await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await delay(2000);

  // Procurar iframe SSO
  const frames = page.frames();
  const ssoFrame = frames.find(f => f.url().includes('sso.cloud.pje.jus.br'));

  if (!ssoFrame) {
    throw new Error('Iframe SSO não encontrado!');
  }

  console.error('✅ Iframe SSO encontrado');

  // Preencher credenciais
  await ssoFrame.waitForSelector('input[name="username"]', { visible: true, timeout: 15000 });
  await ssoFrame.type('input[name="username"]', CPF);
  await delay(1000);

  await ssoFrame.waitForSelector('input[name="password"]', { visible: true, timeout: 10000 });
  await ssoFrame.type('input[name="password"]', SENHA);
  await delay(1500);

  // Clicar em Entrar
  await ssoFrame.click('#kc-login');
  console.error('✅ Botão de login clicado');

  // Aguardar e fazer reload (comportamento específico TJMG)
  await delay(3000);
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await delay(3000);

  console.error('✅ Login concluído!\n');
}

/**
 * Investigar navegação passo a passo
 */
async function investigarFluxo(page) {
  // STEP 1: Pós-login
  await capturarEstado(page, 1, 'pos-login');
  await delay(2000);

  // STEP 2: Tentar abrir menu sanduíche
  console.error('\n🔍 Tentando abrir menu sanduíche...');
  const menuAberto = await page.evaluate(() => {
    const menuBtn = document.querySelector('a.botao-menu');
    if (menuBtn) {
      menuBtn.click();
      return true;
    }
    return false;
  });
  
  if (menuAberto) {
    console.error('✅ Menu sanduíche clicado');
    await delay(2000);
    await capturarEstado(page, 2, 'menu-aberto');
  } else {
    console.error('⚠️  Menu sanduíche não encontrado');
    await capturarEstado(page, 2, 'menu-nao-encontrado');
  }

  // STEP 3: Procurar e clicar em "Painel"
  console.error('\n🔍 Procurando link "Painel"...');
  const painelClicado = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, li, button'));
    const painelLink = links.find(el => el.textContent.trim() === 'Painel');
    if (painelLink) {
      console.log('Encontrado elemento Painel:', painelLink);
      painelLink.click();
      return true;
    }
    return false;
  });

  if (painelClicado) {
    console.error('✅ Link "Painel" clicado');
    await delay(2000);
    await capturarEstado(page, 3, 'painel-clicado');
  } else {
    console.error('⚠️  Link "Painel" não encontrado');
    await capturarEstado(page, 3, 'painel-nao-encontrado');
  }

  // STEP 4: Procurar e clicar em "Painel do Representante Processual"
  console.error('\n🔍 Procurando "Painel do Representante Processual"...');
  
  // Extrair todos os links com "representante" ou "processual"
  const opcoesDisponiveis = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links
      .filter(l => {
        const text = l.textContent.toLowerCase();
        return text.includes('painel') || text.includes('representante') || text.includes('processual');
      })
      .map(l => ({
        text: l.textContent.trim(),
        href: l.href,
        classes: l.className
      }));
  });

  console.error(`\n📋 Opções disponíveis com "painel", "representante" ou "processual":`);
  opcoesDisponiveis.forEach((opt, idx) => {
    console.error(`   ${idx + 1}. "${opt.text}"`);
  });

  const representanteClicado = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const repLink = links.find(el =>
      el.textContent.toLowerCase().includes('painel do representante processual')
    );
    if (repLink) {
      console.log('Encontrado elemento Painel do Representante:', repLink);
      repLink.click();
      return true;
    }
    return false;
  });

  if (representanteClicado) {
    console.error('✅ "Painel do Representante Processual" clicado');
    await delay(5000);
    await capturarEstado(page, 4, 'painel-representante');
  } else {
    console.error('⚠️  "Painel do Representante Processual" não encontrado');
    await capturarEstado(page, 4, 'representante-nao-encontrado');
  }

  // STEP 5: Procurar navbar e botão "Acervo"
  console.error('\n🔍 Procurando navbar e botão "Acervo"...');
  
  const navbarInfo = await page.evaluate(() => {
    // Procurar por elementos com "acervo"
    const acervoElements = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const text = el.textContent.toLowerCase();
        return text.includes('acervo') && el.children.length < 3;
      })
      .map(el => ({
        text: el.textContent.trim().substring(0, 50),
        tag: el.tagName,
        classes: el.className,
        id: el.id,
        clickable: el.tagName === 'A' || el.tagName === 'BUTTON' || el.onclick !== null
      }));

    return { acervoElements };
  });

  console.error(`\n📋 Elementos com "acervo" encontrados: ${navbarInfo.acervoElements.length}`);
  navbarInfo.acervoElements.forEach((el, idx) => {
    console.error(`   ${idx + 1}. [${el.tag}] "${el.text}" | Clickable: ${el.clickable}`);
  });

  await capturarEstado(page, 5, 'navbar-acervo');

  // Tentar clicar em "Acervo"
  const acervoClicado = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const acervoBtn = elements.find(el => el.textContent.trim() === 'Acervo');
    if (acervoBtn) {
      console.log('Encontrado elemento Acervo:', acervoBtn);
      acervoBtn.click();
      return true;
    }
    return false;
  });

  if (acervoClicado) {
    console.error('✅ Botão "Acervo" clicado');
    await delay(3000);
    await capturarEstado(page, 6, 'acervo-carregado');
  } else {
    console.error('⚠️  Botão "Acervo" não encontrado');
    await capturarEstado(page, 6, 'acervo-nao-encontrado');
  }

  // STEP 7: Analisar estrutura de processos (se chegou até aqui)
  console.error('\n🔍 Analisando estrutura de processos/regiões...');
  
  const estruturaProcessos = await page.evaluate(() => {
    const pageText = document.body.innerText;
    
    // Procurar por padrões de região/processos
    const linhas = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Procurar por números (possíveis contadores de processos)
    const linhesComNumeros = linhas.filter(l => /\d+/.test(l)).slice(0, 50);
    
    // Procurar por elementos de lista/tabela
    const listas = Array.from(document.querySelectorAll('ul, ol, table')).map(el => ({
      tag: el.tagName,
      itemCount: el.querySelectorAll('li, tr').length,
      classes: el.className,
      preview: el.textContent.substring(0, 200)
    }));

    return {
      totalLinhas: linhas.length,
      linhesComNumeros,
      listas
    };
  });

  console.error(`\n📋 Estrutura da página:`);
  console.error(`   Total de linhas de texto: ${estruturaProcessos.totalLinhas}`);
  console.error(`   Linhas com números: ${estruturaProcessos.linhesComNumeros.length}`);
  console.error(`   Listas/Tabelas: ${estruturaProcessos.listas.length}`);

  await capturarEstado(page, 7, 'estrutura-processos');
}

/**
 * Main
 */
async function main() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║        INVESTIGAÇÃO DO FLUXO DE NAVEGAÇÃO - PJE TJMG 1º GRAU     ║');
  console.error('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Criar diretório de debug
  await fs.mkdir(DEBUG_DIR, { recursive: true });
  console.error(`✅ Diretório criado: ${DEBUG_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: false, // Navegador visível
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();

  // Monitorar requisições de rede
  page.on('request', request => {
    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      networkLog.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async response => {
    if (response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
      networkLog.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
    }
  });

  try {
    // Fazer login
    await fazerLogin(page);

    // Investigar fluxo
    await investigarFluxo(page);

    console.error('\n✅ Investigação concluída!');
    console.error(`📁 Verifique os arquivos em: ${DEBUG_DIR}/\n`);
    console.error('👁️  Navegador ficará aberto para inspeção manual.');
    console.error('    Pressione Ctrl+C quando terminar.\n');

    // Salvar log completo de rede
    await fs.writeFile(
      `${DEBUG_DIR}/network-log.json`,
      JSON.stringify(networkLog, null, 2)
    );
    console.error(`✅ Log de rede salvo: ${DEBUG_DIR}/network-log.json\n`);

  } catch (error) {
    console.error(`\n❌ ERRO: ${error.message}`);
    console.error(error.stack);

    try {
      await page.screenshot({ path: `${DEBUG_DIR}/erro-fatal.png`, fullPage: true });
      console.error(`📸 Screenshot de erro: ${DEBUG_DIR}/erro-fatal.png`);
    } catch (e) {}
  }
}

main().catch(console.error);

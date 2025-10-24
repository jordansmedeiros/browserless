/**
 * Captura chamadas de API do PJE
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Intercepta todas as chamadas de API
 * 3. Navega para "Pendentes de Manifestação"
 * 4. Captura e salva o JSON de resposta
 *
 * COMO USAR:
 * 1. Atualize CPF e SENHA abaixo
 * 2. Execute: node scripts/pje/capturar-api.js
 * 3. Veja os JSONs salvos em: data/pje/
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
const DATA_DIR = 'data/pje';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Armazena todas as requisições de API capturadas
const apiRequests = [];

async function capturarAPIs() {
  console.log('🚀 Iniciando captura de APIs do PJE...\n');

  // Criar diretório de dados
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

  // ====================================================================
  // INTERCEPTAÇÃO DE REQUISIÇÕES DE REDE
  // ====================================================================

  console.log('📡 Configurando interceptação de requisições...\n');

  // Captura TODAS as respostas de rede
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    const method = response.request().method();

    // Filtra apenas requisições de API (JSON)
    const contentType = response.headers()['content-type'] || '';

    if (contentType.includes('application/json')) {
      console.log(`📥 [${method}] ${status} ${url}`);

      try {
        const json = await response.json();

        // Salva a requisição
        const requestData = {
          timestamp: new Date().toISOString(),
          method,
          url,
          status,
          headers: response.headers(),
          body: json,
        };

        apiRequests.push(requestData);

        // Se for uma requisição importante, salva em arquivo individual
        if (url.includes('processo') ||
            url.includes('painel') ||
            url.includes('acervo') ||
            url.includes('pendente')) {

          const filename = `${DATA_DIR}/api-${Date.now()}-${method}.json`;
          await fs.writeFile(filename, JSON.stringify(requestData, null, 2));
          console.log(`   💾 Salvo em: ${filename}\n`);
        }

      } catch (e) {
        // Resposta não é JSON válido ou já foi consumida
      }
    }
  });

  // ====================================================================
  // LOGIN NO PJE
  // ====================================================================

  try {
    console.log('🔧 Configurando anti-detecção...');

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
    });

    console.log('🌐 Navegando para página de login...');
    await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(1500);

    // Clica em "Entrar com PDPJ"
    console.log('🔍 Procurando botão "Entrar com PDPJ"...');
    await page.waitForSelector('#btnSsoPdpj', { visible: true, timeout: 10000 });

    const pdpjButton = await page.$('#btnSsoPdpj');
    if (pdpjButton) {
      const box = await pdpjButton.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await delay(500);
      }
    }

    console.log('👆 Clicando em "Entrar com PDPJ"...\n');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('#btnSsoPdpj'),
    ]);

    // Preenche CPF
    await delay(2000);
    console.log('👤 Preenchendo CPF...');
    await page.waitForSelector('#username', { visible: true, timeout: 10000 });
    await page.click('#username');
    await delay(500);

    for (const char of CPF) {
      await page.type('#username', char, { delay: Math.random() * 100 + 50 });
    }
    console.log('   ✓ CPF preenchido\n');

    // Preenche Senha
    await delay(1000);
    console.log('🔒 Preenchendo senha...');
    await page.waitForSelector('#password', { visible: true, timeout: 10000 });
    await page.click('#password');
    await delay(500);

    for (const char of SENHA) {
      await page.type('#password', char, { delay: Math.random() * 100 + 50 });
    }
    console.log('   ✓ Senha preenchida\n');

    // Clica em Entrar
    await delay(1500);
    console.log('👆 Clicando em Entrar...');

    const loginButton = await page.$('#kc-login');
    if (loginButton) {
      const box = await loginButton.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await delay(300);
      }
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    console.log('✅ Login realizado!\n');
    await delay(5000);

    // ====================================================================
    // NAVEGAÇÃO ATÉ PENDENTES DE MANIFESTAÇÃO
    // ====================================================================

    const currentUrl = page.url();
    console.log(`📍 URL atual: ${currentUrl}\n`);

    if (currentUrl.includes('pje.trt3.jus.br')) {
      console.log('✅ Logado no sistema PJE!\n');

      // Aguarda a página carregar completamente
      await delay(3000);

      console.log('🔍 Procurando "Pendentes de Manifestação"...\n');

      try {
        // Usa JavaScript para encontrar e clicar no elemento
        // Procura por div que contenha o texto "Pendentes de Manifestação"
        const clickedPendentes = await page.evaluate(() => {
          // Procura todos os elementos que contenham o texto
          const elements = Array.from(document.querySelectorAll('div, a, button, span'));
          const pendentesElement = elements.find(el =>
            el.textContent.includes('Pendentes de Manifestação') &&
            el.textContent.includes('107')
          );

          if (pendentesElement) {
            // Procura o elemento clicável pai
            let clickable = pendentesElement;
            while (clickable && clickable.tagName !== 'A' && clickable.tagName !== 'BUTTON' && !clickable.onclick) {
              clickable = clickable.parentElement;
            }

            if (clickable) {
              clickable.click();
              return true;
            }
          }
          return false;
        });

        if (clickedPendentes) {
          console.log('✅ Clicou em "Pendentes de Manifestação"!\n');
          await delay(5000); // Aguarda a página carregar
        } else {
          console.log('⚠️  Não encontrou o botão "Pendentes de Manifestação"\n');
          console.log('   Tentando navegar diretamente pela URL...\n');

          // Tenta navegar diretamente se conhecer a URL
          // Descobrimos que idAgrupamentoProcessoTarefa=2 é Pendentes de Manifestação
          await page.goto('https://pje.trt3.jus.br/pjekz/painel/usuario-externo?idAgrupamentoProcessoTarefa=2', {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          await delay(5000);
        }

      } catch (e) {
        console.error('❌ Erro ao procurar botão:', e.message);
      }

      // Aguarda requisições de API
      console.log('\n⏳ Aguardando requisições de API...\n');
      await delay(5000);

      // Salva todas as requisições capturadas
      const allRequestsFile = `${DATA_DIR}/todas-requisicoes-${Date.now()}.json`;
      await fs.writeFile(allRequestsFile, JSON.stringify(apiRequests, null, 2));
      console.log(`\n💾 Todas as requisições salvas em: ${allRequestsFile}\n`);

      console.log(`\n📊 Total de requisições de API capturadas: ${apiRequests.length}\n`);

      // Mostra resumo das URLs capturadas
      console.log('📋 URLs de API capturadas:\n');
      const uniqueUrls = [...new Set(apiRequests.map(r => r.url))];
      uniqueUrls.forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
      });

      console.log('\n👁️  Navegador ficará aberto para inspeção.');
      console.log('    Pressione Ctrl+C quando terminar.\n');

    } else {
      console.log('❌ Erro: não foi possível fazer login\n');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);

    await page.screenshot({ path: `${DATA_DIR}/erro-${Date.now()}.png`, fullPage: true });
  }

  // Navegador fica aberto para inspeção
  // await browser.close();
}

// Executa
console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║              CAPTURA DE APIs DO PJE                               ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

capturarAPIs().catch(console.error);

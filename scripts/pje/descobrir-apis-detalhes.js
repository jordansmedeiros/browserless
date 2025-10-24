/**
 * Script para descobrir as APIs de:
 * 1. Lista de processos associados
 * 2. Visualização de documentos/atos
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

puppeteer.use(StealthPlugin());

const CPF = '07529294610';
const SENHA = '12345678A@';
const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function descobrirAPIs() {
  const browser = await puppeteer.launch({
    headless: false, // Modo visual para ver a interação
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const page = await browser.newPage();
  const apiCalls = [];

  // Intercepta TODAS as respostas da API
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';

    if (contentType.includes('application/json') && url.includes('/pje')) {
      try {
        const json = await response.json();
        apiCalls.push({
          timestamp: new Date().toISOString(),
          method: response.request().method(),
          url,
          status: response.status(),
          body: json,
        });
        console.log(`📡 API capturada: ${response.request().method()} ${url}`);
      } catch (e) {
        // Ignora erros de parsing
      }
    }
  });

  try {
    console.log('🔐 Login...\n');

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
    });

    await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2' });
    await delay(1500);

    await page.waitForSelector('#btnSsoPdpj', { visible: true });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#btnSsoPdpj'),
    ]);

    await delay(2000);
    await page.waitForSelector('#username', { visible: true });
    await page.type('#username', CPF);
    await delay(1000);

    await page.waitForSelector('#password', { visible: true });
    await page.type('#password', SENHA);
    await delay(1500);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    console.log('✅ Login OK!\n');
    await delay(5000);

    // Navega para Pendentes de Manifestação
    console.log('📋 Navegando para Pendentes de Manifestação...\n');
    await page.goto('https://pje.trt3.jus.br/pjekz/painel/usuario-externo', { waitUntil: 'networkidle2' });
    await delay(3000);

    // Clica no card de Pendentes
    const clickedPendentes = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('mat-card'));
      const pendenteCard = cards.find(card =>
        card.textContent.includes('Pendentes de Manifestação')
      );
      if (pendenteCard) {
        pendenteCard.click();
        return true;
      }
      return false;
    });

    if (!clickedPendentes) {
      console.log('❌ Não encontrou o card de Pendentes');
      return;
    }

    console.log('✅ Clicou em Pendentes de Manifestação\n');
    await delay(5000);

    // Procura um processo com associação (0010346-97.2025.5.03.0107)
    console.log('🔍 Procurando processo 0010346-97.2025.5.03.0107...\n');

    // Tenta encontrar e clicar no botão de processos associados
    const clickedAssociados = await page.evaluate(() => {
      // Procura pela linha do processo
      const rows = Array.from(document.querySelectorAll('tr'));
      const processoRow = rows.find(row =>
        row.textContent.includes('0010346-97.2025.5.03.0107')
      );

      if (processoRow) {
        // Procura o botão de processos associados (ícone de link)
        const btnAssociados = processoRow.querySelector('button[aria-label*="Processos associados"], button[mattooltip*="Processos Associados"]');
        if (btnAssociados) {
          console.log('Clicando em Processos Associados...');
          btnAssociados.click();
          return true;
        }
      }
      return false;
    });

    if (clickedAssociados) {
      console.log('✅ Clicou em Processos Associados!\n');
      await delay(3000);
    } else {
      console.log('⚠️  Botão de Processos Associados não encontrado\n');
    }

    // Tenta encontrar e clicar no botão de Visualizar Ato
    const clickedVisualizarAto = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const processoRow = rows.find(row =>
        row.textContent.includes('0010346-97.2025.5.03.0107')
      );

      if (processoRow) {
        // Procura o botão de visualizar ato (ícone de PDF)
        const btnVisualizar = processoRow.querySelector('button[aria-label*="Visualizar Expediente"], button[mattooltip*="Visualizar Ato"]');
        if (btnVisualizar) {
          console.log('Clicando em Visualizar Ato...');
          btnVisualizar.click();
          return true;
        }
      }
      return false;
    });

    if (clickedVisualizarAto) {
      console.log('✅ Clicou em Visualizar Ato!\n');
      await delay(5000);
    } else {
      console.log('⚠️  Botão de Visualizar Ato não encontrado\n');
    }

    // Aguarda um pouco mais para capturar quaisquer APIs tardias
    await delay(3000);

    // Salva todas as APIs capturadas
    await fs.writeFile(
      'data/pje/apis-descobertas.json',
      JSON.stringify(apiCalls, null, 2)
    );

    console.log(`\n📊 Total de APIs capturadas: ${apiCalls.length}`);
    console.log('✅ Salvo em: data/pje/apis-descobertas.json\n');

    // Mostra as APIs mais relevantes
    const relevantes = apiCalls.filter(api =>
      api.url.includes('/associad') ||
      api.url.includes('/documento') ||
      api.url.includes('/expediente') ||
      api.url.includes('/ato')
    );

    if (relevantes.length > 0) {
      console.log('🎯 APIs relevantes encontradas:');
      relevantes.forEach(api => {
        console.log(`   ${api.method} ${api.url}`);
      });
    }

    // Aguarda para você ver a tela
    console.log('\n⏸️  Aguardando 30 segundos para você visualizar...');
    await delay(30000);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

descobrirAPIs().catch(console.error);

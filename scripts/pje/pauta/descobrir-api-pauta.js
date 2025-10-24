/**
 * Script para descobrir a API de busca de pauta
 * Preenche os filtros de data e clica em buscar
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

puppeteer.use(StealthPlugin());

const CPF = '07529294610';
const SENHA = '12345678A@';
const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';
const PAUTA_URL = 'https://pje.trt3.jus.br/pjekz/pauta-usuarios-externos';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function descobrirAPIPauta() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const apiCalls = [];

  // Intercepta respostas
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
        console.log(`📡 ${response.request().method()} ${url}`);
      } catch (e) {
        // Ignora
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

    // Navega para Minha Pauta
    console.log('📋 Navegando para Minha Pauta...\n');
    await page.goto(PAUTA_URL, { waitUntil: 'networkidle2' });
    await delay(5000);

    // Calcula datas
    const hoje = new Date();
    const dataInicial = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;
    const proximoAno = hoje.getFullYear() + 1;
    const dataFinal = `31/12/${proximoAno}`;

    console.log(`📅 Preenchendo filtros de data:`);
    console.log(`   Data inicial: ${dataInicial}`);
    console.log(`   Data final: ${dataFinal}\n`);

    // Tenta preencher os campos
    const preenchido = await page.evaluate(async (dataIni, dataFim) => {
      // Busca os inputs de datepicker
      const inputs = document.querySelectorAll('.mat-datepicker-input');

      if (inputs.length >= 2) {
        // Primeiro input = data inicial
        inputs[0].value = dataIni;
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));

        // Segundo input = data final
        inputs[1].value = dataFim;
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].dispatchEvent(new Event('change', { bubbles: true }));

        return {
          sucesso: true,
          inputs: inputs.length,
        };
      }

      return {
        sucesso: false,
        inputs: inputs.length,
      };
    }, dataInicial, dataFinal);

    console.log('Resultado do preenchimento:', preenchido);

    await delay(2000);

    // Procura e clica no botão de buscar/pesquisar
    console.log('\n🔍 Procurando botão de buscar...\n');

    const botaoClicado = await page.evaluate(() => {
      // Procura botões com textos relevantes
      const botoes = Array.from(document.querySelectorAll('button'));
      const botaoBuscar = botoes.find(btn =>
        btn.textContent.toLowerCase().includes('buscar') ||
        btn.textContent.toLowerCase().includes('pesquisar') ||
        btn.textContent.toLowerCase().includes('filtrar') ||
        btn.textContent.toLowerCase().includes('consultar')
      );

      if (botaoBuscar) {
        botaoBuscar.click();
        return {
          sucesso: true,
          texto: botaoBuscar.textContent,
        };
      }

      return { sucesso: false };
    });

    console.log('Botão de buscar:', botaoClicado);

    // Aguarda as APIs carregarem
    await delay(10000);

    // Salva APIs
    await fs.writeFile(
      'data/pje/apis-pauta-busca.json',
      JSON.stringify(apiCalls, null, 2)
    );

    console.log(`\n📊 Total de APIs: ${apiCalls.length}`);
    console.log('✅ Salvo em: data/pje/apis-pauta-busca.json\n');

    // Mostra APIs relevantes
    const relevantes = apiCalls.filter(api =>
      api.url.includes('/pauta') ||
      api.url.includes('/audiencia') ||
      api.url.includes('/sessao') ||
      api.url.toLowerCase().includes('search') ||
      api.url.toLowerCase().includes('busca')
    );

    if (relevantes.length > 0) {
      console.log('🎯 APIs de busca encontradas:');
      relevantes.forEach(api => {
        console.log(`   ${api.method} ${api.url}`);
      });
    }

    // Aguarda
    console.log('\n⏸️  Aguardando 60 segundos...');
    await delay(60000);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

descobrirAPIPauta().catch(console.error);

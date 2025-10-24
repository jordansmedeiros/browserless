/**
 * Script para explorar a página Minha Pauta e descobrir as APIs
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

async function explorarMinhaPauta() {
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
        console.log(`📡 API: ${response.request().method()} ${url}`);
      } catch (e) {
        // Ignora erros de parsing
      }
    }
  });

  try {
    console.log('🔐 Fazendo login...\n');

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

    console.log('📅 Aplicando filtros de data...\n');

    // Calcula as datas
    const hoje = new Date();
    const dataInicial = hoje.toLocaleDateString('pt-BR'); // DD/MM/YYYY

    const proximoAno = hoje.getFullYear() + 1;
    const dataFinal = `31/12/${proximoAno}`;

    console.log(`   Data inicial: ${dataInicial}`);
    console.log(`   Data final: ${dataFinal}\n`);

    // Tenta preencher os campos de data
    const filtrosAplicados = await page.evaluate(async (dataIni, dataFim) => {
      // Busca campos de data por diferentes seletores possíveis
      const seletores = [
        'input[type="date"]',
        'input[formcontrolname*="data"]',
        'input[name*="data"]',
        'input[placeholder*="data"]',
        '.mat-datepicker-input',
      ];

      let camposEncontrados = [];

      for (const seletor of seletores) {
        const campos = document.querySelectorAll(seletor);
        if (campos.length > 0) {
          camposEncontrados.push({
            seletor,
            quantidade: campos.length,
          });
        }
      }

      return {
        camposEncontrados,
        dataIni,
        dataFim,
      };
    }, dataInicial, dataFinal);

    console.log('Campos de data encontrados:');
    console.log(JSON.stringify(filtrosAplicados, null, 2));

    // Aguarda um pouco para as APIs carregarem
    await delay(10000);

    // Salva todas as APIs capturadas
    await fs.writeFile(
      'data/pje/apis-minha-pauta.json',
      JSON.stringify(apiCalls, null, 2)
    );

    console.log(`\n📊 Total de APIs capturadas: ${apiCalls.length}`);
    console.log('✅ Salvo em: data/pje/apis-minha-pauta.json\n');

    // Mostra as APIs mais relevantes
    const relevantes = apiCalls.filter(api =>
      api.url.includes('/pauta') ||
      api.url.includes('/audiencia') ||
      api.url.includes('/sessao')
    );

    if (relevantes.length > 0) {
      console.log('🎯 APIs relevantes encontradas:');
      relevantes.forEach(api => {
        console.log(`   ${api.method} ${api.url}`);
      });
    }

    // Aguarda para você visualizar
    console.log('\n⏸️  Aguardando 60 segundos para você visualizar...');
    await delay(60000);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

explorarMinhaPauta().catch(console.error);

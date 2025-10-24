/**
 * Script de teste para capturar resposta COMPLETA da API
 * Inclui todos os campos, inclusive processos associados e documentos
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

puppeteer.use(StealthPlugin());

const CPF = '07529294610';
const SENHA = '12345678A@';
const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testarAPI() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const page = await browser.newPage();

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

    console.log('🔍 Buscando primeira página da API...\n');

    const idAdvogado = 29203;

    // Captura primeira página com TODOS os campos
    const resultado = await page.evaluate(async (id) => {
      const params = new URLSearchParams();
      params.append('agrupadorExpediente', 'N');
      params.append('agrupadorExpediente', 'C');
      params.append('pagina', 1);
      params.append('tamanhoPagina', 10); // Só 10 para testar
      params.append('tipoPainelAdvogado', 2);
      params.append('ordenacaoCrescente', false);
      params.append('idPainelAdvogadoEnum', 2);

      const url = `/pje-comum-api/api/paineladvogado/${id}/processos?${params.toString()}`;
      console.log('URL:', url);

      const response = await fetch(url);
      return await response.json();
    }, idAdvogado);

    console.log('📊 Total de processos retornados:', resultado.resultado?.length || 0);
    console.log('\n📋 Campos do primeiro processo:\n');

    if (resultado.resultado && resultado.resultado.length > 0) {
      const primeiro = resultado.resultado[0];
      console.log(JSON.stringify(primeiro, null, 2));

      // Salva resultado completo
      await fs.writeFile(
        'data/pje/teste-api-completa.json',
        JSON.stringify(resultado, null, 2)
      );
      console.log('\n✅ Salvo em: data/pje/teste-api-completa.json');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

testarAPI().catch(console.error);

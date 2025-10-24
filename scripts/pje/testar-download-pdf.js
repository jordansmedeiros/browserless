/**
 * Testa diferentes métodos para baixar o PDF
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';

puppeteer.use(StealthPlugin());

const CPF = '07529294610';
const SENHA = '12345678A@';
const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Processo de teste: 0010346-97.2025.5.03.0107
// ID: 2960827
// idDocumento: 231979445
// idBin: 231222889

async function testarDownload() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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

    // Testa diferentes URLs para baixar o PDF
    console.log('🧪 Testando diferentes URLs para download...\n');

    const idProcesso = 2960827;
    const idDocumento = 231979445;
    const idBin = 231222889;

    const urls = [
      `/pje-comum-api/api/binarios/${idBin}`,
      `/pje-comum-api/api/processos/id/${idProcesso}/documentos/id/${idDocumento}/pdf`,
      `/pje-comum-api/api/processos/id/${idProcesso}/documentos/id/${idDocumento}/conteudo`,
      `/pje-comum-api/binarios/${idBin}`,
      `/pjekz/processo/${idProcesso}/documento/${idDocumento}/pdf`,
    ];

    for (const url of urls) {
      console.log(`\nTestando: ${url}`);

      const resultado = await page.evaluate(async (testUrl) => {
        try {
          const response = await fetch(testUrl);
          return {
            status: response.status,
            contentType: response.headers.get('content-type'),
            ok: response.ok,
          };
        } catch (e) {
          return {error: e.message};
        }
      }, url);

      console.log('  Resultado:', JSON.stringify(resultado));

      if (resultado.ok && resultado.contentType?.includes('pdf')) {
        console.log('  ✅ Esta URL funciona!');
      }
    }

    // Aguarda para ver na tela
    console.log('\n⏸️  Aguardando 30 segundos...');
    await delay(30000);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

testarDownload().catch(console.error);

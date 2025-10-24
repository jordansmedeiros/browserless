/**
 * Teste de Anti-Detecção de Bot
 *
 * Este script testa se o navegador está sendo detectado como bot
 * Acesse https://bot.sannysoft.com/ para ver os resultados
 */

import puppeteer from 'puppeteer-core';

async function testarAntiDeteccao() {
  console.log('🔍 Iniciando teste de anti-detecção...\n');

  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://localhost:3000?token=6R0W53R135510',
  });

  const page = await browser.newPage();

  try {
    // Configurações anti-detecção
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Remove webdriver flag
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt', 'en-US', 'en'],
      });
    });

    console.log('1️⃣ Navegando para site de teste de bot...');
    await page.goto('https://bot.sannysoft.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Testes básicos
    console.log('\n📊 Resultados dos testes:\n');

    const webdriver = await page.evaluate(() => navigator.webdriver);
    console.log(`WebDriver: ${webdriver ? '❌ DETECTADO' : '✅ OCULTO'}`);

    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log(`User-Agent: ${userAgent.includes('HeadlessChrome') ? '❌ Headless detectado' : '✅ Normal'}`);

    const plugins = await page.evaluate(() => navigator.plugins.length);
    console.log(`Plugins: ${plugins === 0 ? '❌ Nenhum plugin (suspeito)' : `✅ ${plugins} plugins`}`);

    const languages = await page.evaluate(() => navigator.languages);
    console.log(`Languages: ${languages.length === 0 ? '❌ Vazio (suspeito)' : `✅ ${languages.join(', ')}`}`);

    const chrome = await page.evaluate(() => window.chrome !== undefined);
    console.log(`Chrome object: ${chrome ? '✅ Presente' : '❌ Ausente'}`);

    const permissions = await page.evaluate(() => navigator.permissions !== undefined);
    console.log(`Permissions API: ${permissions ? '✅ Presente' : '❌ Ausente'}`);

    // Screenshot da página de teste
    console.log('\n📸 Tirando screenshot da página de teste...');
    const screenshot = await page.screenshot({
      fullPage: true,
      path: 'test-anti-detection-result.png'
    });

    console.log('✅ Screenshot salvo: test-anti-detection-result.png');

    console.log('\n🎯 Teste completo! Abra o screenshot para ver os resultados visuais.');
    console.log('   Verde = Passou | Vermelho = Falhou\n');

    // Teste adicional no PJE
    console.log('2️⃣ Testando acesso ao PJE...');
    await page.goto('https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-trt3-1g&redirect_uri=https%3A%2F%2Fpje.trt3.jus.br%2Fprimeirograu%2FauthenticateSSO.seam&state=test&login=true&scope=openid', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const pjeUrl = page.url();
    const pjeTitle = await page.title();

    console.log(`URL: ${pjeUrl}`);
    console.log(`Título: ${pjeTitle}`);

    if (pjeUrl.includes('403') || pjeTitle.includes('403') || pjeTitle.includes('ERROR')) {
      console.log('❌ PJE ainda detectou como bot (erro 403)');
    } else if (await page.$('#username')) {
      console.log('✅ PJE carregou a página de login normalmente!');
    } else {
      console.log('⚠️ PJE carregou, mas formato inesperado');
    }

    const pjeScreenshot = await page.screenshot({
      fullPage: true,
      path: 'test-pje-access.png'
    });

    console.log('📸 Screenshot do PJE salvo: test-pje-access.png\n');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado!');
  }
}

testarAntiDeteccao();

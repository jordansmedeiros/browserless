/**
 * Login PJE - Execução LOCAL com Navegador VISÍVEL
 *
 * Este script usa puppeteer-extra com Stealth Plugin e abre
 * o navegador Chromium para você VER a execução em tempo real.
 *
 * COMO USAR:
 * 1. Atualize suas credenciais abaixo (CPF e SENHA)
 * 2. Execute: node login-pje-local-visual.js
 * 3. O navegador vai abrir e você verá tudo acontecendo!
 *
 * DEPENDÊNCIAS:
 * npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Adiciona o plugin stealth ANTES de lançar o navegador
puppeteer.use(StealthPlugin());

// ⚠️ ATUALIZE SUAS CREDENCIAIS AQUI:
const CPF = '07529294610';
const SENHA = '12345678A@';

// URL de login do PJE
const LOGIN_URL = 'https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-trt3-1g&redirect_uri=https%3A%2F%2Fpje.trt3.jus.br%2Fprimeirograu%2FauthenticateSSO.seam&state=85669bbe-58c8-4f13-8597-8686e0a27bae&login=true&scope=openid';

// Função auxiliar para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executarLoginVisual() {
  console.log('🚀 Iniciando navegador com Stealth Plugin...\n');

  // Lança o navegador COM INTERFACE GRÁFICA (headless: false)
  const browser = await puppeteer.launch({
    headless: false,  // ← FALSO = mostra o navegador!
    defaultViewport: null, // Usa o tamanho da janela
    args: [
      '--start-maximized', // Inicia maximizado
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // Remove bandeiras de automação
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const page = await browser.newPage();

  try {
    console.log('🔧 Configurando anti-detecção...');

    // User-Agent realista
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    // Headers extras
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    });

    // Remove detecção de webdriver (redundante com stealth, mas não faz mal)
    await page.evaluateOnNewDocument(() => {
      // Remove navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Adiciona window.chrome
      window.chrome = { runtime: {} };

      // Adiciona plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Adiciona languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt', 'en-US', 'en'],
      });
    });

    console.log('🌐 Navegando para página de login...');
    console.log(`    ${LOGIN_URL}\n`);

    await page.goto(LOGIN_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('✅ Página carregada!\n');

    // Delay humano antes de interagir
    console.log('⏳ Aguardando 2 segundos (comportamento humano)...');
    await delay(2000);

    console.log('👤 Preenchendo CPF com digitação humana...');
    await page.waitForSelector('#username', { visible: true, timeout: 10000 });
    await page.click('#username');
    await delay(500);

    // Digita CARACTERE POR CARACTERE com delay aleatório
    for (let i = 0; i < CPF.length; i++) {
      const char = CPF[i];
      await page.type('#username', char, { delay: Math.random() * 100 + 50 });
      process.stdout.write(`\r    Digitando CPF: ${'*'.repeat(i + 1)}${' '.repeat(CPF.length - i - 1)}`);
    }
    console.log(' ✓\n');

    // Delay entre campos
    await delay(1000);

    console.log('🔒 Preenchendo senha com digitação humana...');
    await page.waitForSelector('#password', { visible: true, timeout: 10000 });
    await page.click('#password');
    await delay(500);

    // Digita senha caractere por caractere
    for (let i = 0; i < SENHA.length; i++) {
      const char = SENHA[i];
      await page.type('#password', char, { delay: Math.random() * 100 + 50 });
      process.stdout.write(`\r    Digitando senha: ${'*'.repeat(i + 1)}${' '.repeat(SENHA.length - i - 1)}`);
    }
    console.log(' ✓\n');

    // Delay antes de clicar no botão
    await delay(1500);

    console.log('🖱️  Simulando movimento do mouse até o botão...');

    // Simula movimento do mouse antes de clicar
    const loginButton = await page.$('#kc-login');
    if (loginButton) {
      const box = await loginButton.boundingBox();
      if (box) {
        // Move o mouse gradualmente até o botão (10 passos)
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await delay(300);
      }
    }

    console.log('👆 Clicando em Entrar...\n');

    // Clica e aguarda navegação
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    console.log('⏳ Aguardando redirecionamento...');
    await delay(3000);

    // Verifica resultado
    const currentUrl = page.url();
    const title = await page.title();

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO:');
    console.log('='.repeat(60));
    console.log(`📍 URL atual: ${currentUrl}`);
    console.log(`📄 Título: ${title}`);
    console.log('='.repeat(60) + '\n');

    if (currentUrl.includes('403') || title.includes('403') || title.includes('ERROR')) {
      console.error('❌ Erro 403 - CloudFront bloqueou o acesso');
      console.log('💡 Possíveis causas:');
      console.log('   - Múltiplas tentativas consecutivas');
      console.log('   - IP marcado como suspeito');
      console.log('   - Captcha adicional pode ter sido acionado');
      console.log('   - Tente aguardar alguns minutos antes de tentar novamente\n');
    } else if (currentUrl.includes('authenticateSSO') || currentUrl.includes('pje.trt3.jus.br')) {
      console.log('✅ Login realizado com sucesso!');
      console.log('🎉 Você foi redirecionado para o sistema PJE!\n');
    } else if (currentUrl === LOGIN_URL || currentUrl.includes('sso.cloud.pje.jus.br')) {
      console.log('⚠️  Ainda na página de login');
      console.log('   Verifique se as credenciais estão corretas\n');
    } else {
      console.log('⚠️  Resultado inesperado');
      console.log('   Verifique o navegador para mais detalhes\n');
    }

    // Tira screenshot
    console.log('📸 Tirando screenshot...');
    await page.screenshot({
      path: 'login-pje-resultado.png',
      fullPage: true
    });
    console.log('✅ Screenshot salvo: login-pje-resultado.png\n');

    console.log('👁️  O navegador ficará aberto para você inspecionar.');
    console.log('    Pressione Ctrl+C para fechar quando terminar.\n');

    // Mantém o navegador aberto para inspeção
    // await browser.close(); // ← Comentado para manter aberto

  } catch (error) {
    console.error('\n❌ Erro durante o processo:', error.message);
    console.error('Stack:', error.stack);

    // Captura informações úteis para debug
    try {
      const url = page.url();
      const title = await page.title();
      console.log(`\n📍 URL no momento do erro: ${url}`);
      console.log(`📄 Título no momento do erro: ${title}`);

      // Tenta tirar screenshot mesmo com erro
      await page.screenshot({
        path: 'login-pje-erro.png',
        fullPage: true
      });
      console.log('📸 Screenshot de erro salvo: login-pje-erro.png\n');
    } catch (e) {
      console.error('Não foi possível capturar informações adicionais');
    }

    console.log('👁️  O navegador ficará aberto para você inspecionar o erro.');
    console.log('    Pressione Ctrl+C para fechar quando terminar.\n');

    // Mantém o navegador aberto mesmo com erro
    // await browser.close(); // ← Comentado para manter aberto
  }
}

// Executa a função
executarLoginVisual().catch(console.error);

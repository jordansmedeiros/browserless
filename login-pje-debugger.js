/**
 * Login PJE para uso no Debugger do Browserless
 *
 * COMO USAR NO DEBUGGER:
 * 1. Abra: http://localhost:3000/debugger/?token=6R0W53R135510
 * 2. Cole este código completo no campo "Code"
 * 3. Clique em "Run"
 * 4. Veja o preview e os logs no console
 */

// ⚠️ ATUALIZE SUAS CREDENCIAIS AQUI:
const CPF = '07529294610';
const SENHA = '12345678A@';

// URL de login do PJE
const LOGIN_URL = 'https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-trt3-1g&redirect_uri=https%3A%2F%2Fpje.trt3.jus.br%2Fprimeirograu%2FauthenticateSSO.seam&state=85669bbe-58c8-4f13-8597-8686e0a27bae&login=true&scope=openid';

// Função auxiliar para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função principal
async function executarLogin() {
  try {
    console.log('🔧 Configurando anti-detecção...');

    // Configurações anti-detecção
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

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

    // Remove detecção de webdriver
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

    console.log('🌐 Navegando para página de login...');
    await page.goto(LOGIN_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Delay humano antes de interagir
    await delay(2000);

    console.log('👤 Preenchendo CPF...');
    await page.waitForSelector('#username', { visible: true });
    await page.click('#username');
    await delay(500);

    // Digita com delay humano (simula digitação real)
    for (const char of CPF) {
      await page.type('#username', char, { delay: Math.random() * 100 + 50 });
    }

    // Delay entre campos
    await delay(1000);

    console.log('🔒 Preenchendo senha...');
    await page.waitForSelector('#password', { visible: true });
    await page.click('#password');
    await delay(500);

    for (const char of SENHA) {
      await page.type('#password', char, { delay: Math.random() * 100 + 50 });
    }

    // Delay antes de clicar no botão
    await delay(1500);

    console.log('🖱️ Clicando em Entrar...');

    // Simula movimento do mouse antes de clicar
    const loginButton = await page.$('#kc-login');
    if (loginButton) {
      const box = await loginButton.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await delay(300);
      }
    }

    // Clica e aguarda navegação
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('#kc-login'),
    ]);

    console.log('⏳ Aguardando redirecionamento...');
    await delay(3000);

    // Verifica resultado
    const currentUrl = page.url();
    const title = await page.title();

    console.log('📍 URL atual:', currentUrl);
    console.log('📄 Título:', title);

    if (currentUrl.includes('403') || title.includes('403') || title.includes('ERROR')) {
      console.error('❌ Erro 403 - CloudFront bloqueou o acesso');
      console.log('💡 Tente novamente ou ajuste as configurações anti-detecção');
    } else if (currentUrl.includes('authenticateSSO')) {
      console.log('✅ Login realizado com sucesso!');
      console.log('🎉 Você foi redirecionado para o sistema');
    } else {
      console.log('⚠️ Resultado inesperado - verifique o preview');
    }

    // Tira screenshot
    console.log('📸 Tirando screenshot...');
    const screenshot = await page.screenshot({ fullPage: true });

    console.log('✨ Processo concluído!');
    console.log('👁️ Veja o resultado no preview ao lado');

    return screenshot;

  } catch (error) {
    console.error('❌ Erro durante o processo:', error.message);

    // Captura informações úteis para debug
    const url = page.url();
    const title = await page.title();
    console.log(`📍 URL no momento do erro: ${url}`);
    console.log(`📄 Título no momento do erro: ${title}`);

    // Tenta tirar screenshot mesmo com erro
    try {
      const errorScreenshot = await page.screenshot({ fullPage: true });
      console.log('📸 Screenshot de erro capturado');
      return errorScreenshot;
    } catch (e) {
      console.error('Não foi possível capturar screenshot do erro');
      throw error;
    }
  }
}

// Executa a função
await executarLogin();

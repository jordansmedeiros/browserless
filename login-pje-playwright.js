/**
 * Login PJE usando Playwright - Melhor evasão de detecção
 *
 * Use este endpoint com Playwright no Browserless:
 * POST /function?token=6R0W53R135510&launch={...}
 */

export default async ({ page, context }) => {
  const loginUrl = 'https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-trt3-1g&redirect_uri=https%3A%2F%2Fpje.trt3.jus.br%2Fprimeirograu%2FauthenticateSSO.seam&state=85669bbe-58c8-4f13-8597-8686e0a27bae&login=true&scope=openid';
  const cpf = '07529294610';
  const senha = '12345678A@';

  try {
    // Configurações anti-detecção para Playwright
    await context.addInitScript(() => {
      // Remove propriedades de webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Substitui navigator.plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Adiciona chrome property
      window.chrome = {
        runtime: {},
      };

      // Substitui permissions API
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    console.log('Navegando para página de login...');
    await page.goto(loginUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Espera a página carregar completamente
    await page.waitForLoadState('domcontentloaded');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Preenchendo CPF...');
    await page.waitForSelector('#username', { state: 'visible' });

    // Clica no campo e digita naturalmente
    await page.click('#username');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.fill('#username', cpf);
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log('Preenchendo senha...');
    await page.waitForSelector('#password', { state: 'visible' });
    await page.click('#password');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.fill('#password', senha);
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Clicando em Entrar...');

    // Simula hover antes de clicar
    await page.hover('#kc-login');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Clica e espera navegação
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      page.click('#kc-login'),
    ]);

    console.log('Login processado, aguardando redirecionamento...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Captura screenshot
    const screenshot = await page.screenshot({ fullPage: true });

    // Retorna informações úteis
    const url = page.url();
    const title = await page.title();
    console.log(`URL final: ${url}`);
    console.log(`Título: ${title}`);

    return {
      screenshot,
      url,
      title,
      success: !url.includes('error') && !url.includes('403')
    };

  } catch (error) {
    console.error('Erro:', error);

    const url = page.url();
    const title = await page.title();
    console.log(`URL no erro: ${url}`);
    console.log(`Título no erro: ${title}`);

    const errorScreenshot = await page.screenshot({ fullPage: true });

    throw new Error(`Falha no login: ${error.message}`);
  }
};

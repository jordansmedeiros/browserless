/**
 * Login PJE com Stealth Mode - Evita detecção de bot
 *
 * Para usar com Browserless, primeiro instale as dependências:
 * npm install puppeteer-extra puppeteer-extra-plugin-stealth
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Adiciona o plugin stealth para evitar detecção
puppeteer.use(StealthPlugin());

export default async ({ page }) => {
  const loginUrl = 'https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?response_type=code&client_id=pje-trt3-1g&redirect_uri=https%3A%2F%2Fpje.trt3.jus.br%2Fprimeirograu%2FauthenticateSSO.seam&state=85669bbe-58c8-4f13-8597-8686e0a27bae&login=true&scope=openid';
  const cpf = '07529294610';
  const senha = '12345678A@';

  try {
    // Configurações adicionais anti-detecção
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    // Define viewport como um navegador real
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Configura headers extras
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

    console.log('Navegando para página de login...');
    await page.goto(loginUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Delay humano antes de interagir
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Preenchendo CPF com digitação humana...');
    await page.waitForSelector('#username', { visible: true });

    // Digita com delay humano (simula digitação real)
    await page.click('#username');
    await new Promise(resolve => setTimeout(resolve, 500));
    for (const char of cpf) {
      await page.type('#username', char, { delay: Math.random() * 100 + 50 });
    }

    // Delay entre campos
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Preenchendo senha com digitação humana...');
    await page.waitForSelector('#password', { visible: true });
    await page.click('#password');
    await new Promise(resolve => setTimeout(resolve, 500));
    for (const char of senha) {
      await page.type('#password', char, { delay: Math.random() * 100 + 50 });
    }

    // Delay antes de clicar no botão
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Clicando em Entrar...');

    // Simula movimento do mouse antes de clicar
    const loginButton = await page.$('#kc-login');
    const box = await loginButton.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('#kc-login'),
    ]);

    console.log('Aguardando redirecionamento...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Tira screenshot da página resultante
    const screenshot = await page.screenshot({ fullPage: true });

    console.log('Processo concluído!');
    return screenshot;

  } catch (error) {
    console.error('Erro durante o processo:', error);

    // Captura informações úteis para debug
    const url = page.url();
    const title = await page.title();
    console.log(`URL atual: ${url}`);
    console.log(`Título: ${title}`);

    const errorScreenshot = await page.screenshot({ fullPage: true });

    throw new Error(`Falha no login: ${error.message}`);
  }
};

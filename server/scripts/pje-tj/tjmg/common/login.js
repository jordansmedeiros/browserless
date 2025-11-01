/**
 * Login PJE TJMG - Script Standalone para Testes Manuais
 *
 * ⚠️ IMPORTANTE:
 * Este script é apenas para TESTES MANUAIS. O sistema principal usa
 * credenciais do BANCO DE DADOS através do gerenciamento em /pje/credentials
 *
 * FLUXO COMPLETO TJMG:
 * 1. Acessa página de login do PJE TJMG
 * 2. Preenche CPF no iframe SSO
 * 3. Preenche senha no iframe SSO
 * 4. Clica em Entrar
 * 5. Aguarda redirecionamento
 * 6. ⚠️ COMPORTAMENTO ESPECÍFICO TJMG: Aparece "Bad Request"
 * 7. Faz refresh (F5) da página
 * 8. Sistema carrega normalmente
 *
 * COMO USAR:
 * node server/scripts/pje-tj/tjmg/common/login.js <CPF> <SENHA>
 * Exemplo: node server/scripts/pje-tj/tjmg/common/login.js 12345678900 minhasenha
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// ============================================================================
// CREDENCIAIS - CONFIGURE AQUI (HARDCODED)
// ============================================================================
const CPF = '07529294610'; // SUBSTITUA PELO SEU CPF
const SENHA = '12345678aA@'; // SUBSTITUA PELA SUA SENHA

const PJE_LOGIN_URL = 'https://pje.tjmg.jus.br/pje/login.seam';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executarLoginTJMG() {
  console.log('🚀 Iniciando navegador para PJE TJMG...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      window.chrome = { runtime: {} };
    });

    console.log('🌐 Navegando para página de login do PJE TJMG...');
    console.log(`    ${PJE_LOGIN_URL}\n`);

    await page.goto(PJE_LOGIN_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('✅ Página carregada!\n');
    await delay(2000);

    // Login no iframe SSO
    console.log('🔍 Procurando iframe SSO...');
    const frames = page.frames();
    const ssoFrame = frames.find(f => f.url().includes('sso.cloud.pje.jus.br'));

    if (!ssoFrame) {
      throw new Error('Iframe SSO não encontrado!');
    }

    console.log('✅ Iframe SSO encontrado!\n');

    // Preencher CPF
    console.log('👤 Preenchendo CPF...');
    await ssoFrame.waitForSelector('input[name="username"]', { visible: true, timeout: 15000 });
    await ssoFrame.type('input[name="username"]', CPF, { delay: 100 });
    console.log('✅ CPF preenchido\n');
    await delay(1000);

    // Preencher senha
    console.log('🔒 Preenchendo senha...');
    await ssoFrame.waitForSelector('input[name="password"]', { visible: true, timeout: 10000 });
    await ssoFrame.type('input[name="password"]', SENHA, { delay: 100 });
    console.log('✅ Senha preenchida\n');
    await delay(1500);

    // Clicar em Entrar
    console.log('👆 Clicando em Entrar...\n');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      ssoFrame.click('#kc-login'),
    ]);

    console.log('⏳ Aguardando redirecionamento...');
    await delay(3000);

    const currentUrl = page.url();
    console.log(`📍 URL atual: ${currentUrl}\n`);

    // ⚠️ COMPORTAMENTO ESPECÍFICO DO TJMG: Bad Request após login
    const pageContent = await page.content();
    if (pageContent.toLowerCase().includes('bad request') || currentUrl.includes('400')) {
      console.log('⚠️  Detectado "Bad Request" - comportamento esperado do TJMG!');
      console.log('🔄 Fazendo refresh da página (F5)...\n');

      await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
      await delay(3000);

      console.log('✅ Página recarregada com sucesso!\n');
    }

    const finalUrl = page.url();
    const title = await page.title();

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESULTADO FINAL:');
    console.log('='.repeat(70));
    console.log(`📍 URL final: ${finalUrl}`);
    console.log(`📄 Título: ${title}`);
    console.log('='.repeat(70) + '\n');

    if (finalUrl.includes('pje.tjmg.jus.br') && !finalUrl.includes('login')) {
      console.log('✅✅✅ LOGIN REALIZADO COM SUCESSO! ✅✅✅');
      console.log('🎉 Sistema PJE TJMG carregado!\n');
    } else {
      console.log('⚠️  Status do login incerto. Verifique o navegador.\n');
    }

    // Screenshot
    console.log('📸 Tirando screenshot...');
    await page.screenshot({
      path: 'login-tjmg-resultado.png',
      fullPage: true
    });
    console.log('✅ Screenshot salvo: login-tjmg-resultado.png\n');

    console.log('=' .repeat(70));
    console.log('👁️  O navegador ficará ABERTO para você inspecionar.');
    console.log('    Pressione Ctrl+C quando terminar.\n');
    console.log('=' .repeat(70) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO DURANTE O PROCESSO:');
    console.error('='.repeat(70));
    console.error(`Mensagem: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);

    try {
      const url = page.url();
      const title = await page.title();
      console.log(`📍 URL no momento do erro: ${url}`);
      console.log(`📄 Título no momento do erro: ${title}\n`);

      await page.screenshot({
        path: 'login-tjmg-erro.png',
        fullPage: true
      });
      console.log('📸 Screenshot de erro salvo: login-tjmg-erro.png\n');
    } catch (e) {
      console.error('Não foi possível capturar informações adicionais');
    }

    console.log('👁️  O navegador ficará aberto para diagnóstico.');
    console.log('    Pressione Ctrl+C para fechar.\n');
  }
}

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                LOGIN PJE TJMG - VERSÃO COMPLETA                   ║');
console.log('║          Com tratamento de Bad Request e Navegador Visível        ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

executarLoginTJMG().catch(console.error);

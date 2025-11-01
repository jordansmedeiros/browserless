/**
 * Login PJE TJMG - Versão FIREFOX
 *
 * Firefox tem políticas de cookies de terceiros muito mais permissivas que Chrome
 *
 * INSTALAÇÃO DO FIREFOX:
 * Execute: npx puppeteer browsers install firefox
 */

import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ============================================================================
// CREDENCIAIS - CONFIGURE AQUI (HARDCODED)
// ============================================================================
const CPF = '07529294610';
const SENHA = '12345678aA@';

const PJE_LOGIN_URL = 'https://pje.tjmg.jus.br/pje/login.seam';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detecta caminho do Firefox instalado pelo Puppeteer
 */
function encontrarFirefox() {
  try {
    // Buscar no diretório do Puppeteer PRIMEIRO (prioridade)
    const puppeteerDirs = [
      path.join(process.cwd(), '.cache', 'puppeteer', 'firefox'),
      path.join(process.env.HOME || process.env.USERPROFILE, '.cache', 'puppeteer', 'firefox'),
    ];

    for (const baseDir of puppeteerDirs) {
      if (fs.existsSync(baseDir)) {
        console.log(`📁 Diretório Puppeteer encontrado: ${baseDir}`);

        // Buscar recursivamente pelo executável
        const findExe = (dir) => {
          try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              const fullPath = path.join(dir, file);
              const stat = fs.statSync(fullPath);

              if (stat.isDirectory()) {
                const found = findExe(fullPath);
                if (found) return found;
              } else if (file === 'firefox.exe' || file === 'firefox') {
                return fullPath;
              }
            }
          } catch (e) {}
          return null;
        };

        const exe = findExe(baseDir);
        if (exe) {
          console.log(`✅ Executável Firefox do Puppeteer encontrado: ${exe}\n`);
          return exe;
        }
      }
    }

    // Caminhos diretos para executáveis (fallback)
    console.log('⚠️  Firefox do Puppeteer não encontrado, tentando Firefox do sistema...');
    const possiblePaths = [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe', // Windows
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe', // Windows 32-bit
      '/usr/bin/firefox', // Linux
      '/Applications/Firefox.app/Contents/MacOS/firefox', // macOS
    ];

    // Verificar caminhos diretos
    for (const firefoxPath of possiblePaths) {
      if (fs.existsSync(firefoxPath)) {
        console.log(`✅ Firefox do sistema encontrado: ${firefoxPath}\n`);
        return firefoxPath;
      }
    }

    // Tentar buscar via comando
    try {
      const result = execSync('where firefox', { encoding: 'utf8' });
      if (result) {
        const firefoxPath = result.trim().split('\n')[0];
        console.log(`✅ Firefox encontrado via comando: ${firefoxPath}\n`);
        return firefoxPath;
      }
    } catch (e) {}

    return null;
  } catch (e) {
    console.error(`Erro ao buscar Firefox: ${e.message}`);
    return null;
  }
}

async function executarLoginTJMG() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║           LOGIN PJE TJMG - VERSÃO FIREFOX                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log('🦊 Procurando Firefox instalado...\n');

  const firefoxPath = encontrarFirefox();

  if (!firefoxPath) {
    console.error('❌ Firefox não encontrado!\n');
    console.error('Por favor, instale o Firefox:');
    console.error('   1. npx puppeteer browsers install firefox');
    console.error('   OU');
    console.error('   2. Instale o Firefox normalmente: https://www.mozilla.org/firefox/\n');
    process.exit(1);
  }

  console.log('🚀 Iniciando Firefox com configuração de cookies...\n');

  const browser = await puppeteer.launch({
    browser: 'firefox',
    headless: false,
    executablePath: firefoxPath,
    extraPrefsFirefox: {
      // Configurações do Firefox para aceitar cookies de terceiros
      'network.cookie.cookieBehavior': 0, // 0 = aceitar todos os cookies
      'privacy.trackingprotection.enabled': false, // Desabilitar proteção de tracking
      'privacy.trackingprotection.pbmode.enabled': false,
    },
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0');

    console.log('🌐 Navegando para página de login...');
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
    console.log('👆 Clicando em Entrar...');
    await ssoFrame.click('#kc-login');
    console.log('✅ Botão clicado\n');

    // Aguardar Bad Request (esperado)
    console.log('⏳ Aguardando Bad Request (esperado)...');
    await delay(5000);

    // Verificar cookies
    const cookies = await page.cookies();
    console.log(`📍 Cookies: ${cookies.length}`);
    cookies.forEach((cookie, idx) => {
      console.log(`   ${idx + 1}. ${cookie.name} (${cookie.domain})`);
    });

    // Fazer refresh
    console.log('\n🔄 Fazendo refresh da página...\n');
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await delay(3000);

    // Verificar resultado
    const finalUrl = page.url();
    const title = await page.title();
    const pageContent = await page.content();
    const hasNavigationElements = pageContent.includes('botao-menu') || pageContent.includes('Painel');
    const hasBadRequest = pageContent.toLowerCase().includes('bad request');

    console.log('═'.repeat(70));
    console.log('📊 RESULTADO FINAL:');
    console.log('═'.repeat(70));
    console.log(`📍 URL: ${finalUrl}`);
    console.log(`📄 Título: ${title}`);
    console.log(`✓ Elementos navegação: ${hasNavigationElements}`);
    console.log(`✗ Bad Request: ${hasBadRequest}`);
    console.log('═'.repeat(70) + '\n');

    if (hasNavigationElements && !hasBadRequest) {
      console.log('✅✅✅ LOGIN REALIZADO COM SUCESSO! ✅✅✅');
      console.log('🎉 Firefox conseguiu logar no PJE TJMG!\n');
    } else {
      console.log('⚠️  Status do login incerto.\n');
    }

    // Screenshot
    console.log('📸 Tirando screenshot...');
    await page.screenshot({
      path: 'login-tjmg-firefox.png',
      fullPage: true
    });
    console.log('✅ Screenshot salvo: login-tjmg-firefox.png\n');

    console.log('═'.repeat(70));
    console.log('👁️  Navegador ficará ABERTO. Pressione Ctrl+C quando terminar.');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n' + '═'.repeat(70));
    console.error('❌ ERRO:');
    console.error('═'.repeat(70));
    console.error(`${error.message}\n`);

    try {
      await page.screenshot({
        path: 'login-tjmg-firefox-erro.png',
        fullPage: true
      });
      console.log('📸 Screenshot de erro salvo\n');
    } catch (e) {}

    console.log('👁️  Navegador ficará aberto para diagnóstico.\n');
  }
}

executarLoginTJMG().catch(console.error);

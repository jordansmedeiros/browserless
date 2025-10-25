/**
 * Login PJE COMPLETO - Script Standalone para Testes Manuais
 *
 * ⚠️ IMPORTANTE:
 * Este script é apenas para TESTES MANUAIS. O sistema principal usa
 * credenciais do BANCO DE DADOS através do gerenciamento em /pje/credentials
 *
 * FLUXO COMPLETO:
 * 1. Acessa página de login do PJE
 * 2. Clica no botão "Entrar com PDPJ"
 * 3. Preenche CPF com digitação humana
 * 4. Preenche senha com digitação humana
 * 5. Clica em Entrar
 * 6. Aguarda redirecionamento
 *
 * COMO USAR:
 * Opção 1 - Linha de comando:
 *   node server/scripts/pje-trt/common/login.js <CPF> <SENHA>
 *   Exemplo: node server/scripts/pje-trt/common/login.js 12345678900 minhasenha
 *
 * Opção 2 - Variáveis de ambiente (apenas para testes):
 *   Configure PJE_CPF e PJE_SENHA no arquivo .env
 *   Execute: node server/scripts/pje-trt/common/login.js
 *
 * DEPENDÊNCIAS:
 * npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Adiciona o plugin stealth ANTES de lançar o navegador
puppeteer.use(StealthPlugin());

// Obtém credenciais via linha de comando ou variáveis de ambiente
const args = process.argv.slice(2);
let CPF = args[0] || process.env.PJE_CPF;
let SENHA = args[1] || process.env.PJE_SENHA;

// Validação de credenciais
if (!CPF || !SENHA) {
  console.error('\n' + '='.repeat(70));
  console.error('❌ ERRO: Credenciais PJE não fornecidas');
  console.error('='.repeat(70));
  console.error('\n💡 Como usar este script:');
  console.error('\nOpção 1 - Argumentos de linha de comando:');
  console.error('  node server/scripts/pje-trt/common/login.js <CPF> <SENHA>');
  console.error('  Exemplo: node server/scripts/pje-trt/common/login.js 12345678900 minhasenha');
  console.error('\nOpção 2 - Variáveis de ambiente (apenas para testes):');
  console.error('  1. Configure PJE_CPF e PJE_SENHA no arquivo .env');
  console.error('  2. Execute: node server/scripts/pje-trt/common/login.js');
  console.error('\n⚠️  LEMBRE-SE: O sistema principal usa credenciais do BANCO DE DADOS');
  console.error('   Configure em: http://localhost:3000/pje/credentials\n');
  console.error('='.repeat(70) + '\n');
  process.exit(1);
}

// URL da página de login do PJE TRT3
const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';

// Função auxiliar para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executarLoginCompleto() {
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

    console.log('🌐 Navegando para página de login do PJE...');
    console.log(`    ${PJE_LOGIN_URL}\n`);

    await page.goto(PJE_LOGIN_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('✅ Página carregada!\n');

    // Delay humano para observar a página
    await delay(1500);

    // PASSO 1: Clicar no botão "Entrar com PDPJ"
    console.log('🔍 Procurando botão "Entrar com PDPJ"...');

    try {
      // Aguarda o botão aparecer
      await page.waitForSelector('#btnSsoPdpj', { visible: true, timeout: 10000 });
      console.log('✅ Botão "Entrar com PDPJ" encontrado!\n');

      // Move o mouse até o botão (comportamento humano)
      const pdpjButton = await page.$('#btnSsoPdpj');
      if (pdpjButton) {
        const box = await pdpjButton.boundingBox();
        if (box) {
          console.log('🖱️  Movendo mouse até o botão "Entrar com PDPJ"...');
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
          await delay(500);
        }
      }

      console.log('👆 Clicando em "Entrar com PDPJ"...\n');

      // Clica e aguarda redirecionamento para SSO
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.click('#btnSsoPdpj'),
      ]);

      const ssoUrl = page.url();
      console.log(`📍 Redirecionado para SSO: ${ssoUrl}\n`);

      if (ssoUrl.includes('sso.cloud.pje.jus.br')) {
        console.log('✅ Agora na página de login SSO!\n');
      } else {
        console.log('⚠️  URL inesperada, mas continuando...\n');
      }

    } catch (e) {
      console.error('❌ Erro ao clicar no botão PDPJ:', e.message);
      console.log('   Verificando se já está na página SSO...\n');

      const currentUrl = page.url();
      if (!currentUrl.includes('sso.cloud.pje.jus.br')) {
        throw new Error('Não conseguiu acessar a página de login SSO');
      }
    }

    // PASSO 2: Preencher CPF
    console.log('⏳ Aguardando página SSO carregar...');

    // Aguarda até 15 segundos para o campo de CPF aparecer (importante para TRTs mais lentos)
    console.log('👤 Preenchendo CPF com digitação humana...');
    await page.waitForSelector('#username', { visible: true, timeout: 15000 });
    await page.click('#username');
    await delay(500);

    // Digita CARACTERE POR CARACTERE com delay aleatório
    for (let i = 0; i < CPF.length; i++) {
      const char = CPF[i];
      await page.type('#username', char, { delay: Math.random() * 100 + 50 });
      process.stdout.write(`\r    Digitando CPF: ${'*'.repeat(i + 1)}${' '.repeat(Math.max(0, CPF.length - i - 1))}`);
    }
    console.log(' ✓\n');

    // PASSO 3: Preencher senha
    await delay(1000);

    console.log('🔒 Preenchendo senha com digitação humana...');
    await page.waitForSelector('#password', { visible: true, timeout: 10000 });
    await page.click('#password');
    await delay(500);

    // Digita senha caractere por caractere
    for (let i = 0; i < SENHA.length; i++) {
      const char = SENHA[i];
      await page.type('#password', char, { delay: Math.random() * 100 + 50 });
      process.stdout.write(`\r    Digitando senha: ${'*'.repeat(i + 1)}${' '.repeat(Math.max(0, SENHA.length - i - 1))}`);
    }
    console.log(' ✓\n');

    // PASSO 4: Clicar em Entrar
    await delay(1500);

    console.log('🖱️  Simulando movimento do mouse até o botão Entrar...');

    // Simula movimento do mouse antes de clicar
    const loginButton = await page.$('#kc-login');
    if (loginButton) {
      const box = await loginButton.boundingBox();
      if (box) {
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

    // PASSO 5: Verificar resultado
    console.log('⏳ Aguardando redirecionamento...');
    await delay(5000);

    const finalUrl = page.url();
    const title = await page.title();

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESULTADO FINAL:');
    console.log('='.repeat(70));
    console.log(`📍 URL final: ${finalUrl}`);
    console.log(`📄 Título: ${title}`);
    console.log('='.repeat(70) + '\n');

    // Análise do resultado
    if (finalUrl.includes('403') || title.includes('403') || title.toLowerCase().includes('forbidden')) {
      console.error('❌ Erro 403 - CloudFront bloqueou o acesso');
      console.log('💡 Possíveis causas:');
      console.log('   - Múltiplas tentativas consecutivas');
      console.log('   - IP marcado como suspeito');
      console.log('   - Aguarde alguns minutos e tente novamente\n');
    } else if (finalUrl.includes('400') || title.includes('400')) {
      console.log('⚠️  HTTP 400 - Bad Request');
      console.log('   Possível sessão OAuth expirada ou credenciais inválidas');
      console.log('   MAS: CloudFront NÃO bloqueou (não é erro 403!)\n');
    } else if (finalUrl.includes('pje.trt3.jus.br') && !finalUrl.includes('sso.cloud')) {
      console.log('✅✅✅ LOGIN REALIZADO COM SUCESSO! ✅✅✅');
      console.log('🎉 Você foi redirecionado para o sistema PJE!\n');

      // Verifica conteúdo da página
      try {
        const pageContent = await page.content();
        if (pageContent.toLowerCase().includes('processo') ||
            pageContent.toLowerCase().includes('menu') ||
            pageContent.toLowerCase().includes('logout')) {
          console.log('✅ Página interna do PJE detectada!');
          console.log('✅ Sistema carregou corretamente!\n');
        }
      } catch (e) {
        console.log('ℹ️  Não foi possível verificar conteúdo da página\n');
      }
    } else if (finalUrl.includes('sso.cloud.pje.jus.br')) {
      console.log('⚠️  Ainda na página de login SSO');
      console.log('   Possíveis causas:');
      console.log('   - Credenciais incorretas');
      console.log('   - Captcha ou verificação adicional');
      console.log('   - Verifique o navegador aberto\n');
    } else {
      console.log('⚠️  Resultado inesperado');
      console.log('   Verifique o navegador para mais detalhes\n');
    }

    // Tira screenshot
    console.log('📸 Tirando screenshot...');
    await page.screenshot({
      path: 'login-pje-completo-resultado.png',
      fullPage: true
    });
    console.log('✅ Screenshot salvo: login-pje-completo-resultado.png\n');

    console.log('=' .repeat(70));
    console.log('👁️  O navegador ficará ABERTO para você inspecionar.');
    console.log('    Pressione Ctrl+C quando terminar.\n');
    console.log('💡 Dica: Você pode continuar navegando no sistema manualmente');
    console.log('=' .repeat(70) + '\n');

    // Mantém o navegador aberto
    // await browser.close(); // ← Comentado intencionalmente

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO DURANTE O PROCESSO:');
    console.error('='.repeat(70));
    console.error(`Mensagem: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);

    // Captura informações para debug
    try {
      const url = page.url();
      const title = await page.title();
      console.log(`📍 URL no momento do erro: ${url}`);
      console.log(`📄 Título no momento do erro: ${title}\n`);

      // Screenshot de erro
      await page.screenshot({
        path: 'login-pje-completo-erro.png',
        fullPage: true
      });
      console.log('📸 Screenshot de erro salvo: login-pje-completo-erro.png\n');
    } catch (e) {
      console.error('Não foi possível capturar informações adicionais');
    }

    console.log('👁️  O navegador ficará aberto para diagnóstico.');
    console.log('    Pressione Ctrl+C para fechar.\n');

    // Mantém aberto mesmo com erro
    // await browser.close();
  }
}

// Executa a função
console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                   LOGIN PJE - VERSÃO COMPLETA                     ║');
console.log('║              Com Anti-Detecção e Navegador Visível                ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

executarLoginCompleto().catch(console.error);

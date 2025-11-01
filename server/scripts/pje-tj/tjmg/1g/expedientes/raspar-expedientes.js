/**
 * Raspagem de Expedientes - PJE TJMG 1º Grau
 *
 * FLUXO:
 * 1. Login no SSO (reutilizado)
 * 2. Lidar com Bad Request (F5) (reutilizado)
 * 3. Navegar: Painel -> Painel do Representante (advogado.seam)
 * 4. A aba "Expedientes" é carregada por padrão.
 * 5. A categoria "Pendentes de ciência ou de resposta" é expandida por padrão.
 * 6. Para cada REGIÃO (Nível 2) dentro desta categoria:
 * a. Expandir região
 * b. Clicar em "Caixa de entrada" (Nível 3)
 * c. Extrair expedientes da página (HTML parsing)
 * d. Navegar pelas páginas (paginação)
 * 7. Salvar todos os expedientes em JSON
 *
 * INTEGRAÇÃO:
 * Este script é executado pelo scrape-executor que fornece as credenciais via
 * variáveis de ambiente (PJE_CPF, PJE_SENHA, etc.).
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Credenciais fornecidas via variáveis de ambiente pelo scrape-executor
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;

const PJE_LOGIN_URL = process.env.PJE_LOGIN_URL || 'https://pje.tjmg.jus.br/pje/login.seam';
const PJE_PAINEL_URL = 'https://pje.tjmg.jus.br/pje/Painel/painel_usuario/advogado.seam';

// ATUALIZADO: Novo diretório de saída
const DATA_DIR = 'data/pje/tjmg/expedientes';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detecta caminho do Firefox instalado pelo Puppeteer
 * (Função reutilizada, sem alterações)
 */
function encontrarFirefox() {
  try {
    const puppeteerDirs = [
      path.join(process.cwd(), '.cache', 'puppeteer', 'firefox'),
      path.join(process.env.HOME || process.env.USERPROFILE, '.cache', 'puppeteer', 'firefox'),
    ];

    for (const baseDir of puppeteerDirs) {
      if (fsSync.existsSync(baseDir)) {
        const findExe = (dir) => {
          try {
            const files = fsSync.readdirSync(dir);
            for (const file of files) {
              const fullPath = path.join(dir, file);
              const stat = fsSync.statSync(fullPath);

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
          console.error(`✅ Firefox do Puppeteer encontrado: ${exe}`);
          return exe;
        }
      }
    }

    const possiblePaths = [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
      '/usr/bin/firefox',
      '/Applications/Firefox.app/Contents/MacOS/firefox',
    ];

    for (const firefoxPath of possiblePaths) {
      if (fsSync.existsSync(firefoxPath)) {
        console.error(`✅ Firefox do sistema encontrado: ${firefoxPath}`);
        return firefoxPath;
      }
    }

    try {
      const result = execSync('where firefox', { encoding: 'utf8' });
      if (result) {
        const firefoxPath = result.trim().split('\n')[0];
        console.error(`✅ Firefox encontrado via comando: ${firefoxPath}`);
        return firefoxPath;
      }
    } catch (e) {}

    return null;
  } catch (e) {
    console.error(`Erro ao buscar Firefox: ${e.message}`);
    return null;
  }
}

/**
 * Realiza login no PJE TJMG e lida com o Bad Request
 * (Função reutilizada, sem alterações)
 */
async function fazerLogin(page) {
  console.error('🔐 Fazendo login no PJE TJMG...\n');
  await delay(2000);
  
  await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  console.error('✅ Página inicial carregada');
  await delay(3000);

  console.error('🔍 Procurando iframe SSO...');
  const frames = page.frames();
  const ssoFrame = frames.find(f => f.url().includes('sso.cloud.pje.jus.br'));

  if (!ssoFrame) {
    try {
      await page.screenshot({ path: 'debug-no-sso-iframe.png', fullPage: true });
      console.error('📸 Screenshot salvo em: debug-no-sso-iframe.png');
    } catch (e) {}
    throw new Error('Iframe SSO não encontrado!');
  }

  console.error('✅ Iframe SSO encontrado');
  
  await ssoFrame.waitForSelector('input[name="username"]', { visible: true, timeout: 15000 });
  await ssoFrame.type('input[name="username"]', CPF);
  console.error('✅ CPF preenchido');
  await delay(1000);

  await ssoFrame.waitForSelector('input[name="password"]', { visible: true, timeout: 10000 });
  await ssoFrame.type('input[name="password"]', SENHA);
  console.error('✅ Senha preenchida');
  await delay(1500);

  console.error('⏳ Clicando em Entrar...');
  await ssoFrame.click('#kc-login');
  console.error('✅ Botão clicado');

  console.error('⏳ Aguardando Bad Request e cookies...');
  await delay(5000);

  let cookies = await page.cookies();
  console.error(`   Cookies: ${cookies.length}`);
  if (cookies.length === 0) {
    console.error('   ⚠️   Sem cookies, aguardando mais...');
    await delay(5000);
    cookies = await page.cookies();
    console.error(`   Cookies após espera: ${cookies.length}`);
  }

  console.error('🔄 Fazendo refresh...');
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await delay(3000);

  const pageContent = await page.content();
  const hasNavigationElements = pageContent.includes('botao-menu') || pageContent.includes('Painel');
  const hasBadRequest = pageContent.toLowerCase().includes('bad request');

  if (!hasNavigationElements || hasBadRequest) {
    throw new Error('Login falhou - área logada não carregou após refresh');
  }

  console.error('✅ Login completado com sucesso!\n');
}

/**
 * ATUALIZADO: Navega até o Painel e verifica a aba Expedientes (padrão)
 */
async function navegarParaExpedientes(page) {
  console.error('🧭 Navegando para Expedientes...\n');

  // Ir direto para o Painel do Advogado
  console.error('📂 Navegando para o Painel do Advogado...');
  await page.goto(PJE_PAINEL_URL, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await delay(3000);

  console.error('✅ Painel do Advogado carregado');

  // A aba "Expedientes" é a padrão. Apenas verificamos se o
  // "itemSelecionado" (Pendentes...) está lá, o que confirma que
  // a aba e a sidebar carregaram.
  const sidebarTreeSelector = 'div[id="formAbaExpediente:listaAgrSitExp:0:trPend"]';
  console.error('Aguardando sidebar de Expedientes carregar...');
  await page.waitForSelector(sidebarTreeSelector, { visible: true, timeout: 15000 }); 
  
  console.error('✅ Aba "Expedientes" e Sidebar carregados por padrão!\n');
}


/**
 * NOVO: Extrai expedientes da página atual usando seletores de CSS robustos.
 */
async function extrairExpedientesDaPagina(page, nomeRegiao) {
  return await page.evaluate((regiao) => {
    const expedientes = [];
    
    // Seletor CORRETO para o <tbody> da tabela de EXPEDIENTES
    const rows = document.querySelectorAll('tbody[id="formExpedientes:tbExpedientes:tb"] > tr.rich-table-row');
    
    rows.forEach(row => {
      // Tenta extrair os dois blocos principais de colunas
      const colInfoExpediente = row.querySelector('td[id*=":j_id540"]');
      const colInfoProcesso = row.querySelector('td[id*=":j_id581"]');

      if (!colInfoExpediente || !colInfoProcesso) {
        return; // Pula linha mal formada
      }

      const expedienteInfo = { 
        regiao: regiao,
        processoNumero: null,
        partes: null,
        vara: null,
        ultimoMovimento: null,
        destinatario: null,
        tipoDocumento: null,
        prazo: null,
        dataLimite: null,
        ciencia: null
      };
      
      // Extrai dados do Bloco de Processo (coluna da direita)
      expedienteInfo.processoNumero = colInfoProcesso.querySelector('a.numero-processo-expediente')?.innerText.trim();
      expedienteInfo.partes = colInfoProcesso.querySelector('div:nth-of-type(2)')?.innerText.trim();
      expedienteInfo.vara = colInfoProcesso.querySelector('div:nth-of-type(3)')?.innerText.trim();
      expedienteInfo.ultimoMovimento = colInfoProcesso.querySelector('div:last-of-type')?.innerText.trim();

      // Extrai dados do Bloco de Expediente (coluna do meio)
      expedienteInfo.destinatario = colInfoExpediente.querySelector('div:nth-of-type(1) > span.text-bold')?.innerText.trim();
      expedienteInfo.tipoDocumento = colInfoExpediente.querySelector('div:nth-of-type(2) > span[title="Tipo de documento"]')?.innerText.trim();
      expedienteInfo.prazo = colInfoExpediente.querySelector('div[title="Prazo para manifestação"]')?.innerText.trim();
      expedienteInfo.dataLimite = colInfoExpediente.querySelector('strong')?.innerText.trim();
      expedienteInfo.ciencia = colInfoExpediente.querySelector('div[id*=":j_id560"]')?.innerText.trim();
      
      if (expedienteInfo.processoNumero) {
        expedientes.push(expedienteInfo);
      }
    });
    return expedientes;
  }, nomeRegiao); // Passa o nome da região para dentro do evaluate
}


/**
 * NOVO: Raspa a árvore de Expedientes
 * (Lógica adaptada do Acervo para os seletores de Expedientes)
 */
async function rasparTodosOsExpedientes(page) {
  console.error('🗺️  Iniciando raspagem de todos os expedientes (Pendentes de ciência ou de resposta)...');
  const todosExpedientes = [];

  // Seletor CORRETO para as REGIÕES (Nível 2) dentro da categoria "Pendentes..."
  const regionItemSelector = 'div[id="formAbaExpediente:listaAgrSitExp:0:trPend:childs"] > table.rich-tree-node > tbody > tr > td.rich-tree-node-text > a[id*="::jNp"]';

  // 1. Obter a contagem de regiões
  const regionCount = await page.$$eval(regionItemSelector, links => links.length);
  console.error(`✅ Encontradas ${regionCount} regiões/jurisdições com expedientes pendentes.`);

  // 2. Loop por cada região
  for (let i = 0; i < regionCount; i++) {
    
    // 3. Buscar *novamente* todos os links de região a cada iteração
    const regionLinks = await page.$$(regionItemSelector);
    const regionLink = regionLinks[i];
    
    // 4. Obter o nome da região e o ID da tabela pai
    const regionData = await regionLink.evaluate(el => {
        const name = el.querySelector('span.nomeJurisdicao').textContent.trim();
        const tableId = el.closest('table.rich-tree-node').id; 
        return { name, tableId };
    });

    console.error(`\n--- [${i + 1}/${regionCount}] Iniciando Região: ${regionData.name} ---`);

    // 5. Clicar na Região (Nível 2) para expandir
    console.error('   🔽 Expandindo região...');
    await regionLink.click();
    await delay(2000); // Aguardar expansão da região

    // 6. Definir e esperar o seletor da "Caixa de Entrada" (Nível 3)
    // Seletor CORRETO para "Caixa de Entrada" de Expedientes
    const inboxSelector = `div[id="${regionData.tableId}:childs"] a[id*="::cxExItem"]`;

    let inboxLink;
    try {
        console.error('   📥 Aguardando "Caixa de Entrada" aparecer...');
        inboxLink = await page.waitForSelector(inboxSelector, { visible: true, timeout: 15000 });
    } catch (e) {
        console.error(`   ⚠️   Não foi possível encontrar "Caixa de Entrada" para ${regionData.name}. Pulando.`);
        continue;
    }

    // 7. Clicar em "Caixa de Entrada" (Nível 3)
    console.error('   ✅ Clicando em "Caixa de Entrada"');
    await inboxLink.click();
    await delay(3000); // Aguardar carregamento da tabela

    // 8. Esperar a tabela de EXPEDIENTES carregar
    // Seletor CORRETO para o <tbody> da tabela de resultados
    const tableBodySelector = 'tbody[id="formExpedientes:tbExpedientes:tb"]';
    try {
        await page.waitForSelector(tableBodySelector, { visible: true, timeout: 15000 });
        console.error('   ✅ Tabela de expedientes carregada.');
    } catch (e) {
        console.error(`   ⚠️   Tabela de expedientes não carregou para ${regionData.name}. Pulando.`);
        continue;
    }

    // 9. Iniciar a raspagem da PAGINAÇÃO
    let paginaAtual = 1;
    
    while (true) {
        console.error(`      📄 Extraindo página ${paginaAtual}...`);
        
        // 10a. Extrair dados da página atual
        const expedientesPagina = await extrairExpedientesDaPagina(page, regionData.name);
        todosExpedientes.push(...expedientesPagina);
        console.error(`         ✅ ${expedientesPagina.length} expedientes encontrados nesta página.`);

        // 10b. Verificar e clicar no botão "Próxima Página"
        // (Seletor é o mesmo do Acervo)
        const nextButtonSelector = 'td.rich-datascr-button[onclick*="\'page\': \'next\'"]';
        const nextButton = await page.$(nextButtonSelector);
        
        if (nextButton) {
            console.error('      ▶️   Indo para a próxima página...');
            await Promise.all([
                nextButton.click(),
                page.waitForResponse(res => res.url().includes('advogado.seam'), { timeout: 30000 })
            ]);
            // Espera a tabela ser atualizada
            await page.waitForSelector(tableBodySelector, { visible: true }); 
            paginaAtual++;
            await delay(2000); // Delay para garantir renderização
        } else {
            console.error('      ⏹️   Não há mais páginas nesta região.');
            break; // Sai do loop de paginação
        }
    } // Fim do loop de paginação (while)
    
    console.error(`--- ✅ Concluída Região: ${regionData.name} ---`);
  } // Fim do loop principal de regiões (for)

  return todosExpedientes;
}


/**
 * Função principal (Adaptada para Expedientes)
 */
async function rasparExpedientesTJMG() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║     RASPAGEM: EXPEDIENTES - PJE TJMG 1º GRAU (Firefox)            ║');
  console.error('╚═══════════════════════════════════════════════════════════════════╝\n');

  await fs.mkdir(DATA_DIR, { recursive: true });

  console.error('🦊 Procurando Firefox instalado...\n');
  const firefoxPath = encontrarFirefox();

  if (!firefoxPath) {
    console.error('❌ Firefox não encontrado!');
    console.error('Por favor, instale o Firefox: npx puppeteer browsers install firefox\n');
    throw new Error('Firefox não encontrado');
  }

  const browser = await puppeteer.launch({
    browser: 'firefox',
    headless: true, 
    executablePath: firefoxPath,
    extraPrefsFirefox: {
      'network.cookie.cookieBehavior': 0, 
      'privacy.trackingprotection.enabled': false,
      'privacy.trackingprotection.pbmode.enabled': false,
    },
  });

  const page = await browser.newPage();
  console.error('✅ Firefox iniciado com configuração de cookies permissiva');

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0');

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['pt-BR', 'pt', 'en-US', 'en'],
    });
  });

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  });

  try {
    // Passo 1: Login
    await fazerLogin(page);

    // Passo 2: Navegar para Expedientes
    await navegarParaExpedientes(page);

    // Passo 3: Raspar todos os expedientes
    const todosExpedientes = await rasparTodosOsExpedientes(page);

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL:');
    console.error('='.repeat(70));
    console.error(`Total de expedientes extraídos: ${todosExpedientes.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/expedientes-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJMG',
        grau: '1g',
        totalExpedientes: todosExpedientes.length,
        expedientes: todosExpedientes
      }, null, 2));

      console.error(`💾 Dados salvos em: ${outputFile}\n`);
    }

    // Saída JSON para stdout
    const resultado = {
      success: true,
      expedientesCount: todosExpedientes.length,
      expedientes: todosExpedientes,
      timestamp: new Date().toISOString(),
      advogado: {
        cpf: CPF,
      },
    };
    console.log(JSON.stringify(resultado));

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);

    const isLoginPhaseError = error.message && (
      error.message.includes('Iframe SSO') ||
      error.message.includes('username') ||
      error.message.includes('password') ||
      error.message.includes('Bad Request')
    );

    const isTimeoutError = error.message && (
      error.message.includes('timeout') ||
      error.message.includes('Timeout') ||
      error.message.includes('TIMEOUT')
    );

    const errorType = isTimeoutError ? 'timeout' : 'script_error';
    const retryable = isTimeoutError;

    // Saída JSON de erro
    const resultadoErro = {
      success: false,
      expedientesCount: 0,
      expedientes: [],
      timestamp: new Date().toISOString(),
      error: {
        type: errorType,
        category: 'execution',
        phase: isLoginPhaseError ? 'login' : 'data-fetch',
        message: error.message,
        technicalMessage: error.stack,
        retryable: retryable,
        loginStep: isLoginPhaseError ? error.message : undefined,
        timestamp: new Date().toISOString()
      }
    };
    console.log(JSON.stringify(resultadoErro));
    process.exit(1);
  } finally {
    await browser.close();
  }
}

rasparExpedientesTJMG().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
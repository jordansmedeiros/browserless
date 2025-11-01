/**
 * Raspagem de Expedientes - PJE TJDF 1º Grau (SEM CAPTCHA)
 *
 * FLUXO:
 * 1. Login SSO direto (sem CAPTCHA)
 * 2. Navegar para o Painel do Advogado
 * 3. Verificar se a aba "Expedientes" está carregada
 * 4. Verificar se há expedientes nos agrupadores (árvore)
 * 5. Raspar expedientes (se houver)
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// --- Configuração ---
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;

// URLs do TJDF
const PJE_LOGIN_URL = 'https://pje.tjdft.jus.br/pje/login.seam';
const PJE_PAINEL_URL = 'https://pje.tjdft.jus.br/pje/Painel/painel_usuario/advogado.seam';

// Diretório de saída
const DATA_DIR = 'data/pje/tjdf/expedientes';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detecta caminho do Firefox instalado pelo Puppeteer
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
 * Faz o login no SSO (TJDF não tem CAPTCHA)
 */
async function fazerLoginSSO(page) {
    console.error('🔐 Fazendo login no SSO...\n');

    // Navegar para a página de login
    await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    console.error('✅ Página de login carregada');

    // 1. Preencher CPF
    await page.waitForSelector('input[name="username"]', { visible: true, timeout: 15000 });
    await page.type('input[name="username"]', CPF);
    console.error('✅ CPF preenchido');
    await delay(1000);

    // 2. Preencher Senha
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 10000 });
    await page.type('input[name="password"]', SENHA);
    console.error('✅ Senha preenchida');
    await delay(1500);

    // 3. Clicar em Entrar
    const loginButtonSelector = '#kc-login, input[name="login"]';
    console.error('⏳ Clicando em Entrar...');

    await Promise.all([
        page.click(loginButtonSelector),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);
    console.error('✅ Botão clicado e navegação detectada.');

    // 4. Verificar se a área logada carregou
    await delay(3000);
    const pageContent = await page.content();
    const currentUrl = page.url();
    const pageTitle = await page.title();

    console.error(`   📍 URL atual: ${currentUrl}`);
    console.error(`   📄 Título: ${pageTitle}`);

    const hasNavigationElements = pageContent.includes('botao-menu') ||
                                   pageContent.includes('Painel') ||
                                   pageContent.includes('painel') ||
                                   currentUrl.includes('painel') ||
                                   currentUrl.includes('Painel');

    if (!hasNavigationElements) {
        console.error(`   ⚠️  Não encontrei elementos esperados. Primeiros 500 chars da página:`);
        console.error(pageContent.substring(0, 500));
        throw new Error('Login SSO falhou - área logada não carregou');
    }

    console.error('✅ Login SSO completado com sucesso!\n');
}

/**
 * Navega até o Painel e verifica a aba Expedientes
 */
async function navegarParaExpedientes(page) {
  console.error('🧭 Navegando para Expedientes (TJDF)...\n');

  console.error('📂 Navegando para o Painel do Advogado...');
  await page.goto(PJE_PAINEL_URL, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await delay(3000);

  console.error('✅ Painel do Advogado carregado');

  // Verificar se a aba Expedientes existe
  console.error('🔍 Verificando se a aba Expedientes existe...');

  const abaExpedientesSelector = 'a[id*="linkAbaExpediente"], a[href*="expediente"]';

  try {
    await page.waitForSelector(abaExpedientesSelector, { visible: true, timeout: 10000 });
    console.error('✅ Aba Expedientes encontrada');
  } catch (e) {
    console.error('⚠️  Aba Expedientes não encontrada - pode já estar selecionada');
  }

  // TJDF: Verificar se há expedientes nos agrupadores (árvore)
  console.error('🔍 Verificando se há expedientes disponíveis...');

  const temExpedientes = await page.evaluate(() => {
    // TJDF usa árvore de jurisdições - procurar nós com expedientes
    const treeNodes = document.querySelectorAll('.rich-tree-node-text.treeNodeItem a span.pull-right');

    if (treeNodes.length === 0) {
      return false;
    }

    // Verificar se algum nó tem quantidade > 0
    for (const node of treeNodes) {
      const quantidade = parseInt(node.innerText.trim());
      if (!isNaN(quantidade) && quantidade > 0) {
        return true;
      }
    }

    return false;
  });

  if (!temExpedientes) {
    console.error('ℹ️  Nenhum expediente encontrado (todos os agrupadores têm 0)');
    console.error('✅ Navegação para Expedientes concluída - sem expedientes\n');
    return false;
  }

  console.error('✅ Expedientes encontrados!\n');
  return true;
}

/**
 * Obtém todos os agrupadores da árvore de expedientes (TJDF)
 */
async function obterAgrupadores(page) {
  const agrupadores = await page.evaluate(() => {
    const items = [];

    // TJDF: Procurar nós da árvore com expedientes
    const treeNodeLinks = document.querySelectorAll('.rich-tree-node-text.treeNodeItem a');

    treeNodeLinks.forEach(linkEl => {
      const nomeSpan = linkEl.querySelector('span.nomeTarefa');
      const qtdSpan = linkEl.querySelector('span.pull-right');

      if (nomeSpan && qtdSpan) {
        const nomeJurisdicao = nomeSpan.innerText.trim();
        const qtd = parseInt(qtdSpan.innerText.trim());

        if (!isNaN(qtd)) {
          items.push({
            nome: nomeJurisdicao,
            quantidade: qtd,
            linkId: linkEl.id,
            tipo: qtd > 0 ? 'clicavel' : 'zero'
          });
        }
      }
    });

    return items;
  });

  return agrupadores;
}

/**
 * Extrai expedientes da página atual
 */
async function extrairExpedientesDaPagina(page, nomeRegiao) {
  return await page.evaluate((regiao) => {
    const expedientes = [];

    // Seletor da tabela de expedientes
    const rows = document.querySelectorAll('tbody[id="formExpedientes:tbExpedientes:tb"] > tr.rich-table-row');

    rows.forEach(row => {
      const colInfoExpediente = row.querySelector('td[id*=":j_id540"]');
      const colInfoProcesso = row.querySelector('td[id*=":j_id581"]');

      if (!colInfoExpediente || !colInfoProcesso) {
        return;
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

      expedienteInfo.processoNumero = colInfoProcesso.querySelector('a.numero-processo-expediente')?.innerText.trim();
      expedienteInfo.partes = colInfoProcesso.querySelector('div:nth-of-type(2)')?.innerText.trim();
      expedienteInfo.vara = colInfoProcesso.querySelector('div:nth-of-type(3)')?.innerText.trim();
      expedienteInfo.ultimoMovimento = colInfoProcesso.querySelector('div:last-of-type')?.innerText.trim();

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
  }, nomeRegiao);
}

/**
 * Raspa todos os expedientes da árvore (TJDF)
 */
async function rasparTodosOsExpedientes(page) {
  console.error('🗺️  Iniciando raspagem de todos os expedientes...');
  const todosExpedientes = [];

  // Obter todos os agrupadores
  const agrupadores = await obterAgrupadores(page);
  console.error(`✅ Encontrados ${agrupadores.length} agrupadores na árvore`);

  // Filtrar apenas agrupadores com quantidade > 0
  const agrupadoresComExpedientes = agrupadores.filter(ag => ag.quantidade > 0);
  console.error(`✅ ${agrupadoresComExpedientes.length} agrupadores têm expedientes`);

  if (agrupadoresComExpedientes.length === 0) {
    console.error('ℹ️  Nenhum agrupador com expedientes encontrado');
    return todosExpedientes;
  }

  for (let i = 0; i < agrupadoresComExpedientes.length; i++) {
    const agrupador = agrupadoresComExpedientes[i];
    console.error(`\n--- [${i + 1}/${agrupadoresComExpedientes.length}] ${agrupador.nome} (${agrupador.quantidade} expedientes) ---`);

    try {
      // Clicar no agrupador usando evaluate para lidar com IDs especiais
      console.error('   🔽 Clicando no agrupador...');

      await page.evaluate((linkId) => {
        const link = document.getElementById(linkId);
        if (link) {
          link.click();
        } else {
          throw new Error(`Link com ID "${linkId}" não encontrado`);
        }
      }, agrupador.linkId);

      await delay(2000);

      // Aguardar tabela de expedientes carregar
      const tableBodySelector = 'tbody[id="formExpedientes:tbExpedientes:tb"]';
      try {
        await page.waitForSelector(tableBodySelector, { visible: true, timeout: 15000 });
        console.error('   ✅ Tabela de expedientes carregada');
      } catch (e) {
        console.error(`   ⚠️  Tabela de expedientes não carregou. Pulando.`);
        continue;
      }

      // Paginar e extrair
      let paginaAtual = 1;

      while (true) {
        console.error(`      📄 Extraindo página ${paginaAtual}...`);

        const expedientesPagina = await extrairExpedientesDaPagina(page, agrupador.nome);
        todosExpedientes.push(...expedientesPagina);
        console.error(`         ✅ ${expedientesPagina.length} expedientes encontrados nesta página`);

        // Verificar se há próxima página
        const nextButtonSelector = 'td.rich-datascr-button[onclick*="\'page\': \'next\'"]';
        const nextButton = await page.$(nextButtonSelector);

        if (nextButton) {
          console.error('      ▶️  Indo para a próxima página...');
          await Promise.all([
            nextButton.click(),
            page.waitForResponse(res => res.url().includes('pje.tjdf.jus.br'), { timeout: 30000 })
          ]);
          await page.waitForSelector(tableBodySelector, { visible: true });
          paginaAtual++;
          await delay(2000);
        } else {
          console.error('      ⏹️  Não há mais páginas');
          break;
        }
      }

      console.error(`--- ✅ Concluído: ${agrupador.nome} ---`);
    } catch (error) {
      console.error(`   ❌ Erro ao processar agrupador "${agrupador.nome}": ${error.message}`);
      continue;
    }
  }

  return todosExpedientes;
}

/**
 * Função principal
 */
async function rasparExpedientesTJDF() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║     RASPAGEM: EXPEDIENTES - PJE TJDF 1º GRAU (Firefox)           ║');
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
    // Passo 1: Fazer o login no SSO (sem CAPTCHA)
    await fazerLoginSSO(page);

    // Passo 2: Navegar para Expedientes e verificar se há expedientes
    const temExpedientes = await navegarParaExpedientes(page);

    let todosExpedientes = [];

    // Passo 3: Raspar expedientes apenas se houver
    if (temExpedientes) {
      todosExpedientes = await rasparTodosOsExpedientes(page);
    } else {
      console.error('⚠️  Pulando raspagem - não há expedientes disponíveis\n');
    }

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL (TJDF):');
    console.error('='.repeat(70));
    console.error(`Total de expedientes extraídos: ${todosExpedientes.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/expedientes-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJDF',
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
      error.message.includes('username') ||
      error.message.includes('password') ||
      error.message.includes('Login SSO')
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

rasparExpedientesTJDF().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

/**
 * Raspagem de Pauta de Audiências - PJE TJDF 1º Grau (SEM CAPTCHA)
 *
 * FLUXO:
 * 1. Login SSO direto (sem CAPTCHA)
 * 2. Navegar para a URL da Pauta de Audiências
 * 3. Aplicar Filtros: Data de Hoje até +365 dias
 * 4. Clicar em "Pesquisar"
 * 5. Verificar se há audiências
 * 6. Raspar e paginar os resultados (se houver)
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
const PAUTA_URL = 'https://pje.tjdft.jus.br/pje/ProcessoAudiencia/PautaAudiencia/listView.seam';

// Diretório de saída
const DATA_DIR = 'data/pje/tjdf/pauta';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper para formatar datas no padrão DD/MM/YYYY
 */
function formatarData(date) {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

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
 * Navega até a Pauta de Audiências
 */
async function navegarParaPauta(page) {
  console.error('🧭 Navegando para Pauta de Audiências (TJDF)...\n');

  console.error(`📂 Navegando para ${PAUTA_URL}...`);
  await page.goto(PAUTA_URL, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // Esperar pelo formulário de filtro para confirmar que a página carregou
  const filterFormSelector = '#idProcessoAudienciaSearchForm';
  await page.waitForSelector(filterFormSelector, { visible: true, timeout: 15000 });

  console.error('✅ Página de Pauta de Audiências carregada!\n');
}

/**
 * Aplica os filtros de data e clica em "Pesquisar"
 */
async function aplicarFiltrosPauta(page) {
  console.error('🔍 Aplicando filtros na pauta de audiências...');

  // Tentar aplicar filtros de data se os campos existirem
  try {
    const hoje = new Date();
    const proximoAno = new Date(hoje);
    proximoAno.setDate(proximoAno.getDate() + 365);

    const dataInicio = formatarData(hoje);
    const dataFim = formatarData(proximoAno);

    console.error(`   🗓️  Tentando definir período: ${dataInicio} até ${dataFim}`);

    const campoInicioExiste = await page.evaluate(() => {
      return !!document.getElementById('processoAudienciaSearchForm:dtInicioDecoration:dtInicioFromFormInputDate');
    });

    if (campoInicioExiste) {
      // Preencher data INÍCIO
      await page.click('#processoAudienciaSearchForm\\:dtInicioDecoration\\:dtInicioFromFormInputDate');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.type('#processoAudienciaSearchForm\\:dtInicioDecoration\\:dtInicioFromFormInputDate', dataInicio);
      console.error(`   ✅ Data início preenchida: ${dataInicio}`);
      await delay(500);

      // Preencher data FIM
      await page.click('#processoAudienciaSearchForm\\:dtInicioDecoration\\:dtInicioToFormInputDate');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.type('#processoAudienciaSearchForm\\:dtInicioDecoration\\:dtInicioToFormInputDate', dataFim);
      console.error(`   ✅ Data fim preenchida: ${dataFim}`);
      await delay(500);

      console.error("   ✅ Filtros de data aplicados");
    } else {
      console.error("   ⚠️  Campos de data não encontrados - pesquisando sem filtros de data");
    }
  } catch (e) {
    console.error(`   ⚠️  Erro ao aplicar filtros de data: ${e.message}`);
  }

  const searchButtonSelector = 'input[id="processoAudienciaSearchForm:searchButton"]';
  console.error('   ⏳ Clicando em "Pesquisar"...');

  await page.click(searchButtonSelector);
  await delay(5000);  // Dar tempo para a pesquisa processar
  console.error('✅ Filtros aplicados e pesquisa realizada.\n');
}

/**
 * Verifica se há audiências na pauta após aplicar filtros
 */
async function verificarPautaVazia(page) {
  console.error('🔍 Verificando se há audiências na pauta...');

  const temAudiencias = await page.evaluate(() => {
    // Verificar se há mensagem de "sem registros"
    const mensagemVazia = document.querySelector('.msgCenter, .rich-messages');
    if (mensagemVazia) {
      const texto = mensagemVazia.innerText.toLowerCase();
      if (texto.includes('não foram encontrados') ||
          texto.includes('nenhum registro') ||
          texto.includes('sem resultados')) {
        return false;
      }
    }

    // Verificar se há linhas na tabela
    const rows = document.querySelectorAll('tbody[id="idProcessoAudiencia:tb"] > tr.rich-table-row');
    return rows.length > 0;
  });

  if (!temAudiencias) {
    console.error('   ℹ️  Nenhuma audiência encontrada na pauta (pauta vazia)');
    return false;
  }

  console.error('   ✅ Audiências encontradas na pauta');
  return true;
}

/**
 * Extrai as audiências da página atual
 */
async function extrairAudienciasDaPagina(page) {
  return await page.evaluate(() => {
    const audiencias = [];

    const rows = document.querySelectorAll('tbody[id="idProcessoAudiencia:tb"] > tr.rich-table-row');

    if (rows.length === 0) {
      return audiencias;
    }

    rows.forEach(row => {
      try {
        const audienciaInfo = {
          dataHora: null,
          processo: null,
          orgaoJulgador: null,
          partes: null,
          classeJudicial: null,
          tipo: null,
          sala: null,
          situacao: null,
          link: null,
          textoCompleto: row.innerText.replace(/\n/g, ' | ')
        };

        const colunas = row.querySelectorAll('td');

        if (colunas.length >= 8) {
          audienciaInfo.dataHora = colunas[1]?.innerText.trim();

          const linkEl = colunas[2]?.querySelector('a');
          if (linkEl) {
            audienciaInfo.processo = linkEl.innerText.trim();
            audienciaInfo.link = linkEl.href;
          }

          audienciaInfo.orgaoJulgador = colunas[3]?.innerText.trim();
          audienciaInfo.partes = colunas[4]?.innerText.trim();
          audienciaInfo.classeJudicial = colunas[5]?.innerText.trim();
          audienciaInfo.tipo = colunas[6]?.innerText.trim();
          audienciaInfo.sala = colunas[7]?.innerText.trim();
          audienciaInfo.situacao = colunas[8]?.innerText.trim();
        }

        if (audienciaInfo.processo || audienciaInfo.textoCompleto) {
          audiencias.push(audienciaInfo);
        }

      } catch (e) {
        console.warn(`Erro ao extrair linha da pauta: ${e.message}`);
      }
    });

    return audiencias;
  });
}

/**
 * Raspa todas as páginas da Pauta de Audiências
 */
async function rasparPautaDeAudiencias(page) {
  console.error('📅 Iniciando raspagem da pauta...');
  const todasAudiencias = [];
  let paginaAtual = 1;

  const tableBodySelector = 'tbody[id="idProcessoAudiencia:tb"]';

  while (true) {
    console.error(`   📄 Extraindo página ${paginaAtual}...`);

    const audienciasPagina = await extrairAudienciasDaPagina(page);
    todasAudiencias.push(...audienciasPagina);
    console.error(`      ✅ ${audienciasPagina.length} audiências encontradas nesta página.`);

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
      console.error('      ⏹️  Não há mais páginas na pauta.');
      break;
    }
  }

  return todasAudiencias;
}

/**
 * Função principal
 */
async function rasparPautaAudienciasTJDF() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║  RASPAGEM: PAUTA DE AUDIÊNCIAS - PJE TJDF 1º GRAU (Firefox)     ║');
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

    // Passo 2: Navegar para Pauta de Audiências
    await navegarParaPauta(page);

    // Passo 3: Aplicar filtros (datas, etc)
    await aplicarFiltrosPauta(page);

    // Passo 4: Verificar se há audiências (pauta pode estar vazia)
    const temAudiencias = await verificarPautaVazia(page);

    let todasAudiencias = [];

    if (!temAudiencias) {
      console.error('\n⚠️  Pauta vazia - nenhuma audiência encontrada no período filtrado.\n');
    } else {
      // Passo 5: Raspar todas as audiências
      todasAudiencias = await rasparPautaDeAudiencias(page);
    }

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL (TJDF):');
    console.error('='.repeat(70));
    console.error(`Total de audiências extraídas: ${todasAudiencias.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/pauta-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJDF',
        grau: '1g',
        totalAudiencias: todasAudiencias.length,
        audiencias: todasAudiencias
      }, null, 2));

      console.error(`💾 Dados salvos em: ${outputFile}\n`);
    }

    // Saída JSON para stdout
    const resultado = {
      success: true,
      audienciasCount: todasAudiencias.length,
      audiencias: todasAudiencias,
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
      audienciasCount: 0,
      audiencias: [],
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

rasparPautaAudienciasTJDF().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

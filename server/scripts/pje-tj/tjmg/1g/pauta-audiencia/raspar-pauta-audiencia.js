/**
 * Raspagem de Pauta de Audiências - PJE TJMG 1º Grau
 *
 * FLUXO:
 * 1. Login no SSO (reutilizado)
 * 2. Lidar com Bad Request (F5) (reutilizado)
 * 3. Navegar: Ir direto para a URL da Pauta de audiência
 * 4. Aplicar Filtros:
 * a. Situação: "todas" (default)
 * b. Período: Data de Hoje até +365 dias
 * c. Clicar em "Pesquisar"
 * 5. Para cada página da pauta:
 * a. Extrair audiências da página (HTML parsing)
 * b. Navegar pelas páginas (paginação)
 * 6. Salvar todas as audiências em JSON
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
const PAUTA_URL = 'https://pje.tjmg.jus.br/pje/ProcessoAudiencia/PautaAudiencia/listView.seam';

// Diretório de saída para a pauta
const DATA_DIR = 'data/pje/tjmg/pauta';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper para formatar datas no padrão DD/MM/YYYY
 */
function formatarData(date) {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0'); // Mês é base 0
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Detecta caminho do Firefox instalado pelo Puppeteer
 * (Função reutilizada do script Acervo)
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
 * (Função reutilizada do script Acervo)
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
 * NOVA FUNÇÃO: Navega até a Pauta de Audiências
 * (Navegação via URL direta, pós-login)
 */
async function navegarParaPauta(page) {
  console.error('🧭 Navegando para Pauta de Audiências...\n');

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
 * NOVA FUNÇÃO: Aplica os filtros de data e clica em "Pesquisar"
 */
async function aplicarFiltrosPauta(page) {
  console.error('🔍 Aplicando filtros na pauta de audiências...');

  // 1. Calcular Datas
  const hoje = new Date();
  const proximoAno = new Date(hoje);
  proximoAno.setDate(proximoAno.getDate() + 365);

  const dataInicio = formatarData(hoje);
  const dataFim = formatarData(proximoAno);

  console.error(`   🗓️  Período definido: ${dataInicio} até ${dataFim}`);

  // 2. Preencher as datas
  // (Usar page.evaluate é mais confiável que page.type para campos de calendário)
  await page.evaluate((data) => {
    document.getElementById('processoAudienciaSearchForm:dtInicioDecoration:dtInicioFromFormInputDate').value = data;
  }, dataInicio);

  await page.evaluate((data) => {
    document.getElementById('processoAudienciaSearchForm:dtInicioDecoration:dtInicioToFormInputDate').value = data;
  }, dataFim);
  
  // 3. Situação "todas"
  // (Baseado no HTML, o checkbox "todas" já vem marcado por padrão,
  // assim como todos os sub-itens. Não é necessário clicar.)
  console.error("   ✅ Situação 'todas' já vem marcada por padrão.");

  // 4. Clicar em "Pesquisar"
  const searchButtonSelector = 'input[id="processoAudienciaSearchForm:searchButton"]';
  console.error('   ⏳ Clicando em "Pesquisar"...');
  
  await Promise.all([
    page.click(searchButtonSelector),
    // Espera a requisição AJAX que busca os dados da pauta
    page.waitForResponse(res => res.url().includes('PautaAudiencia/listView.seam') && res.request().method() === 'POST', { timeout: 45000 })
  ]);
  
  // Esperar a tabela de resultados ser recarregada
  const tableBodySelector = 'tbody[id="idProcessoAudiencia:tb"]';
  await page.waitForSelector(tableBodySelector, { visible: true });
  await delay(2000); // Delay extra para garantir renderização
  
  console.error('✅ Filtros aplicados e resultados carregados.\n');
}


/**
 * NOVA FUNÇÃO: Extrai as audiências da página atual.
 *
 * !!! ATENÇÃO !!!
 * O HTML fornecido não continha audiências (0 resultados).
 * O seletor `tr.rich-table-row` é um PALPITE.
 * Os seletores de colunas (data, processo, etc.) PRECISAM SER VALIDADOS.
 */
async function extrairAudienciasDaPagina(page) {
  return await page.evaluate(() => {
    const audiencias = [];
    
    // TODO: VALIDAR SELETOR DE LINHA. O 'rich-table-row' é um palpite.
    const rows = document.querySelectorAll('tbody[id="idProcessoAudiencia:tb"] > tr.rich-table-row');
    
    // Se não houver linhas, retorna array vazio (0 resultados)
    if (rows.length === 0) {
      return audiencias;
    }

    // TODO: FINALIZAR ESTE BLOCO QUANDO TIVER HTML COM DADOS
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
          textoCompleto: row.innerText.replace(/\n/g, ' | ') // Fallback
        };

        // TODO: Validar os seletores de coluna (baseados na ordem do <thead>)
        // const colunas = row.querySelectorAll('td');
        // if (colunas.length >= 8) {
        //   audienciaInfo.dataHora = colunas[1]?.innerText.trim();
        //   audienciaInfo.processo = colunas[2]?.innerText.trim();
        //   audienciaInfo.orgaoJulgador = colunas[3]?.innerText.trim();
        //   audienciaInfo.partes = colunas[4]?.innerText.trim();
        //   audienciaInfo.classeJudicial = colunas[5]?.innerText.trim();
        //   audienciaInfo.tipo = colunas[6]?.innerText.trim();
        //   audienciaInfo.sala = colunas[7]?.innerText.trim();
        //   audienciaInfo.situacao = colunas[8]?.innerText.trim();
          
        //   // TODO: Procurar pelo link da audiência virtual (se houver)
        //   // audienciaInfo.link = colunas[X]?.querySelector('a')?.href;
        // }
        
        // audiencias.push(audienciaInfo);

      } catch (e) {
        console.warn(`Erro ao extrair linha da pauta: ${e.message}`);
      }
    });
    
    return audiencias;
  });
}

/**
 * NOVA FUNÇÃO: Raspa todas as páginas da Pauta de Audiências.
 */
async function rasparPautaDeAudiencias(page) {
  console.error('📅 Iniciando raspagem da pauta...');
  const todasAudiencias = [];
  let paginaAtual = 1;
  
  // Seletor do <tbody> para esperar o recarregamento
  const tableBodySelector = 'tbody[id="idProcessoAudiencia:tb"]';

  while (true) {
    console.error(`   📄 Extraindo página ${paginaAtual}...`);

    // 1. Extrair dados da página atual
    const audienciasPagina = await extrairAudienciasDaPagina(page);
    todasAudiencias.push(...audienciasPagina);
    console.error(`      ✅ ${audienciasPagina.length} audiências encontradas nesta página.`);

    // 2. Verificar e clicar no botão "Próxima Página"
    // TODO: VALIDAR SELETOR DE PAGINAÇÃO.
    // (O HTML com 0 resultados não mostra o paginador. Estou usando o mesmo do Acervo).
    const nextButtonSelector = 'td.rich-datascr-button[onclick*="\'page\': \'next\'"]';
    
    const nextButton = await page.$(nextButtonSelector);
    
    if (nextButton) {
      console.error('      ▶️   Indo para a próxima página...');
      await Promise.all([
        nextButton.click(),
        page.waitForResponse(res => res.url().includes('PautaAudiencia'), { timeout: 30000 })
      ]);
      
      await page.waitForSelector(tableBodySelector, { visible: true }); 
      paginaAtual++;
      await delay(2000); // Delay para garantir renderização
    } else {
      console.error('      ⏹️   Não há mais páginas na pauta.');
      break; // Sai do loop de paginação
    }
  }

  return todasAudiencias;
}


/**
 * Função principal (Adaptada para Pauta de Audiências)
 */
async function rasparPautaAudienciasTJMG() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║  RASPAGEM: PAUTA DE AUDIÊNCIAS - PJE TJMG 1º GRAU (Firefox)     ║');
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

    // Passo 2: Navegar para Pauta de Audiências
    await navegarParaPauta(page);

    // Passo 3: Aplicar filtros (datas, etc)
    await aplicarFiltrosPauta(page);

    // Passo 4: Raspar todas as audiências
    const todasAudiencias = await rasparPautaDeAudiencias(page);

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL:');
    console.error('='.repeat(70));
    console.error(`Total de audiências extraídas: ${todasAudiencias.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/pauta-audiencias-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJMG',
        grau: '1g',
        totalAudiencias: todasAudiencias.length,
        audiencias: todasAudiencias
      }, null, 2));

      console.error(`💾 Dados salvos em: ${outputFile}\n`);
    }

    // Saída JSON para stdout (para integração com sistema de fila)
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

rasparPautaAudienciasTJMG().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
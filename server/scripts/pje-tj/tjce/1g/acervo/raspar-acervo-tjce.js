/**
 * Raspagem de Processos do Acervo Geral - PJE TJCE 1º Grau
 *
 * FLUXO:
 * 1. Acessar URL de login (login direto, sem CAPTCHA)
 * 2. Preencher CPF/Senha e fazer login
 * 3. Navegar para o Painel do Advogado (advogado.seam)
 * 4. Clicar na aba "ACERVO"
 * 5. Iterar, raspar e paginar os processos
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// --- Configuração ---
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;

// URLs do TJCE
const PJE_LOGIN_URL = 'https://pje.tjce.jus.br/pje1grau/login.seam';
const PJE_PAINEL_URL = 'https://pje.tjce.jus.br/pje1grau/Painel/painel_usuario/advogado.seam';

// Diretório de saída
const DATA_DIR = 'data/pje/tjce/acervo';
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
 * Faz o login no SSO (sem CAPTCHA)
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

    // Tirar screenshot para debug
    try {
      await page.screenshot({ path: 'debug-login-sso-tjce.png', fullPage: true });
      console.error('   📸 Screenshot salvo: debug-login-sso-tjce.png');
    } catch (e) {}

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
 * Navega até o Acervo através dos menus
 */
async function navegarParaAcervo(page) {
  console.error('🧭 Navegando para Acervo (TJCE)...\n');

  // Ir direto para o Painel do Advogado
  console.error('📂 Navegando para o Painel do Advogado...');
  await page.goto(PJE_PAINEL_URL, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await delay(3000);

  console.error('✅ Painel do Advogado carregado');

  // Verificar se tab Acervo já está ativa
  const acervoStatus = await page.evaluate(() => {
    const acervoTab = document.querySelector('#tabAcervo_lbl');
    if (acervoTab) {
      const parent = acervoTab.closest('.rich-tab-header');
      const isActive = parent && parent.classList.contains('rich-tab-active');
      return { exists: true, active: isActive };
    }
    return { exists: false, active: false };
  });

  if (!acervoStatus.exists) {
    throw new Error('Tab Acervo não encontrada no painel');
  }

  if (!acervoStatus.active) {
    console.error('⏳ Clicando na tab Acervo...');
    await page.click('#tabAcervo_lbl');
    console.error('✅ Clique em Acervo enviado');

    // Esperar o conteúdo do acervo carregar
    await delay(5000);

    // Verificar se o div de resultados apareceu
    try {
      await page.waitForSelector('#divResultadoMenuContexto', { timeout: 10000 });
      console.error('✅ Conteúdo do Acervo carregado');
    } catch (e) {
      console.error('   ⚠️  Timeout esperando div de resultados, continuando...');
    }
  } else {
    console.error('✅ Tab Acervo já está ativa');
    await delay(2000);
  }

  // TJCE: Verificar se há processos no acervo (estrutura de árvore)
  console.error('🔍 Verificando se há processos no acervo...');

  const temProcessos = await page.evaluate(() => {
    // Verificar mensagem de "não encontrados"
    const mensagemVazia = document.querySelector('#divResultadoMenuContexto .msgCenter h4');
    if (mensagemVazia && mensagemVazia.innerText.includes('Não foram encontrados registros')) {
      return false;
    }

    // TJCE usa árvore de jurisdições - procurar nós com processos
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

  if (!temProcessos) {
    console.error('ℹ️  Nenhum processo encontrado no acervo');
    console.error('✅ Navegação para Acervo concluída - sem processos\n');
    return false;
  }

  console.error('✅ Processos encontrados no acervo!\n');
  return true;
}


/**
 * Extrai processos da página atual
 * TJCE tem estrutura de tabela diferente
 */
async function extrairProcessosDaPagina(page, nomeRegiao) {
  return await page.evaluate((regiao) => {
    const processos = [];

    const rows = document.querySelectorAll('tbody[id="formAcervo:tbProcessos:tb"] > tr.rich-table-row');

    if (rows.length === 0) {
      return processos;
    }

    rows.forEach(row => {
      try {
        const processoInfo = {
          regiao,
          numero: null,
          classe: null,
          assunto: null,
          area: null,
          orgaoJulgador: null,
          dataDistribuicao: null,
          valorCausa: null,
          partes: null,
          ultimoMovimento: null,
          link: null,
          textoCompleto: row.innerText.replace(/\n/g, ' | ')
        };

        const colunas = row.querySelectorAll('td');

        // TJCE: Tentar estrutura padrão primeiro
        if (colunas.length >= 8) {
          const linkEl = colunas[1]?.querySelector('a');
          if (linkEl) {
            processoInfo.numero = linkEl.innerText.trim();
            processoInfo.link = linkEl.href;
          }

          processoInfo.classe = colunas[2]?.innerText.trim();
          processoInfo.assunto = colunas[3]?.innerText.trim();
          processoInfo.area = colunas[4]?.innerText.trim();
          processoInfo.orgaoJulgador = colunas[5]?.innerText.trim();
          processoInfo.dataDistribuicao = colunas[6]?.innerText.trim();
          processoInfo.valorCausa = colunas[7]?.innerText.trim();

          const partesEl = colunas[8]?.querySelector('span[id*="idPartesPopup"]');
          if (partesEl) {
            processoInfo.partes = partesEl.innerText.trim();
          }
        }

        // Se não conseguiu extrair o número, tentar parseamento do texto
        if (!processoInfo.numero && processoInfo.textoCompleto) {
          // Padrão TJCE: "PJEC 3000344-62.2022.8.06.0018 Classe Assunto | Partes | ..."
          const numeroMatch = processoInfo.textoCompleto.match(/PJEC\s+(\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4})/);
          if (numeroMatch) {
            processoInfo.numero = numeroMatch[1].trim();
          }

          // Extrair classe/assunto (texto após número antes de |)
          const classeMatch = processoInfo.textoCompleto.match(/PJEC\s+\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}\s+([^|]+)/);
          if (classeMatch) {
            processoInfo.classe = classeMatch[1].trim();
          }

          // Extrair partes (texto após | antes do próximo |)
          const partesMatch = processoInfo.textoCompleto.match(/\|\s*([^|]+?)\s*X\s*([^|]+?)\s*\|/);
          if (partesMatch) {
            processoInfo.partes = `${partesMatch[1].trim()} X ${partesMatch[2].trim()}`;
          }

          // Extrair órgão julgador (linha com /)
          const orgaoMatch = processoInfo.textoCompleto.match(/\|\s*(\/[^|]+?)\s*\|/);
          if (orgaoMatch) {
            processoInfo.orgaoJulgador = orgaoMatch[1].trim();
          }

          // Extrair data de distribuição
          const dataMatch = processoInfo.textoCompleto.match(/Distribuído em\s+(\d{2}\/\d{2}\/\d{4})/);
          if (dataMatch) {
            processoInfo.dataDistribuicao = dataMatch[1];
          }

          // Extrair último movimento
          const movimentoMatch = processoInfo.textoCompleto.match(/Último movimento:\s+([^|]+)/);
          if (movimentoMatch) {
            processoInfo.ultimoMovimento = movimentoMatch[1].trim();
          }
        }

        processos.push(processoInfo);

      } catch (e) {
        console.warn(`Erro ao extrair linha do acervo: ${e.message}`);
      }
    });

    return processos;
  }, nomeRegiao);
}

/**
 * Identifica e extrai agrupadores (jurisdições) do acervo
 * TJCE usa estrutura de árvore (tree) em vez de divs
 */
async function obterAgrupadores(page) {
  console.error('📋 Obtendo agrupadores (jurisdições) do acervo...');

  const agrupadores = await page.evaluate(() => {
    const items = [];

    // TJCE: Procurar nós da árvore com processos
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

  if (agrupadores.length === 0) {
    console.error('   ⚠️  Nenhum agrupador encontrado\n');
    return [];
  }

  console.error(`   ✅ ${agrupadores.length} agrupador(es) encontrado(s):`);
  agrupadores.forEach((a, idx) => {
    console.error(`      ${idx + 1}. ${a.nome} (${a.quantidade}) - ${a.tipo}`);
  });
  console.error('');

  return agrupadores;
}

/**
 * Raspa todos os processos de uma região específica (com paginação)
 */
async function rasparRegiao(page, agrupador) {
  console.error(`\n📁 Raspando região: "${agrupador.nome}" (${agrupador.quantidade} processo(s))`);

  if (agrupador.tipo === 'zero') {
    console.error('   ℹ️  Região sem processos (qtd = 0), pulando...\n');
    return [];
  }

  if (!agrupador.linkId) {
    throw new Error(`Agrupador "${agrupador.nome}" não tem linkId para clicar`);
  }

  // Clicar usando evaluate para lidar com IDs especiais
  await page.evaluate((linkId) => {
    const link = document.getElementById(linkId);
    if (link) {
      link.click();
    } else {
      throw new Error(`Link com ID "${linkId}" não encontrado`);
    }
  }, agrupador.linkId);

  console.error(`   ✅ Clique enviado no agrupador "${agrupador.nome}"`);
  await delay(3000);

  const temTabela = await page.evaluate(() => {
    return !!document.querySelector('tbody[id="formAcervo:tbProcessos:tb"]');
  });

  if (!temTabela) {
    console.error(`   ⚠️  Tabela não encontrada após clicar em "${agrupador.nome}"\n`);
    return [];
  }

  const todosProcessos = [];
  let paginaAtual = 1;

  while (true) {
    console.error(`      📄 Extraindo página ${paginaAtual}...`);

    const processosPagina = await extrairProcessosDaPagina(page, agrupador.nome);
    todosProcessos.push(...processosPagina);
    console.error(`         ✅ ${processosPagina.length} processo(s) extraído(s) desta página`);

    const nextButton = await page.$('td.rich-datascr-button[onclick*="\'page\': \'next\'"]');

    if (nextButton) {
      console.error('         ▶️  Indo para a próxima página...');
      await nextButton.click();
      await delay(3000);
      paginaAtual++;
    } else {
      console.error('         ⏹️  Não há mais páginas nesta região.');
      break;
    }
  }

  console.error(`   ✅ Total de ${todosProcessos.length} processo(s) extraído(s) da região "${agrupador.nome}"\n`);
  return todosProcessos;
}

/**
 * Raspa todas as regiões do acervo
 */
async function rasparTodasAsRegioes(page) {
  const agrupadores = await obterAgrupadores(page);

  if (agrupadores.length === 0) {
    return [];
  }

  const todosProcessos = [];

  for (const agrupador of agrupadores) {
    const processosRegiao = await rasparRegiao(page, agrupador);
    todosProcessos.push(...processosRegiao);
  }

  return todosProcessos;
}

/**
 * Função principal
 */
async function rasparAcervoTJCE() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║  RASPAGEM: ACERVO GERAL - PJE TJCE 1º GRAU (Firefox)            ║');
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

    // Passo 2: Navegar para Acervo e verificar se há processos
    const temProcessos = await navegarParaAcervo(page);

    let todosProcessos = [];

    // Passo 3: Raspar processos apenas se houver
    if (temProcessos) {
      todosProcessos = await rasparTodasAsRegioes(page);
    } else {
      console.error('⚠️  Pulando raspagem - não há processos no acervo\n');
    }

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL (TJCE):');
    console.error('='.repeat(70));
    console.error(`Total de processos extraídos: ${todosProcessos.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/acervo-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJCE',
        grau: '1g',
        totalProcessos: todosProcessos.length,
        processos: todosProcessos
      }, null, 2));

      console.error(`💾 Dados salvos em: ${outputFile}\n`);
    }

    // Saída JSON para stdout
    const resultado = {
      success: true,
      processosCount: todosProcessos.length,
      processos: todosProcessos,
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
      error.message.includes('password')
    );

    const isTimeoutError = error.message && (
      error.message.includes('timeout') ||
      error.message.includes('Timeout') ||
      error.message.includes('TIMEOUT')
    );

    const errorType = isTimeoutError ? 'timeout' : 'script_error';
    const retryable = isTimeoutError;

    const errorOutput = {
      success: false,
      processosCount: 0,
      processos: [],
      timestamp: new Date().toISOString(),
      error: {
        type: errorType,
        category: 'execution',
        phase: isLoginPhaseError ? 'login' : 'data-fetch',
        message: error.message,
        technicalMessage: error.stack,
        retryable,
        ...(isLoginPhaseError && { loginStep: error.message }),
        timestamp: new Date().toISOString(),
      },
    };

    console.log(JSON.stringify(errorOutput));
    process.exit(1);

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

rasparAcervoTJCE().catch((err) => {
  console.error('💥 Erro fatal não capturado:', err);
  process.exit(1);
});

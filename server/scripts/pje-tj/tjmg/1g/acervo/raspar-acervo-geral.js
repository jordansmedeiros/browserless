/**
 * Raspagem de Processos do Acervo Geral - PJE TJMG 1º Grau
 *
 * ⚠️ DIFERENÇAS DO TRT:
 * - TJMG NÃO usa API REST - dados vêm renderizados no HTML
 * - Após login, aparece "Bad Request" - precisa fazer refresh (F5)
 * - Precisa navegar manualmente: Menu → Painel → Acervo
 * - Precisa expandir cada região e clicar em "Caixa de entrada"
 * - Dados extraídos do HTML via parsing (não JSON)
 *
 * FLUXO:
 * 1. Login no SSO
 * 2. Lidar com Bad Request (F5)
 * 3. Navegar: Menu sanduíche → Painel → Painel do Representante → ACERVO
 * 4. Para cada região na lista:
 * a. Expandir região
 * b. Clicar em "Caixa de entrada"
 * c. Extrair processos da página (HTML parsing)
 * d. Navegar pelas páginas (paginação)
 * 5. Salvar todos os processos em JSON
 *
 * INTEGRAÇÃO:
 * Este script é executado pelo scrape-executor que fornece as credenciais via
 * variáveis de ambiente (PJE_CPF, PJE_SENHA, etc.). Não deve ser executado
 * diretamente em modo standalone.
 *
 * CORREÇÕES (31/10/2025):
 * - Substituído `obterRegioes`, `rasparRegiao`, `extrairProcessosDaPagina`, `temProximaPagina`
 * e `irParaProximaPagina` por uma nova função `rasparTodasAsRegioes`.
 * - `rasparTodasAsRegioes` usa seletores de CSS/ID precisos para:
 * 1. Iterar dinamicamente sobre os <li> da árvore de região.
 * 2. Clicar no subitem "Caixa de Entrada" *específico* da região atual.
 * 3. Extrair dados da tabela de processos usando classes (`.rich-table-row`, `.numero-processo-acervo`, etc).
 * 4. Clicar no botão "next" da paginação (`[onclick*="\'page\': \'next\'"]`) em vez de
 * calcular números de página.
 *
 * ATUALIZAÇÕES (Arquitetura):
 * - Removida dependência de .env e dotenv
 * - Removida validação via validarCredenciais (credenciais vêm do banco)
 * - Removido PJE_ID_ADVOGADO (não usado no TJMG, apenas em TRT)
 * 
 * CORREÇÕES (Cookies):
 * - Adicionado perfil Chrome persistente (userDataDir) para garantir cookies
 * - Flags adicionadas para permitir cookies cross-origin e compartilhados
 * - Essencial tanto em headless=true quanto headless=false
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

// NÃO usar StealthPlugin pois pode interferir com cookies em headless
// puppeteer.use(StealthPlugin());

// Credenciais fornecidas via variáveis de ambiente pelo scrape-executor
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;

const PJE_LOGIN_URL = process.env.PJE_LOGIN_URL || 'https://pje.tjmg.jus.br/pje/login.seam';
const PJE_BASE_URL = process.env.PJE_BASE_URL || 'https://pje.tjmg.jus.br';

const DATA_DIR = 'data/pje/tjmg/acervo';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Realiza login no PJE TJMG e lida com o Bad Request
 */
async function fazerLogin(page) {
  console.error('🔐 Fazendo login no PJE TJMG...\n');

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['pt-BR', 'pt', 'en-US', 'en'],
    });
  });

  // Aguardar um pouco para garantir que tudo está carregado
  await delay(2000);
  
  await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  console.error('✅ Página inicial carregada');
  await delay(3000);

  // Procurar iframe SSO
  console.error('🔍 Procurando iframe SSO...');
  const frames = page.frames();
  console.error(`📊 Total de frames encontrados: ${frames.length}`);
  frames.forEach((f, idx) => {
    console.error(`   Frame ${idx}: ${f.url()}`);
  });

  const ssoFrame = frames.find(f => f.url().includes('sso.cloud.pje.jus.br'));

  if (!ssoFrame) {
    // Tentar screenshot para debug
    try {
      await page.screenshot({ path: 'debug-no-sso-iframe.png', fullPage: true });
      console.error('📸 Screenshot salvo em: debug-no-sso-iframe.png');
    } catch (e) {}

    throw new Error('Iframe SSO não encontrado!');
  }

  console.error('✅ Iframe SSO encontrado');
  console.error(`📍 URL do iframe SSO: ${ssoFrame.url()}`);

  // Preencher CPF
  await ssoFrame.waitForSelector('input[name="username"]', { visible: true, timeout: 15000 });
  await ssoFrame.type('input[name="username"]', CPF);
  console.error('✅ CPF preenchido');
  await delay(1000);

  // Preencher senha
  await ssoFrame.waitForSelector('input[name="password"]', { visible: true, timeout: 10000 });
  await ssoFrame.type('input[name="password"]', SENHA);
  console.error('✅ Senha preenchida');
  await delay(1500);

  // Clicar em Entrar
  console.error('⏳ Clicando em Entrar...');
  await ssoFrame.click('#kc-login');
  console.error('✅ Botão clicado');

  // ⚠️ COMPORTAMENTO ESPECÍFICO DO TJMG:
  // Após clicar, NÃO há navegação. O componente de login desaparece
  // e é substituído por "Bad Request". Precisamos aguardar isso
  // acontecer e depois fazer refresh manual.
  console.error('⏳ Aguardando 6 segundos para mudança de componente...');
  await delay(6000);

  // Debug: verificar conteúdo e cookies antes do refresh
  const contentBeforeRefresh = await page.content();
  const hasBadRequest = contentBeforeRefresh.toLowerCase().includes('bad request');
  const hasLoginForm = contentBeforeRefresh.toLowerCase().includes('username') || contentBeforeRefresh.toLowerCase().includes('password');
  const cookies = await page.cookies();
  console.error(`   Conteúdo antes do refresh: Bad Request=${hasBadRequest}, Login Form=${hasLoginForm}`);
  console.error(`   Cookies existentes: ${cookies.length}`);

  // Fazer refresh da página para carregar o conteúdo real
  console.error('🔄 Fazendo refresh da página...');
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await delay(3000);
  console.error('✅ Refresh concluído');

  // Verificar se login foi bem-sucedido (verificar se componentes de navegação aparecem)
  const pageContent = await page.content();
  const currentUrl = page.url();
  const hasNavigationElements = pageContent.includes('botao-menu') || pageContent.includes('Painel');

  console.error(`📍 URL após refresh: ${currentUrl}`);
  
  if (!hasNavigationElements) {
    console.error(`⚠️   Elementos de navegação não encontrados`);
    throw new Error('Login falhou - elementos de navegação não encontrados após refresh');
  }

  console.error('✅ Login completado com sucesso!\n');
}

/**
 * Navega até o Acervo através dos menus
 */
async function navegarParaAcervo(page) {
  console.error('🧭 Navegando para Acervo...\n');

  // Ir direto para o Painel do Advogado
  console.error('📂 Navegando para o Painel do Advogado...');
  await page.goto('https://pje.tjmg.jus.br/pje/Painel/painel_usuario/advogado.seam', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await delay(3000);

  console.error('✅ Painel do Advogado carregado');

  // Verificar se tab Acervo já está ativa
  const acervoStatus = await page.evaluate(() => {
    const acervoTab = document.querySelector('#tabAcervo_lbl'); // Seletor correto
    return {
      found: !!acervoTab,
      isActive: acervoTab?.classList.contains('rich-tab-active')
    };
  });
  console.error(`📊 Status da tab Acervo: encontrada=${acervoStatus.found}, ativa=${acervoStatus.isActive}`);
  
  if (!acervoStatus.isActive) {
    // Passo 4: Clicar no botão "ACERVO" apenas se não estiver ativo
    console.error('📂 Clicando no botão ACERVO...');
    // CORREÇÃO: Usar seletor de ID preciso
    const acervoSelector = 'td[id="tabAcervo_lbl"]';
    await page.waitForSelector(acervoSelector);

    // CORREÇÃO: Usar Promise.all para aguardar a requisição AJAX
    await Promise.all([
      page.click(acervoSelector),
      page.waitForResponse(res => res.url().includes('advogado.seam') && res.status() === 200, { timeout: 30000 })
    ]);
    
    console.error('✅ Clique em Acervo enviado');
    await delay(3000); // Delay extra para renderização
  } else {
    console.error('✅ Tab Acervo já está ativa');
    await delay(2000);
  }
  
  // CORREÇÃO: Esperar seletor robusto da árvore da sidebar
  const sidebarTreeSelector = 'div[id="formAbaAcervo:trAc"]';
  console.error('Aguardando sidebar de regiões carregar...');
  await page.waitForSelector(sidebarTreeSelector, { visible: true, timeout: 15000 }); 
  
  console.error('✅ Acervo e Sidebar carregados!\n');
}


// -----------------------------------------------------------------------------
// FUNÇÕES DE RASPAGEM ANTIGAS E FRÁGEIS (REMOVIDAS)
// - obterRegioes()
// - rasparRegiao()
// - temProximaPagina()
// - irParaProximaPagina()
//
// FUNÇÃO DE EXTRAÇÃO ANTIGA (SUBSTITUÍDA)
// - extrairProcessosDaPagina()
// -----------------------------------------------------------------------------


/**
 * NOVO: Extrai processos da página atual usando seletores de CSS robustos.
 * Substitui a versão antiga baseada em regex e innerText.
 */
async function extrairProcessosDaPagina(page, nomeRegiao) {
  return await page.evaluate((regiao) => {
    const processos = [];
    // Seletor CORRETO para o <tbody> da tabela de processos
    const rows = document.querySelectorAll('tbody[id="formAcervo:tbProcessos:tb"] > tr.rich-table-row');
    
    rows.forEach(row => {
      const processoInfo = { 
        regiao: regiao,
        numero: null,
        partes: null,
        vara: null,
        dataDistribuicao: null,
        ultimoMovimento: null,
        textoCompleto: null
      };
      
      // Seletor CORRETO para o Número do Processo
      const numeroEl = row.querySelector('a.numero-processo-acervo > span.text-bold');
      if (numeroEl) processoInfo.numero = numeroEl.innerText.trim();

      // Seletor CORRETO para as Partes
      const partesEl = row.querySelector('span.nome-parte');
      if (partesEl) processoInfo.partes = partesEl.innerText.trim();
      
      // Seletor CORRETO para o bloco de Informações
      const infoEl = row.querySelector('div.informacoes-linha-acervo');
      if (infoEl) {
        processoInfo.textoCompleto = infoEl.innerText.replace(/\n/g, ' | '); // Limpa newlines
        
        // Tenta extrair dados individuais do bloco de info
        const infoLinhas = infoEl.innerText.split('\n');
        if (infoLinhas[0]) processoInfo.vara = infoLinhas[0].trim().replace('/', '').trim(); // Remove a barra inicial
        if (infoLinhas[1]) processoInfo.dataDistribuicao = infoLinhas[1].trim();
        if (infoLinhas[2]) processoInfo.ultimoMovimento = infoLinhas[2].trim();
      }
      
      if (processoInfo.numero) {
        processos.push(processoInfo);
      }
    });
    return processos;
  }, nomeRegiao); // Passa o nome da região para dentro do evaluate
}


/**
 * NOVO: Substitui `obterRegioes` e `rasparRegiao`.
 * Contém a lógica de iteração robusta.
 */
async function rasparTodasAsRegioes(page) {
  console.error('🗺️  Iniciando raspagem de todas as regiões...');
  const todosProcessos = [];

  // Seletor CORRETO para os links das regiões (Nível 1 da árvore)
  const regionItemSelector = 'div[id="formAbaAcervo:trAc:childs"] > table.rich-tree-node > tbody > tr > td.rich-tree-node-text > a';

  // 1. Obter a contagem de regiões
  const regionCount = await page.$$eval(regionItemSelector, links => links.length);
  console.error(`✅ Encontradas ${regionCount} regiões/jurisdições.`);

  // 2. Loop por cada região usando um índice 'i'
  // (Essencial usar um loop 'for' clássico para re-selecionar os elementos)
  for (let i = 0; i < regionCount; i++) {
    
    // 3. Buscar *novamente* todos os links de região a cada iteração
    const regionLinks = await page.$$(regionItemSelector);
    const regionLink = regionLinks[i]; // Pega o link da iteração atual
    
    // 4. Obter o nome da região e o ID da tabela pai (para achar o subitem)
    const regionData = await regionLink.evaluate(el => {
        const name = el.querySelector('span.nomeTarefa').textContent.trim();
        // Pega o ID da <table> pai, que é usado para construir o ID do <div> filho
        const tableId = el.closest('table.rich-tree-node').id; 
        return { name, tableId };
    });

    console.error(`\n--- [${i + 1}/${regionCount}] Iniciando Região: ${regionData.name} ---`);

    // 5. Clicar na Região (Nível 1) para expandir
    console.error('   🔽 Expandindo região...');
    await Promise.all([
      regionLink.click(),
      page.waitForResponse(res => res.url().includes('advogado.seam'), { timeout: 30000 })
    ]);
    
    // 6. Definir e esperar o seletor da "Caixa de Entrada" (Nível 2)
    // Seletor CORRETO e DINÂMICO: busca o "Caixa de Entrada" *dentro* do
    // <div> filho da região que acabamos de clicar.
    const inboxSelector = `div[id="${regionData.tableId}:childs"] a[id*="::cxItem"]`;
    
    let inboxLink;
    try {
        console.error('   📥 Aguardando "Caixa de Entrada" aparecer...');
        inboxLink = await page.waitForSelector(inboxSelector, { visible: true, timeout: 10000 });
    } catch (e) {
        console.error(`   ⚠️  Não foi possível encontrar "Caixa de Entrada" para ${regionData.name}. Pulando.`);
        continue; // Pula para a próxima região
    }

    // 7. Clicar em "Caixa de Entrada" (Nível 2)
    console.error('   ✅ Clicando em "Caixa de Entrada"');
    await Promise.all([
        inboxLink.click(),
        page.waitForResponse(res => res.url().includes('advogado.seam'), { timeout: 30000 }) 
    ]);

    // 8. Esperar a tabela de processos carregar
    // Seletor CORRETO para o <tbody> da tabela principal
    const tableBodySelector = 'tbody[id="formAcervo:tbProcessos:tb"]';
    try {
        await page.waitForSelector(tableBodySelector, { visible: true, timeout: 15000 });
        console.error('   ✅ Tabela de processos carregada.');
    } catch (e) {
        console.error(`   ⚠️  Tabela de processos não carregou para ${regionData.name}. Pulando.`);
        continue;
    }

    // 9. Iniciar a raspagem da PAGINAÇÃO (Loop Aninhado)
    let paginaAtual = 1;
    
    while (true) {
        console.error(`      📄 Extraindo página ${paginaAtual}...`);
        
        // 10a. Extrair dados da página atual
        const processosPagina = await extrairProcessosDaPagina(page, regionData.name);
        todosProcessos.push(...processosPagina);
        console.error(`         ✅ ${processosPagina.length} processos encontrados nesta página.`);

        // 10b. Verificar e clicar no botão "Próxima Página"
        // Seletor CORRETO e ROBUSTO para o botão "próxima"
        const nextButtonSelector = 'td.rich-datascr-button[onclick*="\'page\': \'next\'"]';
        const nextButton = await page.$(nextButtonSelector);
        
        if (nextButton) {
            console.error('      ▶️  Indo para a próxima página...');
            await Promise.all([
                nextButton.click(),
                page.waitForResponse(res => res.url().includes('advogado.seam'), { timeout: 30000 })
            ]);
            // Espera a tabela ser atualizada
            await page.waitForSelector(tableBodySelector, { visible: true }); 
            paginaAtual++;
            await delay(2000); // Delay para garantir renderização
        } else {
            console.error('      ⏹️  Não há mais páginas nesta região.');
            break; // Sai do loop de paginação
        }
    } // Fim do loop de paginação (while)
    
    console.error(`--- ✅ Concluída Região: ${regionData.name} ---`);
  } // Fim do loop principal de regiões (for)

  return todosProcessos;
}


/**
 * Função principal
 */
async function rasparAcervoGeralTJMG() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║     RASPAGEM: ACERVO GERAL - PJE TJMG 1º GRAU (Versão Corrigida)    ║');
  console.error('╚═══════════════════════════════════════════════════════════════════╝\n');

  await fs.mkdir(DATA_DIR, { recursive: true });

  // Configurar perfil persistente para garantir cookies funcionem
  const userDataDir = `${DATA_DIR}/chrome-profile`;

  const browser = await puppeteer.launch({
    headless: true, // Modo produção - sem visualização do browser
    userDataDir: userDataDir, // PERFIL PERSISTENTE para salvar cookies
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security', // Permite cookies cross-origin se necessário
      '--disable-features=IsolateOrigins,site-per-process', // Permite cookies compartilhados
    ],
  });

  const page = await browser.newPage();

  // Configurar headers extras para melhor compatibilidade
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  });

  try {
    // Passo 1: Login
    await fazerLogin(page);

    // Passo 2: Navegar para Acervo
    await navegarParaAcervo(page);

    // Passo 3: Raspar todas as regiões (nova função robusta)
    const todosProcessos = await rasparTodasAsRegioes(page);

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL:');
    console.error('='.repeat(70));
    console.error(`Total de processos extraídos: ${todosProcessos.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/acervo-geral-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJMG',
        grau: '1g',
        totalProcessos: todosProcessos.length,
        processos: todosProcessos
      }, null, 2));

      console.error(`💾 Dados salvos em: ${outputFile}\n`);
    }

    // Saída JSON para stdout (para integração com sistema de fila)
    const resultado = {
      success: true,
      processosCount: todosProcessos.length,
      processos: todosProcessos,
      timestamp: new Date().toISOString(),
      advogado: {
        cpf: CPF,
        // TJMG não retorna ID do advogado via JWT/API (não tem API)
      },
    };
    console.log(JSON.stringify(resultado));

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);

    // Determina se é erro de login ou de execução
    const isLoginPhaseError = error.message && (
      error.message.includes('Iframe SSO') ||
      error.message.includes('username') ||
      error.message.includes('password') ||
      error.message.includes('Bad Request')
    );

    // Determina tipo de erro e se é retryable
    const isTimeoutError = error.message && (
      error.message.includes('timeout') ||
      error.message.includes('Timeout') ||
      error.message.includes('TIMEOUT')
    );

    const errorType = isTimeoutError ? 'timeout' : 'script_error';
    const retryable = isTimeoutError;

    // Saída JSON de erro para stdout (compatível com sistema de fila)
    const resultadoErro = {
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

rasparAcervoGeralTJMG().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
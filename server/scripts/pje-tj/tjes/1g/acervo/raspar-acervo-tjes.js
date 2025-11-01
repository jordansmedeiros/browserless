/**
 * Raspagem de Processos do Acervo Geral - PJE TJES 1º Grau (com Solver de CAPTCHA)
 *
 * FLUXO:
 * 1. Acessar URL de login (cai direto no CAPTCHA da AWS)
 * 2. Clicar em "Iniciar"
 * 3. Mudar para o desafio de ÁUDIO
 * 4. Interceptar e baixar o áudio .mp3
 * 5. Enviar o áudio (base64) para o endpoint do N8N
 * 6. Receber a transcrição (dígitos) do N8N
 * 7. Digitar os dígitos e submeter o CAPTCHA
 * 8. Na tela de login do SSO (agora visível), preencher CPF/Senha
 * 9. Navegar para o Painel do Advogado (advogado.seam)
 * 10. Clicar na aba "ACERVO"
 * 11. Iterar, raspar e paginar (lógica idêntica ao TJMG)
 *
 * NOTAS:
 * - Este script requer a biblioteca `axios` (npm install axios)
 * - Lógica do "Bad Request" (F5) foi REMOVIDA, conforme solicitado.
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import axios from 'axios'; // Necessário para enviar o áudio para o N8N
import FormData from 'form-data';
import ffmpegPath from 'ffmpeg-static';

// --- Configuração ---
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;

// ATUALIZADO: URLs do TJES
const PJE_LOGIN_URL = 'https://pje.tjes.jus.br/pje/login.seam';
const PJE_PAINEL_URL = 'https://pje.tjes.jus.br/pje/Painel/painel_usuario/advogado.seam';

// Endpoint do N8N para resolver CAPTCHA via áudio
const N8N_SOLVER_URL = process.env.N8N_SOLVER_URL || 'https://workflows.platform.sinesys.app/webhook/captcha-solver';

// ATUALIZADO: Diretório de saída
const DATA_DIR = 'data/pje/tjes/acervo';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';
const TEMP_AUDIO_AAC_PATH = path.join(process.cwd(), 'temp_audio_tjes.aac');
const TEMP_AUDIO_MP3_PATH = path.join(process.cwd(), 'temp_audio_tjes.mp3');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detecta caminho do Firefox instalado pelo Puppeteer
 * (Reutilizado do script TJMG)
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
 * NOVO: Envia o arquivo de áudio para o N8N e retorna a transcrição
 */
async function enviarAudioParaN8N(filePath) {
  console.error(`   📤 Enviando áudio para o endpoint N8N...`);
  try {
    const audioBuffer = await fs.readFile(filePath);
    const audioSizeKB = (audioBuffer.length / 1024).toFixed(2);
    console.error(`   Tamanho do áudio: ${audioSizeKB} KB`);

    // Criar FormData e adicionar o áudio como binary data na key "data"
    const form = new FormData();
    form.append('data', audioBuffer, {
      filename: 'captcha-audio.mp3',
      contentType: 'audio/mpeg'
    });

    const response = await axios.post(N8N_SOLVER_URL, form, {
      timeout: 60000, // 60 segundos de timeout
      headers: {
        ...form.getHeaders()
      }
    });

    // Aceitar diferentes formatos de resposta do N8N
    let transcricao = null;

    if (response.data) {
      // Formato 1: { success: true, transcription: "..." }
      if (response.data.success && response.data.transcription) {
        transcricao = response.data.transcription;
      }
      // Formato 2: { text: "..." }
      else if (response.data.text) {
        transcricao = response.data.text;
      }
      // Formato 3: [{ text: "..." }] (array)
      else if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].text) {
        transcricao = response.data[0].text;
      }
    }

    if (transcricao && transcricao.trim()) {
      console.error(`   ✅ N8N respondeu: "${transcricao}"`);
      return transcricao.trim();
    } else {
      throw new Error(`N8N retornou uma resposta inválida: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`   ❌ Erro ao contatar N8N: ${error.message}`);
    throw error;
  }
}

/**
 * NOVO: Resolve o CAPTCHA da AWS
 */
async function resolverCaptchaAWS(page) {
  console.error('🧩 Resolvendo CAPTCHA da AWS...\n');
  
  await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  console.error('✅ Página inicial (CAPTCHA) carregada.');

  try {
    // 1. Clicar no botão "Iniciar"
    const startButtonSelector = '#amzn-captcha-verify-button';
    await page.waitForSelector(startButtonSelector, { visible: true, timeout: 15000 });
    console.error('   ✅ Botão "Iniciar" encontrado. Clicando...');
    await page.click(startButtonSelector);
    await delay(2000);

    // 2. Clicar no botão de ÁUDIO
    const audioButtonSelector = '#amzn-btn-audio-internal';
    await page.waitForSelector(audioButtonSelector, { visible: true, timeout: 10000 });
    console.error('   ✅ CAPTCHA de imagem carregado. Trocando para Áudio...');
    await page.click(audioButtonSelector);
    await delay(2000);

    // 3. Interceptar e Baixar o Áudio
    console.error('   🎧 Procurando elemento <audio> com o arquivo...');

    const possibleAudioSelectors = [
      'audio[src*=".mp3"]',
      'audio[src*="audio"]',
      'audio[src*="data:audio"]',
      'audio',
    ];

    let audioElement = null;
    let audioElementSelector = null;
    let audioUrl = null;

    for (const selector of possibleAudioSelectors) {
      try {
        console.error(`   Tentando seletor: ${selector}`);
        audioElement = await page.waitForSelector(selector, { timeout: 5000 });
        if (audioElement) {
          audioElementSelector = selector;
          audioUrl = await page.$eval(selector, el => el.src);
          console.error(`   ✅ Elemento de áudio encontrado com seletor: ${selector}`);
          console.error(`   URL do áudio: ${audioUrl.substring(0, 100)}...`);
          break;
        }
      } catch (e) {
        console.error(`   ⚠️  Seletor não encontrado: ${selector}`);
      }
    }

    if (!audioUrl) {
      throw new Error('Não foi possível encontrar o <audio> src. Verifique o seletor.');
    }
    
    // Baixar o áudio usando fetch de dentro do browser
    const audioBuffer = await page.evaluate(async (url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return Array.from(new Uint8Array(arrayBuffer));
    }, audioUrl);

    await fs.writeFile(TEMP_AUDIO_AAC_PATH, Buffer.from(audioBuffer));
    console.error(`   ✅ Áudio AAC salvo em: ${TEMP_AUDIO_AAC_PATH}`);

    // Converter AAC para MP3 usando ffmpeg
    console.error('   🔄 Convertendo AAC para MP3 usando ffmpeg...');
    try {
      execSync(`"${ffmpegPath}" -i "${TEMP_AUDIO_AAC_PATH}" -codec:a libmp3lame -q:a 2 "${TEMP_AUDIO_MP3_PATH}" -y`, {
        stdio: 'pipe'
      });
      console.error(`   ✅ Áudio convertido para MP3: ${TEMP_AUDIO_MP3_PATH}`);
    } catch (error) {
      console.error('   ❌ Erro ao converter áudio com ffmpeg:', error.message);
      throw error;
    }

    // 4. Enviar para N8N e obter transcrição (usando MP3 convertido)
    const transcricaoCompleta = await enviarAudioParaN8N(TEMP_AUDIO_MP3_PATH);

    // Limpar arquivos temporários
    await fs.unlink(TEMP_AUDIO_AAC_PATH);
    await fs.unlink(TEMP_AUDIO_MP3_PATH);

    // Processar a transcrição: O CAPTCHA pede UMA das palavras, mas a IA retorna TODAS
    // Exemplo: "atravesse instituto" -> escolher apenas "atravesse"
    console.error('   📝 Processando transcrição...');
    console.error(`   Transcrição completa: "${transcricaoCompleta}"`);

    const palavras = transcricaoCompleta.trim().split(/\s+/).filter(p => p.length > 0);
    let transcricao;

    if (palavras.length > 1) {
      // Se tiver múltiplas palavras, escolher a primeira
      transcricao = palavras[0];
      console.error(`   ℹ️  Múltiplas palavras detectadas (${palavras.length}): ${palavras.join(', ')}`);
      console.error(`   ✅ Usando apenas a primeira palavra: "${transcricao}"`);
    } else {
      transcricao = transcricaoCompleta;
      console.error(`   ✅ Uma palavra detectada: "${transcricao}"`);
    }

    // 5. Digitar a resposta e submeter
    console.error('   🔍 Procurando campo de input para digitar a resposta...');

    const possibleInputSelectors = [
      '#amzn-audio-verify-internal-input',
      'input[id*="audio"]',
      'input[id*="verify"]',
      'input[type="text"]',
      'input[name*="captcha"]',
    ];

    let inputElement = null;
    let inputSelector = null;

    for (const selector of possibleInputSelectors) {
      try {
        inputElement = await page.waitForSelector(selector, { visible: true, timeout: 3000 });
        if (inputElement) {
          inputSelector = selector;
          console.error(`   ✅ Campo de input encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        // Seletor não encontrado, tentar próximo
      }
    }

    if (!inputElement) {
      throw new Error('Campo de input do CAPTCHA não encontrado');
    }

    console.error(`   ⌨️  Digitando transcrição: "${transcricao}"`);
    await page.type(inputSelector, transcricao, { delay: 50 });
    console.error('   ✅ Transcrição digitada.');
    await delay(500);

    // Clicar em "Confirmar" (ou o botão de submit da tela de áudio)
    console.error('   🔍 Procurando botão de confirmação/submit...');

    const possibleSubmitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button[id*="submit"]',
      'button[id*="verify"]',
      'button:has-text("Confirmar")',
      'button:has-text("Verificar")',
    ];

    let submitButton = null;
    let submitSelector = null;

    for (const selector of possibleSubmitSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          submitSelector = selector;
          console.error(`   ✅ Botão de submit encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        // Seletor não encontrado, tentar próximo
      }
    }

    if (!submitButton) {
      throw new Error('Botão de submit do CAPTCHA não encontrado');
    }

    console.error('   👆 Clicando no botão de confirmação...');
    await submitButton.click();
    await delay(1000);

    // 6. Aguardar redirecionamento para a página de LOGIN do SSO
    console.error('   ⏳ Aguardando página de login do SSO...');
    await page.waitForSelector('input[name="username"]', { visible: true, timeout: 30000 });
    console.error('✅ CAPTCHA resolvido! Página de login do SSO carregada.\n');

  } catch (error) {
    console.error('   ❌ Erro fatal ao resolver CAPTCHA:', error.message);
    try {
      await page.screenshot({ path: 'debug-captcha-fail.png', fullPage: true });
      console.error('📸 Screenshot salvo em: debug-captcha-fail.png');
    } catch (e) {}
    throw error;
  }
}

/**
 * ATUALIZADO: Faz o login no SSO (Pós-CAPTCHA) e SEM "Bad Request" (F5)
 */
async function fazerLoginSSO(page) {
    console.error('🔐 Fazendo login no SSO (Pós-CAPTCHA)...\n');
    
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
    
    // ATUALIZADO: Sem F5 (Bad Request)
    // Apenas clicamos e esperamos a navegação para o painel
    await Promise.all([
        page.click(loginButtonSelector),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);
    console.error('✅ Botão clicado e navegação detectada.');

    // 4. Verificar se a área logada carregou
    await delay(3000); // Dar mais tempo para carregar
    const pageContent = await page.content();
    const currentUrl = page.url();
    const pageTitle = await page.title();

    console.error(`   📍 URL atual: ${currentUrl}`);
    console.error(`   📄 Título: ${pageTitle}`);

    // Tirar screenshot para debug
    try {
      await page.screenshot({ path: 'debug-login-sso-tjes.png', fullPage: true });
      console.error('   📸 Screenshot salvo: debug-login-sso-tjes.png');
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
 * (Reutilizado do TJMG, apenas URL atualizada)
 */
async function navegarParaAcervo(page) {
  console.error('🧭 Navegando para Acervo (TJES)...\n');

  // Ir direto para o Painel do Advogado (URL do TJES)
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
    return {
      found: !!acervoTab,
      isActive: acervoTab?.classList.contains('rich-tab-active')
    };
  });
  console.error(`📊 Status da tab Acervo: encontrada=${acervoStatus.found}, ativa=${acervoStatus.isActive}`);
  
  if (!acervoStatus.isActive) {
    console.error('📂 Clicando no botão ACERVO...');
    const acervoSelector = 'td[id="tabAcervo_lbl"]';
    await page.waitForSelector(acervoSelector);

    await Promise.all([
      page.click(acervoSelector),
      page.waitForResponse(res => res.url().includes('advogado.seam') && res.status() === 200, { timeout: 30000 })
    ]);
    
    console.error('✅ Clique em Acervo enviado');
    await delay(3000);
  } else {
    console.error('✅ Tab Acervo já está ativa');
    await delay(2000);
  }

  // TJES: Verificar se há mensagem de "sem processos"
  console.error('🔍 Verificando se há processos no acervo...');

  const temProcessos = await page.evaluate(() => {
    // Verificar mensagem de "não encontrados"
    const mensagemVazia = document.querySelector('#divResultadoMenuContexto .msgCenter h4');
    if (mensagemVazia && mensagemVazia.innerText.includes('Não foram encontrados registros')) {
      return false;
    }

    // Verificar se existe tabela de processos
    const tabela = document.querySelector('tbody[id="formAcervo:tbProcessos:tb"]');
    return !!tabela;
  });

  if (!temProcessos) {
    console.error('ℹ️  Nenhum processo encontrado no acervo (mensagem do sistema detectada)');
    console.error('✅ Navegação para Acervo concluída - sem processos\n');
    return false; // Retorna false para indicar que não há processos
  }

  console.error('✅ Processos encontrados no acervo!\n');
  return true; // Retorna true para indicar que há processos
}


/**
 * Extrai processos da página atual
 * (Reutilizado do TJMG - estrutura da tabela PJe é a mesma)
 */
async function extrairProcessosDaPagina(page, nomeRegiao) {
  return await page.evaluate((regiao) => {
    const processos = [];
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
      
      const numeroEl = row.querySelector('a.numero-processo-acervo > span.text-bold');
      if (numeroEl) processoInfo.numero = numeroEl.innerText.trim();

      const partesEl = row.querySelector('span.nome-parte');
      if (partesEl) processoInfo.partes = partesEl.innerText.trim();
      
      const infoEl = row.querySelector('div.informacoes-linha-acervo');
      if (infoEl) {
        processoInfo.textoCompleto = infoEl.innerText.replace(/\n/g, ' | ');
        const infoLinhas = infoEl.innerText.split('\n');
        if (infoLinhas[0]) processoInfo.vara = infoLinhas[0].trim().replace('/', '').trim();
        if (infoLinhas[1]) processoInfo.dataDistribuicao = infoLinhas[1].trim();
        if (infoLinhas[2]) processoInfo.ultimoMovimento = infoLinhas[2].trim();
      }
      
      if (processoInfo.numero) {
        processos.push(processoInfo);
      }
    });
    return processos;
  }, nomeRegiao);
}


/**
 * Raspa todas as regiões do Acervo
 * (Reutilizado do TJMG - estrutura da árvore PJe é a mesma)
 */
async function rasparTodasAsRegioes(page) {
  console.error('🗺️  Iniciando raspagem de todas as regiões...');
  const todosProcessos = [];

  const regionItemSelector = 'div[id="formAbaAcervo:trAc:childs"] > table.rich-tree-node > tbody > tr > td.rich-tree-node-text > a';

  const regionCount = await page.$$eval(regionItemSelector, links => links.length);
  console.error(`✅ Encontradas ${regionCount} regiões/jurisdições.`);

  for (let i = 0; i < regionCount; i++) {
    const regionLinks = await page.$$(regionItemSelector);
    const regionLink = regionLinks[i];
    
    const regionData = await regionLink.evaluate(el => {
        const name = el.querySelector('span.nomeTarefa').textContent.trim();
        const tableId = el.closest('table.rich-tree-node').id; 
        return { name, tableId };
    });

    console.error(`\n--- [${i + 1}/${regionCount}] Iniciando Região: ${regionData.name} ---`);

    console.error('   🔽 Expandindo região...');
    await regionLink.click();
    await delay(2000); 

    const inboxSelector = `div[id="${regionData.tableId}:childs"] a[id*="::cxItem"]`;

    let inboxLink;
    try {
        console.error('   📥 Aguardando "Caixa de Entrada" aparecer...');
        inboxLink = await page.waitForSelector(inboxSelector, { visible: true, timeout: 15000 });
    } catch (e) {
        console.error(`   ⚠️   Não foi possível encontrar "Caixa de Entrada" para ${regionData.name}. Pulando.`);
        continue;
    }

    console.error('   ✅ Clicando em "Caixa de Entrada"');
    await inboxLink.click();
    await delay(3000); 

    const tableBodySelector = 'tbody[id="formAcervo:tbProcessos:tb"]';
    try {
        await page.waitForSelector(tableBodySelector, { visible: true, timeout: 15000 });
        console.error('   ✅ Tabela de processos carregada.');
    } catch (e) {
        console.error(`   ⚠️   Tabela de processos não carregou para ${regionData.name}. Pulando.`);
        continue;
    }

    let paginaAtual = 1;
    
    while (true) {
        console.error(`      📄 Extraindo página ${paginaAtual}...`);
        
        const processosPagina = await extrairProcessosDaPagina(page, regionData.name);
        todosProcessos.push(...processosPagina);
        console.error(`         ✅ ${processosPagina.length} processos encontrados nesta página.`);

        const nextButtonSelector = 'td.rich-datascr-button[onclick*="\'page\': \'next\'"]';
        const nextButton = await page.$(nextButtonSelector);
        
        if (nextButton) {
            console.error('      ▶️   Indo para a próxima página...');
            await Promise.all([
                nextButton.click(),
                // Atualizado para a URL do TJES
                page.waitForResponse(res => res.url().includes('pje.tjes.jus.br/pje/Painel/painel_usuario/advogado.seam'), { timeout: 30000 })
            ]);
            await page.waitForSelector(tableBodySelector, { visible: true }); 
            paginaAtual++;
            await delay(2000);
        } else {
            console.error('      ⏹️   Não há mais páginas nesta região.');
            break;
        }
    }
    
    console.error(`--- ✅ Concluída Região: ${regionData.name} ---`);
  } 

  return todosProcessos;
}


/**
 * Função principal (Adaptada para TJES Acervo)
 */
async function rasparAcervoGeralTJES() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║     RASPAGEM: ACERVO GERAL - PJE TJES 1º GRAU (Firefox)         ║');
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
    // Passo 1: Resolver o CAPTCHA da AWS
    // (Esta função também faz o page.goto inicial)
    await resolverCaptchaAWS(page);

    // Passo 2: Fazer o login no SSO (sem F5/reload)
    await fazerLoginSSO(page);

    // Passo 3: Navegar para Acervo e verificar se há processos
    const temProcessos = await navegarParaAcervo(page);

    let todosProcessos = [];

    // Passo 4: Raspar processos apenas se houver
    if (temProcessos) {
      todosProcessos = await rasparTodasAsRegioes(page);
    } else {
      console.error('⚠️  Pulando raspagem - não há processos no acervo\n');
    }

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL (TJES):');
    console.error('='.repeat(70));
    console.error(`Total de processos extraídos: ${todosProcessos.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/acervo-geral-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJES', // ATUALIZADO
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
      error.message.includes('password') ||
      error.message.includes('CAPTCHA') // Adicionado
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

// ATUALIZADO: Nome da função principal
rasparAcervoGeralTJES().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
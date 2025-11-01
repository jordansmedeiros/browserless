/**
 * Raspagem de Expedientes - PJE TJES 1º Grau (com Solver de CAPTCHA)
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
 * 10. A aba "Expedientes" (padrão) é carregada
 * 11. Iterar, raspar e paginar (lógica idêntica ao TJMG)
 *
 * NOTAS:
 * - Este script requer a biblioteca `axios` (npm install axios)
 * - Lógica do "Bad Request" (F5) foi REMOVIDA.
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import axios from 'axios';
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
const DATA_DIR = 'data/pje/tjes/expedientes';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';
const TEMP_AUDIO_AAC_PATH = path.join(process.cwd(), 'temp_audio_tjes_exp.aac');
const TEMP_AUDIO_MP3_PATH = path.join(process.cwd(), 'temp_audio_tjes_exp.mp3');

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
 * Envia o arquivo de áudio para o N8N e retorna a transcrição
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
      timeout: 60000,
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
 * Resolve o CAPTCHA da AWS
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
      await page.screenshot({ path: 'debug-captcha-exp-fail.png', fullPage: true });
      console.error('📸 Screenshot salvo em: debug-captcha-exp-fail.png');
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
      await page.screenshot({ path: 'debug-login-sso-tjes-exp.png', fullPage: true });
      console.error('   📸 Screenshot salvo: debug-login-sso-tjes-exp.png');
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
 * Navega até o Painel e verifica a aba Expedientes (padrão)
 */
async function navegarParaExpedientes(page) {
  console.error('🧭 Navegando para Expedientes (TJES)...\n');

  console.error('📂 Navegando para o Painel do Advogado...');
  await page.goto(PJE_PAINEL_URL, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await delay(3000);

  console.error('✅ Painel do Advogado carregado');

  // TJES: Verificar se há expedientes nos agrupadores
  console.error('🔍 Verificando se há expedientes disponíveis...');

  const temExpedientes = await page.evaluate(() => {
    // Verificar todos os agrupadores de expedientes
    const agrupadores = document.querySelectorAll('#formAbaExpediente\\:divMenuContexto .containerDocumentos.nivel1');

    if (agrupadores.length === 0) {
      // Não encontrou sidebar de expedientes
      return false;
    }

    let totalExpedientes = 0;

    agrupadores.forEach(agrupador => {
      // Verificar se é um itemSemLink (sem expedientes)
      const semLink = agrupador.querySelector('.itemSemLink');
      if (!semLink) {
        // Se não tem itemSemLink, pode ter expedientes
        const contador = agrupador.querySelector('.pull-right');
        if (contador) {
          const num = parseInt(contador.innerText.trim());
          if (!isNaN(num)) {
            totalExpedientes += num;
          }
        }
      } else {
        // itemSemLink sempre tem 0 expedientes
        // (title="Não foram encontrados expedientes neste agrupador")
      }
    });

    return totalExpedientes > 0;
  });

  if (!temExpedientes) {
    console.error('ℹ️  Nenhum expediente encontrado (todos os agrupadores estão vazios)');
    console.error('✅ Navegação para Expedientes concluída - sem expedientes\n');
    return false; // Retorna false para indicar que não há expedientes
  }

  console.error('✅ Expedientes encontrados!\n');
  return true; // Retorna true para indicar que há expedientes
}


/**
 * Extrai expedientes da página atual
 * (Reutilizado do TJMG - estrutura da tabela PJe é a mesma)
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
 * Raspa a árvore de Expedientes
 * (Reutilizado do TJMG - estrutura da árvore PJe é a mesma)
 */
async function rasparTodosOsExpedientes(page) {
  console.error('🗺️  Iniciando raspagem de todos os expedientes (Pendentes de ciência ou de resposta)...');
  const todosExpedientes = [];

  // Seletor para as REGIÕES (Nível 2)
  const regionItemSelector = 'div[id="formAbaExpediente:listaAgrSitExp:0:trPend:childs"] > table.rich-tree-node > tbody > tr > td.rich-tree-node-text > a[id*="::jNp"]';

  const regionCount = await page.$$eval(regionItemSelector, links => links.length);
  console.error(`✅ Encontradas ${regionCount} regiões/jurisdições com expedientes pendentes.`);

  for (let i = 0; i < regionCount; i++) {
    const regionLinks = await page.$$(regionItemSelector);
    const regionLink = regionLinks[i];
    
    const regionData = await regionLink.evaluate(el => {
        const name = el.querySelector('span.nomeJurisdicao').textContent.trim();
        const tableId = el.closest('table.rich-tree-node').id; 
        return { name, tableId };
    });

    console.error(`\n--- [${i + 1}/${regionCount}] Iniciando Região: ${regionData.name} ---`);

    console.error('   🔽 Expandindo região...');
    await regionLink.click();
    await delay(2000); 

    // Seletor para "Caixa de Entrada" (Nível 3)
    const inboxSelector = `div[id="${regionData.tableId}:childs"] a[id*="::cxExItem"]`;

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

    // Seletor para <tbody> da tabela de resultados
    const tableBodySelector = 'tbody[id="formExpedientes:tbExpedientes:tb"]';
    try {
        await page.waitForSelector(tableBodySelector, { visible: true, timeout: 15000 });
        console.error('   ✅ Tabela de expedientes carregada.');
    } catch (e) {
        console.error(`   ⚠️   Tabela de expedientes não carregou para ${regionData.name}. Pulando.`);
        continue;
    }

    let paginaAtual = 1;
    
    while (true) {
        console.error(`      📄 Extraindo página ${paginaAtual}...`);
        
        const expedientesPagina = await extrairExpedientesDaPagina(page, regionData.name);
        todosExpedientes.push(...expedientesPagina);
        console.error(`         ✅ ${expedientesPagina.length} expedientes encontrados nesta página.`);

        const nextButtonSelector = 'td.rich-datascr-button[onclick*="\'page\': \'next\'"]';
        const nextButton = await page.$(nextButtonSelector);
        
        if (nextButton) {
            console.error('      ▶️   Indo para a próxima página...');
            await Promise.all([
                nextButton.click(),
                // ATUALIZADO: Espera pela URL do TJES
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

  return todosExpedientes;
}


/**
 * Função principal (Adaptada para Expedientes TJES)
 */
async function rasparExpedientesTJES() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║     RASPAGEM: EXPEDIENTES - PJE TJES 1º GRAU (Firefox)            ║');
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
    await resolverCaptchaAWS(page);

    // Passo 2: Fazer o login no SSO (sem F5/reload)
    await fazerLoginSSO(page);

    // Passo 3: Navegar para Expedientes e verificar se há expedientes
    const temExpedientes = await navegarParaExpedientes(page);

    let todosExpedientes = [];

    // Passo 4: Raspar expedientes apenas se houver
    if (temExpedientes) {
      todosExpedientes = await rasparTodosOsExpedientes(page);
    } else {
      console.error('⚠️  Pulando raspagem - não há expedientes disponíveis\n');
    }

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL (TJES):');
    console.error('='.repeat(70));
    console.error(`Total de expedientes extraídos: ${todosExpedientes.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/expedientes-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJES', // ATUALIZADO
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

// ATUALIZADO: Nome da função principal
rasparExpedientesTJES().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
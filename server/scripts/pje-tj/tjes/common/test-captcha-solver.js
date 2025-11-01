/**
 * Script de Teste: Resolver CAPTCHA da AWS no TJES
 *
 * Este script é usado APENAS para testar e debugar a resolução do CAPTCHA.
 * Abre o navegador em modo visível para permitir inspeção.
 *
 * USO:
 * node server/scripts/pje-tj/tjes/common/test-captcha-solver.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import ffmpegPath from 'ffmpeg-static';

const PJE_LOGIN_URL = 'https://pje.tjes.jus.br/pje/login.seam';
const N8N_SOLVER_URL = process.env.N8N_SOLVER_URL || 'https://workflows.platform.sinesys.app/webhook/captcha-solver';
const TEMP_AUDIO_AAC_PATH = path.join(process.cwd(), 'temp_audio_tjes_test.aac');
const TEMP_AUDIO_MP3_PATH = path.join(process.cwd(), 'temp_audio_tjes_test.mp3');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para medir tempo de operações
function getTimestamp() {
  return new Date().toISOString().split('T')[1].split('.')[0];
}

function logWithTime(message) {
  console.log(`[${getTimestamp()}] ${message}`);
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
          console.log(`✅ Firefox do Puppeteer encontrado: ${exe}`);
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
        console.log(`✅ Firefox do sistema encontrado: ${firefoxPath}`);
        return firefoxPath;
      }
    }

    try {
      const result = execSync('where firefox', { encoding: 'utf8' });
      if (result) {
        const firefoxPath = result.trim().split('\n')[0];
        console.log(`✅ Firefox encontrado via comando: ${firefoxPath}`);
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
  console.log(`\n📤 Enviando áudio para o endpoint N8N...`);
  console.log(`   URL: ${N8N_SOLVER_URL}`);

  try {
    const audioBuffer = await fs.readFile(filePath);
    const audioSizeKB = (audioBuffer.length / 1024).toFixed(2);

    console.log(`   Tamanho do áudio: ${audioSizeKB} KB`);
    console.log(`   Formato: multipart/form-data (binary)`);

    // Criar FormData e adicionar o áudio como binary data na key "data"
    const form = new FormData();
    form.append('data', audioBuffer, {
      filename: 'captcha-audio.mp3',
      contentType: 'audio/mpeg'
    });

    console.log(`   Enviando POST request com binary data...`);
    const response = await axios.post(N8N_SOLVER_URL, form, {
      timeout: 60000,
      headers: {
        ...form.getHeaders()
      }
    });

    console.log(`   Status da resposta: ${response.status}`);
    console.log(`   Dados da resposta:`, JSON.stringify(response.data, null, 2));

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
      console.log(`   ✅ N8N respondeu: "${transcricao}"`);
      return transcricao.trim();
    } else {
      throw new Error(`N8N retornou uma resposta inválida: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`   ❌ Erro ao contatar N8N:`);
    console.error(`   Mensagem: ${error.message}`);
    if (error.response) {
      console.error(`   Status HTTP: ${error.response.status}`);
      console.error(`   Dados: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Função principal: Testa a resolução do CAPTCHA
 */
async function testarCaptchaSolver() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║           TESTE: CAPTCHA SOLVER - PJE TJES (Firefox)             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log('🦊 Procurando Firefox instalado...\n');
  const firefoxPath = encontrarFirefox();

  if (!firefoxPath) {
    console.error('❌ Firefox não encontrado!');
    console.error('Por favor, instale o Firefox: npx puppeteer browsers install firefox\n');
    throw new Error('Firefox não encontrado');
  }

  const browser = await puppeteer.launch({
    browser: 'firefox',
    headless: false, // IMPORTANTE: Modo visível para debug
    executablePath: firefoxPath,
    extraPrefsFirefox: {
      'network.cookie.cookieBehavior': 0,
      'privacy.trackingprotection.enabled': false,
      'privacy.trackingprotection.pbmode.enabled': false,
    },
    args: ['--start-maximized'],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  console.log('✅ Firefox iniciado em modo visível\n');

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0');

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['pt-BR', 'pt', 'en-US', 'en'],
    });
  });

  try {
    console.log('🌐 Navegando para página de login do TJES...');
    console.log(`   URL: ${PJE_LOGIN_URL}\n`);

    await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('✅ Página inicial carregada.\n');
    await delay(3000);

    // Tirar screenshot inicial
    await page.screenshot({ path: 'debug-captcha-01-inicial.png', fullPage: true });
    console.log('📸 Screenshot 1 salvo: debug-captcha-01-inicial.png\n');

    console.log('🧩 Iniciando processo de resolução do CAPTCHA...\n');

    // Passo 1: Procurar e clicar no botão "Iniciar"
    console.log('🔍 Procurando botão "Iniciar" do CAPTCHA...');

    // Tentar diferentes seletores possíveis
    const possibleStartSelectors = [
      '#amzn-captcha-verify-button',
      'button[id*="captcha"]',
      'button[class*="captcha"]',
      'input[type="button"][value*="Iniciar"]',
      'button:has-text("Iniciar")',
    ];

    let startButton = null;
    let usedSelector = null;

    for (const selector of possibleStartSelectors) {
      try {
        console.log(`   Tentando seletor: ${selector}`);
        startButton = await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        if (startButton) {
          usedSelector = selector;
          console.log(`   ✅ Botão encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`   ⚠️  Seletor não encontrado: ${selector}`);
      }
    }

    if (!startButton) {
      console.error('❌ Botão "Iniciar" não encontrado com nenhum seletor!');
      await page.screenshot({ path: 'debug-captcha-02-no-start-button.png', fullPage: true });
      console.log('📸 Screenshot de erro salvo: debug-captcha-02-no-start-button.png');
      throw new Error('Botão "Iniciar" não encontrado');
    }

    console.log('\n👆 Clicando no botão "Iniciar"...');
    await startButton.click();
    await delay(3000);

    await page.screenshot({ path: 'debug-captcha-03-apos-iniciar.png', fullPage: true });
    console.log('📸 Screenshot 2 salvo: debug-captcha-03-apos-iniciar.png\n');

    // Passo 2: Procurar e clicar no botão de ÁUDIO
    console.log('🔍 Procurando botão de troca para ÁUDIO...');

    const possibleAudioSelectors = [
      '#amzn-btn-audio-internal',
      'button[id*="audio"]',
      'button[aria-label*="Audio"]',
      'button[aria-label*="Áudio"]',
      'a[href*="audio"]',
    ];

    let audioButton = null;
    let audioSelector = null;

    for (const selector of possibleAudioSelectors) {
      try {
        console.log(`   Tentando seletor: ${selector}`);
        audioButton = await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        if (audioButton) {
          audioSelector = selector;
          console.log(`   ✅ Botão de áudio encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`   ⚠️  Seletor não encontrado: ${selector}`);
      }
    }

    if (!audioButton) {
      console.error('❌ Botão de troca para ÁUDIO não encontrado!');
      await page.screenshot({ path: 'debug-captcha-04-no-audio-button.png', fullPage: true });
      console.log('📸 Screenshot de erro salvo: debug-captcha-04-no-audio-button.png');
      throw new Error('Botão de ÁUDIO não encontrado');
    }

    console.log('\n👆 Clicando no botão de ÁUDIO...');
    await audioButton.click();
    await delay(3000);

    await page.screenshot({ path: 'debug-captcha-05-apos-audio.png', fullPage: true });
    console.log('📸 Screenshot 3 salvo: debug-captcha-05-apos-audio.png\n');

    // Passo 3: Encontrar e baixar o áudio
    console.log('🎧 Procurando elemento <audio> com o arquivo .mp3...');

    const possibleAudioElementSelectors = [
      'audio[src*=".mp3"]',
      'audio[src*="audio"]',
      'audio',
      'source[src*=".mp3"]',
    ];

    let audioUrl = null;
    let audioElementSelector = null;

    for (const selector of possibleAudioElementSelectors) {
      try {
        console.log(`   Tentando seletor: ${selector}`);
        await page.waitForSelector(selector, { timeout: 5000 });
        audioUrl = await page.$eval(selector, el => el.src || el.getAttribute('src'));
        if (audioUrl) {
          audioElementSelector = selector;
          console.log(`   ✅ Elemento de áudio encontrado com seletor: ${selector}`);
          console.log(`   URL do áudio: ${audioUrl}`);
          break;
        }
      } catch (e) {
        console.log(`   ⚠️  Seletor não encontrado: ${selector}`);
      }
    }

    if (!audioUrl) {
      console.error('❌ Elemento <audio> não encontrado!');
      await page.screenshot({ path: 'debug-captcha-06-no-audio-element.png', fullPage: true });
      console.log('📸 Screenshot de erro salvo: debug-captcha-06-no-audio-element.png');
      throw new Error('Elemento <audio> não encontrado');
    }

    console.log('\n📥 Baixando o áudio...');
    const audioBuffer = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return Array.from(new Uint8Array(arrayBuffer));
    }, audioUrl);

    await fs.writeFile(TEMP_AUDIO_AAC_PATH, Buffer.from(audioBuffer));
    console.log(`✅ Áudio AAC salvo em: ${TEMP_AUDIO_AAC_PATH}`);

    // Converter AAC para MP3 usando ffmpeg
    console.log('🔄 Convertendo AAC para MP3 usando ffmpeg...');
    try {
      execSync(`"${ffmpegPath}" -i "${TEMP_AUDIO_AAC_PATH}" -codec:a libmp3lame -q:a 2 "${TEMP_AUDIO_MP3_PATH}" -y`, {
        stdio: 'pipe'
      });
      console.log(`✅ Áudio convertido para MP3: ${TEMP_AUDIO_MP3_PATH}\n`);
    } catch (error) {
      console.error('❌ Erro ao converter áudio com ffmpeg:', error.message);
      throw error;
    }

    // Passo 4: Enviar para N8N (usando o MP3 convertido)
    const transcricaoCompleta = await enviarAudioParaN8N(TEMP_AUDIO_MP3_PATH);

    // Limpar arquivos temporários
    await fs.unlink(TEMP_AUDIO_AAC_PATH);
    await fs.unlink(TEMP_AUDIO_MP3_PATH);
    console.log('🗑️  Arquivos temporários removidos\n');

    // Processar a transcrição: O CAPTCHA pede UMA das palavras, mas a IA retorna TODAS
    // Exemplo: "atravesse instituto" -> escolher apenas "atravesse"
    logWithTime('📝 Processando transcrição...');
    console.log(`   Transcrição completa: "${transcricaoCompleta}"`);

    const palavras = transcricaoCompleta.trim().split(/\s+/).filter(p => p.length > 0);
    let transcricao;

    if (palavras.length > 1) {
      // Se tiver múltiplas palavras, escolher a primeira
      transcricao = palavras[0];
      console.log(`   ℹ️  Múltiplas palavras detectadas (${palavras.length}): ${palavras.join(', ')}`);
      console.log(`   ✅ Usando apenas a primeira palavra: "${transcricao}"`);
    } else {
      transcricao = transcricaoCompleta;
      console.log(`   ✅ Uma palavra detectada: "${transcricao}"`);
    }
    console.log();

    // Passo 5: Procurar o campo de input e digitar a transcrição
    logWithTime('🔍 Procurando campo de input para digitar a resposta...');

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
        logWithTime(`   Tentando seletor: ${selector}`);
        inputElement = await page.waitForSelector(selector, { visible: true, timeout: 3000 });
        if (inputElement) {
          inputSelector = selector;
          logWithTime(`   ✅ Campo de input encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`   ⚠️  Seletor não encontrado: ${selector}`);
      }
    }

    if (!inputElement) {
      logWithTime('❌ Campo de input não encontrado!');
      await page.screenshot({ path: 'debug-captcha-07-no-input.png', fullPage: true });
      console.log('📸 Screenshot de erro salvo: debug-captcha-07-no-input.png');
      throw new Error('Campo de input não encontrado');
    }

    logWithTime(`⌨️  Digitando transcrição: "${transcricao}"`);
    await page.type(inputSelector, transcricao, { delay: 50 });
    logWithTime('✅ Transcrição digitada com sucesso');
    await delay(500);

    await page.screenshot({ path: 'debug-captcha-08-apos-digitar.png', fullPage: true });
    logWithTime('📸 Screenshot 4 salvo: debug-captcha-08-apos-digitar.png');

    // Passo 6: Procurar e clicar no botão de submit
    logWithTime('🔍 Procurando botão de confirmação/submit...');

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
        logWithTime(`   Tentando seletor: ${selector}`);
        submitButton = await page.$(selector);
        if (submitButton) {
          submitSelector = selector;
          logWithTime(`   ✅ Botão de submit encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`   ⚠️  Seletor não encontrado: ${selector}`);
      }
    }

    if (!submitButton) {
      logWithTime('❌ Botão de submit não encontrado!');
      await page.screenshot({ path: 'debug-captcha-09-no-submit.png', fullPage: true });
      logWithTime('📸 Screenshot de erro salvo: debug-captcha-09-no-submit.png');
      throw new Error('Botão de submit não encontrado');
    }

    logWithTime('👆 Clicando no botão de confirmação...');
    await submitButton.click();
    await delay(1000); // Reduced from 5000ms

    await page.screenshot({ path: 'debug-captcha-10-apos-submit.png', fullPage: true });
    logWithTime('📸 Screenshot 5 salvo: debug-captcha-10-apos-submit.png');

    // Verificar se chegou na tela de login (SSO)
    logWithTime('🔍 Verificando se o CAPTCHA foi resolvido...');

    try {
      const waitStart = Date.now();
      await page.waitForSelector('input[name="username"]', { visible: true, timeout: 15000 });
      const waitDuration = ((Date.now() - waitStart) / 1000).toFixed(2);
      logWithTime(`✅✅✅ CAPTCHA RESOLVIDO COM SUCESSO! (login apareceu em ${waitDuration}s)`);
      logWithTime('🎉 Página de login do SSO carregada!');

      await page.screenshot({ path: 'debug-captcha-11-sucesso.png', fullPage: true });
      logWithTime('📸 Screenshot final salvo: debug-captcha-11-sucesso.png');
    } catch (e) {
      logWithTime('⚠️  Campo de login não apareceu - possível falha na resolução do CAPTCHA');
      await page.screenshot({ path: 'debug-captcha-12-falha.png', fullPage: true });
      logWithTime('📸 Screenshot de falha salvo: debug-captcha-12-falha.png');
    }

    console.log('='.repeat(70));
    console.log('📊 RESUMO DOS SELETORES ENCONTRADOS:');
    console.log('='.repeat(70));
    console.log(`Botão "Iniciar": ${usedSelector}`);
    console.log(`Botão "Áudio": ${audioSelector}`);
    console.log(`Elemento <audio>: ${audioElementSelector}`);
    console.log(`Campo de input: ${inputSelector}`);
    console.log(`Botão de submit: ${submitSelector}`);
    console.log('='.repeat(70) + '\n');

    console.log('👁️  O navegador ficará ABERTO para você inspecionar.');
    console.log('    Pressione Ctrl+C quando terminar.\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);

    try {
      await page.screenshot({ path: 'debug-captcha-erro-geral.png', fullPage: true });
      console.log('📸 Screenshot de erro salvo: debug-captcha-erro-geral.png\n');
    } catch (e) {}

    console.log('👁️  O navegador ficará aberto para diagnóstico.');
    console.log('    Pressione Ctrl+C para fechar.\n');
  }
}

testarCaptchaSolver().catch(console.error);

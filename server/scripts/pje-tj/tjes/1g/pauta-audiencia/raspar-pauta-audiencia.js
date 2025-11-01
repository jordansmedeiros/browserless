/**
 * Raspagem de Pauta de Audiências - PJE TJES 1º Grau (com Solver de CAPTCHA)
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
 * 9. Navegar para a URL da Pauta de Audiências
 * 10. Aplicar Filtros: Data de Hoje até +365 dias
 * 11. Clicar em "Pesquisar"
 * 12. Iterar, raspar e paginar os resultados
 *
 * INTEGRAÇÃO:
 * - Requer `axios` (npm install axios) para se comunicar com o N8N.
 * - Credenciais e URL do N8N via variáveis de ambiente.
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import axios from 'axios'; // Necessário para enviar o áudio para o N8N

// --- Configuração ---
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;

// ATUALIZADO: URLs do TJES
const PJE_LOGIN_URL = 'https://pje.tjes.jus.br/pje/login.seam';
const PAUTA_URL = 'https://pje.tjes.jus.br/pje/ProcessoAudiencia/PautaAudiencia/listView.seam';

// ATUALIZADO: Endpoint do N8N (substituir pela sua URL)
const N8N_SOLVER_URL = process.env.N8N_SOLVER_URL || 'http://seu-servidor-n8n.com/webhook/captcha-solver';

// ATUALIZADO: Diretório de saída
const DATA_DIR = 'data/pje/tjes/pauta';
const SKIP_FILE_OUTPUT = process.env.PJE_OUTPUT_FILE === '';
const TEMP_AUDIO_PATH = path.join(process.cwd(), 'temp_audio.mp3'); // Arquivo temporário

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
    const audioBase64 = audioBuffer.toString('base64');

    const payload = {
      audio_base64: audioBase64
    };

    const response = await axios.post(N8N_SOLVER_URL, payload, {
      timeout: 60000, // 60 segundos de timeout
    });

    // Espera o JSON de resposta (conforme especificado)
    if (response.data && response.data.success && response.data.transcription) {
      console.error(`   ✅ N8N respondeu: ${response.data.transcription}`);
      return response.data.transcription;
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
    console.error('   🎧 Aguardando download do áudio...');

    // TODO: AJUSTAR ESTE SELETOR
    // (Inspecione a tela de áudio e encontre o seletor correto para a tag <audio>)
    const audioSelector = 'audio[src*=".mp3"]'; // <--- PLACEHOLDER
    
    await page.waitForSelector(audioSelector, { timeout: 10000 });
    const audioUrl = await page.$eval(audioSelector, el => el.src);

    if (!audioUrl) {
        throw new Error('Não foi possível encontrar o <audio> src. Verifique o seletor.');
    }
    
    // Baixar o áudio usando fetch de dentro do browser
    const audioBuffer = await page.evaluate(async (url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return Array.from(new Uint8Array(arrayBuffer));
    }, audioUrl);

    await fs.writeFile(TEMP_AUDIO_PATH, Buffer.from(audioBuffer));
    console.error(`   ✅ Áudio salvo em: ${TEMP_AUDIO_PATH}`);

    // 4. Enviar para N8N e obter transcrição
    const transcricao = await enviarAudioParaN8N(TEMP_AUDIO_PATH);
    await fs.unlink(TEMP_AUDIO_PATH); // Limpar arquivo temporário

    // 5. Digitar a resposta e submeter
    
    // TODO: AJUSTAR ESTE SELETOR
    // (Inspecione a tela de áudio e encontre o seletor para o <input> de resposta)
    const inputSelector = '#amzn-audio-verify-internal-input'; // <--- PLACEHOLDER
    
    await page.waitForSelector(inputSelector, { visible: true });
    await page.type(inputSelector, transcricao);
    console.error('   ✅ Transcrição digitada.');
    await delay(500);

    // Clicar em "Confirmar" (ou o botão de submit da tela de áudio)
    const submitSelector = 'button[type="submit"]'; 
    await page.click(submitSelector);
    console.error('   ✅ CAPTCHA submetido.');

    // 6. Aguardar redirecionamento para a página de LOGIN do SSO
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
    const pageContent = await page.content();
    const hasNavigationElements = pageContent.includes('botao-menu') || pageContent.includes('Painel');

    if (!hasNavigationElements) {
        throw new Error('Login SSO falhou - área logada não carregou');
    }

    console.error('✅ Login SSO completado com sucesso!\n');
}

/**
 * Navega até a Pauta de Audiências
 * (Navegação via URL direta, pós-login)
 */
async function navegarParaPauta(page) {
  console.error('🧭 Navegando para Pauta de Audiências (TJES)...\n');

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
 * (Lógica idêntica ao TJMG)
 */
async function aplicarFiltrosPauta(page) {
  console.error('🔍 Aplicando filtros na pauta de audiências...');

  const hoje = new Date();
  const proximoAno = new Date(hoje);
  proximoAno.setDate(proximoAno.getDate() + 365);

  const dataInicio = formatarData(hoje);
  const dataFim = formatarData(proximoAno);

  console.error(`   🗓️   Período definido: ${dataInicio} até ${dataFim}`);

  await page.evaluate((data) => {
    document.getElementById('processoAudienciaSearchForm:dtInicioDecoration:dtInicioFromFormInputDate').value = data;
  }, dataInicio);

  await page.evaluate((data) => {
    document.getElementById('processoAudienciaSearchForm:dtInicioDecoration:dtInicioToFormInputDate').value = data;
  }, dataFim);
  
  console.error("   ✅ Situação 'todas' já vem marcada por padrão.");

  const searchButtonSelector = 'input[id="processoAudienciaSearchForm:searchButton"]';
  console.error('   ⏳ Clicando em "Pesquisar"...');
  
  await Promise.all([
    page.click(searchButtonSelector),
    // ATUALIZADO: Espera pela URL do TJES
    page.waitForResponse(res => res.url().includes('pje.tjes.jus.br/pje/ProcessoAudiencia/PautaAudiencia/listView.seam') && res.request().method() === 'POST', { timeout: 45000 })
  ]);
  
  const tableBodySelector = 'tbody[id="idProcessoAudiencia:tb"]';
  await page.waitForSelector(tableBodySelector, { visible: true });
  await delay(2000); 
  
  console.error('✅ Filtros aplicados e resultados carregados.\n');
}


/**
 * Extrai as audiências da página atual.
 * (Lógica idêntica ao TJMG, pendente de HTML com dados)
 */
async function extrairAudienciasDaPagina(page) {
  return await page.evaluate(() => {
    const audiencias = [];
    
    // TODO: VALIDAR SELETOR DE LINHA. O 'rich-table-row' é um palpite.
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
          textoCompleto: row.innerText.replace(/\n/g, ' | ') // Fallback
        };

        // TODO: Validar os seletores de coluna (baseados na ordem do <thead>)
        // const colunas = row.querySelectorAll('td');
        // if (colunas.length >= 8) {
        //   audienciaInfo.dataHora = colunas[1]?.innerText.trim();
        //   ... (etc)
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
 * Raspa todas as páginas da Pauta de Audiências.
 * (Lógica idêntica ao TJMG, pendente de HTML com dados)
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

    // TODO: VALIDAR SELETOR DE PAGINAÇÃO.
    const nextButtonSelector = 'td.rich-datascr-button[onclick*="\'page\': \'next\'"]';
    
    const nextButton = await page.$(nextButtonSelector);
    
    if (nextButton) {
      console.error('      ▶️    Indo para a próxima página...');
      await Promise.all([
        nextButton.click(),
        // ATUALIZADO: Espera pela URL do TJES
        page.waitForResponse(res => res.url().includes('pje.tjes.jus.br/pje/ProcessoAudiencia/PautaAudiencia'), { timeout: 30000 })
      ]);
      
      await page.waitForSelector(tableBodySelector, { visible: true }); 
      paginaAtual++;
      await delay(2000);
    } else {
      console.error('      ⏹️    Não há mais páginas na pauta.');
      break; 
    }
  }

  return todasAudiencias;
}


/**
 * Função principal (Adaptada para Pauta de Audiências TJES)
 */
async function rasparPautaAudienciasTJES() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║  RASPAGEM: PAUTA DE AUDIÊNCIAS - PJE TJES 1º GRAU (Firefox)     ║');
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

    // Passo 3: Navegar para Pauta de Audiências
    await navegarParaPauta(page);

    // Passo 4: Aplicar filtros (datas, etc)
    await aplicarFiltrosPauta(page);

    // Passo 5: Raspar todas as audiências
    const todasAudiencias = await rasparPautaDeAudiencias(page);

    console.error('\n' + '='.repeat(70));
    console.error('📊 RESUMO FINAL (TJES):');
    console.error('='.repeat(70));
    console.error(`Total de audiências extraídas: ${todasAudiencias.length}`);
    console.error('='.repeat(70) + '\n');

    // Salvar resultados
    if (!SKIP_FILE_OUTPUT) {
      const outputFile = `${DATA_DIR}/pauta-audiencias-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify({
        dataExtracao: new Date().toISOString(),
        tribunal: 'TJES', // ATUALIZADO
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

// ATUALIZADO: Nome da função principal
rasparPautaAudienciasTJES().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
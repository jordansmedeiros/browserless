/**
 * Raspagem PJE - Minha Pauta
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Busca audiências/sessões da pauta
 * 3. Período: hoje até hoje + 365 dias (1 ano exato)
 * 4. Salva em JSON com nomenclatura padronizada
 *
 * COMO USAR:
 * 1. Configure as credenciais no arquivo .env (PJE_CPF, PJE_SENHA)
 * 2. Execute: node scripts/pje-trt/trt3/1g/pauta/raspar-minha-pauta.js
 * 3. Veja resultados em: data/pje/trt3/1g/pauta/
 *
 * PADRÃO DE NOMENCLATURA:
 * pauta-{timestamp}.json
 * - pauta = Minha Pauta
 * - timestamp = YYYYMMDD-HHMMSS
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';

puppeteer.use(StealthPlugin());

// Validação de credenciais
function validarCredenciais() {
  const credenciaisFaltando = [];

  if (!process.env.PJE_CPF) credenciaisFaltando.push('PJE_CPF');
  if (!process.env.PJE_SENHA) credenciaisFaltando.push('PJE_SENHA');

  if (credenciaisFaltando.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO: Credenciais PJE não configuradas');
    console.error('='.repeat(70));
    console.error('\nVariáveis de ambiente faltando:');
    credenciaisFaltando.forEach(v => console.error(`  - ${v}`));
    console.error('\n💡 Como configurar:');
    console.error('  1. Copie o arquivo .env.example para .env');
    console.error('  2. Preencha as variáveis PJE_CPF e PJE_SENHA');
    console.error('  3. Execute o script novamente');
    console.error('\n📖 Consulte o README para mais informações.\n');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
}

// Valida credenciais antes de prosseguir
validarCredenciais();

// Lê credenciais das variáveis de ambiente
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;

// URLs do PJE (genéricas para qualquer tribunal)
const PJE_LOGIN_URL = process.env.PJE_LOGIN_URL || 'https://pje.trt3.jus.br/primeirograu/login.seam';
const PJE_BASE_URL = process.env.PJE_BASE_URL || 'https://pje.trt3.jus.br';

// Diretórios de dados (local, apenas para debug)
const DATA_DIR = 'data/pje/pauta';
const ICS_DIR = 'data/pje/pauta/ics';

// Configurações do raspador
const CONFIG = {
  agrupador: 'pauta',
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gera nome do arquivo baseado no padrão
 */
function gerarNomeArquivo() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .split('.')[0]; // YYYYMMDD-HHMMSS

  return `${CONFIG.agrupador}-${timestamp}.json`;
}

/**
 * Calcula datas para o período de 1 ano
 */
function calcularPeriodo() {
  const hoje = new Date();

  // Data inicial: hoje
  const dataInicio = hoje.toISOString().split('T')[0]; // YYYY-MM-DD

  // Data final: hoje + 365 dias
  const dataFim = new Date(hoje);
  dataFim.setDate(dataFim.getDate() + 365);
  const dataFimStr = dataFim.toISOString().split('T')[0]; // YYYY-MM-DD

  return { dataInicio, dataFim: dataFimStr };
}

async function rasparMinhaPauta() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║   RASPAGEM: MINHA PAUTA                                           ║');
  console.error('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Criar diretórios
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(ICS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();

  try {
    // ====================================================================
    // PASSO 1: LOGIN NO PJE
    // ====================================================================

    console.error('🔐 Fazendo login no PJE...\n');

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
    });

    await page.goto(PJE_LOGIN_URL, { waitUntil: 'networkidle2' });
    await delay(1500);

    // Clica em "Entrar com PDPJ"
    await page.waitForSelector('#btnSsoPdpj', { visible: true });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#btnSsoPdpj'),
    ]);

    // Preenche credenciais - aguarda até 15s para página SSO carregar
    console.error('⏳ Aguardando página SSO carregar...');
    await page.waitForSelector('#username', { visible: true, timeout: 15000 });
    await page.type('#username', CPF);
    console.error('✅ CPF preenchido');
    await delay(1000);

    await page.waitForSelector('#password', { visible: true, timeout: 10000 });
    await page.type('#password', SENHA);
    console.error('✅ Senha preenchida');
    await delay(1500);

    // Clica em Entrar
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#kc-login'),
    ]);

    console.error('✅ Login realizado!\n');
    await delay(5000);

    // ====================================================================
    // PASSO 2: BUSCAR PAUTA
    // ====================================================================

    const { dataInicio, dataFim } = calcularPeriodo();

    console.error('📅 Período de busca:');
    console.error(`   Data inicial: ${dataInicio}`);
    console.error(`   Data final: ${dataFim} (1 ano)\n`);
    console.error('🔄 Iniciando raspagem...\n');

    let audiencias = await buscarPauta(page, dataInicio, dataFim);

    // ====================================================================
    // PASSO 2.5: DELETAR ARQUIVOS ANTIGOS
    // ====================================================================

    console.error('\n🗑️  Limpando arquivos antigos...\n');

    // Limpa arquivos JSON antigos
    const arquivosJSON = await fs.readdir(DATA_DIR);
    const padrao = new RegExp(`^${CONFIG.agrupador}-`);

    for (const arquivo of arquivosJSON) {
      if (padrao.test(arquivo)) {
        const caminhoCompleto = path.join(DATA_DIR, arquivo);
        await fs.unlink(caminhoCompleto);
        console.error(`   ❌ Deletado JSON: ${arquivo}`);
      }
    }

    // Limpa arquivos .ics antigos
    try {
      const arquivosICS = await fs.readdir(ICS_DIR);
      for (const arquivo of arquivosICS) {
        if (arquivo.endsWith('.ics')) {
          const caminhoCompleto = path.join(ICS_DIR, arquivo);
          await fs.unlink(caminhoCompleto);
          console.error(`   ❌ Deletado ICS: ${arquivo}`);
        }
      }
    } catch (error) {
      // Diretório pode não existir ainda
    }

    // ====================================================================
    // PASSO 3.5: GERAR ARQUIVOS .ICS
    // ====================================================================

    audiencias = await gerarArquivosICS(audiencias);

    // ====================================================================
    // PASSO 4: SALVAR RESULTADOS
    // ====================================================================

    const nomeArquivo = gerarNomeArquivo();
    const caminhoArquivo = path.join(DATA_DIR, nomeArquivo);

    await fs.writeFile(caminhoArquivo, JSON.stringify(audiencias, null, 2));

    console.error('\n' + '='.repeat(70));
    console.error('📊 RELATÓRIO FINAL');
    console.error('='.repeat(70) + '\n');
    console.error(`TRT: ${CONFIG.trt.toUpperCase()}`);
    console.error(`Grau: ${CONFIG.grau.toUpperCase()}`);
    console.error(`Tipo: Minha Pauta`);
    console.error(`Período: ${dataInicio} a ${dataFim}`);
    console.error(`Data da raspagem: ${new Date().toISOString()}`);
    console.error(`Total de audiências: ${audiencias.length}`);
    console.error(`Arquivo: ${nomeArquivo}\n`);

    if (audiencias.length > 0) {
      console.error('Primeiras 3 audiências:');
      audiencias.slice(0, 3).forEach((a, i) => {
        const processo = a.nrProcesso || a.processo?.numero || a.id;
        const data = a.dataInicio ? new Date(a.dataInicio).toLocaleString('pt-BR') : 'Sem data';
        const autor = a.poloAtivo?.nome || 'N/A';
        console.error(`  ${i + 1}. Processo: ${processo}`);
        console.error(`     Data/Hora: ${data}`);
        console.error(`     Autor: ${autor}`);
        console.error('');
      });
    }

    console.error('='.repeat(70));
    console.error('✅ RASPAGEM CONCLUÍDA!');
    console.error('='.repeat(70) + '\n');

    // Saída JSON para stdout (para integração com sistema de fila)
    const resultado = {
      success: true,
      processosCount: audiencias.length,
      processos: audiencias,
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(resultado));

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);

    // Saída JSON de erro para stdout
    const resultadoErro = {
      success: false,
      processosCount: 0,
      processos: [],
      timestamp: new Date().toISOString(),
      error: {
        type: 'script_error',
        category: 'execution',
        message: error.message,
        technicalMessage: error.stack,
        retryable: false,
        timestamp: new Date().toISOString()
      }
    };
    console.log(JSON.stringify(resultadoErro));
    process.exit(1);
  } finally {
    await browser.close();
  }
}

/**
 * Formata data para formato iCalendar (YYYYMMDDTHHMMSS)
 */
function formatarDataICS(dataISO) {
  if (!dataISO) return '';
  return dataISO.replace(/[-:]/g, '').replace(/\.\d{3}Z?$/, '');
}

/**
 * Gera conteúdo do arquivo .ics (iCalendar) para uma audiência
 */
function gerarConteudoICS(audiencia) {
  const processo = audiencia.nrProcesso || audiencia.processo?.numero || 'Processo sem número';
  const tipo = audiencia.tipo?.descricao || 'Audiência';
  const orgao = audiencia.processo?.orgaoJulgador?.descricao || 'Órgão não informado';
  const sala = audiencia.salaAudiencia?.nome || 'Sala não informada';
  const autor = audiencia.poloAtivo?.nome || 'Autor não informado';
  const reu = audiencia.poloPassivo?.nome || 'Réu não informado';

  const dtstart = formatarDataICS(audiencia.dataInicio);
  const dtend = formatarDataICS(audiencia.dataFim);
  const dtstamp = formatarDataICS(new Date().toISOString());

  const uid = `audiencia-${audiencia.id}@pje.trt3.jus.br`;
  const summary = `${tipo} - Processo ${processo}`;

  let description = `Processo: ${processo}\\n`;
  description += `Tipo: ${tipo}\\n`;
  description += `Órgão Julgador: ${orgao}\\n`;
  description += `Sala: ${sala}\\n`;
  description += `Autor: ${autor}\\n`;
  description += `Réu: ${reu}`;

  if (audiencia.urlAudienciaVirtual) {
    description += `\\n\\nLink da Videoconferência: ${audiencia.urlAudienciaVirtual}`;
  }

  const location = audiencia.urlAudienciaVirtual ? audiencia.urlAudienciaVirtual : sala;

  // Formato iCalendar (RFC 5545)
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PJE TRT3//Minha Pauta//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:PJE - Minha Pauta',
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    audiencia.urlAudienciaVirtual ? `URL:${audiencia.urlAudienciaVirtual}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(line => line).join('\r\n');

  return icsContent;
}

/**
 * Gera arquivo .ics para cada audiência
 */
async function gerarArquivosICS(audiencias) {
  console.error('📅 Gerando arquivos .ics (Google Calendar)...\n');

  let totalGerados = 0;

  for (const audiencia of audiencias) {
    try {
      const nomeArquivo = `audiencia-${audiencia.id}.ics`;
      const caminhoArquivo = path.join(ICS_DIR, nomeArquivo);

      const conteudoICS = gerarConteudoICS(audiencia);
      await fs.writeFile(caminhoArquivo, conteudoICS, 'utf8');

      // Adiciona referência ao arquivo .ics na audiência
      audiencia.arquivoICS = caminhoArquivo.replace(/\\/g, '/'); // Normaliza path para JSON

      totalGerados++;
    } catch (error) {
      console.error(`   ❌ Erro ao gerar .ics para audiência ${audiencia.id}: ${error.message}`);
    }
  }

  console.error(`   ✅ ${totalGerados}/${audiencias.length} arquivos .ics gerados\n`);

  return audiencias;
}

/**
 * Busca audiências/sessões da pauta com paginação
 */
async function buscarPauta(page, dataInicio, dataFim) {
  const todasAudiencias = [];
  let paginaAtual = 1;
  const tamanhoPagina = 100;
  let totalPaginas = null;

  while (true) {
    console.error(`   Página ${paginaAtual}/${totalPaginas || '?'}...`);

    const resultado = await page.evaluate(async (dataIni, dataFi, pagina, tamanho) => {
      try {
        const params = new URLSearchParams();
        params.append('dataInicio', dataIni);
        params.append('dataFim', dataFi);
        params.append('codigoSituacao', 'M'); // M = Marcada (padrão)
        params.append('numeroPagina', pagina);
        params.append('tamanhoPagina', tamanho);
        params.append('ordenacao', 'asc');

        const url = `/pje-comum-api/api/pauta-usuarios-externos?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          return { error: `HTTP ${response.status}: ${errorText}` };
        }

        return await response.json();
      } catch (e) {
        return { error: e.message };
      }
    }, dataInicio, dataFim, paginaAtual, tamanhoPagina);

    if (resultado.error) {
      console.error(`   ❌ Erro na página ${paginaAtual}: ${resultado.error}`);
      break;
    }

    // Verifica se é uma resposta de erro do PJE
    if (resultado.codigoErro) {
      console.error(`   ❌ Erro PJE: ${resultado.mensagem}`);
      break;
    }

    // Primeira página - descobre total de páginas
    if (totalPaginas === null && resultado.totalPaginas) {
      totalPaginas = resultado.totalPaginas;
      console.error(`   Total de páginas: ${totalPaginas}`);
      console.error(`   Total de audiências: ${resultado.totalRegistros || '?'}\n`);
    }

    // Adiciona audiências desta página
    if (resultado.resultado && Array.isArray(resultado.resultado)) {
      // Se a página atual está vazia, para a busca
      if (resultado.resultado.length === 0) {
        console.error(`   ⚠️  Página vazia - finalizando busca`);
        break;
      }

      todasAudiencias.push(...resultado.resultado);
      console.error(`   ✅ ${resultado.resultado.length} audiências capturadas`);
    } else if (Array.isArray(resultado)) {
      // Caso a resposta seja diretamente um array
      if (resultado.length === 0) {
        console.error(`   ⚠️  Resultado vazio - finalizando busca`);
        break;
      }

      todasAudiencias.push(...resultado);
      console.error(`   ✅ ${resultado.length} audiências capturadas`);
      break; // Se não tem paginação, para aqui
    } else {
      // Resposta inesperada - para
      console.error(`   ⚠️  Resposta inesperada - finalizando busca`);
      break;
    }

    // Verifica se chegou na última página
    if (totalPaginas && paginaAtual >= totalPaginas) {
      break;
    }

    // Limite de segurança para evitar loops infinitos
    if (paginaAtual >= 1000) {
      console.error(`   ⚠️  Limite de páginas atingido - finalizando busca`);
      break;
    }

    paginaAtual++;

    // Delay entre requisições
    await delay(500);
  }

  return todasAudiencias;
}

// Executa
rasparMinhaPauta().catch(console.error);

/**
 * Raspagem PJE - Pendentes de Manifestação
 * Filtros: No Prazo + Dada Ciência
 *
 * Este script:
 * 1. Faz login no PJE
 * 2. Obtém processos pendentes filtrados por:
 *    - Prazo: No prazo (N)
 *    - Ciência: Dada ciência (C)
 * 3. Salva em JSON com nomenclatura padronizada
 *
 * COMO USAR:
 * 1. Configure as credenciais no arquivo .env (PJE_CPF, PJE_SENHA, PJE_ID_ADVOGADO)
 * 2. Execute: node scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-no-prazo-dada-ciencia.js
 * 3. Veja resultados em: data/pje/trt3/1g/pendentes/
 *
 * PADRÃO DE NOMENCLATURA:
 * pend-N-C-{timestamp}.json
 * - pend = Pendentes de Manifestação
 * - N = No prazo
 * - C = Com ciência (dada)
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
  if (!process.env.PJE_ID_ADVOGADO) credenciaisFaltando.push('PJE_ID_ADVOGADO');

  if (credenciaisFaltando.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO: Credenciais PJE não configuradas');
    console.error('='.repeat(70));
    console.error('\nVariáveis de ambiente faltando:');
    credenciaisFaltando.forEach(v => console.error(`  - ${v}`));
    console.error('\n💡 Como configurar:');
    console.error('  1. Copie o arquivo .env.example para .env');
    console.error('  2. Preencha as variáveis PJE_CPF, PJE_SENHA e PJE_ID_ADVOGADO');
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
const ID_ADVOGADO = parseInt(process.env.PJE_ID_ADVOGADO, 10);

const PJE_LOGIN_URL = 'https://pje.trt3.jus.br/primeirograu/login.seam';
const DATA_DIR = 'data/pje/trt3/1g/pendentes';
const PDF_DIR = 'data/pje/trt3/1g/pendentes/pdfs';

// Configurações do raspador
const CONFIG = {
  trt: 'trt3',
  grau: '1g',
  agrupador: 'pend', // Pendentes de Manifestação
  filtros: {
    prazo: 'N',      // N = No prazo
    ciencia: 'C',    // C = Dada ciência
  },
  api: {
    tipoPainelAdvogado: 2,
    idPainelAdvogadoEnum: 2,
    ordenacaoCrescente: false,
  },
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

  const filtros = `${CONFIG.filtros.prazo}-${CONFIG.filtros.ciencia}`;
  return `${CONFIG.agrupador}-${filtros}-${timestamp}.json`;
}

async function rasparPendentesManifestation() {
  console.error('╔═══════════════════════════════════════════════════════════════════╗');
  console.error('║   RASPAGEM: PENDENTES - NO PRAZO + DADA CIÊNCIA                   ║');
  console.error('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Criar diretórios
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(PDF_DIR, { recursive: true });

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
    // PASSO 2: BUSCAR ID DO ADVOGADO
    // ====================================================================

    console.error('👤 Buscando ID do advogado via API...\n');

    // Busca perfis do usuário logado
    const advogadoInfo = await page.evaluate(async () => {
      try {
        const response = await fetch('/pje-seguranca/api/token/perfis');
        if (!response.ok) {
          return { error: `HTTP ${response.status}` };
        }
        const perfis = await response.json();

        // Busca perfil de advogado
        const perfilAdvogado = perfis.find(p =>
          p.identificadorPapel === 'ADVOGADO' ||
          p.papel?.toLowerCase().includes('advogado')
        );

        // Extrai CPF e nome da localizacao se disponível
        // Formato: "NOME COMPLETO (CPF)"
        let cpf = null;
        let nome = null;
        if (perfilAdvogado?.localizacao) {
          const match = perfilAdvogado.localizacao.match(/^(.+?)\s*\(([0-9.-]+)\)$/);
          if (match) {
            nome = match[1].trim();
            cpf = match[2].replace(/[.-]/g, ''); // Remove formatação do CPF
          }
        }

        // CORREÇÃO FINAL: O campo correto é "idPerfil"
        return {
          idAdvogado: perfilAdvogado?.idPerfil,  // ← CORRETO!
          cpf: cpf,
          nome: nome || perfilAdvogado?.papel,
          perfilCompleto: perfilAdvogado, // Para debug
          todosPerfis: perfis, // Retorna todos para debug
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    // DEBUG removido - já validado que funciona

    let idAdvogado;
    if (advogadoInfo.error) {
      console.error(`⚠️  Erro ao buscar ID do advogado: ${advogadoInfo.error}`);
      console.error('   Usando ID_ADVOGADO do .env como fallback...\n');
      idAdvogado = ID_ADVOGADO;
    } else if (advogadoInfo.idAdvogado) {
      idAdvogado = advogadoInfo.idAdvogado;
      console.error(`✅ ID do advogado obtido da API: ${idAdvogado}`);
      console.error(`   Nome: ${advogadoInfo.nome}`);
      console.error(`   CPF: ${advogadoInfo.cpf}\n`);

      // Retorna info do advogado no resultado para salvar no banco
      global.advogadoInfo = advogadoInfo;
    } else {
      console.error('⚠️  ID do advogado não encontrado na resposta da API');
      console.error('   Usando ID_ADVOGADO do .env como fallback...\n');
      idAdvogado = ID_ADVOGADO;
    }

    console.error(`✅ ID do advogado configurado: ${idAdvogado}\n`);

    // ====================================================================
    // PASSO 3: RASPAR PROCESSOS COM FILTROS
    // ====================================================================

    console.error('📋 Filtros aplicados:');
    console.error(`   - Prazo: No prazo (${CONFIG.filtros.prazo})`);
    console.error(`   - Ciência: Dada ciência (${CONFIG.filtros.ciencia})\n`);
    console.error('🔄 Iniciando raspagem...\n');

    const processos = await rasparComFiltros(page, idAdvogado);

    // ====================================================================
    // PASSO 4: DELETAR ARQUIVOS ANTIGOS
    // ====================================================================

    console.error('\n🗑️  Limpando arquivos antigos...\n');

    const arquivos = await fs.readdir(DATA_DIR);
    const padrao = new RegExp(`^${CONFIG.agrupador}-${CONFIG.filtros.prazo}-${CONFIG.filtros.ciencia}-`);

    for (const arquivo of arquivos) {
      if (padrao.test(arquivo)) {
        const caminhoCompleto = path.join(DATA_DIR, arquivo);
        await fs.unlink(caminhoCompleto);
        console.error(`   ❌ Deletado: ${arquivo}`);
      }
    }

    // ====================================================================
    // PASSO 5: SALVAR RESULTADOS
    // ====================================================================

    const nomeArquivo = gerarNomeArquivo();
    const caminhoArquivo = path.join(DATA_DIR, nomeArquivo);

    await fs.writeFile(caminhoArquivo, JSON.stringify(processos, null, 2));

    console.error('\n' + '='.repeat(70));
    console.error('📊 RELATÓRIO FINAL');
    console.error('='.repeat(70) + '\n');
    console.error(`TRT: ${CONFIG.trt.toUpperCase()}`);
    console.error(`Grau: ${CONFIG.grau.toUpperCase()}`);
    console.error(`Agrupador: Pendentes de Manifestação`);
    console.error(`Filtros: No prazo + Dada ciência (${CONFIG.filtros.prazo}-${CONFIG.filtros.ciencia})`);
    console.error(`Data da raspagem: ${new Date().toISOString()}`);
    console.error(`Total de processos: ${processos.length}`);
    console.error(`Arquivo: ${nomeArquivo}\n`);

    if (processos.length > 0) {
      console.error('Primeiros 3 processos:');
      processos.slice(0, 3).forEach((p, i) => {
        console.error(`  ${i + 1}. ${p.numeroProcesso} - ${p.nomeParteAutora}`);
      });
      console.error('');
    }

    console.error('='.repeat(70));
    console.error('✅ RASPAGEM CONCLUÍDA!');
    console.error('='.repeat(70) + '\n');

    // Saída JSON para stdout (para integração com sistema de fila)
    const resultado = {
      success: true,
      processosCount: processos.length,
      processos: processos,
      timestamp: new Date().toISOString(),
      // Inclui info do advogado para salvar no banco
      advogado: global.advogadoInfo ? {
        idAdvogado: global.advogadoInfo.idAdvogado,
        cpf: global.advogadoInfo.cpf,
        nome: global.advogadoInfo.nome,
      } : null,
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
 * Baixa o PDF de um documento e salva localmente
 * @param {Page} page - Página do Puppeteer
 * @param {number} idProcesso - ID do processo
 * @param {number} idDocumento - ID do documento
 * @param {string} numeroProcesso - Número do processo (para nomenclatura)
 * @returns {string|null} - Caminho do arquivo salvo ou null se erro
 */
async function baixarPDF(page, idProcesso, idDocumento, numeroProcesso) {
  try {
    // Gera nome do arquivo: numeroProcesso-idDocumento.pdf
    // Remove caracteres especiais do número do processo
    const nomeArquivo = `${numeroProcesso.replace(/[^0-9]/g, '')}-${idDocumento}.pdf`;
    const caminhoArquivo = path.join(PDF_DIR, nomeArquivo);

    // Baixa o PDF usando a API correta: /conteudo
    const pdfBuffer = await page.evaluate(async (idProc, idDoc) => {
      const response = await fetch(
        `/pje-comum-api/api/processos/id/${idProc}/documentos/id/${idDoc}/conteudo`
      );

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve) => {
        reader.onloadend = () => {
          // Remove o prefixo 'data:application/pdf;base64,'
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    }, idProcesso, idDocumento);

    if (!pdfBuffer) {
      return null;
    }

    // Converte de base64 para Buffer e salva
    const buffer = Buffer.from(pdfBuffer, 'base64');
    await fs.writeFile(caminhoArquivo, buffer);

    return caminhoArquivo;
  } catch (error) {
    console.error(`      ❌ Erro ao baixar PDF ${numeroProcesso}: ${error.message}`);
    return null;
  }
}

/**
 * Enriquece dados de um processo com informações adicionais:
 * - Processos associados (se houver)
 * - Metadados do documento
 * - URL para visualização
 * - Download do PDF
 */
async function enriquecerProcesso(page, processo) {
  // Busca dados via API (dentro do contexto da página)
  const processoEnriquecido = await page.evaluate(async (proc) => {
    const enriquecido = { ...proc };

    // 1. Adiciona URL para visualizar documento
    if (proc.idDocumento) {
      enriquecido.urlDocumento = `https://pje.trt3.jus.br/pjekz/processo/${proc.id}/documento/${proc.idDocumento}`;

      // 2. Busca metadados do documento
      try {
        const docResponse = await fetch(
          `/pje-comum-api/api/processos/id/${proc.id}/documentos/id/${proc.idDocumento}?incluirAssinatura=false&incluirAnexos=false`
        );
        if (docResponse.ok) {
          const docData = await docResponse.json();
          enriquecido.documentoMetadados = {
            titulo: docData.titulo,
            tipo: docData.tipo,
            nomeArquivo: docData.nomeArquivo,
            tamanho: docData.tamanho,
            criadoEm: docData.criadoEm,
            juntadoEm: docData.juntadoEm,
          };
        }
      } catch (e) {
        // Ignora erro - campo fica undefined
      }
    }

    // 3. Busca processos associados (se houver)
    if (proc.temAssociacao) {
      try {
        const assocResponse = await fetch(
          `/pje-comum-api/api/processos/id/${proc.id}/associados?pagina=1&tamanhoPagina=100&ordenacaoCrescente=true`
        );
        if (assocResponse.ok) {
          const assocData = await assocResponse.json();
          enriquecido.processosAssociados = assocData.resultado || [];
        }
      } catch (e) {
        // Ignora erro - campo fica undefined
      }
    }

    return enriquecido;
  }, processo);

  // 4. Baixa o PDF (fora do contexto da página)
  if (processoEnriquecido.idDocumento) {
    const caminhoPDF = await baixarPDF(
      page,
      processoEnriquecido.id,
      processoEnriquecido.idDocumento,
      processoEnriquecido.numeroProcesso
    );

    if (caminhoPDF) {
      processoEnriquecido.pdfLocal = caminhoPDF;
    }
  }

  return processoEnriquecido;
}

/**
 * Raspa processos aplicando os filtros configurados
 */
async function rasparComFiltros(page, idAdvogado) {
  const todosProcessos = [];
  let paginaAtual = 1;
  const tamanhoPagina = 100;
  let totalPaginas = null;

  while (true) {
    console.error(`   Página ${paginaAtual}/${totalPaginas || '?'}...`);

    const resultado = await page.evaluate(async (id, cfg, pagina, tamanho) => {
      try {
        // Monta URL com filtros
        const params = new URLSearchParams();

        // Adiciona filtros de prazo e ciência
        params.append('agrupadorExpediente', cfg.filtros.prazo);
        params.append('agrupadorExpediente', cfg.filtros.ciencia);

        // Adiciona parâmetros da API
        params.append('pagina', pagina);
        params.append('tamanhoPagina', tamanho);
        params.append('tipoPainelAdvogado', cfg.api.tipoPainelAdvogado);
        params.append('ordenacaoCrescente', cfg.api.ordenacaoCrescente);
        params.append('idPainelAdvogadoEnum', cfg.api.idPainelAdvogadoEnum);

        const url = `/pje-comum-api/api/paineladvogado/${id}/processos?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          return { error: `HTTP ${response.status}` };
        }

        return await response.json();
      } catch (e) {
        return { error: e.message };
      }
    }, idAdvogado, CONFIG, paginaAtual, tamanhoPagina);

    if (resultado.error) {
      console.error(`   ❌ Erro na página ${paginaAtual}: ${resultado.error}`);
      break;
    }

    // Primeira página - descobre total de páginas
    if (totalPaginas === null) {
      totalPaginas = resultado.qtdPaginas || 1;
      console.error(`   Total de páginas: ${totalPaginas}`);
      console.error(`   Total de processos: ${resultado.totalRegistros || '?'}\n`);
    }

    // Adiciona processos desta página
    if (resultado.resultado && Array.isArray(resultado.resultado)) {
      console.error(`   ✅ ${resultado.resultado.length} processos capturados`);

      // Enriquece cada processo com dados adicionais
      console.error(`   🔍 Enriquecendo processos com dados adicionais...`);
      for (const processo of resultado.resultado) {
        const processoEnriquecido = await enriquecerProcesso(page, processo);
        todosProcessos.push(processoEnriquecido);

        // Delay pequeno entre cada processo para não sobrecarregar
        await delay(100);
      }
      console.error(`   ✅ Enriquecimento concluído`);
    }

    // Verifica se chegou na última página
    if (paginaAtual >= totalPaginas) {
      break;
    }

    paginaAtual++;

    // Delay entre requisições
    await delay(500);
  }

  return todosProcessos;
}

// Executa
rasparPendentesManifestation().catch(console.error);

/**
 * Script de Teste: Raspagem Pendentes TRT3-1g
 *
 * Testa a execução do script de raspagem diretamente via scrape-executor
 * sem passar pelo sistema de fila, para diagnosticar problemas.
 */

import { executeScript, executeScriptWithRetry } from '@/lib/services/scrape-executor';
import { ScrapeType, ScrapeSubType } from '@/lib/types/scraping';
import { prisma } from '@/lib/prisma';

async function testScrape() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   TESTE: RASPAGEM PENDENTES TRT3-1g                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Busca configuração do TRT3-1g no banco
    console.log('📋 Buscando configuração do TRT3-1g no banco...\n');

    const tribunalConfig = await prisma.tribunalConfig.findFirst({
      where: {
        tribunal: { codigo: 'TRT3' },
        grau: '1g'
      },
      include: {
        tribunal: true,
        credenciais: {
          where: { credencial: { ativa: true } },
          include: {
            credencial: {
              include: { advogado: true }
            }
          }
        }
      }
    });

    if (!tribunalConfig) {
      throw new Error('TRT3-1g não encontrado no banco de dados');
    }

    console.log('✅ Configuração encontrada:');
    console.log('   ID:', tribunalConfig.id);
    console.log('   Tribunal:', tribunalConfig.tribunal.codigo);
    console.log('   Grau:', tribunalConfig.grau);
    console.log('   URL:', tribunalConfig.urlBase);
    console.log('   Credenciais ativas:', tribunalConfig.credenciais.length);

    // 2. Busca credenciais
    const credencialTribunal = tribunalConfig.credenciais[0];
    if (!credencialTribunal) {
      throw new Error('Nenhuma credencial ativa encontrada para TRT3-1g');
    }

    const advogado = credencialTribunal.credencial.advogado;
    console.log('\n✅ Credenciais encontradas:');
    console.log('   Advogado:', advogado.nome);
    console.log('   CPF:', advogado.cpf.substring(0, 3) + '***');
    console.log('   ID Advogado:', advogado.idAdvogado || 'NÃO CONFIGURADO');

    if (!advogado.idAdvogado) {
      console.log('\n⚠️  ATENÇÃO: ID do advogado não configurado no banco!');
      console.log('   Usando ID_ADVOGADO do arquivo .env...');
    }

    // 3. Prepara opções para execução
    const credentials = {
      cpf: advogado.cpf,
      senha: credencialTribunal.credencial.senha,
      idAdvogado: advogado.idAdvogado || process.env.PJE_ID_ADVOGADO || ''
    };

    const tribunalConfigForScraping = {
      urlBase: tribunalConfig.urlBase,
      urlLoginSeam: tribunalConfig.urlLoginSeam,
      urlApi: tribunalConfig.urlApi,
      codigo: `${tribunalConfig.tribunal.codigo}-${tribunalConfig.grau}`
    };

    console.log('\n🚀 Iniciando execução do script...\n');
    console.log('='.repeat(70));

    // 4. Executa o script (COM retry automático)
    const result = await executeScriptWithRetry({
      credentials,
      tribunalConfig: tribunalConfigForScraping,
      scrapeType: ScrapeType.PENDENTES,
      scrapeSubType: ScrapeSubType.COM_DADO_CIENCIA,
      timeout: 5 * 60 * 1000, // 5 minutos (reduzido para teste)
      logger: {
        info: (msg: string, ctx?: any) => {
          console.log('[INFO]', msg, ctx ? JSON.stringify(ctx) : '');
        },
        warn: (msg: string, ctx?: any) => {
          console.warn('[WARN]', msg, ctx ? JSON.stringify(ctx) : '');
        },
        error: (msg: string, ctx?: any) => {
          console.error('[ERROR]', msg, ctx ? JSON.stringify(ctx) : '');
        }
      }
    });

    console.log('='.repeat(70));
    console.log('\n✅ EXECUÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📊 RESULTADO:');
    console.log('   - Sucesso:', result.result.success ? '✅ SIM' : '❌ NÃO');
    console.log('   - Processos encontrados:', result.result.processosCount);
    console.log('   - Duração:', Math.round(result.duration / 1000), 'segundos');
    console.log('   - Linhas de log:', result.logs.length);

    if (result.result.processosCount > 0) {
      console.log('\n📝 Primeiros 3 processos:');
      result.result.processos.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.numeroProcesso} - ${p.nomeParteAutora}`);
      });
    }

    console.log('\n💾 Salvando resultado no banco de dados...');

    // 5. Testa salvamento no banco (simulando o que o orchestrator faria)
    const { compressJSON } = await import('@/lib/utils/compression');
    const compressedData = compressJSON({
      processos: result.result.processos
    });

    console.log('   - Dados comprimidos:', compressedData.length, 'bytes');
    console.log('   ✅ Compressão OK (não salvando no banco neste teste)');

    console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║   TESTE CONCLUÍDO COM SUCESSO! ✅                                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  } catch (error: any) {
    console.error('\n❌ ERRO NA EXECUÇÃO:\n');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);

    if (error.type) {
      console.error('Tipo de erro (scraping):', error.type);
      console.error('Retryable:', error.retryable);
    }

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o teste
testScrape();

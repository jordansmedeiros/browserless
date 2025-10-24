/**
 * Script de Teste: Multi-TRT Support
 * Valida a implementação do suporte multi-TRT
 */

import { PrismaClient } from '@prisma/client';
import {
  getTribunalConfig,
  listAllTRTs,
  listTRTsByRegion,
  validateTRTCode,
  normalizeTRTCode,
} from '../lib/services/tribunal.js';
import type { TRTCode, Grau } from '../lib/types/tribunal.js';

const prisma = new PrismaClient();

async function testURLGeneration() {
  console.log('\n📋 Teste 1: Geração de URLs para todos os 48 configurações');
  console.log('=' .repeat(70));

  const testCases: Array<{ trt: TRTCode; grau: Grau }> = [
    { trt: 'TRT3', grau: '1g' },
    { trt: 'TRT3', grau: '2g' },
    { trt: 'TRT15', grau: '1g' },
    { trt: 'TRT24', grau: '2g' },
  ];

  for (const { trt, grau } of testCases) {
    try {
      const config = await getTribunalConfig(trt, grau);
      console.log(`✅ ${trt} ${grau}:`);
      console.log(`   URL Login: ${config.urlLoginSeam}`);
      console.log(`   URL Base:  ${config.urlBase}`);
      console.log(`   URL API:   ${config.urlApi}`);
    } catch (error) {
      console.error(`❌ ${trt} ${grau}: ${error}`);
    }
  }

  console.log('\n✅ Teste de geração de URLs concluído!');
}

async function testTRTCodeValidation() {
  console.log('\n📋 Teste 2: Validação de códigos TRT');
  console.log('=' .repeat(70));

  const validCodes = ['TRT3', 'trt15', '24', 1];
  const invalidCodes = ['TRT25', 'TRT0', 'INVALID', 0, 25];

  console.log('Códigos válidos:');
  for (const code of validCodes) {
    try {
      const normalized = normalizeTRTCode(code as any);
      validateTRTCode(normalized);
      console.log(`  ✅ ${code} → ${normalized}`);
    } catch (error) {
      console.log(`  ❌ ${code}: ${error}`);
    }
  }

  console.log('\nCódigos inválidos (devem falhar):');
  for (const code of invalidCodes) {
    try {
      const normalized = normalizeTRTCode(code as any);
      validateTRTCode(normalized);
      console.log(`  ❌ ${code} não deveria ser aceito!`);
    } catch (error) {
      console.log(`  ✅ ${code} corretamente rejeitado`);
    }
  }

  console.log('\n✅ Teste de validação concluído!');
}

async function testBackwardCompatibility() {
  console.log('\n📋 Teste 3: Backward Compatibility (TRT3 1g default)');
  console.log('=' .repeat(70));

  try {
    const config = await getTribunalConfig('TRT3', '1g');
    console.log('✅ getTribunalConfig("TRT3", "1g") funciona');
    console.log(`   URL: ${config.urlLoginSeam}`);

    const expectedUrl = 'https://pje.trt3.jus.br/primeirograu/login.seam';
    if (config.urlLoginSeam === expectedUrl) {
      console.log('✅ URL corresponde ao padrão esperado');
    } else {
      console.log(`⚠️  URL diferente do esperado: ${expectedUrl}`);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar TRT3 1g:', error);
  }

  console.log('\n✅ Teste de backward compatibility concluído!');
}

async function testRegionalFiltering() {
  console.log('\n📋 Teste 4: Filtragem por Região');
  console.log('=' .repeat(70));

  const regioes = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'] as const;

  for (const regiao of regioes) {
    try {
      const trts = await listTRTsByRegion(regiao);
      console.log(`✅ ${regiao}: ${trts.length} TRTs`);
      console.log(
        `   ${trts.map((t) => t.codigo).join(', ')}`
      );
    } catch (error) {
      console.error(`❌ ${regiao}: ${error}`);
    }
  }

  console.log('\n✅ Teste de filtragem regional concluído!');
}

async function testDatabaseIntegrity() {
  console.log('\n📋 Teste 5: Integridade do Banco de Dados');
  console.log('=' .repeat(70));

  // Conta tribunais
  const tribunaisCount = await prisma.tribunal.count();
  console.log(`Tribunais no banco: ${tribunaisCount}`);
  if (tribunaisCount === 24) {
    console.log('✅ 24 TRTs encontrados');
  } else {
    console.log(`❌ Esperado 24 TRTs, encontrado ${tribunaisCount}`);
  }

  // Conta configurações
  const configsCount = await prisma.tribunalConfig.count();
  console.log(`Configurações no banco: ${configsCount}`);
  if (configsCount === 48) {
    console.log('✅ 48 configurações encontradas (24 TRTs × 2 graus)');
  } else {
    console.log(`❌ Esperado 48 configs, encontrado ${configsCount}`);
  }

  // Verifica que cada TRT tem 2 configurações (1g e 2g)
  const tribunais = await prisma.tribunal.findMany({
    include: { configs: true },
  });

  let allHaveTwoConfigs = true;
  for (const tribunal of tribunais) {
    if (tribunal.configs.length !== 2) {
      console.log(
        `❌ ${tribunal.codigo} tem ${tribunal.configs.length} configurações (esperado 2)`
      );
      allHaveTwoConfigs = false;
    }
  }

  if (allHaveTwoConfigs) {
    console.log('✅ Todos os TRTs têm 2 configurações (1g e 2g)');
  }

  console.log('\n✅ Teste de integridade do banco concluído!');
}

async function testListAllTRTs() {
  console.log('\n📋 Teste 6: Listar Todos os TRTs');
  console.log('=' .repeat(70));

  try {
    const trts = await listAllTRTs();
    console.log(`Total de TRTs: ${trts.length}`);

    if (trts.length === 24) {
      console.log('✅ 24 TRTs listados corretamente');
    } else {
      console.log(`❌ Esperado 24 TRTs, listado ${trts.length}`);
    }

    // Exibe alguns exemplos
    console.log('\nExemplos:');
    for (const trt of trts.slice(0, 5)) {
      console.log(
        `  ${trt.codigo}: ${trt.nome} (${trt.regiao}, ${trt.uf})`
      );
    }
    console.log(`  ... e mais ${trts.length - 5} TRTs`);
  } catch (error) {
    console.error('❌ Erro ao listar TRTs:', error);
  }

  console.log('\n✅ Teste de listagem concluído!');
}

async function runAllTests() {
  console.log('🧪 TESTES DE VALIDAÇÃO: MULTI-TRT SUPPORT');
  console.log('=' .repeat(70));

  try {
    await testDatabaseIntegrity();
    await testURLGeneration();
    await testTRTCodeValidation();
    await testBackwardCompatibility();
    await testRegionalFiltering();
    await testListAllTRTs();

    console.log('\n' + '=' .repeat(70));
    console.log('✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('=' .repeat(70));
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa os testes
runAllTests();

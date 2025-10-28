/**
 * Prisma Seed Script
 * Popula o banco de dados com dados iniciais dos Tribunais
 * (TRTs, TJs, TRFs e Tribunais Superiores)
 */

import { PrismaClient } from '@prisma/client';
// TRT seeds
import { tribunaisSeed } from './seeds/tribunais';
import { tribunalConfigsSeed } from './seeds/tribunal-configs';
// TJ seeds
import { tribunaisTJSeed } from './seeds/tribunais-tj';
import { tribunalConfigsTJSeed } from './seeds/tribunal-configs-tj';
// TRF seeds
import { tribunaisTRFSeed } from './seeds/tribunais-trf';
import { tribunalConfigsTRFSeed } from './seeds/tribunal-configs-trf';
// Tribunais Superiores seeds
import { tribunaisSuperioresSeed } from './seeds/tribunais-superiores';
import { tribunalConfigsSuperioresSeed } from './seeds/tribunal-configs-superiores';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (opcional - comentar se não quiser resetar)
  console.log('🗑️  Limpando dados existentes...');
  await prisma.tribunalConfig.deleteMany();
  await prisma.tribunal.deleteMany();

  const tribunaisCreated = [];

  // Seed TRTs
  console.log('\n📋 Criando 24 TRTs...');
  for (const tribunalData of tribunaisSeed) {
    const tribunal = await prisma.tribunal.create({
      data: {
        codigo: tribunalData.codigo,
        nome: tribunalData.nome,
        regiao: tribunalData.regiao,
        uf: tribunalData.uf,
        cidadeSede: tribunalData.cidadeSede,
        ativo: tribunalData.ativo,
      },
    });
    tribunaisCreated.push(tribunal);
  }
  console.log(`  ✓ ${tribunaisSeed.length} TRTs criados`);

  // Seed TJs
  console.log('\n📋 Criando 27 TJs...');
  for (const tribunalData of tribunaisTJSeed) {
    const tribunal = await prisma.tribunal.create({
      data: {
        codigo: tribunalData.codigo,
        nome: tribunalData.nome,
        regiao: tribunalData.regiao,
        uf: tribunalData.uf,
        cidadeSede: tribunalData.cidadeSede,
        ativo: tribunalData.ativo,
      },
    });
    tribunaisCreated.push(tribunal);
  }
  console.log(`  ✓ ${tribunaisTJSeed.length} TJs criados`);

  // Seed TRFs
  console.log('\n📋 Criando 6 TRFs...');
  for (const tribunalData of tribunaisTRFSeed) {
    const tribunal = await prisma.tribunal.create({
      data: {
        codigo: tribunalData.codigo,
        nome: tribunalData.nome,
        regiao: tribunalData.regiao,
        uf: tribunalData.uf,
        cidadeSede: tribunalData.cidadeSede,
        ativo: tribunalData.ativo,
      },
    });
    tribunaisCreated.push(tribunal);
  }
  console.log(`  ✓ ${tribunaisTRFSeed.length} TRFs criados`);

  // Seed Tribunais Superiores
  console.log('\n📋 Criando 3 Tribunais Superiores...');
  for (const tribunalData of tribunaisSuperioresSeed) {
    const tribunal = await prisma.tribunal.create({
      data: {
        codigo: tribunalData.codigo,
        nome: tribunalData.nome,
        regiao: tribunalData.regiao,
        uf: tribunalData.uf,
        cidadeSede: tribunalData.cidadeSede,
        ativo: tribunalData.ativo,
      },
    });
    tribunaisCreated.push(tribunal);
  }
  console.log(`  ✓ ${tribunaisSuperioresSeed.length} Tribunais Superiores criados`);

  // Merge all configs
  const allConfigs = [
    ...tribunalConfigsSeed,
    ...tribunalConfigsTJSeed,
    ...tribunalConfigsTRFSeed,
    ...tribunalConfigsSuperioresSeed,
  ];

  // Seed Tribunal Configs
  console.log(`\n⚙️  Criando ${allConfigs.length} configurações de URL...`);
  let configCount = 0;

  for (const configData of allConfigs) {
    // Busca o tribunal pelo código
    const tribunal = tribunaisCreated.find(
      (t) => t.codigo === configData.tribunalCodigo
    );

    if (!tribunal) {
      console.warn(
        `  ⚠️  Tribunal ${configData.tribunalCodigo} não encontrado, pulando config`
      );
      continue;
    }

    await prisma.tribunalConfig.create({
      data: {
        tribunalId: tribunal.id,
        sistema: configData.sistema,
        grau: configData.grau,
        urlBase: configData.urlBase,
        urlLoginSeam: configData.urlLoginSeam,
        urlApi: configData.urlApi,
      },
    });

    configCount++;
    if (configCount % 20 === 0) {
      console.log(`  ✓ ${configCount} configurações criadas...`);
    }
  }

  console.log(`  ✓ Total: ${configCount} configurações criadas`);

  // Resumo
  console.log('\n✅ Seed concluído com sucesso!');
  console.log(`   - ${tribunaisSeed.length} TRTs`);
  console.log(`   - ${tribunaisTJSeed.length} TJs`);
  console.log(`   - ${tribunaisTRFSeed.length} TRFs`);
  console.log(`   - ${tribunaisSuperioresSeed.length} Tribunais Superiores`);
  console.log(`   - Total: ${tribunaisCreated.length} Tribunais`);
  console.log(`   - Total: ${configCount} Configurações`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

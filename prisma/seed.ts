/**
 * Prisma Seed Script
 * Popula o banco de dados com dados iniciais dos TRTs
 */

import { PrismaClient } from '@prisma/client';
import { tribunaisSeed } from './seeds/tribunais.js';
import { tribunalConfigsSeed } from './seeds/tribunal-configs.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (opcional - comentar se não quiser resetar)
  console.log('🗑️  Limpando dados existentes...');
  await prisma.tribunalConfig.deleteMany();
  await prisma.tribunal.deleteMany();

  // Seed Tribunais
  console.log('📋 Criando 24 TRTs...');
  const tribunaisCreated = [];

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
    console.log(`  ✓ ${tribunal.codigo} - ${tribunal.nome}`);
  }

  // Seed Tribunal Configs
  console.log('\n⚙️  Criando 48 configurações de URL (24 TRTs × 2 graus)...');
  let configCount = 0;

  for (const configData of tribunalConfigsSeed) {
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
        grau: configData.grau,
        urlBase: configData.urlBase,
        urlLoginSeam: configData.urlLoginSeam,
        urlApi: configData.urlApi,
      },
    });

    configCount++;
    if (configCount % 10 === 0) {
      console.log(`  ✓ ${configCount} configurações criadas...`);
    }
  }

  console.log(`  ✓ Total: ${configCount} configurações criadas`);

  // Resumo
  console.log('\n✅ Seed concluído com sucesso!');
  console.log(`   - ${tribunaisCreated.length} Tribunais`);
  console.log(`   - ${configCount} Configurações`);
  console.log(`   - Total: ${tribunaisCreated.length * 2} URLs configuradas`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando configurações de TRTs no banco...\n');

  const configs = await prisma.tribunalConfig.findMany({
    where: {
      tribunal: {
        codigo: {
          startsWith: 'TRT',
        },
      },
    },
    include: {
      tribunal: true,
    },
    take: 10,
  });

  console.log(`Total de configs encontrados: ${configs.length}\n`);

  configs.forEach((config) => {
    const id = `${config.tribunal.codigo}-${config.sistema}-${config.grau}`;
    console.log(`ID: ${id}`);
    console.log(`  Código: ${config.tribunal.codigo}`);
    console.log(`  Sistema: ${config.sistema}`);
    console.log(`  Grau: ${config.grau}`);
    console.log();
  });

  await prisma.$disconnect();
}

main().catch(console.error);

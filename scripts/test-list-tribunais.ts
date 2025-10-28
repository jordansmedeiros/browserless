import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testando listTribunalConfigsAction...\n');

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
    orderBy: [
      { tribunal: { codigo: 'asc' } },
      { sistema: 'asc' },
      { grau: 'asc' },
    ],
    take: 5,
  });

  console.log(`Total de configs encontrados: ${configs.length}\n`);

  configs.forEach((config) => {
    const id = `${config.tribunal.codigo}-${config.sistema}-${config.grau}`;
    console.log(`ID construído: "${id}"`);
    console.log(`  tribunal.codigo: "${config.tribunal.codigo}" (tipo: ${typeof config.tribunal.codigo})`);
    console.log(`  sistema: "${config.sistema}" (tipo: ${typeof config.sistema})`);
    console.log(`  grau: "${config.grau}" (tipo: ${typeof config.grau})`);

    // Testa o regex ANTIGO (ERRADO)
    const regexAntigo = /^[A-Z]{3,6}-(PJE|EPROC|ESAJ|PROJUDI|THEMIS)-(1g|2g|unico)$/;
    const matchAntigo = regexAntigo.test(id);
    console.log(`  Match regex ANTIGO: ${matchAntigo ? '✅' : '❌'}`);

    // Testa o regex NOVO (CORRETO)
    const regexNovo = /^[A-Z0-9]{3,6}-(PJE|EPROC|ESAJ|PROJUDI|THEMIS)-(1g|2g|unico)$/;
    const matchNovo = regexNovo.test(id);
    console.log(`  Match regex NOVO: ${matchNovo ? '✅' : '❌'}`);
    console.log();
  });

  await prisma.$disconnect();
}

main().catch(console.error);

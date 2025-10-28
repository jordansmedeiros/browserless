import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando migração de advogados autônomos para escritórios...\n');

  // 1. Buscar todos os advogados sem escritório
  const soloLawyers = await prisma.advogado.findMany({
    where: {
      escritorioId: null,
    },
    select: {
      id: true,
      nome: true,
      oabNumero: true,
      oabUf: true,
    },
  });

  if (soloLawyers.length === 0) {
    console.log('✅ Nenhum advogado autônomo encontrado. Migração não necessária.\n');
    return;
  }

  console.log(`📊 Encontrados ${soloLawyers.length} advogados autônomos:\n`);

  const created: string[] = [];
  const errors: Array<{ advogadoId: string; error: string }> = [];

  // 2. Para cada advogado, criar escritório e atualizar
  for (const advogado of soloLawyers) {
    try {
      console.log(`   Processando: ${advogado.nome} (${advogado.oabNumero}/${advogado.oabUf})...`);

      // Criar escritório com mesmo nome do advogado
      const escritorio = await prisma.escritorio.create({
        data: {
          nome: advogado.nome,
        },
      });

      // Atualizar advogado para referenciar o novo escritório
      await prisma.advogado.update({
        where: { id: advogado.id },
        data: { escritorioId: escritorio.id },
      });

      created.push(advogado.id);
      console.log(`      ✅ Escritório "${escritorio.nome}" criado (ID: ${escritorio.id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push({ advogadoId: advogado.id, error: errorMessage });
      console.log(`      ❌ Erro: ${errorMessage}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO DA MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Escritórios criados: ${created.length}`);
  console.log(`❌ Erros: ${errors.length}`);
  console.log(`📝 Total processado: ${soloLawyers.length}`);

  if (created.length > 0) {
    console.log('\n📝 IDs dos advogados migrados:');
    created.forEach((id) => console.log(`   - ${id}`));
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Erros encontrados:');
    errors.forEach(({ advogadoId, error }) => {
      console.log(`   - Advogado ${advogadoId}: ${error}`);
    });
  }

  console.log('\n✅ Migração concluída!\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Erro fatal durante migração:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

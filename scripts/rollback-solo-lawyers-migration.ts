import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⏪ Iniciando rollback de migração de advogados autônomos...\n');

  // 1. Buscar escritórios que têm apenas 1 advogado e nome igual ao advogado
  const escritorios = await prisma.escritorio.findMany({
    include: {
      advogados: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  const toRollback = escritorios.filter(
    (e) => e.advogados.length === 1 && e.nome === e.advogados[0].nome
  );

  if (toRollback.length === 0) {
    console.log('✅ Nenhum escritório auto-criado encontrado. Rollback não necessário.\n');
    return;
  }

  console.log(`📊 Encontrados ${toRollback.length} escritórios auto-criados:\n`);

  const deleted: string[] = [];
  const errors: Array<{ escritorioId: string; error: string }> = [];

  // 2. Para cada escritório, setar advogado.escritorioId para null e deletar escritório
  for (const escritorio of toRollback) {
    try {
      const advogado = escritorio.advogados[0];
      console.log(`   Revertendo: ${escritorio.nome}...`);

      // Setar escritorioId para null
      await prisma.advogado.update({
        where: { id: advogado.id },
        data: { escritorioId: null },
      });

      // Deletar escritório
      await prisma.escritorio.delete({
        where: { id: escritorio.id },
      });

      deleted.push(escritorio.id);
      console.log(`      ✅ Escritório deletado, advogado voltou para autônomo`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push({ escritorioId: escritorio.id, error: errorMessage });
      console.log(`      ❌ Erro: ${errorMessage}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO DO ROLLBACK');
  console.log('='.repeat(60));
  console.log(`✅ Escritórios deletados: ${deleted.length}`);
  console.log(`❌ Erros: ${errors.length}`);
  console.log(`📝 Total processado: ${toRollback.length}`);

  if (deleted.length > 0) {
    console.log('\n📝 IDs dos escritórios deletados:');
    deleted.forEach((id) => console.log(`   - ${id}`));
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Erros encontrados:');
    errors.forEach(({ escritorioId, error }) => {
      console.log(`   - Escritório ${escritorioId}: ${error}`);
    });
  }

  console.log('\n✅ Rollback concluído!\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Erro fatal durante rollback:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

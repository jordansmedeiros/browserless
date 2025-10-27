const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testando conexão com o banco...');
    const escritorios = await prisma.escritorio.findMany();
    console.log('✅ Conexão OK! Escritórios encontrados:', escritorios.length);

    const advogados = await prisma.advogado.findMany();
    console.log('✅ Advogados encontrados:', advogados.length);

    const credenciais = await prisma.credencial.findMany();
    console.log('✅ Credenciais encontradas:', credenciais.length);
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();

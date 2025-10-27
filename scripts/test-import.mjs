// Test direct import
console.log('Testing Prisma import...');

try {
  const { PrismaClient } = await import('@prisma/client');
  console.log('✅ PrismaClient imported:', typeof PrismaClient);

  const prisma = new PrismaClient();
  console.log('✅ Prisma instance created:', typeof prisma);
  console.log('✅ prisma.escritorio:', typeof prisma.escritorio);

  await prisma.$disconnect();
  console.log('✅ All tests passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}

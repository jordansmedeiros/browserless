import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Try to select with sistema field
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'TribunalConfig'
      ORDER BY ordinal_position;
    `;

    console.log('TribunalConfig table structure:');
    console.log(JSON.stringify(result, null, 2));

    // Check unique constraints
    const constraints = await prisma.$queryRaw`
      SELECT conname, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE cl.relname = 'TribunalConfig'
      AND contype = 'u';
    `;

    console.log('\nUnique constraints:');
    console.log(JSON.stringify(constraints, null, 2));

    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'TribunalConfig';
    `;

    console.log('\nIndexes:');
    console.log(JSON.stringify(indexes, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();

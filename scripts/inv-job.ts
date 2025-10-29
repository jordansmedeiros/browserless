import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const job = await prisma.scrapeJob.findFirst({
    where: { scrapeType: 'acervo_geral' },
    include: {
      tribunals: { include: { tribunalConfig: { include: { tribunal: true } } } },
      executions: { include: { tribunalConfig: { include: { tribunal: true } } }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (\!job) { console.log('No job'); return; }
  console.log('Job ID:', job.id);
  console.log('Status:', job.status);
  console.log('Tribunals:', job.tribunals.length);
  console.log('Executions:', job.executions.length);
  console.log('Created:', job.createdAt);
  
  const stats: any = {};
  job.tribunals.forEach((t: any) => stats[t.status] = (stats[t.status] || 0) + 1);
  console.log('Tribunal Status:', stats);
  
  let completed = 0, failed = 0, total = 0;
  job.executions.forEach((e: any) => {
    if (e.status === 'completed') { completed++; total += e.processosCount || 0; }
    if (e.status === 'failed') failed++;
  });
  console.log('Completed:', completed, 'Failed:', failed, 'Total Processos:', total);
  await prisma.\();
}

main();

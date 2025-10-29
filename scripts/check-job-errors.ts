import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJobErrors(jobId: string) {
  const executions = await prisma.scrapeExecution.findMany({
    where: {
      scrapeJobId: jobId,
      status: 'failed'
    },
    include: {
      tribunalConfig: {
        include: {
          tribunal: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`\n📋 Execuções falhadas: ${executions.length}\n`);

  for (const exec of executions) {
    const tribunal = exec.tribunalConfig?.tribunal;
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`${tribunal?.codigo} ${exec.tribunalConfig?.grau}`);
    console.log(`Status: ${exec.status}`);
    console.log(`\nError Data:`);

    if (exec.errorData) {
      console.log(JSON.stringify(exec.errorData, null, 2));
    } else {
      console.log('(sem dados de erro)');
    }

    if (exec.logs) {
      console.log(`\nLogs:`);
      console.log(exec.logs);
    }
  }
}

const jobId = process.argv[2] || '064727ea-793a-4cae-b532-da5c3a3c3fd1';
checkJobErrors(jobId)
  .catch(console.error)
  .finally(() => prisma.$disconnect());

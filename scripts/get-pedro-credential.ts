import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const creds = await prisma.credencial.findMany({
    where: {
      advogado: {
        cpf: '07529294610'
      }
    },
    include: {
      advogado: {
        include: {
          escritorio: true
        }
      },
      tribunais: {
        include: {
          tribunalConfig: {
            include: {
              tribunal: true
            }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(creds, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

/**
 * Prisma Client Singleton
 * Módulo consolidado para acesso ao banco de dados
 * Evita múltiplas instâncias do Prisma Client em desenvolvimento
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Get Prisma instance (for server actions)
 */
export async function getPrisma() {
  return prisma;
}

export default prisma;

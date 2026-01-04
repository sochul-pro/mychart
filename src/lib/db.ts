import { PrismaClient } from '@prisma/client';

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            const isStartupError =
              error instanceof Error &&
              error.message.includes('database system is starting up');

            if (isStartupError && attempt < maxRetries) {
              console.warn(
                `Database starting up, retry ${attempt}/${maxRetries} for ${model}.${operation}`
              );
              await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
              continue;
            }
            throw error;
          }
        }
        throw new Error('Max retries exceeded');
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

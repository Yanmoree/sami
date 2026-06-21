import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const MAX_ATTEMPTS = 6;
const backoffMs = (i: number) => Math.min(10_000, 500 * 2 ** i); // 0.5s, 1s, 2s, 4s, 8s, 10s

async function connectWithRetry(prisma: PrismaClient, log: FastifyInstance['log']): Promise<void> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      await prisma.$connect();
      log.info('[prisma] connected to database');
      return;
    } catch (err) {
      const wait = backoffMs(i);
      log.error({ err, attempt: i + 1, wait }, '[prisma] connect failed, retrying');
      if (i === MAX_ATTEMPTS - 1) throw err;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

export default fp(async (app: FastifyInstance) => {
  const prisma = new PrismaClient({
    log: app.config.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  await connectWithRetry(prisma, app.log);
  app.decorate('prisma', prisma);

  app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
});

import { buildApp } from './app.js';
import { env } from './config/env.js';

type AppInstance = Awaited<ReturnType<typeof buildApp>>;
let appInstance: AppInstance | null = null;

async function startWithRetry(): Promise<void> {
  let attempt = 0;
  const maxAttempts = 10;
  // backoff: 1s, 2s, 4s, 8s, 16s, потом 30s
  const backoffMs = (i: number) => Math.min(30_000, 1000 * 2 ** i);

  while (attempt < maxAttempts) {
    try {
      appInstance = await buildApp();
      await appInstance.listen({ port: env.PORT, host: env.HOST });
      appInstance.log.info({ port: env.PORT, host: env.HOST }, 'SAMI API listening');
      return;
    } catch (err) {
      attempt += 1;
      const wait = backoffMs(attempt - 1);
      console.error(`[server] start attempt ${attempt}/${maxAttempts} failed:`, err);
      if (appInstance) {
        await appInstance.close().catch(() => null);
        appInstance = null;
      }
      if (attempt >= maxAttempts) throw err;
      console.error(`[server] retrying in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function shutdown(signal: string): Promise<void> {
  try {
    appInstance?.log.info({ signal }, 'Shutting down gracefully');
    await appInstance?.close();
  } catch (err) {
    console.error('[server] shutdown error', err);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// Не падать на одиночной необработанной ошибке — логируем и продолжаем.
// Watchdog всё равно поднимет процесс если он реально умрёт, но «царапина»
// в обработчике одного запроса не должна валить весь Node.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

startWithRetry().catch((err) => {
  console.error('[server] fatal start failure after retries:', err);
  process.exit(1);
});

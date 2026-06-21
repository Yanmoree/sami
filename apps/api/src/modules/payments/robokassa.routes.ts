import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { z } from 'zod';
import { AppError, NotFoundError } from '../../lib/errors.js';

/**
 * Робокасса (https://docs.robokassa.ru/).
 *
 * Flow:
 *   1. Клиент после создания Order POST'ит /payments/robokassa/init { orderId }
 *      → бэк генерирует подписанный URL → возвращает confirmation_url
 *   2. Клиент редиректится на confirmation_url, проходит оплату на Робокассе
 *   3. Робокасса POST'ит /payments/robokassa/result (server-to-server)
 *      → проверяем подпись → обновляем Order.status = PAID и Payment.status = SUCCEEDED
 *   4. Клиент возвращается на /payments/robokassa/success (или /fail)
 *      → редирект на /account/orders/:id
 *
 * SPLIT-оплата (рассрочка):
 *   В Робокассе сплит включается на уровне магазина в личке. На init передаём
 *   IsTest=0/1 и опциональный параметр `IncCurrLabel=` для конкретной системы.
 *   Сплит автоматически появляется как вариант оплаты на странице кассы.
 */

const initSchema = z.object({
  orderId: z.string().min(1),
});

function md5(s: string): string {
  return crypto.createHash('md5').update(s).digest('hex');
}

/** Формирует подпись запроса (MD5(login:OutSum:InvId:Password1)) */
function signRequest(login: string, sum: string, invId: string, password1: string): string {
  return md5(`${login}:${sum}:${invId}:${password1}`).toUpperCase();
}

/** Проверяет подпись result-callback (MD5(OutSum:InvId:Password2)) */
function verifyResult(sum: string, invId: string, password2: string, signature: string): boolean {
  const expected = md5(`${sum}:${invId}:${password2}`).toUpperCase();
  return expected === signature.toUpperCase();
}

export default async function robokassaRoutes(app: FastifyInstance) {
  // INIT — клиент должен быть авторизован
  app.post('/init', { onRequest: [app.authenticate] }, async (req) => {
    const { orderId } = initSchema.parse(req.body);
    const cfg = app.config;
    if (!cfg.ROBOKASSA_LOGIN || !cfg.ROBOKASSA_PASSWORD1) {
      throw new AppError('Robokassa not configured', 503, 'PAYMENTS_NOT_CONFIGURED');
    }

    const order = await app.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== req.user!.sub) throw new NotFoundError('Заказ не найден');
    if (order.status !== 'PENDING_PAYMENT') {
      throw new AppError('Заказ уже не ожидает оплаты', 400, 'ORDER_NOT_PENDING');
    }

    // Сумма в рублях с копейками (Robokassa требует точку, не запятую)
    const sumStr = (order.totalMinor / 100).toFixed(2);
    const invId = order.number.replace(/^S-/, ''); // числовой InvId
    const signature = signRequest(cfg.ROBOKASSA_LOGIN, sumStr, invId, cfg.ROBOKASSA_PASSWORD1);

    const params = new URLSearchParams({
      MerchantLogin: cfg.ROBOKASSA_LOGIN,
      OutSum: sumStr,
      InvId: invId,
      Description: `Заказ SAMI ${order.number}`,
      SignatureValue: signature,
      Culture: 'ru',
      IsTest: cfg.ROBOKASSA_IS_TEST === 'true' ? '1' : '0',
      // Email клиента для квитанции
      Email: order.customerEmail,
    });

    const confirmationUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?${params.toString()}`;

    // Создадим / обновим Payment-запись
    await app.prisma.payment.upsert({
      where: {
        providerId: `robokassa:${invId}`,
      },
      update: { amountMinor: order.totalMinor, status: 'PENDING' },
      create: {
        orderId: order.id,
        provider: 'ROBOKASSA',
        providerId: `robokassa:${invId}`,
        status: 'PENDING',
        amountMinor: order.totalMinor,
      },
    });

    return { confirmationUrl };
  });

  // RESULT — server-to-server callback Робокассы (НЕ требует авторизации)
  app.post('/result', async (req, reply) => {
    const cfg = app.config;
    if (!cfg.ROBOKASSA_PASSWORD2) return reply.status(503).send('not configured');

    const body = req.body as Record<string, string> | undefined;
    const query = req.query as Record<string, string> | undefined;
    const data = { ...(body ?? {}), ...(query ?? {}) };

    const sum = String(data.OutSum ?? '');
    const invId = String(data.InvId ?? '');
    const signature = String(data.SignatureValue ?? '');

    if (!sum || !invId || !signature) {
      return reply.status(400).send('bad params');
    }
    if (!verifyResult(sum, invId, cfg.ROBOKASSA_PASSWORD2, signature)) {
      app.log.warn({ invId }, 'Robokassa bad signature');
      return reply.status(400).send('bad signature');
    }

    // Найти order по number (S-XXXXXX)
    const order = await app.prisma.order.findUnique({ where: { number: `S-${invId}` } });
    if (!order) return reply.status(404).send('order not found');

    await app.prisma.$transaction([
      app.prisma.payment.updateMany({
        where: { providerId: `robokassa:${invId}` },
        data: { status: 'SUCCEEDED', rawPayload: data },
      }),
      app.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date() },
      }),
    ]);

    // Robokassa требует ответ "OKInvId" чтобы прекратить повторы
    return reply.type('text/plain').send(`OK${invId}`);
  });

  // SUCCESS/FAIL — пользовательский redirect после оплаты (не доверяем без result)
  app.get('/success', async (req, reply) => {
    const invId = (req.query as { InvId?: string }).InvId;
    const order = invId ? await app.prisma.order.findUnique({ where: { number: `S-${invId}` } }) : null;
    if (order) {
      return reply.redirect(`${app.config.CORS_ORIGIN.split(',')[0]}/account/orders/${order.id}?paid=1`);
    }
    return reply.redirect(`${app.config.CORS_ORIGIN.split(',')[0]}/account/orders`);
  });

  app.get('/fail', async (req, reply) => {
    const invId = (req.query as { InvId?: string }).InvId;
    const order = invId ? await app.prisma.order.findUnique({ where: { number: `S-${invId}` } }) : null;
    if (order) {
      return reply.redirect(`${app.config.CORS_ORIGIN.split(',')[0]}/account/orders/${order.id}?paid=0`);
    }
    return reply.redirect(`${app.config.CORS_ORIGIN.split(',')[0]}/cart`);
  });
}

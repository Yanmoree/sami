import type { FastifyInstance } from 'fastify';

/**
 * Заготовка под ЮKassa.
 *
 * План интеграции:
 *  1. POST /payments/yookassa/create — серверный create-payment вызов к ЮKassa
 *     (idempotence-key = order.id), возвращает confirmation_url для редиректа.
 *  2. POST /payments/yookassa/webhook — обработка событий payment.succeeded /
 *     payment.canceled. Обязательная проверка IP отправителя или HMAC-подписи
 *     по `yookassa-signature`.
 *  3. Обновление Order.status и Payment.status в транзакции.
 *
 * Документация: https://yookassa.ru/developers/api
 */
export default async function paymentsRoutes(app: FastifyInstance) {
  app.post('/yookassa/webhook', async (req, reply) => {
    // TODO: верифицировать подпись/IP, парсить event.type, обновлять Order+Payment
    app.log.info({ body: req.body }, 'YooKassa webhook received (stub)');
    return reply.status(200).send({ received: true });
  });

  app.get('/health', async () => ({
    provider: 'yookassa',
    configured: Boolean(app.config.YOOKASSA_SHOP_ID && app.config.YOOKASSA_SECRET_KEY),
  }));
}

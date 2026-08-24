import type { FastifyInstance, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import { z } from 'zod';
import { AppError, NotFoundError } from '../../lib/errors.js';

const paymentStatuses = ['PENDING', 'WAITING_FOR_CAPTURE'] as const;

const initSchema = z.object({
  orderId: z.string().min(1),
});

const statusQuerySchema = z.object({
  orderId: z.string().min(1),
});

type YooKassaPayment = {
  id: string;
  status: string;
  amount?: {
    value?: string;
    currency?: string;
  };
  confirmation?: {
    type?: string;
    confirmation_url?: string;
  };
  metadata?: {
    orderId?: string;
    orderNumber?: string;
  };
  description?: string;
};

type YooKassaWebhookBody = {
  event?: string;
  object?: {
    id?: string;
  };
};

type OrderPayment = {
  provider: string;
  providerId: string | null;
  status: string;
  rawPayload: unknown;
};

function mapYooKassaStatus(status: string) {
  switch (status) {
    case 'succeeded':
      return 'SUCCEEDED';
    case 'waiting_for_capture':
      return 'WAITING_FOR_CAPTURE';
    case 'canceled':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

function amountMinor(payment: YooKassaPayment): number {
  const value = Number(payment.amount?.value ?? 0);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function firstCorsOrigin(app: FastifyInstance): string {
  return app.config.CORS_ORIGIN.split(',')[0]?.trim() || 'http://localhost:5173';
}

function confirmationUrlFromRawPayload(rawPayload: unknown): string | null {
  if (!rawPayload || typeof rawPayload !== 'object') return null;
  const confirmation = (rawPayload as { confirmation?: unknown }).confirmation;
  if (!confirmation || typeof confirmation !== 'object') return null;
  const url = (confirmation as { confirmation_url?: unknown }).confirmation_url;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

async function yookassaRequest(
  app: FastifyInstance,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
  idempotenceKey?: string,
): Promise<YooKassaPayment> {
  const { YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY } = app.config;
  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    throw new AppError('YooKassa not configured', 503, 'PAYMENTS_NOT_CONFIGURED');
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
    'Content-Type': 'application/json',
  };
  if (idempotenceKey) headers['Idempotence-Key'] = idempotenceKey.slice(0, 64);

  const response = await fetch(`https://api.yookassa.ru/v3${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as YooKassaPayment & { description?: string }) : null;
  if (!response.ok || !payload) {
    throw new AppError(
      payload?.description ?? `YooKassa request failed (HTTP ${response.status})`,
      502,
      'YOOKASSA_REQUEST_FAILED',
    );
  }

  return payload;
}

async function createYooKassaPayment(app: FastifyInstance, req: FastifyRequest) {
  const { orderId } = initSchema.parse(req.body);

  const order = await app.prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  });
  if (!order || order.userId !== req.user!.sub) throw new NotFoundError('Заказ не найден');
  if (order.status === 'PAID') {
    return { confirmationUrl: null, status: 'PAID', alreadyPaid: true };
  }
  if (order.status !== 'PENDING_PAYMENT') {
    throw new AppError('Заказ уже не ожидает оплаты', 400, 'ORDER_NOT_PENDING');
  }

  const payments = order.payments as OrderPayment[];
  const reusablePayment = payments.find((payment: OrderPayment) => (
    payment.provider === 'YOOKASSA' &&
    paymentStatuses.includes(payment.status as (typeof paymentStatuses)[number]) &&
    confirmationUrlFromRawPayload(payment.rawPayload)
  ));
  if (reusablePayment) {
    return {
      confirmationUrl: confirmationUrlFromRawPayload(reusablePayment.rawPayload),
      status: reusablePayment.status,
      paymentId: reusablePayment.providerId,
    };
  }

  const returnUrl = app.config.YOOKASSA_RETURN_URL ?? `${firstCorsOrigin(app)}/account/orders/${order.id}`;
  const payment = await yookassaRequest(
    app,
    'POST',
    '/payments',
    {
      amount: {
        value: (order.totalMinor / 100).toFixed(2),
        currency: order.currency,
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description: `Заказ SAMI ${order.number}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.number,
      },
    },
    crypto.randomUUID(),
  );

  await app.prisma.payment.upsert({
    where: { providerId: payment.id },
    update: {
      status: mapYooKassaStatus(payment.status),
      rawPayload: payment,
      amountMinor: order.totalMinor,
      currency: order.currency,
    },
    create: {
      orderId: order.id,
      provider: 'YOOKASSA',
      providerId: payment.id,
      status: mapYooKassaStatus(payment.status),
      amountMinor: order.totalMinor,
      currency: order.currency,
      rawPayload: payment,
    },
  });

  return {
    confirmationUrl: payment.confirmation?.confirmation_url ?? null,
    status: mapYooKassaStatus(payment.status),
    paymentId: payment.id,
  };
}

async function syncYooKassaPayment(app: FastifyInstance, paymentId: string) {
  const payment = await yookassaRequest(app, 'GET', `/payments/${encodeURIComponent(paymentId)}`);
  const orderId = payment.metadata?.orderId;
  const status = mapYooKassaStatus(payment.status);

  if (!orderId) {
    await app.prisma.payment.updateMany({
      where: { provider: 'YOOKASSA', providerId: payment.id },
      data: { status, rawPayload: payment },
    });
    return payment;
  }

  const operations = [
    app.prisma.payment.upsert({
      where: { providerId: payment.id },
      update: { status, rawPayload: payment },
      create: {
        orderId,
        provider: 'YOOKASSA',
        providerId: payment.id,
        status,
        amountMinor: amountMinor(payment),
        currency: payment.amount?.currency ?? 'RUB',
        rawPayload: payment,
      },
    }),
  ];

  if (payment.status === 'succeeded') {
    operations.push(
      app.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID', paidAt: new Date() },
      }),
    );
  }

  await app.prisma.$transaction(operations);

  return payment;
}

export default async function paymentsRoutes(app: FastifyInstance) {
  app.post('/yookassa/create', { onRequest: [app.authenticate] }, async (req) => {
    return createYooKassaPayment(app, req);
  });

  app.post('/yookassa/init', { onRequest: [app.authenticate] }, async (req) => {
    return createYooKassaPayment(app, req);
  });

  app.get('/yookassa/status', { onRequest: [app.authenticate] }, async (req) => {
    const { orderId } = statusQuerySchema.parse(req.query);
    const order = await app.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order || order.userId !== req.user!.sub) throw new NotFoundError('Заказ не найден');
    return {
      orderStatus: order.status,
      paymentStatus: order.payments[0]?.status ?? null,
    };
  });

  app.post('/yookassa/webhook', async (req, reply) => {
    const body = req.body as YooKassaWebhookBody | undefined;
    const paymentId = body?.object?.id;
    if (paymentId) {
      try {
        await syncYooKassaPayment(app, paymentId);
      } catch (err) {
        app.log.error({ err, paymentId }, 'Failed to process YooKassa webhook');
      }
    }

    return reply.status(200).send({ received: true });
  });

  app.get('/health', async () => ({
    provider: 'yookassa',
    configured: Boolean(app.config.YOOKASSA_SHOP_ID && app.config.YOOKASSA_SECRET_KEY),
  }));
}

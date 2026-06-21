import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email(),
  productId: z.string().min(1).optional(),
  variantId: z.string().min(1).optional(),
});

/**
 * Подписка «уведомить когда появится». Открыта без авторизации —
 * достаточно email. При появлении stock — крон в админке/cron-задача может
 * пройтись по NotifyRequest и отправить письма (SMTP-интеграция позже).
 */
export default async function notifyRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    const input = subscribeSchema.parse(req.body);
    const rec = await app.prisma.notifyRequest.upsert({
      where: {
        email_variantId: {
          email: input.email,
          variantId: input.variantId ?? '',
        },
      },
      update: { notified: false },
      create: {
        email: input.email,
        productId: input.productId,
        variantId: input.variantId,
      },
      select: { id: true, email: true, createdAt: true },
    });
    return reply.status(201).send({ request: rec });
  });
}

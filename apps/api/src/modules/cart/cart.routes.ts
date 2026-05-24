import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError, NotFoundError } from '../../lib/errors.js';

const addItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

const patchItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(10),
});

async function ensureCart(app: FastifyInstance, userId: string) {
  const existing = await app.prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
  if (existing) return existing;
  return app.prisma.cart.create({
    data: { userId },
    include: cartInclude,
  });
}

const cartInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { order: 'asc' as const }, take: 1 } } },
      variant: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

function totals(cart: { items: Array<{ quantity: number; product: { priceMinor: number }; variant: { priceMinor: number | null } }> }) {
  const subtotalMinor = cart.items.reduce((sum, it) => {
    const price = it.variant.priceMinor ?? it.product.priceMinor;
    return sum + price * it.quantity;
  }, 0);
  const totalItems = cart.items.reduce((s, it) => s + it.quantity, 0);
  return { subtotalMinor, totalItems };
}

export default async function cartRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/', async (req) => {
    const cart = await ensureCart(app, req.user!.sub);
    return { cart, ...totals(cart) };
  });

  app.post('/items', async (req, reply) => {
    const input = addItemSchema.parse(req.body);
    const variant = await app.prisma.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: true },
    });
    if (!variant || variant.productId !== input.productId) {
      throw new NotFoundError('Вариант не найден');
    }
    if (variant.stock < input.quantity) {
      throw new AppError('Недостаточно товара на складе', 400, 'OUT_OF_STOCK');
    }

    const cart = await ensureCart(app, req.user!.sub);
    await app.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
      update: { quantity: { increment: input.quantity } },
      create: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
      },
    });

    const updated = await ensureCart(app, req.user!.sub);
    return reply.status(201).send({ cart: updated, ...totals(updated) });
  });

  app.patch<{ Params: { id: string } }>('/items/:id', async (req) => {
    const { quantity } = patchItemSchema.parse(req.body);
    const item = await app.prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== req.user!.sub) throw new NotFoundError('Позиция не найдена');

    if (quantity === 0) {
      await app.prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await app.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    }
    const updated = await ensureCart(app, req.user!.sub);
    return { cart: updated, ...totals(updated) };
  });

  app.delete<{ Params: { id: string } }>('/items/:id', async (req) => {
    const item = await app.prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== req.user!.sub) throw new NotFoundError('Позиция не найдена');
    await app.prisma.cartItem.delete({ where: { id: item.id } });
    const updated = await ensureCart(app, req.user!.sub);
    return { cart: updated, ...totals(updated) };
  });
}

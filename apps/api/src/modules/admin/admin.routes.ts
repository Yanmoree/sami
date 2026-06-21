import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError, ForbiddenError, NotFoundError } from '../../lib/errors.js';

const replySchema = z.object({ body: z.string().min(1).max(2000) });

// ─────────── schemas ───────────
const productInputSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, 'slug: lowercase, digits, dashes'),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  priceRub: z.coerce.number().int().nonnegative(),
  categorySlug: z.string().optional(),
  images: z.array(z.string().min(1)).min(1),
  sizes: z.array(z.string().min(1)).min(1),
  stock: z.coerce.number().int().min(0).default(25),
  isActive: z.boolean().optional(),
});

const stockSchema = z.object({ stock: z.coerce.number().int().min(0) });

const userRoleSchema = z.object({ role: z.enum(['CUSTOMER', 'ADMIN']) });

// ─────────── middleware ───────────
async function ensureAdmin(this: FastifyInstance, req: FastifyRequest, _reply: FastifyReply) {
  if (!req.user) throw new ForbiddenError();
  const u = await this.prisma.user.findUnique({ where: { id: req.user.sub }, select: { role: true } });
  if (!u || u.role !== 'ADMIN') throw new ForbiddenError('ADMIN only');
}

// ─────────── routes ───────────
export default async function adminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);
  app.addHook('onRequest', ensureAdmin.bind(app));

  // ── Products CRUD ──────────────────────────────────────
  app.get('/products', async () => {
    const items = await app.prisma.product.findMany({
      include: {
        images: { orderBy: { order: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  });

  app.post('/products', async (req, reply) => {
    const data = productInputSchema.parse(req.body);
    const product = await createOrUpdateProduct(app, null, data);
    return reply.status(201).send({ product });
  });

  app.put<{ Params: { id: string } }>('/products/:id', async (req) => {
    const data = productInputSchema.parse(req.body);
    const product = await createOrUpdateProduct(app, req.params.id, data);
    return { product };
  });

  app.delete<{ Params: { id: string } }>('/products/:id', async (req, reply) => {
    const existing = await app.prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Product not found');
    await app.prisma.product.delete({ where: { id: req.params.id } });
    return reply.status(204).send();
  });

  app.patch<{ Params: { id: string; size: string } }>(
    '/products/:id/variants/:size/stock',
    async (req) => {
      const { stock } = stockSchema.parse(req.body);
      const variant = await app.prisma.productVariant.update({
        where: { productId_size: { productId: req.params.id, size: req.params.size } },
        data: { stock },
      });
      return { variant };
    },
  );

  // ── Users ────────────────────────────────────────────
  app.get('/users', async () => {
    const users = await app.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { users };
  });

  app.patch<{ Params: { id: string } }>('/users/:id', async (req) => {
    const { role } = userRoleSchema.parse(req.body);
    if (req.params.id === req.user!.sub && role !== 'ADMIN') {
      throw new AppError('Нельзя забрать свою роль ADMIN у себя', 400, 'SELF_DEMOTE');
    }
    const user = await app.prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    return { user };
  });

  // ── Stats ────────────────────────────────────────────
  app.get('/stats', async () => {
    const [
      totalUsers,
      totalOrders,
      paidOrders,
      pendingOrders,
      cancelledOrders,
      ordersAgg,
      paidAgg,
      productsCount,
      activeProductsCount,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      app.prisma.user.count(),
      app.prisma.order.count(),
      app.prisma.order.count({ where: { status: 'PAID' } }),
      app.prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      app.prisma.order.count({ where: { status: { in: ['CANCELLED', 'REFUNDED'] } } }),
      app.prisma.order.aggregate({ _sum: { totalMinor: true } }),
      app.prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalMinor: true },
      }),
      app.prisma.product.count(),
      app.prisma.product.count({ where: { isActive: true } }),
      app.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          number: true,
          status: true,
          totalMinor: true,
          createdAt: true,
          customerEmail: true,
        },
      }),
      app.prisma.orderItem.groupBy({
        by: ['productId', 'nameSnapshot'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Last-7-days breakdown (orders per day)
    const since = new Date(Date.now() - 7 * 86_400_000);
    const last7 = await app.prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, totalMinor: true, status: true },
    });
    const byDay: Record<string, { orders: number; revenueMinor: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      byDay[d] = { orders: 0, revenueMinor: 0 };
    }
    for (const o of last7) {
      const d = o.createdAt.toISOString().slice(0, 10);
      if (!byDay[d]) continue;
      byDay[d].orders += 1;
      if (o.status === 'PAID') byDay[d].revenueMinor += o.totalMinor;
    }

    return {
      totals: {
        users: totalUsers,
        orders: totalOrders,
        paid: paidOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders,
        revenueMinor: ordersAgg._sum.totalMinor ?? 0,
        paidRevenueMinor: paidAgg._sum.totalMinor ?? 0,
        products: productsCount,
        activeProducts: activeProductsCount,
      },
      recentOrders,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        name: p.nameSnapshot,
        sold: p._sum.quantity ?? 0,
      })),
      timeline: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
    };
  });

  // ── Support chats (admin side) ─────────────────────────
  app.get('/chats', async () => {
    const items = await app.prisma.conversation.findMany({
      orderBy: [{ status: 'asc' }, { lastMessageAt: 'desc' }],
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      take: 100,
    });
    return { items };
  });

  app.get<{ Params: { id: string } }>('/chats/:id', async (req) => {
    const conv = await app.prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundError('Conversation not found');
    await app.prisma.conversation.update({
      where: { id: conv.id },
      data: { unreadForAdmin: 0 },
    });
    return { conversation: conv };
  });

  app.post<{ Params: { id: string } }>('/chats/:id/reply', async (req) => {
    const { body } = replySchema.parse(req.body);
    const conv = await app.prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conv) throw new NotFoundError('Conversation not found');

    const wasTakeover = conv.status !== 'OPERATOR';
    const msg = await app.prisma.message.create({
      data: { conversationId: conv.id, sender: 'OPERATOR', body },
    });
    await app.prisma.conversation.update({
      where: { id: conv.id },
      data: {
        status: 'OPERATOR',
        lastMessageAt: new Date(),
        unreadForUser: { increment: 1 },
      },
    });
    if (wasTakeover) {
      await app.prisma.message.create({
        data: { conversationId: conv.id, sender: 'SYSTEM', body: 'support.operatorTakeover' },
      });
    }
    return { message: msg };
  });

  app.post<{ Params: { id: string } }>('/chats/:id/close', async (req) => {
    const conv = await app.prisma.conversation.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED' },
    });
    return { conversation: conv };
  });
}

// ─────────── helper: upsert product with variants + images ───────────
async function createOrUpdateProduct(
  app: FastifyInstance,
  id: string | null,
  data: z.infer<typeof productInputSchema>,
) {
  const priceMinor = Math.round(data.priceRub * 100);
  const categoryId = data.categorySlug
    ? (await app.prisma.category.findUnique({ where: { slug: data.categorySlug } }))?.id ?? null
    : null;

  return app.prisma.$transaction(async (tx) => {
    let productId = id;

    if (id) {
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Product not found');
      await tx.product.update({
        where: { id },
        data: {
          slug: data.slug,
          name: data.name,
          description: data.description,
          priceMinor,
          categoryId,
          isActive: data.isActive ?? true,
        },
      });
      // Очищаем картинки и пересоздаём
      await tx.productImage.deleteMany({ where: { productId: id } });
    } else {
      const created = await tx.product.create({
        data: {
          slug: data.slug,
          name: data.name,
          description: data.description,
          priceMinor,
          categoryId,
          isActive: data.isActive ?? true,
        },
      });
      productId = created.id;
    }

    if (!productId) throw new AppError('product id missing', 500);

    await tx.productImage.createMany({
      data: data.images.map((url, i) => ({
        productId: productId!,
        url,
        alt: data.name,
        order: i,
      })),
    });

    // Sync variants: добавляем недостающие, удаляем лишние
    const existingVariants = await tx.productVariant.findMany({ where: { productId } });
    const wantedSizes = new Set(data.sizes);
    for (const v of existingVariants) {
      if (!wantedSizes.has(v.size)) {
        await tx.productVariant.delete({ where: { id: v.id } });
      } else {
        await tx.productVariant.update({ where: { id: v.id }, data: { stock: data.stock } });
      }
    }
    const existingSizes = new Set(existingVariants.map((v) => v.size));
    for (const size of data.sizes) {
      if (existingSizes.has(size)) continue;
      await tx.productVariant.create({
        data: {
          productId,
          size,
          sku: `SAMI-${productId.slice(-6).toUpperCase()}-${size}`,
          stock: data.stock,
        },
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: productId },
      include: { images: { orderBy: { order: 'asc' } }, variants: true, category: true },
    });
  });
}

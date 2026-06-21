import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError } from '../../lib/errors.js';

const listQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  /** Размеры через запятую: ?size=S,M */
  size: z.string().optional(),
  /** Цена в копейках */
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
  /** Цвет (colorGroupSlug) — для группировки */
  colorGroup: z.string().optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc']).default('newest'),
  limit: z.coerce.number().int().min(1).max(100).default(40),
  offset: z.coerce.number().int().min(0).default(0),
});

export default async function productsRoutes(app: FastifyInstance) {
  app.get('/', async (req) => {
    const params = listQuerySchema.parse(req.query);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(params.category ? { category: { slug: params.category } } : {}),
      ...(params.colorGroup ? { colorGroupSlug: params.colorGroup } : {}),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q } },
              { description: { contains: params.q } },
            ],
          }
        : {}),
      ...(params.priceMin !== undefined || params.priceMax !== undefined
        ? {
            priceMinor: {
              ...(params.priceMin !== undefined ? { gte: params.priceMin } : {}),
              ...(params.priceMax !== undefined ? { lte: params.priceMax } : {}),
            },
          }
        : {}),
      ...(params.size
        ? {
            variants: {
              some: {
                size: { in: params.size.split(',').map((s) => s.trim()) },
                stock: { gt: 0 },
              },
            },
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      params.sort === 'price-asc'
        ? { priceMinor: 'asc' }
        : params.sort === 'price-desc'
        ? { priceMinor: 'desc' }
        : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      app.prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' } },
          category: true,
          variants: { orderBy: { size: 'asc' } },
        },
        orderBy,
        skip: params.offset,
        take: params.limit,
      }),
      app.prisma.product.count({ where }),
    ]);

    return { items, total, limit: params.limit, offset: params.offset };
  });

  app.get<{ Params: { slug: string } }>('/:slug', async (req) => {
    const product = await app.prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true,
        variants: { orderBy: { size: 'asc' } },
      },
    });
    if (!product || !product.isActive) throw new NotFoundError('Товар не найден');

    // Цветные вариации той же группы
    const colorSiblings = product.colorGroupSlug
      ? await app.prisma.product.findMany({
          where: {
            colorGroupSlug: product.colorGroupSlug,
            isActive: true,
          },
          select: {
            id: true,
            slug: true,
            colorHex: true,
            colorName: true,
            images: { take: 1, orderBy: { order: 'asc' } },
          },
        })
      : [];

    return { product, colorSiblings };
  });

  app.get('/categories', async () => {
    const categories = await app.prisma.category.findMany({ orderBy: { order: 'asc' } });
    return { categories };
  });

  app.get('/facets', async () => {
    // Минимум и максимум цены, доступные размеры
    const [agg, sizes] = await Promise.all([
      app.prisma.product.aggregate({
        where: { isActive: true },
        _min: { priceMinor: true },
        _max: { priceMinor: true },
      }),
      app.prisma.productVariant.findMany({
        where: { stock: { gt: 0 }, product: { isActive: true } },
        select: { size: true },
        distinct: ['size'],
        orderBy: { size: 'asc' },
      }),
    ]);
    return {
      priceMin: agg._min.priceMinor ?? 0,
      priceMax: agg._max.priceMinor ?? 1000000,
      sizes: sizes.map((s) => s.size),
    };
  });
}

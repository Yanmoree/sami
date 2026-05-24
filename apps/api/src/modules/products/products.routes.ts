import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '../../lib/errors.js';

const listQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
  offset: z.coerce.number().int().min(0).default(0),
});

export default async function productsRoutes(app: FastifyInstance) {
  app.get('/', async (req) => {
    const { category, q, limit, offset } = listQuerySchema.parse(req.query);

    const where = {
      isActive: true,
      ...(category ? { category: { slug: category } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      app.prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' } },
          category: true,
          variants: { orderBy: { size: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      app.prisma.product.count({ where }),
    ]);

    return { items, total, limit, offset };
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
    return { product };
  });

  app.get('/categories', async () => {
    const categories = await app.prisma.category.findMany({ orderBy: { order: 'asc' } });
    return { categories };
  });
}

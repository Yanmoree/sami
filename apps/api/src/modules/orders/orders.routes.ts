import type { FastifyInstance } from 'fastify';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { AppError, NotFoundError } from '../../lib/errors.js';

const generateOrderNumber = customAlphabet('0123456789', 6);

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(5),
  city: z.string().min(1),
  street: z.string().min(1),
  building: z.string().min(1),
  apartment: z.string().optional(),
  postalCode: z.string().min(3),
  country: z.string().default('RU'),
});

const createOrderSchema = z.object({
  customerEmail: z.string().email(),
  customerPhone: z.string().min(5),
  comment: z.string().max(500).optional(),
  address: addressSchema,
  shippingMinor: z.coerce.number().int().min(0).default(0),
});

export default async function ordersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/', async (req) => {
    const orders = await app.prisma.order.findMany({
      where: { userId: req.user!.sub },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { orders };
  });

  app.get<{ Params: { id: string } }>('/:id', async (req) => {
    const order = await app.prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: { include: { images: { take: 1, orderBy: { order: 'asc' } } } } } },
        payments: true,
        address: true,
      },
    });
    if (!order || order.userId !== req.user!.sub) throw new NotFoundError('Заказ не найден');
    return { order };
  });

  app.post('/', async (req, reply) => {
    const input = createOrderSchema.parse(req.body);

    const order = await app.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId: req.user!.sub },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new AppError('Корзина пуста', 400, 'CART_EMPTY');
      }

      // Проверяем сток + резервируем
      for (const item of cart.items) {
        if (item.variant.stock < item.quantity) {
          throw new AppError(
            `Недостаточно товара: ${item.product.name}`,
            400,
            'OUT_OF_STOCK',
          );
        }
      }

      const subtotalMinor = cart.items.reduce((sum, it) => {
        const price = it.variant.priceMinor ?? it.product.priceMinor;
        return sum + price * it.quantity;
      }, 0);
      const totalMinor = subtotalMinor + input.shippingMinor;

      // Сохраняем адрес
      const address = await tx.address.create({
        data: {
          userId: req.user!.sub,
          ...input.address,
        },
      });

      const order = await tx.order.create({
        data: {
          number: `S-${generateOrderNumber()}`,
          userId: req.user!.sub,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          comment: input.comment,
          addressId: address.id,
          shippingAddressSnapshot: input.address,
          subtotalMinor,
          shippingMinor: input.shippingMinor,
          totalMinor,
          items: {
            create: cart.items.map((it) => ({
              productId: it.productId,
              variantId: it.variantId,
              nameSnapshot: it.product.name,
              sizeSnapshot: it.variant.size,
              priceMinor: it.variant.priceMinor ?? it.product.priceMinor,
              quantity: it.quantity,
            })),
          },
          payments: {
            create: {
              amountMinor: totalMinor,
              status: 'PENDING',
            },
          },
        },
        include: { items: true, payments: true },
      });

      // Списываем сток
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Очищаем корзину
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    return reply.status(201).send({ order });
  });
}

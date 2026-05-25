import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();
const sku = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 8);

/**
 * Сид каталога. Идемпотентный: сначала чистит позиции корзин/заказов
 * и старые товары, потом заполняет актуальным набором.
 *
 * Картинки лежат в apps/web/public/products/ — фронт раздаёт их относительными URL.
 */
async function main() {
  console.log('🌱 Seeding…');

  // 1. Чистим зависимости и старые товары
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // 2. Категории
  const tees = await prisma.category.create({
    data: { slug: 'tees', name: 'T-Shirts', order: 1 },
  });

  // 3. Товары — пока только 2 футболки по 3000 ₽
  const products = [
    {
      slug: 'core-tee-black',
      name: 'CORE TEE / BLACK',
      categoryId: tees.id,
      description:
        'Базовая футболка SAMI из плотного хлопка 240 г/м². Прямой свободный крой, минималистичная вышивка-логотип на груди.',
      priceMinor: 300000, // 3000 ₽
      images: ['/products/black1.png', '/products/black2.png'],
    },
    {
      slug: 'core-tee-white',
      name: 'CORE TEE / WHITE',
      categoryId: tees.id,
      description:
        'Базовая футболка SAMI из плотного хлопка 240 г/м². Прямой свободный крой, минималистичная вышивка-логотип.',
      priceMinor: 300000, // 3000 ₽
      images: ['/products/white1.png', '/products/white2.png'],
    },
  ];

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        priceMinor: p.priceMinor,
        categoryId: p.categoryId,
        images: {
          create: p.images.map((url, i) => ({
            url,
            alt: p.name,
            order: i,
          })),
        },
      },
    });

    for (const size of ['S', 'M', 'L', 'XL']) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          size,
          sku: `SAMI-${sku()}`,
          stock: 25,
        },
      });
    }
  }

  console.log(`✅ Seed complete — ${products.length} product(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

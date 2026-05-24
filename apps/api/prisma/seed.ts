import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();
const sku = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 8);

async function main() {
  console.log('🌱 Seeding…');

  // Categories
  const [tees, hoodies, outer] = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'tees' },
      update: {},
      create: { slug: 'tees', name: 'T-Shirts', order: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'hoodies' },
      update: {},
      create: { slug: 'hoodies', name: 'Hoodies', order: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'outerwear' },
      update: {},
      create: { slug: 'outerwear', name: 'Outerwear', order: 3 },
    }),
  ]);

  const placeholder = (seed: string) => `https://picsum.photos/seed/${seed}/900/1200`;

  const products = [
    {
      slug: 'core-tee-black',
      name: 'CORE TEE / BLACK',
      categoryId: tees.id,
      description:
        'Базовая футболка SAMI из плотного хлопка 240 г/м². Прямой свободный крой, минималистичная вышивка-логотип на груди.',
      priceMinor: 320000,
      images: ['core-tee-black-1', 'core-tee-black-2', 'core-tee-black-3'],
    },
    {
      slug: 'core-tee-white',
      name: 'CORE TEE / WHITE',
      categoryId: tees.id,
      description:
        'Базовая футболка SAMI из плотного хлопка 240 г/м². Прямой свободный крой, минималистичная вышивка-логотип.',
      priceMinor: 320000,
      images: ['core-tee-white-1', 'core-tee-white-2'],
    },
    {
      slug: 'logo-hoodie-black',
      name: 'LOGO HOODIE / BLACK',
      categoryId: hoodies.id,
      description:
        'Худи оверсайз из футера 380 г/м² с начёсом. Принт-логотип SAMI на спине, регулируемый шнур, карман-кенгуру.',
      priceMinor: 790000,
      images: ['logo-hoodie-black-1', 'logo-hoodie-black-2'],
    },
    {
      slug: 'logo-hoodie-grey',
      name: 'LOGO HOODIE / HEATHER GREY',
      categoryId: hoodies.id,
      description: 'Худи оверсайз в графитовом мел-меланже. Футер 380 г/м² с начёсом.',
      priceMinor: 790000,
      images: ['logo-hoodie-grey-1', 'logo-hoodie-grey-2'],
    },
    {
      slug: 'shell-jacket',
      name: 'SHELL JACKET / BLACK',
      categoryId: outer.id,
      description:
        'Ветровка-shell с водоотталкивающей мембраной. Минималистичный силуэт, скрытые карманы, регулируемый капюшон.',
      priceMinor: 1490000,
      images: ['shell-jacket-1', 'shell-jacket-2'],
    },
    {
      slug: 'work-pant',
      name: 'WORK PANT / BLACK',
      categoryId: outer.id,
      description: 'Брюки в стиле workwear из плотного хлопкового твила. Прямой крой, усиленные швы.',
      priceMinor: 690000,
      images: ['work-pant-1', 'work-pant-2'],
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        priceMinor: p.priceMinor,
        categoryId: p.categoryId,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        priceMinor: p.priceMinor,
        categoryId: p.categoryId,
        images: {
          create: p.images.map((id, i) => ({
            url: placeholder(id),
            alt: p.name,
            order: i,
          })),
        },
      },
    });

    for (const size of ['S', 'M', 'L', 'XL']) {
      await prisma.productVariant.upsert({
        where: { productId_size: { productId: product.id, size } },
        update: {},
        create: {
          productId: product.id,
          size,
          sku: `SAMI-${sku()}`,
          stock: 25,
        },
      });
    }
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

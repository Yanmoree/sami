import type { Category, Product, ProductVariant } from './types';

/**
 * Те же 6 товаров что в apps/api/prisma/seed.ts — синхронизировать вручную.
 * Картинки берём из picsum.photos с фиксированными seed, поэтому одинаковые
 * с серверным режимом.
 */

const categories: Category[] = [
  { id: 'cat-tees', slug: 'tees', name: 'T-Shirts', order: 1 },
  { id: 'cat-hoodies', slug: 'hoodies', name: 'Hoodies', order: 2 },
  { id: 'cat-outerwear', slug: 'outerwear', name: 'Outerwear', order: 3 },
];

const placeholder = (seed: string) => `https://picsum.photos/seed/${seed}/900/1200`;

function makeVariants(productId: string): ProductVariant[] {
  return ['S', 'M', 'L', 'XL'].map((size) => ({
    id: `${productId}-${size}`,
    productId,
    size,
    sku: `SAMI-DEMO-${productId}-${size}`,
    priceMinor: null,
    stock: 25,
  }));
}

const productsSeed: Array<
  Omit<Product, 'images' | 'variants' | 'category' | 'isActive' | 'createdAt' | 'currency'> & {
    images: string[];
    categorySlug: string;
  }
> = [
  {
    id: 'prod-core-tee-black',
    slug: 'core-tee-black',
    name: 'CORE TEE / BLACK',
    description:
      'Базовая футболка SAMI из плотного хлопка 240 г/м². Прямой свободный крой, минималистичная вышивка-логотип на груди.',
    priceMinor: 320000,
    categorySlug: 'tees',
    images: ['core-tee-black-1', 'core-tee-black-2', 'core-tee-black-3'],
  },
  {
    id: 'prod-core-tee-white',
    slug: 'core-tee-white',
    name: 'CORE TEE / WHITE',
    description:
      'Базовая футболка SAMI из плотного хлопка 240 г/м². Прямой свободный крой, минималистичная вышивка-логотип.',
    priceMinor: 320000,
    categorySlug: 'tees',
    images: ['core-tee-white-1', 'core-tee-white-2'],
  },
  {
    id: 'prod-logo-hoodie-black',
    slug: 'logo-hoodie-black',
    name: 'LOGO HOODIE / BLACK',
    description:
      'Худи оверсайз из футера 380 г/м² с начёсом. Принт-логотип SAMI на спине, регулируемый шнур, карман-кенгуру.',
    priceMinor: 790000,
    categorySlug: 'hoodies',
    images: ['logo-hoodie-black-1', 'logo-hoodie-black-2'],
  },
  {
    id: 'prod-logo-hoodie-grey',
    slug: 'logo-hoodie-grey',
    name: 'LOGO HOODIE / HEATHER GREY',
    description: 'Худи оверсайз в графитовом мел-меланже. Футер 380 г/м² с начёсом.',
    priceMinor: 790000,
    categorySlug: 'hoodies',
    images: ['logo-hoodie-grey-1', 'logo-hoodie-grey-2'],
  },
  {
    id: 'prod-shell-jacket',
    slug: 'shell-jacket',
    name: 'SHELL JACKET / BLACK',
    description:
      'Ветровка-shell с водоотталкивающей мембраной. Минималистичный силуэт, скрытые карманы, регулируемый капюшон.',
    priceMinor: 1490000,
    categorySlug: 'outerwear',
    images: ['shell-jacket-1', 'shell-jacket-2'],
  },
  {
    id: 'prod-work-pant',
    slug: 'work-pant',
    name: 'WORK PANT / BLACK',
    description: 'Брюки в стиле workwear из плотного хлопкового твила. Прямой крой, усиленные швы.',
    priceMinor: 690000,
    categorySlug: 'outerwear',
    images: ['work-pant-1', 'work-pant-2'],
  },
];

export const MOCK_CATEGORIES = categories;

export const MOCK_PRODUCTS: Product[] = productsSeed.map((p) => {
  const category = categories.find((c) => c.slug === p.categorySlug) ?? null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    priceMinor: p.priceMinor,
    currency: 'RUB',
    category,
    isActive: true,
    createdAt: new Date('2026-05-24').toISOString(),
    images: p.images.map((seed, i) => ({
      id: `${p.id}-img-${i}`,
      url: placeholder(seed),
      alt: p.name,
      order: i,
    })),
    variants: makeVariants(p.id),
  };
});

export function findMockProduct(slug: string): Product | null {
  return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

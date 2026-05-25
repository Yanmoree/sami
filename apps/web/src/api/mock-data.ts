import type { Category, Product, ProductVariant } from './types';

/**
 * Каталог демо-версии. Изображения лежат в apps/web/public/products/.
 * Картинка с цифрой 1 в имени — главная (первая в массиве).
 * Когда подключим админку — каталог можно расширять/менять прямо из UI.
 */

const categories: Category[] = [
  { id: 'cat-tees', slug: 'tees', name: 'T-Shirts', order: 1 },
];

function makeVariants(productId: string): ProductVariant[] {
  return ['S', 'M', 'L', 'XL'].map((size) => ({
    id: `${productId}-${size}`,
    productId,
    size,
    sku: `SAMI-${productId.toUpperCase()}-${size}`,
    priceMinor: null,
    stock: 25,
  }));
}

interface ProductSeed {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMinor: number;
  categorySlug: string;
  /** Файлы в /public/products/. Первый — обложка карточки */
  images: string[];
}

const productsSeed: ProductSeed[] = [
  {
    id: 'prod-core-tee-black',
    slug: 'core-tee-black',
    name: 'CORE TEE / BLACK',
    description:
      'Базовая футболка SAMI из плотного хлопка 240 г/м². Прямой свободный крой, минималистичная вышивка-логотип на груди.',
    priceMinor: 320000,
    categorySlug: 'tees',
    images: ['/products/black1.png', '/products/black2.png'],
  },
  {
    id: 'prod-core-tee-white',
    slug: 'core-tee-white',
    name: 'CORE TEE / WHITE',
    description:
      'Базовая футболка SAMI из плотного хлопка 240 г/м². Прямой свободный крой, минималистичная вышивка-логотип.',
    priceMinor: 320000,
    categorySlug: 'tees',
    images: ['/products/white1.png', '/products/white2.png'],
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
    createdAt: new Date('2026-05-25').toISOString(),
    images: p.images.map((url, i) => ({
      id: `${p.id}-img-${i}`,
      url,
      alt: p.name,
      order: i,
    })),
    variants: makeVariants(p.id),
  };
});

export function findMockProduct(slug: string): Product | null {
  return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

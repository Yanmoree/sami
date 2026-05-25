import type { Product, ProductVariant } from './types';
import { MOCK_CATEGORIES } from './mock-data';

/**
 * Demo-админка: товары, созданные через /admin, хранятся в localStorage.
 * Каталог объединяет MOCK_PRODUCTS (встроенные) + custom products.
 * В production такая же логика реализуется через REST-эндпоинты /admin/products.
 */
// v2 — после ребренда каталога; старый ключ игнорируется, чтобы не подтягивать
// фейковые тестовые товары из ранних сессий
const STORAGE_KEY = 'sami_demo_admin_products_v2';

function readCustom(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

function writeCustom(list: Product[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getCustomProducts(): Product[] {
  return readCustom();
}

export interface AdminProductInput {
  slug: string;
  name: string;
  description: string;
  /** рубли (не копейки) */
  priceRub: number;
  categorySlug?: string;
  /** список URL картинок; первая — обложка */
  images: string[];
  /** список размеров */
  sizes: string[];
  /** общий сток на размер (demo упрощение) */
  stock: number;
}

function makeVariants(productId: string, sizes: string[], stock: number): ProductVariant[] {
  return sizes.map((size) => ({
    id: `${productId}-${size}`,
    productId,
    size,
    sku: `SAMI-${productId.toUpperCase()}-${size}`,
    priceMinor: null,
    stock,
  }));
}

function inputToProduct(input: AdminProductInput, existingId?: string): Product {
  const id = existingId ?? `custom-${Date.now()}`;
  const category =
    MOCK_CATEGORIES.find((c) => c.slug === input.categorySlug) ?? MOCK_CATEGORIES[0] ?? null;
  return {
    id,
    slug: input.slug,
    name: input.name,
    description: input.description,
    priceMinor: Math.round(input.priceRub * 100),
    currency: 'RUB',
    category,
    isActive: true,
    createdAt: new Date().toISOString(),
    images: input.images.map((url, i) => ({
      id: `${id}-img-${i}`,
      url,
      alt: input.name,
      order: i,
    })),
    variants: makeVariants(id, input.sizes, input.stock),
  };
}

export const mockAdminApi = {
  async list(): Promise<Product[]> {
    return readCustom();
  },
  async create(input: AdminProductInput): Promise<Product> {
    const product = inputToProduct(input);
    const list = readCustom();
    list.unshift(product);
    writeCustom(list);
    return product;
  },
  async update(id: string, input: AdminProductInput): Promise<Product> {
    const list = readCustom();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    const updated = inputToProduct(input, id);
    list[idx] = updated;
    writeCustom(list);
    return updated;
  },
  async remove(id: string): Promise<void> {
    const list = readCustom().filter((p) => p.id !== id);
    writeCustom(list);
  },
  async updateStock(productId: string, size: string, stock: number): Promise<void> {
    const list = readCustom();
    const product = list.find((p) => p.id === productId);
    if (!product) return;
    const variant = product.variants.find((v) => v.size === size);
    if (variant) variant.stock = stock;
    writeCustom(list);
  },
};

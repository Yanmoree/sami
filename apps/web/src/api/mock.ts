import { DEMO_ACCESS_TOKEN, DEMO_USER } from '@/lib/demo';
import type {
  Cart,
  CartItem,
  CartResponse,
  Order,
  Product,
  User,
} from './types';
import { findMockProduct, MOCK_CATEGORIES, MOCK_PRODUCTS } from './mock-data';

const STORAGE_KEYS = {
  cart: 'sami_demo_cart',
  orders: 'sami_demo_orders',
};

function generateOrderNumber(): string {
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
}

// ───────────────────────────────────────────────────────────
// helpers
// ───────────────────────────────────────────────────────────

function delay<T>(value: T, ms = 200): Promise<T> {
  // лёгкая задержка чтобы скелетоны успели мелькнуть и flow ощущался настоящим
  return new Promise((res) => setTimeout(() => res(value), ms));
}

function readCart(): Cart {
  if (typeof window === 'undefined') return emptyCart();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.cart);
    return raw ? (JSON.parse(raw) as Cart) : emptyCart();
  } catch {
    return emptyCart();
  }
}

function writeCart(cart: Cart) {
  window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

function emptyCart(): Cart {
  return { id: 'demo-cart', userId: DEMO_USER.id, items: [] };
}

function readOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.orders);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

function priceOf(product: Product, variantId: string): number {
  const variant = product.variants.find((v) => v.id === variantId);
  return variant?.priceMinor ?? product.priceMinor;
}

function computeCartResponse(cart: Cart): CartResponse {
  const subtotalMinor = cart.items.reduce(
    (sum, it) => sum + priceOf(it.product, it.variantId) * it.quantity,
    0,
  );
  const totalItems = cart.items.reduce((s, it) => s + it.quantity, 0);
  return { cart, subtotalMinor, totalItems };
}

// ───────────────────────────────────────────────────────────
// API mocks
// ───────────────────────────────────────────────────────────

export const mockAuthApi = {
  async me(): Promise<User> {
    return delay(DEMO_USER);
  },
  async login(_email: string, _password: string) {
    return delay({ user: DEMO_USER, accessToken: DEMO_ACCESS_TOKEN }, 400);
  },
  async register(data: { email: string; firstName?: string; lastName?: string }) {
    const user: User = {
      ...DEMO_USER,
      email: data.email,
      firstName: data.firstName ?? DEMO_USER.firstName,
      lastName: data.lastName ?? DEMO_USER.lastName,
    };
    return delay({ user, accessToken: DEMO_ACCESS_TOKEN }, 400);
  },
  async logout() {
    window.localStorage.removeItem(STORAGE_KEYS.cart);
    return delay(null, 100);
  },
  async refresh() {
    return delay({ accessToken: DEMO_ACCESS_TOKEN }, 100);
  },
};

export const mockProductsApi = {
  async list(params?: { category?: string; q?: string; limit?: number; offset?: number }) {
    const items = MOCK_PRODUCTS.filter((p) => {
      if (params?.category && p.category?.slug !== params.category) return false;
      if (params?.q) {
        const q = params.q.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
    const limit = params?.limit ?? 40;
    const offset = params?.offset ?? 0;
    return delay({
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    });
  },
  async bySlug(slug: string): Promise<Product> {
    const product = findMockProduct(slug);
    if (!product) throw new Error('Товар не найден');
    return delay(product);
  },
  async categories() {
    return delay(MOCK_CATEGORIES);
  },
};

export const mockCartApi = {
  async get(): Promise<CartResponse> {
    return delay(computeCartResponse(readCart()));
  },
  async add(productId: string, variantId: string, quantity = 1): Promise<CartResponse> {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) throw new Error('Товар не найден');
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error('Вариант не найден');

    const cart = readCart();
    const existing = cart.items.find((it) => it.variantId === variantId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      const item: CartItem = {
        id: `item-${variantId}`,
        cartId: cart.id,
        productId,
        variantId,
        quantity,
        product,
        variant,
      };
      cart.items.push(item);
    }
    writeCart(cart);
    return delay(computeCartResponse(cart), 250);
  },
  async patch(itemId: string, quantity: number): Promise<CartResponse> {
    const cart = readCart();
    if (quantity === 0) {
      cart.items = cart.items.filter((it) => it.id !== itemId);
    } else {
      const item = cart.items.find((it) => it.id === itemId);
      if (item) item.quantity = quantity;
    }
    writeCart(cart);
    return delay(computeCartResponse(cart), 150);
  },
  async remove(itemId: string): Promise<CartResponse> {
    const cart = readCart();
    cart.items = cart.items.filter((it) => it.id !== itemId);
    writeCart(cart);
    return delay(computeCartResponse(cart), 150);
  },
};

export const mockOrdersApi = {
  async list(): Promise<Order[]> {
    return delay(readOrders().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async byId(id: string): Promise<Order> {
    const order = readOrders().find((o) => o.id === id);
    if (!order) throw new Error('Заказ не найден');
    return delay(order);
  },
  async create(data: {
    customerEmail: string;
    customerPhone: string;
    comment?: string;
    shippingMinor?: number;
    address: Record<string, unknown>;
  }): Promise<Order> {
    const cart = readCart();
    if (cart.items.length === 0) throw new Error('Корзина пуста');

    const subtotalMinor = cart.items.reduce(
      (sum, it) => sum + priceOf(it.product, it.variantId) * it.quantity,
      0,
    );
    const shippingMinor = data.shippingMinor ?? 0;
    const totalMinor = subtotalMinor + shippingMinor;

    const order: Order = {
      id: `order-${Date.now()}`,
      number: `S-${generateOrderNumber()}`,
      status: 'PENDING_PAYMENT',
      subtotalMinor,
      shippingMinor,
      totalMinor,
      currency: 'RUB',
      createdAt: new Date().toISOString(),
      items: cart.items.map((it) => ({
        id: `oi-${it.variantId}`,
        nameSnapshot: it.product.name,
        sizeSnapshot: it.variant.size,
        priceMinor: priceOf(it.product, it.variantId),
        quantity: it.quantity,
        product: { images: it.product.images.slice(0, 1) },
      })),
    };

    const orders = readOrders();
    orders.unshift(order);
    writeOrders(orders);
    writeCart(emptyCart());

    return delay(order, 500);
  },
};

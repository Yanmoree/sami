import { api } from './client';
import { IS_DEMO } from '@/lib/demo';
import { mockAuthApi, mockCartApi, mockOrdersApi, mockProductsApi } from './mock';
import type { Cart, CartResponse, Order, Product, User } from './types';

// ──────────────────────────────────────────────────────────────
// Public API contracts
// ──────────────────────────────────────────────────────────────

export interface AuthApi {
  me: () => Promise<User>;
  login: (email: string, password: string) => Promise<{ user: User; accessToken: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<{ user: User; accessToken: string }>;
  logout: () => Promise<unknown>;
  refresh: () => Promise<{ accessToken: string }>;
}

export interface ProductsApi {
  list: (params?: {
    category?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) => Promise<{ items: Product[]; total: number; limit?: number; offset?: number }>;
  bySlug: (slug: string) => Promise<Product>;
  categories: () => Promise<Array<{ slug: string; name: string }>>;
}

export interface CartApi {
  get: () => Promise<CartResponse>;
  add: (productId: string, variantId: string, quantity?: number) => Promise<CartResponse>;
  patch: (itemId: string, quantity: number) => Promise<CartResponse>;
  remove: (itemId: string) => Promise<CartResponse>;
}

export interface CreateOrderInput {
  customerEmail: string;
  customerPhone: string;
  comment?: string;
  shippingMinor?: number;
  address: {
    fullName: string;
    phone: string;
    city: string;
    street: string;
    building: string;
    apartment?: string;
    postalCode: string;
    country?: string;
  };
}

export interface OrdersApi {
  list: () => Promise<Order[]>;
  byId: (id: string) => Promise<Order>;
  create: (data: CreateOrderInput) => Promise<Order>;
}

// ──────────────────────────────────────────────────────────────
// Реальные эндпоинты (http к Fastify)
// ──────────────────────────────────────────────────────────────
const realAuthApi: AuthApi = {
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  login: (email, password) =>
    api.post<{ user: User; accessToken: string }>('/auth/login', { email, password }).then((r) => r.data),
  register: (data) =>
    api.post<{ user: User; accessToken: string }>('/auth/register', data).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh').then((r) => r.data),
};

const realProductsApi: ProductsApi = {
  list: (params) =>
    api
      .get<{ items: Product[]; total: number }>('/products', { params })
      .then((r) => r.data),
  bySlug: (slug) =>
    api.get<{ product: Product }>(`/products/${slug}`).then((r) => r.data.product),
  categories: () =>
    api
      .get<{ categories: Array<{ slug: string; name: string }> }>('/products/categories')
      .then((r) => r.data.categories),
};

const realCartApi: CartApi = {
  get: () => api.get<CartResponse>('/cart').then((r) => r.data),
  add: (productId, variantId, quantity = 1) =>
    api.post<CartResponse>('/cart/items', { productId, variantId, quantity }).then((r) => r.data),
  patch: (itemId, quantity) =>
    api.patch<CartResponse>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  remove: (itemId) =>
    api.delete<CartResponse>(`/cart/items/${itemId}`).then((r) => r.data),
};

const realOrdersApi: OrdersApi = {
  list: () => api.get<{ orders: Order[] }>('/orders').then((r) => r.data.orders),
  byId: (id) => api.get<{ order: Order }>(`/orders/${id}`).then((r) => r.data.order),
  create: (data) => api.post<{ order: Order }>('/orders', data).then((r) => r.data.order),
};

// ──────────────────────────────────────────────────────────────
// Switch: реальный API или мок (типизация сохраняется)
// ──────────────────────────────────────────────────────────────
export const authApi: AuthApi = IS_DEMO ? (mockAuthApi as AuthApi) : realAuthApi;
export const productsApi: ProductsApi = IS_DEMO ? (mockProductsApi as ProductsApi) : realProductsApi;
export const cartApi: CartApi = IS_DEMO ? (mockCartApi as CartApi) : realCartApi;
export const ordersApi: OrdersApi = IS_DEMO ? (mockOrdersApi as OrdersApi) : realOrdersApi;

export type { Cart, Product, User };

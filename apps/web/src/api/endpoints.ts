import { api } from './client';
import type { Cart, CartResponse, Order, Product, User } from './types';

export const authApi = {
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  login: (email: string, password: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/login', { email, password }).then((r) => r.data),
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post<{ user: User; accessToken: string }>('/auth/register', data).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh').then((r) => r.data),
};

export const productsApi = {
  list: (params?: { category?: string; q?: string; limit?: number; offset?: number }) =>
    api
      .get<{ items: Product[]; total: number }>('/products', { params })
      .then((r) => r.data),
  bySlug: (slug: string) =>
    api.get<{ product: Product }>(`/products/${slug}`).then((r) => r.data.product),
  categories: () => api.get<{ categories: Array<{ slug: string; name: string }> }>('/products/categories').then((r) => r.data.categories),
};

export const cartApi = {
  get: () => api.get<CartResponse>('/cart').then((r) => r.data),
  add: (productId: string, variantId: string, quantity = 1) =>
    api.post<CartResponse>('/cart/items', { productId, variantId, quantity }).then((r) => r.data),
  patch: (itemId: string, quantity: number) =>
    api.patch<CartResponse>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  remove: (itemId: string) =>
    api.delete<CartResponse>(`/cart/items/${itemId}`).then((r) => r.data),
};

export const ordersApi = {
  list: () => api.get<{ orders: Order[] }>('/orders').then((r) => r.data.orders),
  byId: (id: string) => api.get<{ order: Order }>(`/orders/${id}`).then((r) => r.data.order),
  create: (data: {
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
  }) => api.post<{ order: Order }>('/orders', data).then((r) => r.data.order),
};

export type { Cart, Product, User };

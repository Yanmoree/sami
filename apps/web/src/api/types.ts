export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  order: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  sku: string;
  priceMinor: number | null;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  category: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
}

export interface CartResponse {
  cart: Cart;
  subtotalMinor: number;
  totalItems: number;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  sizeSnapshot: string;
  priceMinor: number;
  quantity: number;
  product?: { images: ProductImage[] };
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
}

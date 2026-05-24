import { create } from 'zustand';
import type { CartResponse } from '@/api/types';

interface CartState {
  data: CartResponse | null;
  setCart: (data: CartResponse) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  data: null,
  setCart: (data) => set({ data }),
  clear: () => set({ data: null }),
}));

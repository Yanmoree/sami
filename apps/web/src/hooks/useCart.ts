import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export function useCart() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setCart = useCartStore((s) => s.setCart);

  const query = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) setCart(query.data);
  }, [query.data, setCart]);

  return query;
}

export function useAddToCart() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  return useMutation({
    mutationFn: ({ productId, variantId, quantity }: { productId: string; variantId: string; quantity?: number }) =>
      cartApi.add(productId, variantId, quantity),
    onSuccess: (data) => {
      setCart(data);
      qc.setQueryData(['cart'], data);
    },
  });
}

export function usePatchCartItem() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => cartApi.patch(id, quantity),
    onSuccess: (data) => {
      setCart(data);
      qc.setQueryData(['cart'], data);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  return useMutation({
    mutationFn: (id: string) => cartApi.remove(id),
    onSuccess: (data) => {
      setCart(data);
      qc.setQueryData(['cart'], data);
    },
  });
}

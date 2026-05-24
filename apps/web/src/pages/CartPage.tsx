import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useCart, usePatchCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { formatRub } from '@/lib/format';
import { useAuthStore } from '@/store/auth';

export function CartPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data, isLoading } = useCart();
  const patch = usePatchCartItem();
  const remove = useRemoveCartItem();

  if (!accessToken) {
    return (
      <Container className="py-24">
        <div className="mx-auto max-w-md text-center space-y-6">
          <h1 className="display text-display-lg">Корзина</h1>
          <p className="text-ink-600">
            Войдите, чтобы увидеть свою корзину и оформить заказ.
          </p>
          <Link to="/login">
            <Button size="lg">Войти</Button>
          </Link>
        </div>
      </Container>
    );
  }

  const items = data?.cart.items ?? [];

  return (
    <div >
      <Container className="py-12">
        <h1 className="display text-display-lg mb-10">Корзина</h1>

        {isLoading && <p className="text-sm text-ink-500">Загрузка…</p>}

        {!isLoading && items.length === 0 && (
          <div className="py-24 text-center space-y-6">
            <p className="text-ink-500">Корзина пуста.</p>
            <Link to="/shop">
              <Button>Перейти в каталог</Button>
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-12 lg:grid-cols-[1.5fr,1fr]">
            <ul className="divide-y divide-ink-200 border-y border-ink-200">
              {items.map((it) => {
                const price = it.variant.priceMinor ?? it.product.priceMinor;
                const cover = it.product.images[0]?.url;
                return (
                  <li key={it.id} className="flex gap-5 py-6">
                    <div className="aspect-[3/4] w-24 flex-shrink-0 overflow-hidden bg-ink-100">
                      {cover && (
                        <img src={cover} alt={it.product.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link to={`/product/${it.product.slug}`} className="text-sm font-medium hover:underline">
                            {it.product.name}
                          </Link>
                          <p className="mt-1 text-xs uppercase tracking-[0.15em] text-ink-500">
                            Размер: {it.variant.size}
                          </p>
                        </div>
                        <p className="font-mono text-sm">{formatRub(price * it.quantity)}</p>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center border border-ink-300">
                          <button
                            type="button"
                            className="h-8 w-8 text-sm hover:bg-ink-100"
                            onClick={() => patch.mutate({ id: it.id, quantity: it.quantity - 1 })}
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">{it.quantity}</span>
                          <button
                            type="button"
                            className="h-8 w-8 text-sm hover:bg-ink-100"
                            onClick={() => patch.mutate({ id: it.id, quantity: it.quantity + 1 })}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove.mutate(it.id)}
                          className="text-ink-500 hover:text-ink transition-colors"
                          aria-label="Удалить"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <h2 className="label">Итого</h2>
              <div className="space-y-3 border-y border-ink-200 py-6">
                <Row label="Подытог" value={formatRub(data?.subtotalMinor ?? 0)} />
                <Row label="Доставка" value="При оформлении" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="label">Total</span>
                <span className="font-mono text-2xl">{formatRub(data?.subtotalMinor ?? 0)}</span>
              </div>
              <Link to="/checkout">
                <Button size="lg" fullWidth>
                  Оформить заказ
                </Button>
              </Link>
            </aside>
          </div>
        )}
      </Container>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-600">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}

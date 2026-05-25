import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ordersApi } from '@/api/endpoints';
import { Container } from '@/components/ui/Container';
import { formatRub, formatDate } from '@/lib/format';
import type { OrderStatus } from '@/api/types';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/cn';

const STATUSES: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

function useStatusLabel() {
  const t = useTranslation();
  return (s: OrderStatus) => t(`orders.status.${s}` as `orders.status.${OrderStatus}`);
}

export function OrdersPage() {
  const { id } = useParams<{ id?: string }>();
  if (id) return <OrderDetail id={id} />;
  return <OrdersList />;
}

function OrdersList() {
  const t = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => ordersApi.list() });

  return (
    <div>
      <Container className="py-12">
        <h1 className="display text-display-lg mb-10">{t('orders.title')}</h1>

        {isLoading && <p className="text-sm text-ink-500">{t('common.loading')}</p>}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="py-24 text-center text-ink-500">{t('orders.empty')}</div>
        )}

        <ul className="divide-y divide-ink-200 border-y border-ink-200">
          {data?.map((o) => (
            <li key={o.id}>
              <Link
                to={`/account/orders/${o.id}`}
                className="flex items-center justify-between gap-4 py-5 hover:bg-ink-50 px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <span className="font-mono text-sm">{o.number}</span>
                  <span className="text-sm text-ink-500">{formatDate(o.createdAt)}</span>
                </div>
                <div className="flex items-center gap-6">
                  <StatusBadge status={o.status} />
                  <span className="font-mono text-sm">{formatRub(o.totalMinor)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

function OrderDetail({ id }: { id: string }) {
  const t = useTranslation();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.byId(id),
  });

  if (isLoading || !order) {
    return (
      <Container className="py-12">
        <p className="text-sm text-ink-500">{t('common.loading')}</p>
      </Container>
    );
  }

  return (
    <div>
      <Container className="py-12">
        <Link to="/account/orders" className="label hover:text-ink">
          {t('orders.toList')}
        </Link>
        <div className="mt-6 flex items-end justify-between border-b border-ink-200 pb-6">
          <div>
            <p className="label">{t('orders.orderLabel')}</p>
            <h1 className="display text-display-lg mt-1">{order.number}</h1>
            <p className="mt-2 text-sm text-ink-500">{formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <ul className="divide-y divide-ink-200 border-b border-ink-200">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-4 py-5">
              <div className="text-sm">
                <p>{it.nameSnapshot}</p>
                <p className="text-xs uppercase tracking-[0.15em] text-ink-500 mt-1">
                  {t('common.size')} {it.sizeSnapshot} × {it.quantity}
                </p>
              </div>
              <p className="font-mono text-sm">{formatRub(it.priceMinor * it.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
          <Row label={t('cart.subtotal')} value={formatRub(order.subtotalMinor)} />
          <Row label={t('cart.shipping')} value={formatRub(order.shippingMinor)} />
          <div className="flex items-baseline justify-between border-t border-ink-200 pt-3">
            <span className="label">{t('common.total')}</span>
            <span className="font-mono text-xl">{formatRub(order.totalMinor)}</span>
          </div>
        </div>
      </Container>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-600">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const label = useStatusLabel()(status);
  void STATUSES; // for tree-shake reference
  const color =
    status === 'PAID' || status === 'DELIVERED'
      ? 'bg-ink text-paper'
      : status === 'CANCELLED' || status === 'REFUNDED'
      ? 'bg-ink-200 text-ink-700'
      : 'bg-ink-100 text-ink-700';
  return (
    <span className={cn('px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]', color)}>
      {label}
    </span>
  );
}

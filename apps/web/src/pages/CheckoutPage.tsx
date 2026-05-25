import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import { ordersApi } from '@/api/endpoints';
import { formatRub } from '@/lib/format';
import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';

const SHIPPING_MINOR = 49000; // 490 ₽ заглушка

export function CheckoutPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const setAddress = useProfileStore((s) => s.setAddress);
  const { data: cartData } = useCart();

  const schema = z.object({
    customerEmail: z.string().email(t('auth.errEmail')),
    customerPhone: z.string().min(5, t('common.required')),
    fullName: z.string().min(2, t('common.required')),
    city: z.string().min(1, t('common.required')),
    street: z.string().min(1, t('common.required')),
    building: z.string().min(1, t('common.required')),
    apartment: z.string().optional(),
    postalCode: z.string().min(3, t('common.required')),
    comment: z.string().optional(),
  });
  type FormData = z.infer<typeof schema>;

  // Автоподстановка: профиль → email из auth → пусто
  const defaultValues: FormData = {
    customerEmail: profile.email || user?.email || '',
    customerPhone: profile.phone || profile.address.phone || '',
    fullName:
      profile.address.fullName ||
      [profile.firstName || user?.firstName, profile.lastName || user?.lastName]
        .filter(Boolean)
        .join(' '),
    city: profile.address.city,
    street: profile.address.street,
    building: profile.address.building,
    apartment: profile.address.apartment,
    postalCode: profile.address.postalCode,
    comment: '',
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues });

  const createOrder = useMutation({
    mutationFn: (data: FormData) =>
      ordersApi.create({
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        comment: data.comment,
        shippingMinor: SHIPPING_MINOR,
        address: {
          fullName: data.fullName,
          phone: data.customerPhone,
          city: data.city,
          street: data.street,
          building: data.building,
          apartment: data.apartment,
          postalCode: data.postalCode,
        },
      }),
    onSuccess: (order, data) => {
      // Сохраняем в профиль то что пользователь ввёл — пригодится в следующий раз
      setProfile({
        email: data.customerEmail,
        phone: data.customerPhone,
      });
      setAddress({
        fullName: data.fullName,
        phone: data.customerPhone,
        city: data.city,
        street: data.street,
        building: data.building,
        apartment: data.apartment ?? '',
        postalCode: data.postalCode,
      });
      qc.invalidateQueries({ queryKey: ['cart'] });
      navigate(`/account/orders/${order.id}`);
    },
  });

  const onSubmit = handleSubmit((data) => createOrder.mutate(data));

  const subtotal = cartData?.subtotalMinor ?? 0;
  const total = subtotal + SHIPPING_MINOR;

  return (
    <div>
      <Container className="py-12">
        <h1 className="display text-display-lg mb-10">{t('checkout.title')}</h1>

        <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-10">
            <section className="space-y-5">
              <h2 className="label">{t('checkout.contacts')}</h2>
              <Input
                label={t('checkout.email')}
                type="email"
                error={errors.customerEmail?.message}
                {...register('customerEmail')}
              />
              <Input
                label={t('checkout.phone')}
                type="tel"
                placeholder="+7"
                error={errors.customerPhone?.message}
                {...register('customerPhone')}
              />
            </section>

            <section className="space-y-5">
              <h2 className="label">{t('checkout.address')}</h2>
              <Input
                label={t('checkout.fullName')}
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <div className="grid grid-cols-2 gap-5">
                <Input label={t('checkout.city')} error={errors.city?.message} {...register('city')} />
                <Input
                  label={t('checkout.postal')}
                  error={errors.postalCode?.message}
                  {...register('postalCode')}
                />
              </div>
              <Input label={t('checkout.street')} error={errors.street?.message} {...register('street')} />
              <div className="grid grid-cols-2 gap-5">
                <Input label={t('checkout.building')} error={errors.building?.message} {...register('building')} />
                <Input
                  label={t('checkout.apartment')}
                  error={errors.apartment?.message}
                  {...register('apartment')}
                />
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="label">{t('checkout.comment')}</h2>
              <Input placeholder={t('checkout.commentPlaceholder')} {...register('comment')} />
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <h2 className="label">{t('checkout.summary')}</h2>
            <ul className="divide-y divide-ink-200 border-y border-ink-200">
              {cartData?.cart.items.map((it) => {
                const price = it.variant.priceMinor ?? it.product.priceMinor;
                return (
                  <li key={it.id} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="truncate">
                      {it.product.name} · {it.variant.size} × {it.quantity}
                    </span>
                    <span className="font-mono whitespace-nowrap">{formatRub(price * it.quantity)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-600">{t('cart.subtotal')}</span>
                <span className="font-mono">{formatRub(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">{t('cart.shipping')}</span>
                <span className="font-mono">{formatRub(SHIPPING_MINOR)}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink-200 pt-4">
              <span className="label">{t('common.total')}</span>
              <span className="font-mono text-xl">{formatRub(total)}</span>
            </div>
            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting || createOrder.isPending}>
              {t('checkout.confirm')}
            </Button>
            <p className="text-xs text-ink-500 leading-relaxed">{t('checkout.disclaimer')}</p>
            {createOrder.isError && <p className="text-xs text-red-600">{t('checkout.error')}</p>}
          </aside>
        </form>
      </Container>
    </div>
  );
}

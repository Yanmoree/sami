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
import { useMutation, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  customerEmail: z.string().email('Некорректный email'),
  customerPhone: z.string().min(5, 'Введите телефон'),
  fullName: z.string().min(2, 'Укажите ФИО'),
  city: z.string().min(1, 'Город'),
  street: z.string().min(1, 'Улица'),
  building: z.string().min(1, 'Дом'),
  apartment: z.string().optional(),
  postalCode: z.string().min(3, 'Индекс'),
  comment: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SHIPPING_MINOR = 49000; // 490 ₽ заглушка

export function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: cartData } = useCart();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerEmail: user?.email ?? '',
      fullName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    },
  });

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
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      navigate(`/account/orders/${order.id}`);
    },
  });

  const onSubmit = handleSubmit((data) => createOrder.mutate(data));

  const subtotal = cartData?.subtotalMinor ?? 0;
  const total = subtotal + SHIPPING_MINOR;

  return (
    <div >
      <Container className="py-12">
        <h1 className="display text-display-lg mb-10">Оформление</h1>

        <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-10">
            <section className="space-y-5">
              <h2 className="label">Контакты</h2>
              <Input label="Email" type="email" error={errors.customerEmail?.message} {...register('customerEmail')} />
              <Input label="Телефон" type="tel" placeholder="+7" error={errors.customerPhone?.message} {...register('customerPhone')} />
            </section>

            <section className="space-y-5">
              <h2 className="label">Адрес доставки</h2>
              <Input label="ФИО получателя" error={errors.fullName?.message} {...register('fullName')} />
              <div className="grid grid-cols-2 gap-5">
                <Input label="Город" error={errors.city?.message} {...register('city')} />
                <Input label="Индекс" error={errors.postalCode?.message} {...register('postalCode')} />
              </div>
              <Input label="Улица" error={errors.street?.message} {...register('street')} />
              <div className="grid grid-cols-2 gap-5">
                <Input label="Дом" error={errors.building?.message} {...register('building')} />
                <Input label="Квартира / офис" error={errors.apartment?.message} {...register('apartment')} />
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="label">Комментарий</h2>
              <Input placeholder="По желанию" {...register('comment')} />
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <h2 className="label">Заказ</h2>
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
              <div className="flex justify-between"><span className="text-ink-600">Подытог</span><span className="font-mono">{formatRub(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Доставка</span><span className="font-mono">{formatRub(SHIPPING_MINOR)}</span></div>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink-200 pt-4">
              <span className="label">Total</span>
              <span className="font-mono text-xl">{formatRub(total)}</span>
            </div>
            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting || createOrder.isPending}>
              Подтвердить заказ
            </Button>
            <p className="text-xs text-ink-500 leading-relaxed">
              Нажимая «Подтвердить заказ», вы соглашаетесь с обработкой персональных данных. Оплата — следующим этапом
              (ЮKassa).
            </p>
            {createOrder.isError && (
              <p className="text-xs text-red-600">Не удалось оформить заказ. Попробуйте ещё раз.</p>
            )}
          </aside>
        </form>
      </Container>
    </div>
  );
}

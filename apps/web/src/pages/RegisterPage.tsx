import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';

const schema = z.object({
  firstName: z.string().min(1, 'Введите имя'),
  lastName: z.string().optional(),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      const res = await authApi.register(data);
      setAuth(res.user, res.accessToken);
      navigate('/account', { replace: true });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setServerError(err.response?.data?.message ?? 'Не удалось зарегистрироваться');
    }
  });

  return (
    <div >
      <Container className="py-24">
        <div className="mx-auto max-w-sm space-y-10">
          <div className="space-y-2 text-center">
            <h1 className="display text-display-lg">Регистрация</h1>
            <p className="text-sm text-ink-500">Создайте аккаунт SAMI</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <Input label="Имя" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Фамилия" error={errors.lastName?.message} {...register('lastName')} />
            </div>
            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Input
              label="Пароль"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
              Создать аккаунт
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500">
            Уже зарегистрированы?{' '}
            <Link to="/login" className="text-ink underline-offset-4 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
      const res = await authApi.login(data.email, data.password);
      setAuth(res.user, res.accessToken);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setServerError(err.response?.data?.message ?? 'Не удалось войти');
    }
  });

  return (
    <div >
      <Container className="py-24">
        <div className="mx-auto max-w-sm space-y-10">
          <div className="space-y-2 text-center">
            <h1 className="display text-display-lg">Войти</h1>
            <p className="text-sm text-ink-500">Добро пожаловать обратно</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Input label="Пароль" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
              Войти
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-ink underline-offset-4 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}

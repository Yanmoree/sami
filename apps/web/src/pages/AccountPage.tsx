import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/api/endpoints';
import { useMe } from '@/hooks/useAuth';

export function AccountPage() {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const { data: user } = useMe();
  const cached = useAuthStore((s) => s.user);
  const me = user ?? cached;

  const logout = async () => {
    await authApi.logout().catch(() => null);
    clear();
    navigate('/');
  };

  return (
    <div >
      <Container className="py-12">
        <div className="mb-10 flex items-end justify-between border-b border-ink-200 pb-6">
          <div>
            <p className="label">Аккаунт</p>
            <h1 className="display text-display-lg mt-1">
              {me?.firstName ? `Привет, ${me.firstName}` : 'Аккаунт'}
            </h1>
          </div>
          <Button variant="outline" onClick={logout}>
            Выйти
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card title="Профиль" body={me?.email ?? ''} action={{ to: '/account', label: 'Изменить' }} />
          <Card title="Заказы" body="История заказов и статусы" action={{ to: '/account/orders', label: 'Открыть' }} />
          <Card title="Адреса" body="Сохранённые адреса доставки" action={{ to: '/account', label: 'Скоро' }} />
        </div>
      </Container>
    </div>
  );
}

function Card({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: { to: string; label: string };
}) {
  return (
    <div className="border border-ink-200 p-6 hover:border-ink transition-colors">
      <p className="label">{title}</p>
      <p className="mt-3 text-sm text-ink-700 leading-relaxed">{body}</p>
      <Link to={action.to} className="mt-6 inline-block text-xs uppercase tracking-[0.18em] text-ink hover:underline">
        {action.label} →
      </Link>
    </div>
  );
}

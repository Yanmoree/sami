import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { useProfileStore, type ProfileData } from '@/store/profile';
import { authApi } from '@/api/endpoints';
import { useMe } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { IS_DEMO } from '@/lib/demo';

export function AccountPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const setUser = useAuthStore((s) => s.setUser);
  const { data: user } = useMe();
  const cached = useAuthStore((s) => s.user);
  const profileClear = useProfileStore((s) => s.clear);
  const me = user ?? cached;
  const isAdmin = me?.role === 'ADMIN';

  const toggleDemoAdmin = () => {
    if (!me) return;
    setUser({ ...me, role: isAdmin ? 'CUSTOMER' : 'ADMIN' });
  };

  const logout = async () => {
    await authApi.logout().catch(() => null);
    clear();
    profileClear();
    navigate('/');
  };

  return (
    <div>
      <Container className="py-12 space-y-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-200 pb-6">
          <div>
            <p className="label">{t('account.title')}</p>
            <h1 className="display text-display-lg mt-1">
              {me?.firstName ? `${t('account.helloPrefix')} ${me.firstName}` : t('account.title')}
            </h1>
          </div>
          <div className="flex gap-3">
            {IS_DEMO && (
              <Button variant="ghost" onClick={toggleDemoAdmin}>
                {isAdmin ? t('admin.demoDisable') : t('admin.demoEnable')}
              </Button>
            )}
            <Button variant="outline" onClick={logout}>
              {t('account.logout')}
            </Button>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card
            title={t('account.orders')}
            body={t('account.ordersBody')}
            action={{ to: '/account/orders', label: t('account.openOrders') }}
          />
          {isAdmin && (
            <Card
              title={t('account.adminPanel')}
              body={t('account.adminPanelBody')}
              action={{ to: '/admin', label: t('account.openProfile') }}
            />
          )}
          <Card
            title={t('account.profile')}
            body={t('account.profileBody')}
            action={{ to: '#profile', label: t('account.openProfile') }}
          />
        </div>

        {/* Profile form */}
        <ProfileForm initialEmail={me?.email ?? ''} />
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

function ProfileForm({ initialEmail }: { initialEmail: string }) {
  const t = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const setAddress = useProfileStore((s) => s.setAddress);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProfileData>({
    defaultValues: {
      ...profile,
      email: profile.email || initialEmail,
    },
  });

  const onSubmit = handleSubmit((data) => {
    setProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    });
    setAddress(data.address);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  });

  return (
    <form id="profile" onSubmit={onSubmit} className="space-y-10 border-t border-ink-200 pt-10">
      <h2 className="display text-2xl">{t('account.profileTitle')}</h2>

      <section className="space-y-5 max-w-2xl">
        <p className="label">{t('checkout.contacts')}</p>
        <div className="grid grid-cols-2 gap-5">
          <Input label={t('auth.firstName')} {...register('firstName')} />
          <Input label={t('auth.lastName')} {...register('lastName')} />
        </div>
        <Input label={t('checkout.email')} type="email" {...register('email')} />
        <Input label={t('checkout.phone')} type="tel" placeholder="+7" {...register('phone')} />
      </section>

      <section className="space-y-5 max-w-2xl">
        <p className="label">{t('checkout.address')}</p>
        <Input label={t('checkout.fullName')} {...register('address.fullName')} />
        <div className="grid grid-cols-2 gap-5">
          <Input label={t('checkout.city')} {...register('address.city')} />
          <Input label={t('checkout.postal')} {...register('address.postalCode')} />
        </div>
        <Input label={t('checkout.street')} {...register('address.street')} />
        <div className="grid grid-cols-2 gap-5">
          <Input label={t('checkout.building')} {...register('address.building')} />
          <Input label={t('checkout.apartment')} {...register('address.apartment')} />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <Button type="submit" isLoading={isSubmitting}>
          {t('account.profileSave')}
        </Button>
        {saved && <span className="text-sm text-ink-700">{t('account.profileSaved')}</span>}
      </div>
    </form>
  );
}

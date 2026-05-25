import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Marquee } from '@/components/ui/Marquee';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useSetLocale, useTranslation, useLocale } from '@/i18n';
import { cn } from '@/lib/cn';

export function Header() {
  const t = useTranslation();
  const locale = useLocale();
  const setLocale = useSetLocale();

  const totalItems = useCartStore((s) => s.data?.totalItems ?? 0);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { to: '/shop', label: t('nav.shop') },
      { to: '/shop/tees', label: t('nav.tees') },
      { to: '/about', label: t('nav.about') },
    ],
    [t],
  );

  const marqueeItems = useMemo(
    () => [
      t('marquee.0'),
      t('marquee.1'),
      t('marquee.2'),
      t('marquee.3'),
      t('marquee.4'),
    ],
    [t],
  );

  // При скролле header слегка сжимается: фон становится плотнее
  const { scrollY } = useScroll();
  const headerBlur = useTransform(scrollY, [0, 80], ['blur(6px)', 'blur(14px)']);
  const headerBg = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.92)']);

  useEffect(() => {
    const onResize = () => window.innerWidth >= 768 && setMobileOpen(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleLocale = () => setLocale(locale === 'ru' ? 'en' : 'ru');

  return (
    <div className="sticky top-0 z-40">
      <Marquee items={marqueeItems} />
      <motion.header
        style={{ backdropFilter: headerBlur, WebkitBackdropFilter: headerBlur, backgroundColor: headerBg }}
        className="border-b border-ink-200"
      >
        <Container className="flex h-16 items-center justify-between gap-4">
          <button
            type="button"
            className="md:hidden p-1 -ml-1 text-ink"
            aria-label={t('nav.openMenu')}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>

          <Link to="/" className="flex items-center" aria-label="SAMI — home">
            <img
              src="/logo.png"
              alt="SAMI"
              draggable={false}
              className="block h-7 w-auto select-none md:h-8"
            />
          </Link>

          <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/shop'}
                className={({ isActive }) =>
                  cn(
                    'relative text-xs uppercase tracking-[0.18em] transition-colors duration-200',
                    isActive ? 'text-ink' : 'text-ink-500 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      className={cn(
                        'absolute -bottom-1 left-0 h-px w-full origin-left bg-ink transition-transform duration-500 ease-out-expo',
                        isActive ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLocale}
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500 hover:text-ink transition-colors"
              aria-label="Switch language"
              title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              {locale === 'ru' ? 'EN' : 'RU'}
            </button>
            <Link
              to={user ? '/account' : '/login'}
              className="text-ink hover:text-ink-600 transition-colors"
              aria-label={t('nav.account')}
            >
              <User size={18} strokeWidth={1.5} />
            </Link>
            <Link
              to="/cart"
              className="relative text-ink hover:text-ink-600 transition-colors"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-medium text-paper"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>
          </div>
        </Container>

        {/* Мобильное меню */}
        <motion.nav
          initial={false}
          animate={{ height: mobileOpen ? 'auto' : 0, opacity: mobileOpen ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="md:hidden overflow-hidden border-t border-ink-200 bg-paper"
        >
          <Container className="flex flex-col gap-4 py-6">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="text-sm uppercase tracking-[0.18em] text-ink-700 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </motion.nav>
      </motion.header>
    </div>
  );
}

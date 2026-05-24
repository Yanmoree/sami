import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { Marquee } from '@/components/ui/Marquee';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop/tees', label: 'Tees' },
  { to: '/shop/hoodies', label: 'Hoodies' },
  { to: '/shop/outerwear', label: 'Outerwear' },
  { to: '/about', label: 'About' },
];

const marqueeItems = [
  'FREE SHIPPING OVER 10 000 ₽',
  'SS·01 IS LIVE',
  'MADE WITH CARE',
  'NEW DROP EVERY THURSDAY',
  'SAMI · СВОЁ',
];

export function Header() {
  const totalItems = useCartStore((s) => s.data?.totalItems ?? 0);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  // При скролле header слегка сжимается: высота и фон становятся плотнее
  const { scrollY } = useScroll();
  const headerBlur = useTransform(scrollY, [0, 80], ['blur(6px)', 'blur(14px)']);
  const headerBg = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.92)']);

  useEffect(() => {
    // Закрывать мобильное меню при ресайзе на десктоп
    const onResize = () => window.innerWidth >= 768 && setMobileOpen(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="sticky top-0 z-40">
      <Marquee items={marqueeItems} />
      <motion.header
        style={{ backdropFilter: headerBlur, WebkitBackdropFilter: headerBlur, backgroundColor: headerBg }}
        className="border-b border-ink-200"
      >
        <Container className="flex h-16 items-center justify-between">
          <button
            type="button"
            className="md:hidden p-1 -ml-1 text-ink"
            aria-label="Открыть меню"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>

          <Link to="/" className="flex items-center gap-2" aria-label="SAMI — на главную">
            <Logo variant="wordmark" size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
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

          <div className="flex items-center gap-5">
            <Link
              to={user ? '/account' : '/login'}
              className="text-ink hover:text-ink-600 transition-colors"
              aria-label="Account"
            >
              <User size={18} strokeWidth={1.5} />
            </Link>
            <Link to="/cart" className="relative text-ink hover:text-ink-600 transition-colors" aria-label="Cart">
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

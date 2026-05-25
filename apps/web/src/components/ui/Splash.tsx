import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';

const EASE = [0.85, 0, 0.15, 1] as const;
const KEY = 'sami_splash_shown';

/**
 * Открывающий splash. Показывается один раз за сессию.
 * Чёрный экран с бренд-марком, который затем «расходится» вверх и вниз шторками,
 * открывая сайт. После анимации компонент демонтируется.
 */
export function Splash() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(KEY);
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(KEY, '1');
      setShow(false);
    }, 1800);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          {/* Верхняя шторка */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-ink"
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          />
          {/* Нижняя шторка */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          />
          {/* Центральный знак */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-paper"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Logo
              variant="mark"
              invert
              className="w-[82vw] max-w-[860px] h-auto"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

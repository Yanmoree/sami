import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  /** Сработать один раз при появлении (по умолчанию true) */
  once?: boolean;
  /** Триггерный отступ — насколько элемент должен попасть во вьюпорт */
  amount?: number;
  as?: 'div' | 'section' | 'span' | 'li';
}

/**
 * Появляющийся при скролле блок. Использует whileInView из framer-motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
  amount = 0.2,
  as = 'div',
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Группа со staggered появлением дочерних элементов.
 */
export function RevealGroup({
  children,
  delay = 0,
  stagger = 0.08,
  className,
}: {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const revealItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

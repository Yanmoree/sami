import { cn } from '@/lib/cn';

interface MarqueeProps {
  items: string[];
  className?: string;
  /** Скорость: чем больше — тем медленнее */
  speed?: 'normal' | 'slow';
  invert?: boolean;
}

/**
 * Бесконечная бегущая строка. Дублируем список дважды и анимируем translateX(-50%),
 * чтобы при возврате в 0 склейка была бесшовной.
 */
export function Marquee({ items, className, speed = 'normal', invert = true }: MarqueeProps) {
  const sequence = [...items, ...items];
  return (
    <div
      className={cn(
        'group/marquee relative overflow-hidden border-y',
        invert ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink border-ink-200',
        className,
      )}
    >
      <div
        className={cn(
          'flex w-max whitespace-nowrap will-change-transform',
          speed === 'slow' ? 'animate-marquee-slow' : 'animate-marquee',
          'group-hover/marquee:[animation-play-state:paused]',
        )}
      >
        {sequence.map((text, i) => (
          <span
            key={i}
            className="flex items-center gap-8 px-6 py-3 text-xs font-medium uppercase tracking-[0.22em]"
          >
            {text}
            <span aria-hidden className="text-current/40">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

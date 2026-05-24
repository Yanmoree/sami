import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  /** mark / full — реальный PNG-знак из public/logo.png; wordmark — текстовая «SAMI» */
  variant?: 'wordmark' | 'mark' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** инвертирует яркость для использования на тёмном фоне (черное → белое) */
  invert?: boolean;
}

/**
 * Размеры по ШИРИНЕ — потому что PNG-канва 1254×1254 квадратная, но артворк
 * вписан примерно в 70% по горизонтали и 50% по вертикали, и height-сайзинг
 * визуально занижает логотип.
 */
const markSize: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'w-16',
  md: 'w-24',
  lg: 'w-40',
  xl: 'w-64',
  '2xl': 'w-96',
  '3xl': 'w-[36rem]',
};

const wordSize: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
  '2xl': 'text-7xl',
  '3xl': 'text-8xl',
};

function Mark({
  size,
  invert,
  className,
}: {
  size: NonNullable<LogoProps['size']>;
  invert?: boolean;
  className?: string;
}) {
  return (
    <img
      src="/logo.png"
      alt="SAMI"
      draggable={false}
      className={cn(
        markSize[size],
        'h-auto select-none object-contain',
        invert && 'invert',
        className,
      )}
    />
  );
}

function Wordmark({
  size,
  invert,
  className,
}: {
  size: NonNullable<LogoProps['size']>;
  invert?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-display font-semibold tracking-tightest leading-none select-none',
        wordSize[size],
        invert ? 'text-paper' : 'text-ink',
        className,
      )}
      aria-label="SAMI"
    >
      SAMI
    </span>
  );
}

export function Logo({ className, variant = 'wordmark', size = 'md', invert }: LogoProps) {
  if (variant === 'mark' || variant === 'full') {
    return <Mark size={size} invert={invert} className={className} />;
  }
  return <Wordmark size={size} invert={invert} className={className} />;
}

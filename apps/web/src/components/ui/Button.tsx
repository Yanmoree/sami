import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const base =
  'inline-flex items-center justify-center font-medium tracking-tight transition-all duration-300 ease-out-expo disabled:cursor-not-allowed disabled:opacity-40 select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-ink-800 active:bg-ink-900',
  secondary:
    'bg-ink-100 text-ink hover:bg-ink-200 active:bg-ink-300',
  ghost: 'text-ink hover:bg-ink-100',
  outline:
    'border border-ink text-ink hover:bg-ink hover:text-paper',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs uppercase tracking-[0.15em]',
  md: 'h-11 px-6 text-sm uppercase tracking-[0.15em]',
  lg: 'h-14 px-8 text-sm uppercase tracking-[0.18em]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, isLoading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? '...' : children}
    </button>
  ),
);
Button.displayName = 'Button';

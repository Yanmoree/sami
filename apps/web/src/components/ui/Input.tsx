import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full border-b border-ink-300 bg-transparent px-0 py-2 text-base text-ink placeholder:text-ink-400',
            'focus:outline-none focus:border-ink focus:ring-0',
            'transition-colors duration-200',
            error && 'border-red-500 focus:border-red-500',
            className,
          )}
          {...rest}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

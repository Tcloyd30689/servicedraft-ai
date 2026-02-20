'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="mb-5">
        {label && (
          <label
            htmlFor={id}
            className="block text-[var(--text-secondary)] text-sm font-medium mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full p-3',
            'bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg',
            'text-[var(--text-primary)] placeholder-[var(--text-muted)]',
            'focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)]',
            'hover:border-[var(--accent-primary)]',
            'transition-all duration-200',
            error && 'border-red-500 focus:border-red-500',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

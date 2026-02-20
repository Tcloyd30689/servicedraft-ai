'use client';

import { type TextareaHTMLAttributes, forwardRef, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AutoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const AutoTextarea = forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  ({ label, error, className, id, onChange, value, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const resize = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    // Resize when value changes (including programmatic changes)
    useEffect(() => {
      resize();
    }, [value, resize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      resize();
      onChange?.(e);
    };

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
        <textarea
          ref={(node) => {
            internalRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          rows={2}
          value={value}
          onChange={handleChange}
          className={cn(
            'w-full p-3 leading-relaxed resize-none overflow-hidden',
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

AutoTextarea.displayName = 'AutoTextarea';

export default AutoTextarea;

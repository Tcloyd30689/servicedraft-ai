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
            className="block text-[#c4b5fd] text-sm font-medium mb-2"
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
            'bg-[#0f0520] border border-[#6b21a8] rounded-lg',
            'text-white placeholder-[#9ca3af]',
            'focus:outline-none focus:border-[#a855f7] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]',
            'hover:border-[#7c3aed]',
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

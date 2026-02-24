'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large' | 'fullWidth';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--accent-hover)] text-[var(--btn-text-on-accent)]',
    'hover:bg-[var(--accent-primary)]',
    'active:bg-[var(--accent-border)]',
    'disabled:bg-[#4b5563] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none',
  ].join(' '),
  secondary: [
    'bg-transparent text-[var(--accent-vivid)] border border-[var(--accent-vivid)]',
    'hover:bg-[var(--accent-10)]',
    'active:bg-[var(--accent-20)]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--accent-vivid)]',
    'hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]',
    'active:bg-[var(--accent-15)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  small: 'py-2 px-4 text-sm',
  medium: 'py-3 px-5 text-[15px]',
  large: 'py-3.5 px-6 text-base',
  fullWidth: 'py-3.5 px-6 text-base w-full',
};

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };

export default function Button({
  variant = 'primary',
  size = 'large',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      className={cn(
        'font-semibold rounded-lg cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      whileHover={disabled ? undefined : { scale: 1.05, boxShadow: 'var(--shadow-glow-sm)' }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={springTransition}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}

'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large' | 'fullWidth';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#a855f7] text-white',
    'hover:bg-[#9333ea] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    'active:bg-[#7c3aed] active:scale-[0.98]',
    'disabled:bg-[#4b5563] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100',
  ].join(' '),
  secondary: [
    'bg-transparent text-[#a855f7] border border-[#a855f7]',
    'hover:bg-[rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    'active:bg-[rgba(168,85,247,0.2)]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
  ].join(' '),
  ghost: [
    'bg-transparent text-[#c4b5fd]',
    'hover:text-white hover:bg-[rgba(168,85,247,0.1)]',
    'active:bg-[rgba(168,85,247,0.15)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  small: 'py-2 px-4 text-sm',
  medium: 'py-3 px-5 text-[15px]',
  large: 'py-3.5 px-6 text-base',
  fullWidth: 'py-3.5 px-6 text-base w-full',
};

export default function Button({
  variant = 'primary',
  size = 'large',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold rounded-lg cursor-pointer',
        'transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

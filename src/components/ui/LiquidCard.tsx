'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardSize = 'compact' | 'standard' | 'spacious';

interface LiquidCardProps {
  children: ReactNode;
  size?: CardSize;
  className?: string;
  hover?: boolean;
}

const sizeClasses: Record<CardSize, string> = {
  compact: 'p-4',
  standard: 'p-6',
  spacious: 'p-8 md:p-10',
};

export default function LiquidCard({
  children,
  size = 'standard',
  className,
  hover = true,
}: LiquidCardProps) {
  return (
    <div
      className={cn(
        'relative bg-[rgba(197,173,229,0.05)]',
        'border-2 border-black rounded-[23px]',
        'backdrop-blur-sm',
        'shadow-[0_0_40px_rgba(73,18,155,0.4)]',
        'transition-all duration-300',
        hover && 'hover:shadow-[0_0_60px_rgba(73,18,155,0.5)]',
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}

'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import CursorGlow from '@/components/ui/CursorGlow';

type CardSize = 'compact' | 'standard' | 'spacious';

interface LiquidCardProps {
  children: ReactNode;
  size?: CardSize;
  className?: string;
  /** Enable cursor underglow effect on hover (default true) */
  glow?: boolean;
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
  glow = true,
}: LiquidCardProps) {
  return (
    <CursorGlow enabled={glow} className={cn(
      'relative bg-[var(--bg-card)]',
      'border-2 border-[var(--card-border)] rounded-[23px]',
      'backdrop-blur-sm',
      'shadow-[var(--shadow-glow-md)]',
      'transition-shadow duration-300',
      'hover:shadow-[var(--shadow-glow-accent)]',
      className,
    )}>
      <div className={sizeClasses[size]}>
        {children}
      </div>
    </CursorGlow>
  );
}

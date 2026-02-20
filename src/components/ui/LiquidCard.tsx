'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
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

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };

export default function LiquidCard({
  children,
  size = 'standard',
  className,
  hover = true,
}: LiquidCardProps) {
  return (
    <motion.div
      className={cn(
        'relative bg-[var(--bg-card)]',
        'border-2 border-[var(--card-border)] rounded-[23px]',
        'backdrop-blur-sm',
        'shadow-[var(--shadow-glow-md)]',
        sizeClasses[size],
        className,
      )}
      whileHover={hover ? { scale: 1.02, boxShadow: 'var(--shadow-glow-accent)' } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      transition={springTransition}
    >
      {children}
    </motion.div>
  );
}

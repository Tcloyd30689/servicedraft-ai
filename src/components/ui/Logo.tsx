'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoSize = 'small' | 'medium' | 'large';

interface LogoProps {
  size?: LogoSize;
  glow?: boolean;
  className?: string;
}

const sizeConfig: Record<LogoSize, { width: number; height: number }> = {
  small: { width: 240, height: 60 },
  medium: { width: 400, height: 100 },
  large: { width: 800, height: 200 },
};

export default function Logo({ size = 'medium', glow = false, className }: LogoProps) {
  const { width, height } = sizeConfig[size];

  return (
    <div
      className={cn(
        'relative inline-block',
        glow && 'hover:drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]',
        'transition-all duration-300',
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="ServiceDraft.AI"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );
}

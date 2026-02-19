'use client';

import { Wrench, Hammer, ScanLine, PenLine, ClipboardList, BookOpen, User } from 'lucide-react';

const iconMap: Record<string, typeof Wrench> = {
  Technician: Wrench,
  Foreman: Hammer,
  Diagnostician: ScanLine,
  Advisor: PenLine,
  Manager: ClipboardList,
  'Warranty Clerk': BookOpen,
};

interface PositionIconProps {
  position: string | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeConfig = {
  small: { container: 'w-9 h-9', icon: 18, border: 'border-2' },
  medium: { container: 'w-12 h-12', icon: 22, border: 'border-2' },
  large: { container: 'w-20 h-20', icon: 36, border: 'border-2' },
};

export default function PositionIcon({ position, size = 'medium', className = '' }: PositionIconProps) {
  const Icon = (position && iconMap[position]) || User;
  const config = sizeConfig[size];

  return (
    <div
      className={`${config.container} rounded-full bg-[#0f0520] ${config.border} border-[#6b21a8] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.25)] ${className}`}
    >
      <Icon size={config.icon} className="text-[#a855f7]" />
    </div>
  );
}

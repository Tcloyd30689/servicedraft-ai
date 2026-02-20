'use client';

import { motion } from 'framer-motion';
import { FileText, Wrench } from 'lucide-react';
import type { StoryType } from '@/constants/fieldConfig';
import { cn } from '@/lib/utils';

interface StoryTypeSelectorProps {
  selected: StoryType | null;
  onSelect: (type: StoryType) => void;
}

const options: { type: StoryType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'diagnostic_only',
    label: 'DIAGNOSTIC ONLY',
    description: 'Diagnosis performed, repair not yet completed',
    icon: <FileText size={24} />,
  },
  {
    type: 'repair_complete',
    label: 'REPAIR COMPLETE',
    description: 'Repair has been fully completed and verified',
    icon: <Wrench size={24} />,
  },
];

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };

export default function StoryTypeSelector({ selected, onSelect }: StoryTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((option) => (
        <motion.button
          key={option.type}
          onClick={() => onSelect(option.type)}
          className={cn(
            'flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer',
            selected === option.type
              ? 'border-[var(--accent-hover)] bg-[var(--accent-10)] shadow-[var(--shadow-glow-sm)]'
              : 'border-[var(--accent-border)] bg-[var(--accent-3)]',
          )}
          whileHover={{ scale: 1.03, boxShadow: 'var(--shadow-glow-sm)' }}
          whileTap={{ scale: 0.97 }}
          transition={springTransition}
        >
          <div className={cn(
            selected === option.type ? 'text-[var(--accent-hover)]' : 'text-[var(--text-muted)]',
          )}>
            {option.icon}
          </div>
          <span className={cn(
            'font-semibold text-sm',
            selected === option.type ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
          )}>
            {option.label}
          </span>
          <span className="text-xs text-[var(--text-muted)] text-center">
            {option.description}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

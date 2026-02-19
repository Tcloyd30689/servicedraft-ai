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
              ? 'border-[#a855f7] bg-[rgba(168,85,247,0.1)] shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : 'border-[#6b21a8] bg-[rgba(197,173,229,0.03)]',
          )}
          whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}
          whileTap={{ scale: 0.97 }}
          transition={springTransition}
        >
          <div className={cn(
            selected === option.type ? 'text-[#a855f7]' : 'text-[#9ca3af]',
          )}>
            {option.icon}
          </div>
          <span className={cn(
            'font-semibold text-sm',
            selected === option.type ? 'text-white' : 'text-[#c4b5fd]',
          )}>
            {option.label}
          </span>
          <span className="text-xs text-[#9ca3af] text-center">
            {option.description}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

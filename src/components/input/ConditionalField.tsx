'use client';

import { Sparkles } from 'lucide-react';
import type { FieldConfig, DropdownOption } from '@/constants/fieldConfig';
import { dropdownOptions } from '@/constants/fieldConfig';
import { cn } from '@/lib/utils';

interface ConditionalFieldProps {
  field: FieldConfig;
  value: string;
  dropdownSelection: DropdownOption;
  onValueChange: (value: string) => void;
  onDropdownChange: (option: DropdownOption) => void;
}

export default function ConditionalField({
  field,
  value,
  dropdownSelection,
  onValueChange,
  onDropdownChange,
}: ConditionalFieldProps) {
  const isInclude = dropdownSelection === 'include';
  const isGenerate = dropdownSelection === 'generate';
  const isDontInclude = dropdownSelection === 'dont_include';

  return (
    <div className={cn(
      'mb-5 transition-opacity duration-300',
      isDontInclude && 'opacity-50',
    )}>
      {/* Label row with dropdown */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="text-[#c4b5fd] text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isGenerate && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-[rgba(168,85,247,0.2)] text-[#c084fc] px-1.5 py-0.5 rounded">
              <Sparkles size={10} />
              AI
            </span>
          )}
        </label>

        <select
          value={dropdownSelection}
          onChange={(e) => onDropdownChange(e.target.value as DropdownOption)}
          className="text-xs bg-[#0f0520] border border-[#6b21a8] rounded-md px-2 py-1.5 text-[#c4b5fd] cursor-pointer focus:outline-none focus:border-[#a855f7] appearance-none"
        >
          {dropdownOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Input field — only shown for "Include Information" */}
      {isInclude && (
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full p-3 bg-[#0f0520] border border-[#6b21a8] rounded-lg text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#a855f7] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)] hover:border-[#7c3aed] transition-all duration-200"
        />
      )}

      {/* AI generate indicator */}
      {isGenerate && (
        <div className="p-3 bg-[rgba(168,85,247,0.05)] border border-dashed border-[#6b21a8] rounded-lg">
          <p className="text-xs text-[#9ca3af] italic">
            AI will generate the most probable {field.label.toLowerCase()} based on your other inputs.
          </p>
        </div>
      )}
    </div>
  );
}

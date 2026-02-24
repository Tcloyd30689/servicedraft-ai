'use client';

import { useRef, useCallback, useEffect } from 'react';
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (isInclude) resize();
  }, [value, isInclude, resize]);

  return (
    <div className={cn(
      'mb-5 transition-opacity duration-300',
      isDontInclude && 'opacity-50',
    )}>
      {/* Label row with dropdown */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="text-[var(--text-secondary)] text-sm font-medium flex items-center gap-1.5">
          {field.label}
          {isGenerate && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--accent-20)] text-[var(--accent-text-emphasis)] px-1.5 py-0.5 rounded">
              <Sparkles size={10} />
              AI
            </span>
          )}
        </label>

        <select
          value={dropdownSelection}
          onChange={(e) => onDropdownChange(e.target.value as DropdownOption)}
          className="text-xs bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-md px-2 py-1.5 text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] appearance-none"
        >
          {dropdownOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Text field — only shown for "Include Information" */}
      {isInclude && (
        <textarea
          ref={textareaRef}
          rows={2}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            resize();
          }}
          placeholder={field.placeholder}
          className="w-full p-3 leading-relaxed resize-none overflow-hidden bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)] hover:border-[var(--accent-primary)] transition-all duration-200"
        />
      )}

      {/* AI generate indicator */}
      {isGenerate && (
        <div className="p-3 bg-[var(--accent-5)] border border-dashed border-[var(--accent-border)] rounded-lg">
          <p className="text-xs text-[var(--text-muted)] italic">
            AI will generate the most probable {field.label.toLowerCase()} based on your other inputs.
          </p>
        </div>
      )}
    </div>
  );
}

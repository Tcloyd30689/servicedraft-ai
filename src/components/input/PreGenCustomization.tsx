'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useNarrativeStore, type NarrativeState } from '@/stores/narrativeStore';

const STORAGE_KEY = 'sd-pregen-customization';

interface SliderOption<T extends string> {
  value: T;
  label: string;
}

const lengthOptions: SliderOption<NarrativeState['lengthSlider']>[] = [
  { value: 'short', label: 'Short' },
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed' },
];

const toneOptions: SliderOption<NarrativeState['toneSlider']>[] = [
  { value: 'warranty', label: 'Warranty' },
  { value: 'standard', label: 'Standard' },
  { value: 'customer_friendly', label: 'Customer Friendly' },
];

const detailOptions: SliderOption<NarrativeState['detailSlider']>[] = [
  { value: 'concise', label: 'Concise' },
  { value: 'standard', label: 'Standard' },
  { value: 'additional', label: 'Additional Steps' },
];

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SliderOption<T>[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
        {label}
      </label>
      <div className="flex bg-[var(--bg-input)] rounded-lg border border-[var(--accent-border)] overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 px-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
              value === opt.value
                ? 'bg-[var(--accent-hover)] text-white shadow-[0_0_10px_var(--accent-30)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PreGenCustomization() {
  const [isOpen, setIsOpen] = useState(false);
  const { state, setLengthSlider, setToneSlider, setDetailSlider } = useNarrativeStore();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<{ length: string; tone: string; detail: string }>;
        if (parsed.length && parsed.length !== 'standard') {
          setLengthSlider(parsed.length as NarrativeState['lengthSlider']);
        }
        if (parsed.tone && parsed.tone !== 'standard') {
          setToneSlider(parsed.tone as NarrativeState['toneSlider']);
        }
        if (parsed.detail && parsed.detail !== 'standard') {
          setDetailSlider(parsed.detail as NarrativeState['detailSlider']);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [setLengthSlider, setToneSlider, setDetailSlider]);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        length: state.lengthSlider,
        tone: state.toneSlider,
        detail: state.detailSlider,
      }));
    } catch {
      // Ignore storage errors
    }
  }, [state.lengthSlider, state.toneSlider, state.detailSlider]);

  const hasCustomization =
    state.lengthSlider !== 'standard' ||
    state.toneSlider !== 'standard' ||
    state.detailSlider !== 'standard';

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full py-3 px-4 rounded-lg border border-[var(--accent-border)] bg-[var(--bg-input)] hover:bg-[var(--accent-10)] transition-all duration-200 cursor-pointer group"
      >
        <SlidersHorizontal className="w-4 h-4 text-[var(--accent-hover)]" />
        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          Customize Output Style
        </span>
        {hasCustomization && (
          <span className="ml-1 w-2 h-2 rounded-full bg-[var(--accent-hover)]" />
        )}
        <ChevronDown
          className={`w-4 h-4 ml-auto text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-1">
              <SegmentedControl
                label="Length"
                options={lengthOptions}
                value={state.lengthSlider}
                onChange={(val) => setLengthSlider(val)}
              />

              <SegmentedControl
                label="Tone"
                options={toneOptions}
                value={state.toneSlider}
                onChange={(val) => setToneSlider(val)}
              />

              <SegmentedControl
                label="Detail Level"
                options={detailOptions}
                value={state.detailSlider}
                onChange={(val) => setDetailSlider(val)}
              />

              <p className="text-xs text-[var(--text-muted)] pt-1">
                Customization will be applied to the initial generation. You can further adjust after generating.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

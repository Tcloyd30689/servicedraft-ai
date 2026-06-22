'use client';

import { useEffect } from 'react';
import { useNarrativeStore, type NarrativeState } from '@/stores/narrativeStore';

const STORAGE_KEY = 'sd-pregen-customization';

interface StyleOption {
  value: NarrativeState['narrativeStyle'];
  label: string;
}

const narrativeStyleOptions: StyleOption[] = [
  { value: 'customer_pay', label: 'Customer Pay' },
  { value: 'extended_warranty', label: 'Extended Warranty' },
  { value: 'manufacturer_warranty', label: 'Manufacturer Warranty' },
];

const VALID_STYLES = narrativeStyleOptions.map((o) => o.value);

export default function PreGenCustomization() {
  const { state, setNarrativeStyle } = useNarrativeStore();

  // Rehydrate the saved narrative style from localStorage on mount.
  // Defaults to manufacturer_warranty (the store's initial value) if nothing valid is stored.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<{ narrativeStyle: string }>;
        if (parsed.narrativeStyle && VALID_STYLES.includes(parsed.narrativeStyle as NarrativeState['narrativeStyle'])) {
          setNarrativeStyle(parsed.narrativeStyle as NarrativeState['narrativeStyle']);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [setNarrativeStyle]);

  // Persist the chosen narrative style to localStorage on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ narrativeStyle: state.narrativeStyle }));
    } catch {
      // Ignore storage errors
    }
  }, [state.narrativeStyle]);

  return (
    <div className="mb-6">
      <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
        Narrative Style
      </label>
      <div className="flex bg-[var(--bg-input)] rounded-lg border border-[var(--accent-border)] overflow-hidden">
        {narrativeStyleOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setNarrativeStyle(opt.value)}
            className={`flex-1 py-2 px-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
              state.narrativeStyle === opt.value
                ? 'bg-[var(--accent-hover)] text-white shadow-[0_0_10px_var(--accent-30)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)] pt-2">
        Customer Pay: clear and concise. Extended Warranty: evidence-focused. Manufacturer Warranty: strict OEM audit style.
      </p>
    </div>
  );
}

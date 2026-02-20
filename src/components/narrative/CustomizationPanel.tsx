'use client';

import { useNarrativeStore, type NarrativeState } from '@/stores/narrativeStore';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

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

interface CustomizationPanelProps {
  onApply: () => void;
  isLoading: boolean;
}

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

export default function CustomizationPanel({
  onApply,
  isLoading,
}: CustomizationPanelProps) {
  const {
    state,
    setLengthSlider,
    setToneSlider,
    setDetailSlider,
    setCustomInstructions,
  } = useNarrativeStore();

  return (
    <div className="space-y-2">
      <SegmentedControl
        label="Length"
        options={lengthOptions}
        value={state.lengthSlider}
        onChange={setLengthSlider}
      />

      <SegmentedControl
        label="Tone"
        options={toneOptions}
        value={state.toneSlider}
        onChange={setToneSlider}
      />

      <SegmentedControl
        label="Detail Level"
        options={detailOptions}
        value={state.detailSlider}
        onChange={setDetailSlider}
      />

      <Textarea
        label="Custom Instructions"
        placeholder="Add any specific instructions for rewriting the narrative..."
        value={state.customInstructions}
        onChange={(e) => setCustomInstructions(e.target.value)}
        className="min-h-[80px]"
      />

      <Button
        size="fullWidth"
        onClick={onApply}
        disabled={isLoading}
      >
        {isLoading ? 'APPLYING...' : 'APPLY CUSTOMIZATION TO STORY'}
      </Button>
    </div>
  );
}

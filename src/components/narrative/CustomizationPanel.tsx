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
      <label className="block text-[#c4b5fd] text-sm font-medium mb-2">
        {label}
      </label>
      <div className="flex bg-[#0f0520] rounded-lg border border-[#6b21a8] overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 px-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
              value === opt.value
                ? 'bg-[#a855f7] text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'text-[#9ca3af] hover:text-white hover:bg-[rgba(168,85,247,0.1)]'
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

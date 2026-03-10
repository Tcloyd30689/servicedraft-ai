'use client';

import { useState, useMemo } from 'react';
import { Calculator, ChevronDown, Info, Zap, Calendar, DollarSign } from 'lucide-react';
import LiquidCard from '@/components/ui/LiquidCard';

// ─── Gemini Model Pricing (per 1M tokens, as of March 2026) ──
const MODELS = [
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash Preview',
    inputPer1M: 0.50,
    outputPer1M: 3.00,
  },
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    inputPer1M: 0.075,
    outputPer1M: 0.30,
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    inputPer1M: 1.25,
    outputPer1M: 5.00,
  },
] as const;

type ModelId = (typeof MODELS)[number]['id'];

export default function TokenCalculator() {
  const [modelId, setModelId] = useState<ModelId>('gemini-3-flash-preview');
  const [inputTokens, setInputTokens] = useState(1500);
  const [outputTokens, setOutputTokens] = useState(800);
  const [narrativesPerMonth, setNarrativesPerMonth] = useState(100);
  const [includeProofread, setIncludeProofread] = useState(false);
  const [includeCustomization, setIncludeCustomization] = useState(false);

  const model = MODELS.find((m) => m.id === modelId)!;

  const costs = useMemo(() => {
    // Base API calls = narratives per month
    let totalCalls = narrativesPerMonth;
    if (includeProofread) totalCalls += narrativesPerMonth * 0.5;
    if (includeCustomization) totalCalls += narrativesPerMonth * 0.3;

    const inputCost = (inputTokens / 1_000_000) * model.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * model.outputPer1M;
    const costPerNarrative = inputCost + outputCost;

    const monthlyCost = costPerNarrative * totalCalls;
    const annualCost = monthlyCost * 12;

    return { costPerNarrative, monthlyCost, annualCost, totalCalls };
  }, [modelId, inputTokens, outputTokens, narrativesPerMonth, includeProofread, includeCustomization, model]);

  const formatCurrency = (value: number) => {
    if (value < 0.01 && value > 0) return `$${value.toFixed(4)}`;
    if (value < 1) return `$${value.toFixed(3)}`;
    return `$${value.toFixed(2)}`;
  };

  // ─── Shared input styles ──────────────────────────────────
  const inputClass =
    'w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:border-[var(--accent-hover)] focus:outline-none transition-all';

  const labelClass = 'block text-sm font-medium text-[var(--text-secondary)] mb-1.5';

  return (
    <div className="space-y-6">
      {/* Calculator Header */}
      <LiquidCard size="standard" className="!rounded-[16px]">
        <div className="flex items-center gap-3 mb-1">
          <Calculator size={22} style={{ color: 'var(--accent-bright)' }} />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            AI Token Usage &amp; Pricing Calculator
          </h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] ml-[34px]">
          Estimate your Google Gemini API costs based on usage patterns.
        </p>
      </LiquidCard>

      {/* Input Configuration */}
      <LiquidCard size="standard" className="!rounded-[16px]">
        <h4 className="text-base font-semibold text-[var(--text-primary)] mb-5">Configuration</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Model Selector */}
          <div>
            <label className={labelClass}>AI Model</label>
            <div className="relative">
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value as ModelId)}
                className={`${inputClass} appearance-none pr-9 cursor-pointer`}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]"
              />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Input: ${model.inputPer1M}/1M &middot; Output: ${model.outputPer1M}/1M
            </p>
          </div>

          {/* Average Input Tokens */}
          <div>
            <label className={labelClass}>Avg Input Tokens / Narrative</label>
            <input
              type="number"
              min={0}
              value={inputTokens}
              onChange={(e) => setInputTokens(Math.max(0, Number(e.target.value)))}
              className={inputClass}
            />
          </div>

          {/* Average Output Tokens */}
          <div>
            <label className={labelClass}>Avg Output Tokens / Narrative</label>
            <input
              type="number"
              min={0}
              value={outputTokens}
              onChange={(e) => setOutputTokens(Math.max(0, Number(e.target.value)))}
              className={inputClass}
            />
          </div>

          {/* Narratives Per Month */}
          <div>
            <label className={labelClass}>Estimated Narratives / Month</label>
            <input
              type="number"
              min={0}
              value={narrativesPerMonth}
              onChange={(e) => setNarrativesPerMonth(Math.max(0, Number(e.target.value)))}
              className={inputClass}
            />
          </div>

          {/* Toggles */}
          <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-3 justify-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeProofread}
                onChange={(e) => setIncludeProofread(e.target.checked)}
                className="sr-only peer"
              />
              <span className="relative w-10 h-5 rounded-full bg-[var(--accent-15)] border border-[var(--accent-border)] transition-colors peer-checked:bg-[var(--accent-primary)] peer-checked:border-[var(--accent-primary)] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                Include proofread calls
                <span className="text-xs text-[var(--text-muted)] ml-1.5">(+50% API calls)</span>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeCustomization}
                onChange={(e) => setIncludeCustomization(e.target.checked)}
                className="sr-only peer"
              />
              <span className="relative w-10 h-5 rounded-full bg-[var(--accent-15)] border border-[var(--accent-border)] transition-colors peer-checked:bg-[var(--accent-primary)] peer-checked:border-[var(--accent-primary)] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                Include customization calls
                <span className="text-xs text-[var(--text-muted)] ml-1.5">(+30% API calls)</span>
              </span>
            </label>
          </div>
        </div>
      </LiquidCard>

      {/* Cost Output */}
      <LiquidCard size="standard" className="!rounded-[16px]">
        <h4 className="text-base font-semibold text-[var(--text-primary)] mb-5">Estimated Costs</h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Cost Per Narrative */}
          <div className="p-4 rounded-xl bg-[var(--accent-5)] border border-[var(--accent-15)]">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} style={{ color: 'var(--accent-bright)' }} />
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                Cost / Narrative
              </p>
            </div>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent-bright)' }}>
              {formatCurrency(costs.costPerNarrative)}
            </p>
          </div>

          {/* Monthly Cost */}
          <div className="p-4 rounded-xl bg-[var(--accent-5)] border border-[var(--accent-15)]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} style={{ color: 'var(--accent-bright)' }} />
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                Monthly Estimate
              </p>
            </div>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent-bright)' }}>
              {formatCurrency(costs.monthlyCost)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {costs.totalCalls.toLocaleString()} API calls/mo
            </p>
          </div>

          {/* Annual Cost */}
          <div className="p-4 rounded-xl bg-[var(--accent-5)] border border-[var(--accent-15)]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} style={{ color: 'var(--accent-bright)' }} />
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                Annual Estimate
              </p>
            </div>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent-bright)' }}>
              {formatCurrency(costs.annualCost)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {(costs.totalCalls * 12).toLocaleString()} API calls/yr
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent-5)] border border-[var(--accent-15)]">
          <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-hover)' }} />
          <p className="text-xs text-[var(--text-muted)]">
            Estimates based on current Google Gemini API pricing as of March 2026. Actual costs may vary
            based on prompt complexity, response length, and API pricing changes.
          </p>
        </div>
      </LiquidCard>
    </div>
  );
}

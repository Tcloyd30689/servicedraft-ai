// Single source of truth for the Gemini model. No side effects, no env access:
// safe to import from client components.
// Set 2026-10-20. CONFIRMED against Google's official Gemini API pricing page (Standard tier,
// paid, per 1M tokens; output price includes thinking tokens) — Tyler supplied screenshots 2026-10-20.
// Introductory rate through 2026-12-31; rises to $1.50 input / $7.50 output per 1M from 2027-01-01.
export const GEMINI_MODEL_ID = 'gemini-3.8-flash';
export const GEMINI_MODEL_LABEL = 'Gemini 3.8 Flash';
export const GEMINI_INPUT_COST_PER_1M = 0.75;
export const GEMINI_OUTPUT_COST_PER_1M = 3.75;

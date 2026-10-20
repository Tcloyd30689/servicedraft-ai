/**
 * Fixed issue categories for the Review & Proofread tool.
 *
 * SINGLE SOURCE OF TRUTH shared by:
 *   - src/constants/prompts.ts        (the model is told to pick ONE key per flagged issue)
 *   - src/app/api/proofread/route.ts  (parses the model's answer, unknown -> 'other')
 *   - ProofreadResults.tsx            (sends the key as issue_type on thumbs up/down)
 *   - InsightsAnalytics.tsx           (shows the human label on the "By issue type" chart)
 *
 * Pure constants, no side effects, safe to import from server and client code.
 * Add a key here and every consumer picks it up; never rename an existing key
 * because public.proofread_feedback.issue_type rows already hold them.
 */

export const PROOFREAD_ISSUE_CATEGORIES = [
  'grammar_spelling',
  'tense_voice',
  'missing_verification',
  'missing_cause_link',
  'vague_or_generic',
  'unsupported_claim',
  'harmful_warranty_language',
  'tone_or_style',
  'formatting',
  'terminology',
  'other',
] as const;

export type ProofreadIssueCategory = (typeof PROOFREAD_ISSUE_CATEGORIES)[number];

/** Fallback for anything the model returns that is not on the list. */
export const PROOFREAD_ISSUE_CATEGORY_FALLBACK: ProofreadIssueCategory = 'other';

/** Human labels for charts, pills, and tooltips. */
export const PROOFREAD_ISSUE_CATEGORY_LABELS: Record<ProofreadIssueCategory, string> = {
  grammar_spelling: 'Grammar & Spelling',
  tense_voice: 'Tense & Voice',
  missing_verification: 'Missing Verification',
  missing_cause_link: 'Missing Cause Link',
  vague_or_generic: 'Vague or Generic',
  unsupported_claim: 'Unsupported Claim',
  harmful_warranty_language: 'Harmful Warranty Language',
  tone_or_style: 'Tone or Style',
  formatting: 'Formatting',
  terminology: 'Terminology',
  other: 'Other',
};

/**
 * One-line definitions the proofread prompt hands the model so it picks the
 * same bucket a warranty administrator would.
 */
export const PROOFREAD_ISSUE_CATEGORY_DESCRIPTIONS: Record<ProofreadIssueCategory, string> = {
  grammar_spelling: 'spelling, grammar, punctuation, or capitalization errors',
  tense_voice:
    'first-person pronouns, references to THE TECHNICIAN, wrong tense, or actions not written verb-first in the implied first person',
  missing_verification:
    'no verification of the repair or diagnosis (road test, re-scan, operational check) or its result is not stated',
  missing_cause_link:
    'root cause is missing or the stated cause does not connect to the correction or recommended repair',
  vague_or_generic:
    'vague, ambiguous, or generic wording; missing specific values, test results, or specification comparisons',
  unsupported_claim:
    'uncertainty language (might, could, possibly), a conclusion not backed by the documented findings, or sections that contradict each other',
  harmful_warranty_language:
    'wording that implies external damage, customer misuse, abuse, neglect, or aftermarket modification',
  tone_or_style: 'slang, informal or non-professional tone, or filler that weakens the narrative',
  formatting:
    'dashes used as punctuation, parentheses used to define abbreviations, or section structure and ordering problems',
  terminology: 'non-standard abbreviations, wrong component names, or incorrect technical terms',
  other: 'anything that does not fit the categories above',
};

const CATEGORY_SET: ReadonlySet<string> = new Set(PROOFREAD_ISSUE_CATEGORIES);

export function isProofreadIssueCategory(value: unknown): value is ProofreadIssueCategory {
  return typeof value === 'string' && CATEGORY_SET.has(value);
}

/**
 * Defensive parse of whatever the model (or an old client) hands back.
 * Accepts 'Missing Verification', 'missing-verification', ' MISSING_VERIFICATION '
 * and returns 'missing_verification'; anything unknown or missing -> 'other'.
 */
export function normalizeProofreadIssueCategory(value: unknown): ProofreadIssueCategory {
  if (typeof value !== 'string') return PROOFREAD_ISSUE_CATEGORY_FALLBACK;
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return isProofreadIssueCategory(key) ? key : PROOFREAD_ISSUE_CATEGORY_FALLBACK;
}

/** Human label for a stored issue_type; unknown keys fall through to the caller's fallback. */
export function proofreadIssueCategoryLabel(key: string): string | undefined {
  return isProofreadIssueCategory(key) ? PROOFREAD_ISSUE_CATEGORY_LABELS[key] : undefined;
}

/**
 * Sprint A-3 — shared beta-insights aggregation.
 *
 * Used by BOTH:
 *   - GET  /api/admin/insights          (owner dashboard numbers)
 *   - POST /api/admin/insights/report   (the data handed to Gemini)
 *
 * Everything here aggregates IN JAVASCRIPT. No raw SQL, no RPC, no views.
 * Callers must pass a Supabase SERVICE client (these are owner-only surfaces).
 *
 * Every query is explicitly ordered and row-capped (MAX_ROWS_SCANNED) so a
 * growing table can never turn an admin page load into an unbounded scan.
 */

import type { createClient } from '@supabase/supabase-js';

/**
 * The exact client type produced by `createClient(url, serviceKey)` inside the
 * admin routes. Written as an instantiation expression with the library's own
 * call-site defaults (`Database = any`, schema `'public'`) so it stays in step
 * with supabase-js instead of hand-writing SupabaseClient's generics.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = ReturnType<typeof createClient<any, 'public', 'public'>>;

/** Hard ceiling on rows pulled from any single source table, newest first. */
export const MAX_ROWS_SCANNED = 2000;

/** Bucket key used when narrative_style / story_type is null on a row. */
export const UNSPECIFIED_KEY = 'unspecified';

/** Recent thumbs-down comments surfaced on the dashboard. */
const MAX_RECENT_DOWN_COMMENTS = 10;
/** Recent free-text survey answers surfaced per question. */
const MAX_RECENT_TEXT_ANSWERS = 10;
/** Proofread feedback: how many issue_type buckets the dashboard charts. */
const MAX_ISSUE_TYPE_BUCKETS = 10;
/** Proofread feedback: suggestion_text context shown beside a down comment. */
const RECENT_SUGGESTION_TEXT_CHARS = 200;

/* ---------------------------------------------------------------- types -- */

export interface RatioBucket {
  key: string;
  up: number;
  down: number;
  total: number;
  /** up / total. null when total is 0 — never NaN. */
  ratio: number | null;
}

export interface FeedbackAggregate {
  up: number;
  down: number;
  total: number;
  ratio: number | null;
  byStyle: RatioBucket[];
  byStoryType: RatioBucket[];
}

/**
 * Owner-facing analytics only. Deliberately carries NO user_id and NO
 * tracker_id — this is not a per-user dump.
 */
export interface RecentDownComment {
  comment: string;
  narrative_style: string | null;
  story_type: string | null;
  created_at: string;
}

export interface SurveyAggregate {
  id: string;
  question_text: string;
  input_type: string;
  is_active: boolean;
  /** Real answers (dismissals excluded). */
  total_responses: number;
  /** Times the question was shown and dismissed without answering. */
  dismissed: number;
  /** Only populated for input_type 'choice'; null otherwise. */
  choice_counts: Record<string, number> | null;
  /** Only populated for input_type 'text'; capped at 10, newest first. */
  recent_text_answers: string[];
}

export interface CountBucket {
  key: string;
  count: number;
}

export interface RateStat {
  count: number;
  /** Percentage of totalGenerations, one decimal. 0 when total is 0. */
  pct: number;
}

export interface UsageAggregate {
  totalGenerations: number;
  byStyle: CountBucket[];
  byStoryType: CountBucket[];
  rates: {
    regenerated: RateStat;
    customized: RateStat;
    proofread: RateStat;
    saved: RateStat;
    exported: RateStat;
  };
}

/**
 * One recent thumbs-down on a proofread suggestion. Owner analytics only:
 * carries NO user_id, NO tracker_id and NO proofread_run_id.
 */
export interface ProofreadRecentDownComment {
  comment: string;
  issue_type: string | null;
  /** Truncated to RECENT_SUGGESTION_TEXT_CHARS. */
  suggestion_text: string | null;
  narrative_style: string | null;
  story_type: string | null;
  created_at: string;
}

/**
 * Thumbs up/down left on individual REVIEW & PROOFREAD suggestions
 * (public.proofread_feedback). Kept as its own top-level aggregate and NEVER
 * merged into `feedback`, which counts generated-story ratings only.
 */
export interface ProofreadFeedbackAggregate {
  up: number;
  down: number;
  total: number;
  ratio: number | null;
  byStyle: RatioBucket[];
  byStoryType: RatioBucket[];
  /** Top MAX_ISSUE_TYPE_BUCKETS issue_type values by volume; null → 'unspecified'. */
  byIssueType: RatioBucket[];
  /** Count of distinct proofread runs rated — a count only, no ids. */
  distinctRuns: number;
  /** Count of distinct raters — a count only, no ids. */
  distinctUsers: number;
  recentDownComments: ProofreadRecentDownComment[];
}

export interface InsightsAggregate {
  /** Generated-story ratings (public.narrative_feedback). */
  feedback: FeedbackAggregate;
  recentDownComments: RecentDownComment[];
  surveys: SurveyAggregate[];
  usage: UsageAggregate;
  /** Proofread-suggestion ratings (public.proofread_feedback) — isolated from `feedback`. */
  proofreadFeedback: ProofreadFeedbackAggregate;
}

/* ------------------------------------------------------- report sampling -- */

/** HARD CAPS on the raw sample sent to Gemini. A report must cost cents. */
export const SAMPLE_MAX_NARRATIVES = 12;
export const SAMPLE_NARRATIVE_FIELD_CHARS = 600;
export const SAMPLE_MAX_DOWN_COMMENTS = 25;
export const SAMPLE_DOWN_COMMENT_CHARS = 300;
export const SAMPLE_MAX_SURVEY_ANSWERS = 30;
export const SAMPLE_SURVEY_ANSWER_CHARS = 200;
export const SAMPLE_MAX_PROOFREAD_DOWN_COMMENTS = 25;
export const SAMPLE_PROOFREAD_COMMENT_CHARS = 300;
export const SAMPLE_PROOFREAD_SUGGESTION_CHARS = 200;
export const SAMPLE_PROOFREAD_ISSUE_TYPE_CHARS = 60;

export interface SampleNarrative {
  narrative_style: string | null;
  story_type: string | null;
  /** Truncated to SAMPLE_NARRATIVE_FIELD_CHARS. */
  raw_input: string;
  /** Truncated to SAMPLE_NARRATIVE_FIELD_CHARS. */
  full_narrative: string;
  had_thumbs_down: boolean;
}

/** One sampled thumbs-down on a proofread suggestion, every field truncated. */
export interface SampleProofreadDownComment {
  /** Truncated to SAMPLE_PROOFREAD_ISSUE_TYPE_CHARS. */
  issue_type: string | null;
  /** Truncated to SAMPLE_PROOFREAD_SUGGESTION_CHARS. */
  suggestion_text: string | null;
  /** Truncated to SAMPLE_PROOFREAD_COMMENT_CHARS. */
  comment: string;
}

export interface InsightsSample {
  narratives: SampleNarrative[];
  /** Generated-story thumbs-down comments, each truncated to SAMPLE_DOWN_COMMENT_CHARS. */
  downComments: string[];
  /** Each truncated to SAMPLE_SURVEY_ANSWER_CHARS. */
  surveyTextAnswers: string[];
  /** Proofread-suggestion thumbs-down comments — separate from downComments. */
  proofreadDownComments: SampleProofreadDownComment[];
}

/* ------------------------------------------------------------ internals -- */

interface FeedbackRow {
  rating: string | null;
  comment: string | null;
  narrative_style: string | null;
  story_type: string | null;
  created_at: string;
}

/**
 * user_id and proofread_run_id are read ONLY to count distinct values; they
 * never leave this module.
 */
interface ProofreadFeedbackRow {
  rating: string | null;
  comment: string | null;
  issue_type: string | null;
  suggestion_text: string | null;
  narrative_style: string | null;
  story_type: string | null;
  proofread_run_id: string | null;
  user_id: string | null;
  created_at: string;
}

interface SurveyQuestionRow {
  id: string;
  question_text: string | null;
  input_type: string | null;
  is_active: boolean | null;
}

interface SurveyResponseRow {
  survey_id: string;
  response_value: string | null;
  was_dismissed: boolean | null;
  created_at: string;
}

interface TrackerStatsRow {
  narrative_style: string | null;
  story_type: string | null;
  is_regenerated: boolean | null;
  is_customized: boolean | null;
  is_proofread: boolean | null;
  is_saved: boolean | null;
  is_exported: boolean | null;
}

interface TrackerSampleRow {
  id: string;
  raw_input: string | null;
  full_narrative: string | null;
  narrative_style: string | null;
  story_type: string | null;
}

/**
 * Turns a Supabase result into a plain array, or throws a caller-safe Error.
 * The real driver message is logged, never returned to the client.
 */
function unwrap<T>(label: string, res: { data: unknown; error: { message: string } | null }): T[] {
  if (res.error) {
    console.error(`Insights aggregation failed (${label}):`, res.error.message);
    throw new Error(`Failed to load ${label}`);
  }
  return (res.data as T[] | null) || [];
}

function bucketKey(value: string | null | undefined): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > 0 ? trimmed : UNSPECIFIED_KEY;
}

/** up / total, or null when there is nothing to divide by. Never NaN. */
function safeRatio(up: number, total: number): number | null {
  if (total <= 0) return null;
  return up / total;
}

/** Percentage to one decimal. 0 when there is nothing to divide by. */
function safePct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function sortRatioBuckets(map: Map<string, { up: number; down: number }>): RatioBucket[] {
  return Array.from(map.entries())
    .map(([key, v]) => {
      const total = v.up + v.down;
      return { key, up: v.up, down: v.down, total, ratio: safeRatio(v.up, total) };
    })
    .sort((a, b) => (b.total - a.total) || a.key.localeCompare(b.key));
}

function sortCountBuckets(map: Map<string, number>): CountBucket[] {
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => (b.count - a.count) || a.key.localeCompare(b.key));
}

/* --------------------------------------------------------- public API 1 -- */

/**
 * Builds every aggregate the insights dashboard and the AI report share.
 *
 * Empty database is a first-class case: zeros, empty arrays, null ratios.
 * Throws on a driver error; callers translate that into a 500.
 */
export async function buildInsightsAggregate(svc: ServiceClient): Promise<InsightsAggregate> {
  const [feedbackRes, questionsRes, responsesRes, trackerRes, proofreadRes] = await Promise.all([
    svc
      .from('narrative_feedback')
      .select('rating, comment, narrative_style, story_type, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS_SCANNED),
    svc
      .from('survey_questions')
      .select('id, question_text, input_type, is_active')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS_SCANNED),
    svc
      .from('survey_responses')
      .select('survey_id, response_value, was_dismissed, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS_SCANNED),
    svc
      .from('narrative_tracker')
      .select('narrative_style, story_type, is_regenerated, is_customized, is_proofread, is_saved, is_exported')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS_SCANNED),
    svc
      .from('proofread_feedback')
      .select(
        'rating, comment, issue_type, suggestion_text, narrative_style, story_type, proofread_run_id, user_id, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS_SCANNED),
  ]);

  const feedbackRows = unwrap<FeedbackRow>('narrative feedback', feedbackRes);
  const questionRows = unwrap<SurveyQuestionRow>('survey questions', questionsRes);
  const responseRows = unwrap<SurveyResponseRow>('survey responses', responsesRes);
  const trackerRows = unwrap<TrackerStatsRow>('narrative tracker', trackerRes);
  const proofreadRows = unwrap<ProofreadFeedbackRow>('proofread feedback', proofreadRes);

  /* -- feedback ------------------------------------------------------- */

  let up = 0;
  let down = 0;
  const styleMap = new Map<string, { up: number; down: number }>();
  const storyMap = new Map<string, { up: number; down: number }>();
  const recentDownComments: RecentDownComment[] = [];

  for (const row of feedbackRows) {
    const isUp = row.rating === 'up';
    const isDown = row.rating === 'down';
    if (!isUp && !isDown) continue; // ignore anything unexpected rather than crash

    if (isUp) up += 1;
    else down += 1;

    const styleKey = bucketKey(row.narrative_style);
    const storyKey = bucketKey(row.story_type);

    const styleBucket = styleMap.get(styleKey) || { up: 0, down: 0 };
    if (isUp) styleBucket.up += 1;
    else styleBucket.down += 1;
    styleMap.set(styleKey, styleBucket);

    const storyBucket = storyMap.get(storyKey) || { up: 0, down: 0 };
    if (isUp) storyBucket.up += 1;
    else storyBucket.down += 1;
    storyMap.set(storyKey, storyBucket);

    // Rows arrive newest-first, so the first N matches are the most recent.
    if (
      isDown &&
      recentDownComments.length < MAX_RECENT_DOWN_COMMENTS &&
      typeof row.comment === 'string' &&
      row.comment.trim().length > 0
    ) {
      recentDownComments.push({
        comment: row.comment.trim(),
        narrative_style: row.narrative_style,
        story_type: row.story_type,
        created_at: row.created_at,
      });
    }
  }

  const feedbackTotal = up + down;
  const feedback: FeedbackAggregate = {
    up,
    down,
    total: feedbackTotal,
    ratio: safeRatio(up, feedbackTotal),
    byStyle: sortRatioBuckets(styleMap),
    byStoryType: sortRatioBuckets(storyMap),
  };

  /* -- surveys -------------------------------------------------------- */

  const answered = new Map<string, number>();
  const dismissed = new Map<string, number>();
  const choiceCounts = new Map<string, Map<string, number>>();
  const textAnswers = new Map<string, string[]>();

  for (const row of responseRows) {
    const surveyId = row.survey_id;
    if (!surveyId) continue;

    if (row.was_dismissed) {
      dismissed.set(surveyId, (dismissed.get(surveyId) || 0) + 1);
      continue;
    }

    answered.set(surveyId, (answered.get(surveyId) || 0) + 1);

    const value = typeof row.response_value === 'string' ? row.response_value.trim() : '';
    if (!value) continue;

    const counts = choiceCounts.get(surveyId) || new Map<string, number>();
    counts.set(value, (counts.get(value) || 0) + 1);
    choiceCounts.set(surveyId, counts);

    // Responses arrive newest-first.
    const answers = textAnswers.get(surveyId) || [];
    if (answers.length < MAX_RECENT_TEXT_ANSWERS) {
      answers.push(value);
      textAnswers.set(surveyId, answers);
    }
  }

  const surveys: SurveyAggregate[] = questionRows.map((question) => {
    const inputType = question.input_type || 'text';
    const counts = choiceCounts.get(question.id);
    return {
      id: question.id,
      question_text: question.question_text || '',
      input_type: inputType,
      is_active: question.is_active === true,
      total_responses: answered.get(question.id) || 0,
      dismissed: dismissed.get(question.id) || 0,
      choice_counts:
        inputType === 'choice' ? Object.fromEntries(counts ? counts.entries() : []) : null,
      recent_text_answers: inputType === 'text' ? textAnswers.get(question.id) || [] : [],
    };
  });

  /* -- usage ---------------------------------------------------------- */

  const usageStyleMap = new Map<string, number>();
  const usageStoryMap = new Map<string, number>();
  let regenerated = 0;
  let customized = 0;
  let proofread = 0;
  let saved = 0;
  let exported = 0;

  for (const row of trackerRows) {
    const styleKey = bucketKey(row.narrative_style);
    const storyKey = bucketKey(row.story_type);
    usageStyleMap.set(styleKey, (usageStyleMap.get(styleKey) || 0) + 1);
    usageStoryMap.set(storyKey, (usageStoryMap.get(storyKey) || 0) + 1);

    if (row.is_regenerated) regenerated += 1;
    if (row.is_customized) customized += 1;
    if (row.is_proofread) proofread += 1;
    if (row.is_saved) saved += 1;
    if (row.is_exported) exported += 1;
  }

  const totalGenerations = trackerRows.length;
  const usage: UsageAggregate = {
    totalGenerations,
    byStyle: sortCountBuckets(usageStyleMap),
    byStoryType: sortCountBuckets(usageStoryMap),
    rates: {
      regenerated: { count: regenerated, pct: safePct(regenerated, totalGenerations) },
      customized: { count: customized, pct: safePct(customized, totalGenerations) },
      proofread: { count: proofread, pct: safePct(proofread, totalGenerations) },
      saved: { count: saved, pct: safePct(saved, totalGenerations) },
      exported: { count: exported, pct: safePct(exported, totalGenerations) },
    },
  };

  /* -- proofread suggestion feedback (ISOLATED from `feedback`) -------- */

  let prUp = 0;
  let prDown = 0;
  const prStyleMap = new Map<string, { up: number; down: number }>();
  const prStoryMap = new Map<string, { up: number; down: number }>();
  const prIssueMap = new Map<string, { up: number; down: number }>();
  const prRunIds = new Set<string>();
  const prUserIds = new Set<string>();
  const prRecentDown: ProofreadRecentDownComment[] = [];

  for (const row of proofreadRows) {
    const isUp = row.rating === 'up';
    const isDown = row.rating === 'down';
    if (!isUp && !isDown) continue;

    if (isUp) prUp += 1;
    else prDown += 1;

    // Counted, never emitted.
    if (typeof row.proofread_run_id === 'string' && row.proofread_run_id.length > 0) {
      prRunIds.add(row.proofread_run_id);
    }
    if (typeof row.user_id === 'string' && row.user_id.length > 0) {
      prUserIds.add(row.user_id);
    }

    const styleKey = bucketKey(row.narrative_style);
    const storyKey = bucketKey(row.story_type);
    const issueKey = bucketKey(row.issue_type);

    const styleBucket = prStyleMap.get(styleKey) || { up: 0, down: 0 };
    if (isUp) styleBucket.up += 1;
    else styleBucket.down += 1;
    prStyleMap.set(styleKey, styleBucket);

    const storyBucket = prStoryMap.get(storyKey) || { up: 0, down: 0 };
    if (isUp) storyBucket.up += 1;
    else storyBucket.down += 1;
    prStoryMap.set(storyKey, storyBucket);

    const issueBucket = prIssueMap.get(issueKey) || { up: 0, down: 0 };
    if (isUp) issueBucket.up += 1;
    else issueBucket.down += 1;
    prIssueMap.set(issueKey, issueBucket);

    // Rows arrive newest-first, so the first N matches are the most recent.
    if (
      isDown &&
      prRecentDown.length < MAX_RECENT_DOWN_COMMENTS &&
      typeof row.comment === 'string' &&
      row.comment.trim().length > 0
    ) {
      const suggestion =
        typeof row.suggestion_text === 'string' ? row.suggestion_text.trim() : '';
      prRecentDown.push({
        comment: row.comment.trim(),
        issue_type: row.issue_type,
        suggestion_text: suggestion.length > 0 ? suggestion.slice(0, RECENT_SUGGESTION_TEXT_CHARS) : null,
        narrative_style: row.narrative_style,
        story_type: row.story_type,
        created_at: row.created_at,
      });
    }
  }

  const prTotal = prUp + prDown;
  const proofreadFeedback: ProofreadFeedbackAggregate = {
    up: prUp,
    down: prDown,
    total: prTotal,
    ratio: safeRatio(prUp, prTotal),
    byStyle: sortRatioBuckets(prStyleMap),
    byStoryType: sortRatioBuckets(prStoryMap),
    byIssueType: sortRatioBuckets(prIssueMap).slice(0, MAX_ISSUE_TYPE_BUCKETS),
    distinctRuns: prRunIds.size,
    distinctUsers: prUserIds.size,
    recentDownComments: prRecentDown,
  };

  return { feedback, recentDownComments, surveys, usage, proofreadFeedback };
}

/* --------------------------------------------------------- public API 2 -- */

/**
 * Builds the BOUNDED raw sample for the AI report.
 *
 * Caps are enforced here with explicit .slice() calls — never by asking the
 * model to be brief:
 *   - 12 narratives, each field truncated to 600 chars
 *   - 25 thumbs-down comments, each truncated to 300 chars
 *   - 30 survey free-text answers, each truncated to 200 chars
 *   - 25 proofread-suggestion thumbs-down comments at 300 chars, with their
 *     issue_type (60) and suggestion_text (200) for context — kept separate
 *     from the generated-story comments above
 *
 * Narratives that received a thumbs-down are preferred; the remainder is
 * back-filled with the most recent rows.
 */
export async function buildInsightsSample(svc: ServiceClient): Promise<InsightsSample> {
  /* -- thumbs-down comments ------------------------------------------- */

  const downRes = await svc
    .from('narrative_feedback')
    .select('comment')
    .eq('rating', 'down')
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(SAMPLE_MAX_DOWN_COMMENTS * 3);

  const downComments = unwrap<{ comment: string | null }>('thumbs-down comments', downRes)
    .map((row) => (typeof row.comment === 'string' ? row.comment.trim() : ''))
    .filter((comment) => comment.length > 0)
    .slice(0, SAMPLE_MAX_DOWN_COMMENTS)
    .map((comment) => comment.slice(0, SAMPLE_DOWN_COMMENT_CHARS));

  /* -- narratives (thumbs-down first, then most recent) ---------------- */

  const downTrackerRes = await svc
    .from('narrative_feedback')
    .select('tracker_id')
    .eq('rating', 'down')
    .order('created_at', { ascending: false })
    .limit(SAMPLE_MAX_NARRATIVES * 5);

  const downTrackerIds = Array.from(
    new Set(
      unwrap<{ tracker_id: string | null }>('thumbs-down trackers', downTrackerRes)
        .map((row) => row.tracker_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  ).slice(0, SAMPLE_MAX_NARRATIVES);

  const trackerColumns = 'id, raw_input, full_narrative, narrative_style, story_type';
  const picked: TrackerSampleRow[] = [];
  const pickedIds = new Set<string>();

  if (downTrackerIds.length > 0) {
    const flaggedRes = await svc
      .from('narrative_tracker')
      .select(trackerColumns)
      .in('id', downTrackerIds)
      .limit(SAMPLE_MAX_NARRATIVES);

    for (const row of unwrap<TrackerSampleRow>('flagged narratives', flaggedRes)) {
      if (picked.length >= SAMPLE_MAX_NARRATIVES) break;
      if (pickedIds.has(row.id)) continue;
      picked.push(row);
      pickedIds.add(row.id);
    }
  }

  if (picked.length < SAMPLE_MAX_NARRATIVES) {
    const recentRes = await svc
      .from('narrative_tracker')
      .select(trackerColumns)
      .order('created_at', { ascending: false })
      .limit(SAMPLE_MAX_NARRATIVES * 2);

    for (const row of unwrap<TrackerSampleRow>('recent narratives', recentRes)) {
      if (picked.length >= SAMPLE_MAX_NARRATIVES) break;
      if (pickedIds.has(row.id)) continue;
      picked.push(row);
      pickedIds.add(row.id);
    }
  }

  const flaggedIdSet = new Set(downTrackerIds);
  const narratives: SampleNarrative[] = picked
    .slice(0, SAMPLE_MAX_NARRATIVES)
    .map((row) => ({
      narrative_style: row.narrative_style,
      story_type: row.story_type,
      raw_input: (row.raw_input || '').slice(0, SAMPLE_NARRATIVE_FIELD_CHARS),
      full_narrative: (row.full_narrative || '').slice(0, SAMPLE_NARRATIVE_FIELD_CHARS),
      had_thumbs_down: flaggedIdSet.has(row.id),
    }));

  /* -- survey free-text answers --------------------------------------- */

  const textQuestionsRes = await svc
    .from('survey_questions')
    .select('id')
    .eq('input_type', 'text')
    .limit(MAX_ROWS_SCANNED);

  const textQuestionIds = unwrap<{ id: string }>('text survey questions', textQuestionsRes)
    .map((row) => row.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  let surveyTextAnswers: string[] = [];
  if (textQuestionIds.length > 0) {
    const answersRes = await svc
      .from('survey_responses')
      .select('response_value, was_dismissed')
      .in('survey_id', textQuestionIds)
      .not('response_value', 'is', null)
      .order('created_at', { ascending: false })
      .limit(SAMPLE_MAX_SURVEY_ANSWERS * 3);

    surveyTextAnswers = unwrap<{ response_value: string | null; was_dismissed: boolean | null }>(
      'survey text answers',
      answersRes
    )
      .filter((row) => !row.was_dismissed)
      .map((row) => (typeof row.response_value === 'string' ? row.response_value.trim() : ''))
      .filter((value) => value.length > 0)
      .slice(0, SAMPLE_MAX_SURVEY_ANSWERS)
      .map((value) => value.slice(0, SAMPLE_SURVEY_ANSWER_CHARS));
  }

  /* -- proofread-suggestion thumbs-down comments (separate bucket) ---- */

  const proofreadDownRes = await svc
    .from('proofread_feedback')
    .select('comment, issue_type, suggestion_text')
    .eq('rating', 'down')
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(SAMPLE_MAX_PROOFREAD_DOWN_COMMENTS * 3);

  const proofreadDownComments: SampleProofreadDownComment[] = unwrap<{
    comment: string | null;
    issue_type: string | null;
    suggestion_text: string | null;
  }>('proofread thumbs-down comments', proofreadDownRes)
    .map((row) => ({
      comment: typeof row.comment === 'string' ? row.comment.trim() : '',
      issue_type: typeof row.issue_type === 'string' ? row.issue_type.trim() : '',
      suggestion_text: typeof row.suggestion_text === 'string' ? row.suggestion_text.trim() : '',
    }))
    .filter((row) => row.comment.length > 0)
    .slice(0, SAMPLE_MAX_PROOFREAD_DOWN_COMMENTS)
    .map((row) => ({
      issue_type: row.issue_type.length > 0 ? row.issue_type.slice(0, SAMPLE_PROOFREAD_ISSUE_TYPE_CHARS) : null,
      suggestion_text:
        row.suggestion_text.length > 0
          ? row.suggestion_text.slice(0, SAMPLE_PROOFREAD_SUGGESTION_CHARS)
          : null,
      comment: row.comment.slice(0, SAMPLE_PROOFREAD_COMMENT_CHARS),
    }));

  return { narratives, downComments, surveyTextAnswers, proofreadDownComments };
}

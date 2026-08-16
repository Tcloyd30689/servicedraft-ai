import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { generateWithGemini } from '@/lib/gemini/client';
import { logTokenUsage } from '@/lib/usageLogger';
import { rateLimit } from '@/lib/rateLimit';
import {
  buildInsightsAggregate,
  buildInsightsSample,
  type InsightsAggregate,
  type InsightsSample,
} from '@/lib/insightsAggregate';

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(url, serviceKey);
}

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // qa_tester: read-only owner-equivalent (Sprint G-4a)
  if (!profile || (profile.role !== 'owner' && profile.role !== 'qa_tester')) return null;
  return { userId: user.id, role: profile.role as string };
}

/**
 * Report-specific system prompt, defined inline per house precedent
 * (src/app/api/convert-recommendation/route.ts).
 *
 * Deliberately does NOT interpolate MANDATORY_OUTPUT_RULES — that constant is
 * narrative-specific (FULL CAPS, implied first person) and would wreck a report.
 */
const INSIGHTS_REPORT_SYSTEM_PROMPT = `You are a product analyst reviewing beta feedback for ServiceDraft.AI, a tool that generates automotive repair-order narratives for technicians and service advisors.

You will be given aggregated statistics plus a small, deliberately capped sample of raw user data. Write a short, honest analysis report for the product owner.

HONESTY RULES — these outrank every other instruction in this prompt:
- This is a SMALL BETA DATASET. It is normal and expected for there to be very little data, or none at all. Treat thin data as thin data.
- NEVER invent a finding, a quote, a user, a trend, or a percentage. Use only what appears in the supplied data.
- NEVER extrapolate from one or two data points. Two thumbs-down ratings are two thumbs-down ratings, not "a pattern of dissatisfaction".
- NEVER manufacture, estimate, or round up numbers. If a count is not present in the data, do not state a count.
- When a section does not have enough evidence to support a conclusion, say so plainly. "Not enough data yet to say" is a CORRECT and EXPECTED answer, and it is always preferred over a confident guess.
- Whenever you do make a claim, cite the actual counts it rests on. For example: "3 of the 5 thumbs-down comments mention length".
- Do not paper over missing data with speculation about what "might" or "could" be happening. State the gap and move on.

OUTPUT FORMAT — the reader's markdown renderer is hand-rolled and supports only a small subset. You MUST use only these constructs:
- "##" and "###" headings
- plain paragraphs
- "-" bullet lists
- "1." numbered lists
- "**bold**" for inline emphasis

FORBIDDEN — never output any of the following, under any circumstance: tables, code fences or backticks, links, images, blockquotes, horizontal rules, and "#" level-1 headings. Do not use single "*" or "_" for emphasis; use "**bold**" only.

REPORT STRUCTURE — use exactly these four "##" sections, in this order:

## Patterns in Negative Feedback
What the thumbs-down ratings and comments actually show. Cite counts. If there are too few to read anything into, say so.

## Style-Specific Issues
Break the problems down by narrative_style. Say which styles have enough data to judge and which do not.

## Survey Takeaways
What the survey responses actually indicate. Paraphrase only real answers that appear in the data.

## Recommendations
A numbered list, highest priority first. For each item give the change to make and the specific evidence from this data that motivates it. If the data does not yet justify any change, say that and recommend what to collect instead.

Write plainly and directly. No marketing language, no filler, and no closing summary paragraph.`;

/* --- prompt-side caps (the stored snapshot keeps the untrimmed version) --- */
const PROMPT_MAX_BUCKETS = 25;
const PROMPT_BUCKET_KEY_CHARS = 60;
const PROMPT_MAX_SURVEYS = 15;
const PROMPT_QUESTION_CHARS = 160;
const PROMPT_MAX_CHOICE_KEYS = 12;
const PROMPT_CHOICE_KEY_CHARS = 80;

/**
 * Numeric-only view of the aggregates for the prompt.
 *
 * The free-text carried inside the full aggregate (recentDownComments,
 * recent_text_answers) is deliberately replaced by counts here — the capped
 * sample already supplies that text, so including both would double the cost.
 */
function toPromptAggregates(a: InsightsAggregate) {
  const trimKey = <T extends { key: string }>(buckets: T[]) =>
    buckets
      .slice(0, PROMPT_MAX_BUCKETS)
      .map((b) => ({ ...b, key: b.key.slice(0, PROMPT_BUCKET_KEY_CHARS) }));

  return {
    feedback: {
      up: a.feedback.up,
      down: a.feedback.down,
      total: a.feedback.total,
      ratio: a.feedback.ratio,
      byStyle: trimKey(a.feedback.byStyle),
      byStoryType: trimKey(a.feedback.byStoryType),
    },
    recent_down_comment_count: a.recentDownComments.length,
    surveys: a.surveys.slice(0, PROMPT_MAX_SURVEYS).map((s) => ({
      question_text: s.question_text.slice(0, PROMPT_QUESTION_CHARS),
      input_type: s.input_type,
      is_active: s.is_active,
      total_responses: s.total_responses,
      dismissed: s.dismissed,
      choice_counts: s.choice_counts
        ? Object.fromEntries(
            Object.entries(s.choice_counts)
              .slice(0, PROMPT_MAX_CHOICE_KEYS)
              .map(([k, v]) => [k.slice(0, PROMPT_CHOICE_KEY_CHARS), v])
          )
        : null,
      text_answer_count: s.recent_text_answers.length,
    })),
    usage: {
      totalGenerations: a.usage.totalGenerations,
      byStyle: trimKey(a.usage.byStyle),
      byStoryType: trimKey(a.usage.byStoryType),
      rates: a.usage.rates,
    },
  };
}

/** Assembles the user prompt from the trimmed aggregates and the capped sample. */
function buildUserPrompt(aggregates: InsightsAggregate, sample: InsightsSample): string {
  const parts: string[] = [];

  parts.push('AGGREGATED STATISTICS (JSON):');
  parts.push(JSON.stringify(toPromptAggregates(aggregates), null, 2));
  parts.push('');

  parts.push(`NARRATIVE SAMPLE (${sample.narratives.length} rows, each field truncated):`);
  if (sample.narratives.length === 0) {
    parts.push('(none)');
  } else {
    sample.narratives.forEach((n, i) => {
      parts.push(
        `${i + 1}. style=${n.narrative_style || 'unspecified'} | story_type=${n.story_type || 'unspecified'} | thumbs_down=${n.had_thumbs_down ? 'yes' : 'no'}`
      );
      parts.push(`INPUT: ${n.raw_input || '(empty)'}`);
      parts.push(`OUTPUT: ${n.full_narrative || '(empty)'}`);
      parts.push('');
    });
  }

  parts.push(`THUMBS-DOWN COMMENTS (${sample.downComments.length}, truncated):`);
  parts.push(
    sample.downComments.length === 0
      ? '(none)'
      : sample.downComments.map((c, i) => `${i + 1}. ${c}`).join('\n')
  );
  parts.push('');

  parts.push(`SURVEY FREE-TEXT ANSWERS (${sample.surveyTextAnswers.length}, truncated):`);
  parts.push(
    sample.surveyTextAnswers.length === 0
      ? '(none)'
      : sample.surveyTextAnswers.map((t, i) => `${i + 1}. ${t}`).join('\n')
  );
  parts.push('');

  parts.push(
    'Write the report using ONLY the data above. Where the data is too thin to support a conclusion, say so.'
  );

  return parts.join('\n');
}

interface ReportListRow {
  id: string;
  created_at: string;
  generated_by: string | null;
}

/**
 * GET /api/admin/insights/report
 *
 * No query param  → the 20 most recent reports, newest first, WITHOUT the two
 *                    large columns (report_markdown, data_snapshot).
 * ?id=<uuid>      → that single report, including both large columns.
 *
 * Read-only, so qa_tester is allowed. Generator emails are resolved with a
 * second query and mapped in JavaScript — no join.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const svc = createServiceClient();

    if (searchParams.has('id')) {
      const reportId = (searchParams.get('id') || '').trim();
      if (!reportId) {
        return NextResponse.json({ success: false, error: 'id must be a non-empty string' }, { status: 400 });
      }

      const { data: report, error } = await svc
        .from('insight_reports')
        .select('id, generated_by, report_markdown, data_snapshot, created_at')
        .eq('id', reportId)
        .maybeSingle();

      // A malformed uuid surfaces as a driver error — treat it as "not found"
      // rather than leaking a 500, mirroring the admin surveys PATCH lookup.
      if (error) {
        console.error('Failed to look up insight report:', error.message);
        return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
      }

      if (!report) {
        return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
      }

      let generatedByEmail: string | null = null;
      if (report.generated_by) {
        const { data: userRow } = await svc
          .from('users')
          .select('id, email')
          .eq('id', report.generated_by)
          .maybeSingle();
        generatedByEmail = userRow?.email ?? null;
      }

      return NextResponse.json({
        success: true,
        data: { ...report, generated_by_email: generatedByEmail },
      });
    }

    const { data: rows, error } = await svc
      .from('insight_reports')
      .select('id, created_at, generated_by')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to list insight reports:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const reports: ReportListRow[] = rows || [];

    // Resolve generator emails in JavaScript — no join.
    const generatorIds = Array.from(
      new Set(
        reports
          .map((r) => r.generated_by)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      )
    );

    const emailById: Record<string, string> = {};
    if (generatorIds.length > 0) {
      const { data: userRows } = await svc.from('users').select('id, email').in('id', generatorIds);
      (userRows || []).forEach((u: { id: string; email: string | null }) => {
        if (u.email) emailById[u.id] = u.email;
      });
    }

    const data = reports.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      generated_by: r.generated_by,
      generated_by_email: r.generated_by ? emailById[r.generated_by] ?? null : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Admin insights report GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/insights/report
 *
 * Generates a new AI insight report from the current aggregates plus a hard-
 * capped raw sample, then persists it to public.insight_reports.
 *
 * Mutating AND expensive, so qa_tester is denied and the call is rate limited
 * to 5 reports per owner per 15 minutes. If the insert fails the generated
 * markdown is still returned with saved:false — a paid generation is never
 * thrown away.
 */
export async function POST() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // qa_tester is read-only, deny-by-default on every mutation (Sprint G-4a).
    if (admin.role === 'qa_tester') {
      return NextResponse.json({ success: false, error: 'Forbidden — qa_tester is read-only' }, { status: 403 });
    }

    // Rate limit: 5 reports per owner per 15 minutes (each one is a paid call).
    const { success: rateLimitOk } = rateLimit(`insights_report:${admin.userId}`, 5, 15 * 60 * 1000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { success: false, error: 'Too many report requests. Please wait a few minutes.' },
        { status: 429 },
      );
    }

    const svc = createServiceClient();

    const [aggregates, sample] = await Promise.all([
      buildInsightsAggregate(svc),
      buildInsightsSample(svc),
    ]);

    const userPrompt = buildUserPrompt(aggregates, sample);

    const geminiResult = await generateWithGemini(INSIGHTS_REPORT_SYSTEM_PROMPT, userPrompt, 8000);

    // Fire-and-forget token usage logging
    logTokenUsage(admin.userId, 'insights_report', geminiResult.usage);

    const reportMarkdown = (geminiResult.text || '').trim();
    const dataSnapshot = {
      generated_at: new Date().toISOString(),
      aggregates,
      sample,
    };

    const { data: inserted, error: insertError } = await svc
      .from('insight_reports')
      .insert({
        generated_by: admin.userId,
        report_markdown: reportMarkdown,
        data_snapshot: dataSnapshot,
      })
      .select('id, created_at')
      .single();

    if (insertError || !inserted) {
      // Never lose a paid generation — hand the markdown back unsaved.
      console.error('Failed to save insight report:', insertError?.message);
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          report_markdown: reportMarkdown,
          created_at: dataSnapshot.generated_at,
          saved: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: inserted.id,
        report_markdown: reportMarkdown,
        created_at: inserted.created_at,
        saved: true,
      },
    });
  } catch (err) {
    console.error('Admin insights report POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

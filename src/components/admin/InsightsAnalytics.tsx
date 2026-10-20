'use client';

/**
 * Sprint A-3 — beta insights analytics, rendered BELOW the Survey Manager
 * inside the admin Insights tab.
 *
 * Reads:
 *   GET  /api/admin/insights                 aggregate numbers (owner + qa_tester)
 *   GET  /api/admin/insights/report          past report list, newest first
 *   GET  /api/admin/insights/report?id=…     one report's markdown
 *   POST /api/admin/insights/report          generate (OWNER ONLY — paid call)
 *
 * The generate button is hidden entirely for read-only (qa_tester) viewers,
 * matching the Sprint G-4a/G-4b convention: see everything, mutate nothing.
 *
 * Feedback is TWO isolated streams, never blended:
 *   - Generated Story Feedback      ← data.feedback / data.recentDownComments
 *   - Proofread Suggestion Feedback ← data.proofreadFeedback
 * A segmented control (GENERATED STORIES | PROOFREAD SUGGESTIONS | BOTH) picks
 * which stream(s) are on screen; BOTH is the default.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Activity, Sparkles,
  FileText, ClipboardList, AlertTriangle, RefreshCw, Clock, SpellCheck, Tag,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import MarkdownReport from '@/components/admin/MarkdownReport';
import type { InsightReport } from '@/types/database';
import type {
  InsightsAggregate,
  ProofreadFeedbackAggregate,
  RatioBucket,
} from '@/lib/insightsAggregate';
import { proofreadIssueCategoryLabel } from '@/constants/proofreadCategories';

/* ------------------------------------------------------------- labels ---- */

const NARRATIVE_STYLE_LABELS: Record<string, string> = {
  customer_pay: 'Customer Pay',
  extended_warranty: 'Extended Warranty',
  manufacturer_warranty: 'Manufacturer Warranty',
  unspecified: 'Unspecified',
};

const STORY_TYPE_LABELS: Record<string, string> = {
  diagnostic_only: 'Diagnostic Only',
  repair_complete: 'Repair Complete',
  unspecified: 'Unspecified',
};

/** snake_case → Title Case, so an unknown key still reads like English. */
function humanize(key: string): string {
  const words = key
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.length > 0 ? words.join(' ') : 'Unspecified';
}

const styleLabel = (key: string): string => NARRATIVE_STYLE_LABELS[key] ?? humanize(key);
const storyLabel = (key: string): string => STORY_TYPE_LABELS[key] ?? humanize(key);
/**
 * issue_type is now a fixed-list category KEY from the proofread tool
 * (src/constants/proofreadCategories.ts), so known keys get their human label.
 * Rows written before the category list existed hold the full flagged-issue
 * sentence (up to 200 chars); those fall through to the humanizer and are
 * truncated for the chart axis and the pill, with the full text in the pill's
 * title tooltip.
 */
const ISSUE_LABEL_MAX_CHARS = 40;
function truncateLabel(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
const issueLabel = (key: string): string =>
  proofreadIssueCategoryLabel(key) ?? truncateLabel(humanize(key), ISSUE_LABEL_MAX_CHARS);

/**
 * Satisfaction as a percentage. `ratio` is null on an empty database, so the
 * null branch (and the non-finite guard behind it) makes "NaN%" unreachable.
 */
function formatRatio(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—';
  return `${Math.round(ratio * 100)}%`;
}

/** Integer counter that can never print NaN/undefined. */
function formatCount(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
  return value.toLocaleString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/**
 * Category-axis width. The admin page's own bar charts use 110, but these axes
 * carry longer labels ("Repair Complete", "Manufacturer Warranty") and at 110
 * the first glyph is clipped by the SVG edge in the half-width two-up grid.
 */
const Y_AXIS_WIDTH = 132;

/** Series fills, all CSS variables — no literal colors anywhere in this file. */
const SERIES_FILLS = [
  'var(--accent-primary)',
  'var(--accent-hover)',
  'var(--accent-bright)',
  'var(--accent-30)',
];

const TOOLTIP_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--accent-30)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: 13,
} as const;

/* -------------------------------------------------------------- types ---- */

/** GET /api/admin/insights/report (list) — no markdown on these rows. */
interface ReportListRow {
  id: string;
  created_at: string;
  generated_by: string | null;
  generated_by_email: string | null;
}

/** GET …?id=… returns the stored row plus a resolved email. */
type ReportDetail = InsightReport & { generated_by_email: string | null };

/**
 * What the modal shows. POST returns no email (and `id: null` when the insert
 * failed), so this is deliberately looser than ReportDetail.
 */
interface ReportView {
  id: string | null;
  report_markdown: string;
  created_at: string;
  generated_by_email: string | null;
}

const RATE_LABELS: { key: keyof InsightsAggregate['usage']['rates']; label: string }[] = [
  { key: 'regenerated', label: 'Regenerated' },
  { key: 'customized', label: 'Customized' },
  { key: 'proofread', label: 'Proofread' },
  { key: 'saved', label: 'Saved' },
  { key: 'exported', label: 'Exported' },
];

/* ------------------------------------------------ feedback view switch ---- */

type FeedbackView = 'stories' | 'proofread' | 'both';

const FEEDBACK_VIEW_OPTIONS: { key: FeedbackView; label: string }[] = [
  { key: 'stories', label: 'GENERATED STORIES' },
  { key: 'proofread', label: 'PROOFREAD SUGGESTIONS' },
  { key: 'both', label: 'BOTH' },
];

/** Section headers — referenced by QA, keep the strings stable. */
const STORY_SECTION_TITLE = 'Generated Story Feedback';
const PROOFREAD_SECTION_TITLE = 'Proofread Suggestion Feedback';

/**
 * Safe stand-in when the API payload predates `proofreadFeedback` (stale tab
 * across a deploy). Every field is a real zero / empty value, never undefined.
 */
const EMPTY_PROOFREAD: ProofreadFeedbackAggregate = {
  up: 0,
  down: 0,
  total: 0,
  ratio: null,
  byStyle: [],
  byStoryType: [],
  byIssueType: [],
  distinctRuns: 0,
  distinctUsers: 0,
  recentDownComments: [],
};

/* ------------------------------------------------------ sub-components ---- */

interface ChartRow {
  name: string;
  up: number;
  down: number;
}

function toChartRows(buckets: RatioBucket[] | undefined, label: (key: string) => string): ChartRow[] {
  return (buckets ?? []).map((b) => ({
    name: label(b.key),
    up: Number.isFinite(b.up) ? b.up : 0,
    down: Number.isFinite(b.down) ? b.down : 0,
  }));
}

/** The house up/down horizontal bar chart. One place for the chrome. */
function RatioBarChart({ rows, emptyText }: { rows: ChartRow[]; emptyText: string }) {
  if (rows.length === 0) {
    return (
      <p className="text-[var(--text-muted)] text-base text-center py-8">{emptyText}</p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(rows.length * 40, 200)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" horizontal={false} />
        <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis dataKey="name" type="category" width={Y_AXIS_WIDTH} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="up" name="Thumbs up" fill="var(--accent-bright)" radius={[0, 4, 4, 0]} />
        <Bar dataKey="down" name="Thumbs down" fill="var(--accent-30)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  sub: string;
}

function buildStatCards(
  totals: { up: number; down: number; total: number; ratio: number | null } | undefined,
  totalSub: string,
): StatCard[] {
  return [
    {
      label: 'Thumbs Up',
      value: formatCount(totals?.up),
      icon: ThumbsUp,
      color: 'var(--accent-bright)',
      sub: 'Helpful ratings',
    },
    {
      label: 'Thumbs Down',
      value: formatCount(totals?.down),
      icon: ThumbsDown,
      color: 'var(--accent-primary)',
      sub: 'Needs work',
    },
    {
      label: 'Total Feedback',
      value: formatCount(totals?.total),
      icon: MessageSquare,
      color: 'var(--accent-hover)',
      sub: totalSub,
    },
    {
      label: 'Satisfaction',
      // Preformatted string — an em-dash when ratio is null, never NaN%.
      value: formatRatio(totals?.ratio ?? null),
      icon: TrendingUp,
      color: 'var(--accent-bright)',
      sub: 'Thumbs up share',
    },
  ];
}

function StatCardGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map(({ label, value, icon: Icon, color, sub }) => (
        <LiquidCard key={label} size="compact" className="!rounded-[16px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[var(--text-muted)] uppercase tracking-wider font-medium">
                {label}
              </p>
              <Icon size={22} style={{ color, opacity: 0.6 }} />
            </div>
            <p className="text-2xl sm:text-4xl font-bold" style={{ color }}>{value}</p>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-1">{sub}</p>
          </div>
        </LiquidCard>
      ))}
    </div>
  );
}

/** Distinct section banner so BOTH mode reads as two separate blocks. */
function SectionHeader({ icon: Icon, title, caption }: { icon: LucideIcon; title: string; caption: string }) {
  return (
    <div className="flex items-start gap-3 pt-2">
      <div className="w-10 h-10 rounded-xl bg-[var(--accent-15)] border border-[var(--accent-20)] flex items-center justify-center shrink-0">
        <Icon size={20} style={{ color: 'var(--accent-bright)' }} />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{title}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">{caption}</p>
      </div>
    </div>
  );
}

function ContextPill({ children, title }: { children: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-block max-w-full truncate align-bottom px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-15)] border border-[var(--accent-20)] text-[var(--accent-bright)]"
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------- component ---- */

interface InsightsAnalyticsProps {
  /** qa_tester — may see everything, may generate nothing (Sprint G-4a/G-4b). */
  readOnly: boolean;
}

export default function InsightsAnalytics({ readOnly }: InsightsAnalyticsProps) {
  const [data, setData] = useState<InsightsAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [feedbackView, setFeedbackView] = useState<FeedbackView>('both');

  const [reports, setReports] = useState<ReportListRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportView | null>(null);

  /* ─── Fetch ──────────────────────────────────────────────── */

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/insights');
      const json = await res.json();
      if (json.success) {
        setData(json.data as InsightsAggregate);
        setError(null);
      } else {
        setError(json.error || 'Failed to load insights.');
      }
    } catch (err) {
      console.error('Insights fetch error:', err);
      setError('Failed to load insights.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await fetch('/api/admin/insights/report');
      const json = await res.json();
      if (json.success) {
        setReports(json.data as ReportListRow[]);
        setReportsError(null);
      } else {
        setReportsError(json.error || 'Failed to load past reports.');
      }
    } catch (err) {
      console.error('Insight reports fetch error:', err);
      setReportsError('Failed to load past reports.');
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    fetchReports();
  }, [fetchInsights, fetchReports]);

  /* ─── Report modal ───────────────────────────────────────── */

  const openReport = useCallback(async (row: ReportListRow) => {
    // The list rows carry no markdown, so the body is fetched by id.
    setActiveReport(null);
    setReportOpen(true);
    setReportLoading(true);
    try {
      const res = await fetch(`/api/admin/insights/report?id=${encodeURIComponent(row.id)}`);
      const json = await res.json();
      if (json.success) {
        const detail = json.data as ReportDetail;
        setActiveReport({
          id: detail.id,
          report_markdown: detail.report_markdown,
          created_at: detail.created_at,
          generated_by_email: detail.generated_by_email,
        });
      } else {
        toast.error(json.error || 'Failed to load report');
        setReportOpen(false);
      }
    } catch (err) {
      console.error('Insight report fetch error:', err);
      toast.error('Failed to load report');
      setReportOpen(false);
    } finally {
      setReportLoading(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (readOnly || generating) return;
    setGenerating(true);
    try {
      // Deliberately NO body — the route builds its own sample server-side.
      const res = await fetch('/api/admin/insights/report', { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        const payload = json.data as {
          id: string | null;
          report_markdown: string;
          created_at: string;
          saved: boolean;
        };

        // Branch on `saved`, NOT on `success`: a failed DB insert still returns
        // 200 + success:true so a paid generation is never thrown away.
        setActiveReport({
          id: payload.id,
          report_markdown: payload.report_markdown,
          created_at: payload.created_at,
          generated_by_email: null,
        });
        setReportLoading(false);
        setReportOpen(true);

        if (payload.saved === false) {
          toast.error('Report generated but could NOT be saved — copy it before closing.');
        } else {
          toast.success('Insights report generated');
          await fetchReports();
        }
        return;
      }

      const message = typeof json.error === 'string' ? json.error : '';
      if (message.includes('read-only')) {
        toast.error('Read-only access — report generation is owner-only.');
      } else {
        toast.error(message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Insight report generate error:', err);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }, [readOnly, generating, fetchReports]);

  /* ─── Derived chart data ─────────────────────────────────── */

  // Stale-payload guard: a tab left open across a deploy may lack the key.
  const proofread: ProofreadFeedbackAggregate = data?.proofreadFeedback ?? EMPTY_PROOFREAD;

  const feedbackStyleData = useMemo(
    () => toChartRows(data?.feedback.byStyle, styleLabel),
    [data],
  );

  const feedbackStoryData = useMemo(
    () => toChartRows(data?.feedback.byStoryType, storyLabel),
    [data],
  );

  const proofreadStyleData = useMemo(
    () => toChartRows(proofread.byStyle, styleLabel),
    [proofread],
  );

  const proofreadStoryData = useMemo(
    () => toChartRows(proofread.byStoryType, storyLabel),
    [proofread],
  );

  const proofreadIssueData = useMemo(
    () => toChartRows(proofread.byIssueType, issueLabel).slice(0, 10),
    [proofread],
  );

  const usageStyleData = useMemo(
    () => (data?.usage.byStyle ?? []).map((b, i) => ({
      name: styleLabel(b.key), count: b.count, fill: SERIES_FILLS[i % SERIES_FILLS.length],
    })),
    [data],
  );

  const storyStatCards = useMemo(
    () => buildStatCards(data?.feedback, 'Ratings on generated stories'),
    [data],
  );

  const proofreadStatCards = useMemo(
    () => buildStatCards(proofread, 'Ratings on proofread suggestions'),
    [proofread],
  );

  const showStories = feedbackView === 'stories' || feedbackView === 'both';
  const showProofread = feedbackView === 'proofread' || feedbackView === 'both';

  /* ─── Render ─────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {error ? (
        <LiquidCard size="standard" className="!rounded-[16px]">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertTriangle size={40} className="text-red-400 opacity-70" />
            <p className="text-[var(--text-secondary)] text-base text-center">{error}</p>
            <Button variant="secondary" size="small" onClick={fetchInsights}>
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </LiquidCard>
      ) : loading && !data ? (
        <LiquidCard size="standard">
          <div className="py-12">
            <LoadingSpinner size="medium" message="Loading insights..." />
          </div>
        </LiquidCard>
      ) : data ? (
        <>
          {/* ─── Feedback source switch ────────────────────── */}
          <LiquidCard size="compact" className="!rounded-[16px]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <MessageSquare size={22} style={{ color: 'var(--accent-bright)' }} />
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Feedback Source</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Story ratings and proofread-suggestion ratings are tracked separately.
                  </p>
                </div>
              </div>

              <div
                role="group"
                aria-label="Feedback source"
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--accent-10)] border border-[var(--accent-border)] flex-wrap"
              >
                {FEEDBACK_VIEW_OPTIONS.map(({ key, label }) => {
                  const active = feedbackView === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFeedbackView(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[var(--accent-primary)] text-white shadow-[var(--shadow-glow-sm)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--accent-20)] hover:text-[var(--accent-bright)]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </LiquidCard>

          {/* ═══ SECTION 1 — Generated Story Feedback ═══════════ */}
          {showStories && (
            <section className="space-y-4" aria-label={STORY_SECTION_TITLE}>
              <SectionHeader
                icon={FileText}
                title={STORY_SECTION_TITLE}
                caption="Thumbs up / down left on whole generated narratives."
              />

              {/* A. Stats */}
              <StatCardGrid cards={storyStatCards} />

              {/* B. Breakdown */}
              <LiquidCard size="standard" className="!rounded-[16px]">
                <div className="flex items-center gap-3 mb-4">
                  <ThumbsUp size={22} style={{ color: 'var(--accent-bright)' }} />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Feedback Breakdown</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">By narrative style</p>
                    <RatioBarChart rows={feedbackStyleData} emptyText="No feedback recorded yet." />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">By story type</p>
                    <RatioBarChart rows={feedbackStoryData} emptyText="No feedback recorded yet." />
                  </div>
                </div>
              </LiquidCard>

              {/* C. Recent thumbs-down comments */}
              <LiquidCard size="standard" className="!rounded-[16px]">
                <div className="flex items-center gap-3 mb-4">
                  <ThumbsDown size={22} style={{ color: 'var(--accent-bright)' }} />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Recent Thumbs-Down Comments
                  </h3>
                </div>

                {data.recentDownComments.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentDownComments.slice(0, 10).map((c, i) => (
                      <div
                        key={`down-${i}`}
                        className="p-3 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-15)]"
                      >
                        <p className="text-sm text-[var(--text-secondary)] mb-2 whitespace-pre-wrap">
                          {c.comment}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <ContextPill>{styleLabel(c.narrative_style ?? 'unspecified')}</ContextPill>
                          <ContextPill>{storyLabel(c.story_type ?? 'unspecified')}</ContextPill>
                          <span className="text-xs text-[var(--text-muted)] ml-auto">
                            {formatDate(c.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] text-base text-center py-8">
                    No thumbs-down comments yet.
                  </p>
                )}
              </LiquidCard>
            </section>
          )}

          {/* Divider between the two streams in BOTH mode. */}
          {showStories && showProofread && (
            <div className="border-t border-[var(--accent-15)] my-2" aria-hidden="true" />
          )}

          {/* ═══ SECTION 2 — Proofread Suggestion Feedback ══════ */}
          {showProofread && (
            <section className="space-y-4" aria-label={PROOFREAD_SECTION_TITLE}>
              <SectionHeader
                icon={SpellCheck}
                title={PROOFREAD_SECTION_TITLE}
                caption="Thumbs up / down left on individual Review & Proofread suggestions."
              />

              {/* A. Stats */}
              <StatCardGrid cards={proofreadStatCards} />

              {/* B. Breakdown — style, story type, issue type */}
              <LiquidCard size="standard" className="!rounded-[16px]">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div className="flex items-center gap-3">
                    <ThumbsUp size={22} style={{ color: 'var(--accent-bright)' }} />
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Suggestion Feedback Breakdown</h3>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-primary)]">
                        {formatCount(proofread.distinctRuns)}
                      </span>{' '}
                      proofread runs rated
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-primary)]">
                        {formatCount(proofread.distinctUsers)}
                      </span>{' '}
                      {proofread.distinctUsers === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">By narrative style</p>
                    <RatioBarChart rows={proofreadStyleData} emptyText="No suggestion feedback recorded yet." />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">By story type</p>
                    <RatioBarChart rows={proofreadStoryData} emptyText="No suggestion feedback recorded yet." />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={14} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm text-[var(--text-muted)]">By issue type (top 10)</p>
                  </div>
                  <RatioBarChart rows={proofreadIssueData} emptyText="No suggestion feedback recorded yet." />
                </div>
              </LiquidCard>

              {/* C. Recent thumbs-down comments on suggestions */}
              <LiquidCard size="standard" className="!rounded-[16px]">
                <div className="flex items-center gap-3 mb-4">
                  <ThumbsDown size={22} style={{ color: 'var(--accent-bright)' }} />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Recent Rejected Suggestions
                  </h3>
                </div>

                {proofread.recentDownComments.length > 0 ? (
                  <div className="space-y-3">
                    {proofread.recentDownComments.slice(0, 10).map((c, i) => (
                      <div
                        key={`pr-down-${i}`}
                        className="p-3 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-15)]"
                      >
                        {c.suggestion_text && (
                          <div className="mb-2 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--accent-border)]">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">
                              Suggestion
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                              {c.suggestion_text}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">
                          User feedback
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mb-2 whitespace-pre-wrap">
                          {c.comment}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <ContextPill title={c.issue_type ?? undefined}>
                            {issueLabel(c.issue_type ?? 'unspecified')}
                          </ContextPill>
                          <ContextPill>{styleLabel(c.narrative_style ?? 'unspecified')}</ContextPill>
                          <ContextPill>{storyLabel(c.story_type ?? 'unspecified')}</ContextPill>
                          <span className="text-xs text-[var(--text-muted)] ml-auto">
                            {formatDate(c.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] text-base text-center py-8">
                    No rejected suggestions with comments yet.
                  </p>
                )}
              </LiquidCard>
            </section>
          )}

          {/* ─── D. Survey summaries ───────────────────────── */}
          <LiquidCard size="standard" className="!rounded-[16px]">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardList size={22} style={{ color: 'var(--accent-bright)' }} />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Survey Results</h3>
            </div>

            {data.surveys.length > 0 ? (
              <div className="space-y-4">
                {data.surveys.map((q) => {
                  const choices = Object.entries(q.choice_counts ?? {});
                  const maxChoice = choices.reduce((m, [, n]) => (n > m ? n : m), 0);

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-15)]"
                    >
                      <div className="flex items-start gap-2 flex-wrap mb-2">
                        <h4 className="text-base font-semibold text-[var(--text-primary)] flex-1">
                          {q.question_text}
                        </h4>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            q.is_active
                              ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {q.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap mb-3">
                        <span className="text-sm text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--text-primary)]">
                            {q.total_responses}
                          </span>{' '}
                          answered
                        </span>
                        <span className="text-sm text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--text-primary)]">
                            {q.dismissed}
                          </span>{' '}
                          dismissed
                        </span>
                      </div>

                      {q.input_type === 'choice' ? (
                        choices.length > 0 ? (
                          <div className="space-y-2">
                            {choices.map(([option, count]) => (
                              <div key={`${q.id}-${option}`}>
                                <div className="flex items-center justify-between gap-3 mb-1">
                                  <span className="text-sm text-[var(--text-secondary)]">{option}</span>
                                  <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {count}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-[var(--accent-15)] overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${maxChoice > 0 ? Math.round((count / maxChoice) * 100) : 0}%`,
                                      background: 'var(--accent-primary)',
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[var(--text-muted)] text-sm text-center py-4">
                            No answers to this question yet.
                          </p>
                        )
                      ) : q.recent_text_answers.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-[var(--text-muted)]">Recent answers</p>
                          {q.recent_text_answers.map((answer, i) => (
                            <p
                              key={`${q.id}-answer-${i}`}
                              className="text-sm text-[var(--text-secondary)] px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--accent-border)] whitespace-pre-wrap"
                            >
                              {answer}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--text-muted)] text-sm text-center py-4">
                          No answers to this question yet.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-base text-center py-8">
                No survey questions yet.
              </p>
            )}
          </LiquidCard>

          {/* ─── E. Usage patterns ─────────────────────────── */}
          <LiquidCard size="standard" className="!rounded-[16px]">
            <div className="flex items-center gap-3 mb-4">
              <Activity size={22} style={{ color: 'var(--accent-bright)' }} />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Usage Patterns</h3>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-4">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {data.usage.totalGenerations.toLocaleString()}
              </span>{' '}
              narratives generated
            </p>

            <div className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-2">By narrative style</p>
              {usageStyleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(usageStyleData.length * 40, 200)}>
                  <BarChart
                    data={usageStyleData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={Y_AXIS_WIDTH} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                      {usageStyleData.map((entry, idx) => (
                        <Cell key={`usage-style-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[var(--text-muted)] text-base text-center py-8">
                  No generations recorded yet.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {RATE_LABELS.map(({ key, label }) => {
                const stat = data.usage.rates[key];
                return (
                  <div
                    key={key}
                    className="p-3 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-15)]"
                  >
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">
                      {label}
                    </p>
                    <p className="text-xl font-bold text-[var(--text-primary)]">
                      {stat.count.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--accent-bright)] mt-0.5">{stat.pct}%</p>
                  </div>
                );
              })}
            </div>
          </LiquidCard>
        </>
      ) : null}

      {/* ─── F + G. Report generator and past reports ─────── */}
      <LiquidCard size="standard" className="!rounded-[16px]">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={22} style={{ color: 'var(--accent-bright)' }} />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">AI Insights Report</h3>
        </div>

        <p className="text-sm text-[var(--text-muted)] mb-4">
          A written analysis of beta feedback, survey answers and usage patterns. Each run is a
          live, paid model call — generate sparingly.
        </p>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <p className="text-sm text-[var(--text-muted)]">
            {reports.length} {reports.length === 1 ? 'report' : 'reports'} saved
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="small"
              onClick={fetchReports}
              disabled={reportsLoading}
            >
              <RefreshCw size={16} className={reportsLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            {/* Owner-only: hidden outright for qa_tester (readOnly). */}
            {!readOnly && (
              <Button
                variant="primary"
                size="small"
                onClick={handleGenerate}
                disabled={generating}
              >
                <Sparkles size={16} className="mr-2" />
                {generating ? 'GENERATING…' : 'GENERATE INSIGHTS REPORT'}
              </Button>
            )}
          </div>
        </div>

        {reportsError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <AlertTriangle size={40} className="text-red-400 opacity-70" />
            <p className="text-[var(--text-secondary)] text-base text-center">{reportsError}</p>
            <Button variant="secondary" size="small" onClick={fetchReports}>
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        ) : reportsLoading && reports.length === 0 ? (
          <div className="py-8">
            <LoadingSpinner size="small" message="Loading past reports..." />
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-2">
            {reports.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => openReport(row)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-15)] text-left hover:bg-[var(--accent-20)] hover:border-[var(--accent-30)] transition-all cursor-pointer"
              >
                <FileText size={16} style={{ color: 'var(--accent-bright)' }} />
                <span className="text-sm text-[var(--text-primary)] font-medium">
                  {formatDateTime(row.created_at)}
                </span>
                <span className="text-sm text-[var(--text-muted)] ml-auto truncate">
                  {row.generated_by_email || 'Unknown'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-base text-center py-8">
            No reports generated yet.
          </p>
        )}
      </LiquidCard>

      {/* Report viewer — Modal already scrolls its own content. */}
      <Modal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Insights Report"
        width="max-w-3xl"
      >
        {reportLoading ? (
          <div className="py-12">
            <LoadingSpinner size="medium" message="Loading report..." />
          </div>
        ) : activeReport ? (
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-4 pb-3 border-b border-[var(--accent-15)]">
              <Clock size={15} style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm text-[var(--text-muted)]">
                {formatDateTime(activeReport.created_at)}
              </span>
              {activeReport.generated_by_email && (
                <span className="text-sm text-[var(--text-muted)] ml-auto">
                  {activeReport.generated_by_email}
                </span>
              )}
            </div>

            {activeReport.report_markdown.trim().length > 0 ? (
              <MarkdownReport markdown={activeReport.report_markdown} />
            ) : (
              <p className="text-[var(--text-muted)] text-base text-center py-8">
                This report is empty.
              </p>
            )}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-base text-center py-8">
            No report to show.
          </p>
        )}
      </Modal>
    </div>
  );
}

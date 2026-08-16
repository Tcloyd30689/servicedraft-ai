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
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Activity, Sparkles,
  FileText, ClipboardList, AlertTriangle, RefreshCw, Clock,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import MarkdownReport from '@/components/admin/MarkdownReport';
import type { InsightReport } from '@/types/database';
import type { InsightsAggregate } from '@/lib/insightsAggregate';

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
 * Satisfaction as a percentage. `ratio` is null on an empty database, so the
 * null branch (and the non-finite guard behind it) makes "NaN%" unreachable.
 */
function formatRatio(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—';
  return `${Math.round(ratio * 100)}%`;
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

interface InsightsAnalyticsProps {
  /** qa_tester — may see everything, may generate nothing (Sprint G-4a/G-4b). */
  readOnly: boolean;
}

export default function InsightsAnalytics({ readOnly }: InsightsAnalyticsProps) {
  const [data, setData] = useState<InsightsAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const feedbackStyleData = useMemo(
    () => (data?.feedback.byStyle ?? []).map((b) => ({
      name: styleLabel(b.key), up: b.up, down: b.down,
    })),
    [data],
  );

  const feedbackStoryData = useMemo(
    () => (data?.feedback.byStoryType ?? []).map((b) => ({
      name: storyLabel(b.key), up: b.up, down: b.down,
    })),
    [data],
  );

  const usageStyleData = useMemo(
    () => (data?.usage.byStyle ?? []).map((b, i) => ({
      name: styleLabel(b.key), count: b.count, fill: SERIES_FILLS[i % SERIES_FILLS.length],
    })),
    [data],
  );

  const statCards: { label: string; value: string; icon: LucideIcon; color: string; sub: string }[] =
    useMemo(() => {
      const fb = data?.feedback;
      return [
        {
          label: 'Thumbs Up',
          value: (fb?.up ?? 0).toLocaleString(),
          icon: ThumbsUp,
          color: 'var(--accent-bright)',
          sub: 'Helpful ratings',
        },
        {
          label: 'Thumbs Down',
          value: (fb?.down ?? 0).toLocaleString(),
          icon: ThumbsDown,
          color: 'var(--accent-primary)',
          sub: 'Needs work',
        },
        {
          label: 'Total Feedback',
          value: (fb?.total ?? 0).toLocaleString(),
          icon: MessageSquare,
          color: 'var(--accent-hover)',
          sub: 'Ratings recorded',
        },
        {
          label: 'Satisfaction',
          // Preformatted string — an em-dash when ratio is null, never NaN%.
          value: formatRatio(fb?.ratio ?? null),
          icon: TrendingUp,
          color: 'var(--accent-bright)',
          sub: 'Thumbs up share',
        },
      ];
    }, [data]);

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
          {/* ─── A. Feedback stats ─────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map(({ label, value, icon: Icon, color, sub }) => (
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

          {/* ─── B. Feedback by style / story type ─────────── */}
          <LiquidCard size="standard" className="!rounded-[16px]">
            <div className="flex items-center gap-3 mb-4">
              <ThumbsUp size={22} style={{ color: 'var(--accent-bright)' }} />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Feedback Breakdown</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-2">By narrative style</p>
                {feedbackStyleData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(feedbackStyleData.length * 40, 200)}
                  >
                    <BarChart
                      data={feedbackStyleData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={Y_AXIS_WIDTH} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="up" name="Thumbs up" fill="var(--accent-bright)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="down" name="Thumbs down" fill="var(--accent-30)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-[var(--text-muted)] text-base text-center py-8">
                    No feedback recorded yet.
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[var(--text-muted)] mb-2">By story type</p>
                {feedbackStoryData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(feedbackStoryData.length * 40, 200)}
                  >
                    <BarChart
                      data={feedbackStoryData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={Y_AXIS_WIDTH} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="up" name="Thumbs up" fill="var(--accent-bright)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="down" name="Thumbs down" fill="var(--accent-30)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-[var(--text-muted)] text-base text-center py-8">
                    No feedback recorded yet.
                  </p>
                )}
              </div>
            </div>
          </LiquidCard>

          {/* ─── C. Recent thumbs-down comments ────────────── */}
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
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-15)] border border-[var(--accent-20)] text-[var(--accent-bright)]">
                        {styleLabel(c.narrative_style ?? 'unspecified')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-15)] border border-[var(--accent-20)] text-[var(--accent-bright)]">
                        {storyLabel(c.story_type ?? 'unspecified')}
                      </span>
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

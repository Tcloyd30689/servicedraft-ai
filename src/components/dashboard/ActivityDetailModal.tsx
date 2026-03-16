'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { TrackerActionEntry } from '@/types/database';

// ─── Color map for action type pills ──────────────────────────
const ACTION_PILL_COLORS: Record<string, string> = {
  generate: 'var(--accent-primary)',
  regenerate: '#f59e0b',
  customize: '#8b5cf6',
  proofread: '#06b6d4',
  proofread_apply: '#06b6d4',
  save: '#22c55e',
  export_copy: '#64748b',
  export_print: '#64748b',
  export_pdf: '#ef4444',
  export_docx: '#3b82f6',
};

function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    generate: 'Generated',
    regenerate: 'Regenerated',
    customize: 'Customized',
    proofread: 'Proofread',
    proofread_apply: 'Edits Applied',
    save: 'Saved',
    export_copy: 'Copied',
    export_print: 'Printed',
    export_pdf: 'PDF Export',
    export_docx: 'Word Export',
  };
  return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${mm}/${dd}/${yyyy} at ${hours}:${minutes} ${ampm}`;
}

function formatStoryType(st: string | null): string {
  if (!st) return 'Unknown';
  if (st === 'diagnostic_only') return 'Diagnostic Only';
  if (st === 'repair_complete') return 'Repair Complete';
  return st.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TrackerDetailData {
  id: string;
  user_id: string;
  ro_number: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  story_type: string | null;
  full_narrative: string | null;
  concern: string | null;
  cause: string | null;
  correction: string | null;
  action_history: TrackerActionEntry[];
  created_at: string;
  last_action_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
  user_email: string;
}

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackerId: string | null;
  fetchDetailFn?: (trackerId: string) => Promise<TrackerDetailData>;
}

export default function ActivityDetailModal({ isOpen, onClose, trackerId, fetchDetailFn }: ActivityDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TrackerDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrativeView, setNarrativeView] = useState<'block' | 'ccc'>('block');
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!trackerId) return;
    setLoading(true);
    setError(null);
    try {
      if (fetchDetailFn) {
        const detail = await fetchDetailFn(trackerId);
        setData(detail);
      } else {
        const response = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_tracker_detail', tracker_id: trackerId }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch detail');
        }
        const result = await response.json();
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [trackerId, fetchDetailFn]);

  useEffect(() => {
    if (isOpen && trackerId) {
      fetchDetail();
      setExpandedVersions(new Set());
      setNarrativeView('block');
    }
    if (!isOpen) {
      setData(null);
      setError(null);
    }
  }, [isOpen, trackerId, fetchDetail]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const toggleVersion = (version: number) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  };

  if (!mounted) return null;

  const storyTypeColor = data?.story_type === 'repair_complete' ? '#22c55e' : 'var(--accent-primary)';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[130] flex items-start justify-center pointer-events-none p-4 pt-[20px] overflow-y-auto">
            <motion.div
              className="relative w-[85vw] max-w-5xl pointer-events-auto bg-[var(--bg-elevated)] border-2 border-[var(--accent-border)] rounded-[16px] backdrop-blur-xl shadow-[var(--shadow-glow-lg)] my-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Sticky close button (top-right) */}
              <button
                onClick={onClose}
                className="sticky top-0 float-right z-10 mt-4 mr-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1 bg-[var(--bg-elevated)] rounded-full"
                aria-label="Close modal"
              >
                <X size={22} />
              </button>

              <div className="p-6 md:p-8">
                {/* Loading state */}
                {loading && (
                  <div className="py-16">
                    <LoadingSpinner size="medium" message="Loading tracker detail..." />
                  </div>
                )}

                {/* Error state */}
                {error && !loading && (
                  <div className="py-12 text-center">
                    <p className="text-[var(--text-muted)] mb-4">{error}</p>
                    <button
                      onClick={fetchDetail}
                      className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--btn-text-on-accent)] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Data loaded */}
                {data && !loading && !error && (
                  <>
                    {/* ─── SECTION 1: Header + Vehicle Info ──────────── */}
                    <div className="mb-6">
                      <div className="flex items-start gap-3 flex-wrap mb-2">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                          R.O. #{data.ro_number || '—'}
                        </h2>
                        {data.story_type && (
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${storyTypeColor} 15%, transparent)`,
                              color: storyTypeColor,
                              border: `1.5px solid ${storyTypeColor}`,
                            }}
                          >
                            {formatStoryType(data.story_type)}
                          </span>
                        )}
                      </div>
                      {(data.vehicle_year || data.vehicle_make || data.vehicle_model) && (
                        <p className="text-lg text-[var(--text-secondary)] font-medium mb-1">
                          {[data.vehicle_year, data.vehicle_make, data.vehicle_model].filter(Boolean).join(' ')}
                        </p>
                      )}
                      <p className="text-sm text-[var(--text-muted)]">
                        Generated on {formatTimestamp(data.created_at)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {[data.user_first_name, data.user_last_name].filter(Boolean).join(' ') || 'Unknown'} — {data.user_email}
                      </p>
                    </div>

                    {/* ─── SECTION 2: Current Narrative ────────────── */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">Current Narrative</h3>
                        <div className="h-[2px] flex-1 bg-[var(--accent-15)]" />
                      </div>
                      {/* Toggle buttons */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setNarrativeView('block')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            narrativeView === 'block'
                              ? 'bg-[var(--accent-primary)] text-[var(--btn-text-on-accent)]'
                              : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                          }`}
                        >
                          Block
                        </button>
                        <button
                          onClick={() => setNarrativeView('ccc')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            narrativeView === 'ccc'
                              ? 'bg-[var(--accent-primary)] text-[var(--btn-text-on-accent)]'
                              : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                          }`}
                        >
                          C/C/C
                        </button>
                      </div>

                      {narrativeView === 'block' ? (
                        <div className="whitespace-pre-wrap bg-[var(--bg-input)] p-4 rounded-lg text-sm max-h-[400px] overflow-y-auto border border-[var(--accent-border)] text-[var(--text-secondary)] leading-relaxed">
                          {data.full_narrative || 'No narrative available.'}
                        </div>
                      ) : (
                        <div className="bg-[var(--bg-input)] p-4 rounded-lg max-h-[400px] overflow-y-auto border border-[var(--accent-border)] space-y-4">
                          {[
                            { label: 'CONCERN', text: data.concern },
                            { label: 'CAUSE', text: data.cause },
                            { label: 'CORRECTION', text: data.correction },
                          ].map((section, i) => (
                            <div key={section.label}>
                              {i > 0 && <div className="border-t border-[var(--accent-10)] mb-3" />}
                              <p className="text-xs font-bold tracking-wider mb-1" style={{ color: 'var(--accent-bright)' }}>
                                {section.label}:
                              </p>
                              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                                {section.text || '—'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ─── SECTION 3: Activity Timeline ──────────── */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">Activity Timeline</h3>
                        <div className="h-[2px] flex-1 bg-[var(--accent-15)]" />
                      </div>

                      {data.action_history && data.action_history.length > 0 ? (
                        <div className="relative pl-6">
                          {/* Vertical timeline line */}
                          <div
                            className="absolute left-[9px] top-2 bottom-2 w-[2px]"
                            style={{ backgroundColor: 'var(--accent-30)' }}
                          />

                          <div className="space-y-4">
                            {data.action_history.map((entry, idx) => {
                              const pillColor = ACTION_PILL_COLORS[entry.action] || 'var(--accent-primary)';
                              const hasVersion = typeof entry.version === 'number';
                              const isExpandable = hasVersion && entry.narrative_text;
                              const isExpanded = hasVersion && expandedVersions.has(entry.version!);

                              // Check if customization has non-standard settings
                              const cust = entry.customization;
                              const hasCustomSettings = cust && (
                                (cust.length && cust.length !== 'standard') ||
                                (cust.tone && cust.tone !== 'standard') ||
                                (cust.detail && cust.detail !== 'standard')
                              );

                              return (
                                <div key={idx} className="relative">
                                  {/* Timeline dot */}
                                  <div
                                    className="absolute -left-6 top-[6px] w-[14px] h-[14px] rounded-full border-2"
                                    style={{
                                      borderColor: pillColor,
                                      backgroundColor: `color-mix(in srgb, ${pillColor} 30%, transparent)`,
                                    }}
                                  />

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Action pill badge */}
                                      <span
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                                        style={{
                                          backgroundColor: `color-mix(in srgb, ${pillColor} 15%, transparent)`,
                                          color: pillColor,
                                          border: `1px solid ${pillColor}`,
                                        }}
                                      >
                                        {formatActionLabel(entry.action)}
                                      </span>

                                      {/* Version badge */}
                                      {hasVersion && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-10)] text-[var(--text-muted)]">
                                          Version {entry.version}
                                        </span>
                                      )}

                                      {/* Timestamp */}
                                      <span className="text-xs text-[var(--text-muted)]">
                                        {formatTimestamp(entry.at)}
                                      </span>

                                      {/* Expand toggle for versioned entries */}
                                      {isExpandable && (
                                        <button
                                          onClick={() => toggleVersion(entry.version!)}
                                          className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer p-0.5"
                                          title={isExpanded ? 'Collapse' : 'Expand narrative snapshot'}
                                        >
                                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                      )}
                                    </div>

                                    {/* Customization tags */}
                                    {hasCustomSettings && (
                                      <div className="mt-1.5 flex gap-1.5 flex-wrap">
                                        {cust!.length && cust!.length !== 'standard' && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-5)] text-[var(--text-muted)]">
                                            Length: {cust!.length.charAt(0).toUpperCase() + cust!.length.slice(1)}
                                          </span>
                                        )}
                                        {cust!.tone && cust!.tone !== 'standard' && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-5)] text-[var(--text-muted)]">
                                            Tone: {cust!.tone.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                          </span>
                                        )}
                                        {cust!.detail && cust!.detail !== 'standard' && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-5)] text-[var(--text-muted)]">
                                            Detail: {cust!.detail.charAt(0).toUpperCase() + cust!.detail.slice(1)}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Expanded version snapshot */}
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="mt-2">
                                            <p className="text-[10px] text-[var(--text-muted)] mb-1">
                                              Narrative at Version {entry.version}
                                            </p>
                                            <div className="whitespace-pre-wrap bg-[var(--bg-input)] p-3 rounded-lg text-xs max-h-[250px] overflow-y-auto border border-[var(--accent-10)] text-[var(--text-muted)] leading-relaxed opacity-90">
                                              {entry.narrative_text || 'No snapshot available.'}
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text-muted)]">No activity recorded.</p>
                      )}
                    </div>

                    {/* ─── Bottom Close Button ──────────────────── */}
                    <div className="mt-8 flex justify-center">
                      <motion.button
                        onClick={onClose}
                        className="px-8 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--btn-text-on-accent)] text-sm font-semibold cursor-pointer transition-opacity"
                        whileHover={{ scale: 1.05, boxShadow: 'var(--shadow-glow-sm)' }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        CLOSE
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

'use client';

import { useState, useEffect } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, FileText, Mail, ArrowUpCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { downloadExport } from '@/lib/exportUtils';
import type { ExportPayload } from '@/lib/exportUtils';
import EmailExportModal from '@/components/narrative/EmailExportModal';
import UpdateWithRepairModal from '@/components/dashboard/UpdateWithRepairModal';
import RestoreVersionModal from '@/components/dashboard/RestoreVersionModal';
import type { Narrative, NarrativeHistoryEntry } from '@/types/database';

// ─── Color map for action type pills (duplicated from ActivityDetailModal) ───
const ACTION_PILL_COLORS: Record<string, string> = {
  generate: 'var(--accent-primary)',
  initial_save: 'var(--accent-primary)',
  regenerate: '#f59e0b',
  customize: '#8b5cf6',
  proofread_apply: '#06b6d4',
  manual_edit: '#e879f9',
  auto_save: '#64748b',
  manual_save: '#22c55e',
  restore: '#14b8a6',
};

// ─── Narrative style literal → display words (guarded: unknown literals fall back) ───
const NARRATIVE_STYLE_LABELS: Record<string, string> = {
  customer_pay: 'Customer Pay',
  extended_warranty: 'Extended Warranty',
  manufacturer_warranty: 'Manufacturer Warranty',
};

/**
 * Human label for a history entry's action.
 * `prevEntry` is the entry immediately before this one in version-ascending order —
 * used to detect a narrative-style CHANGE on `regenerate` entries. Legacy entries carry
 * no `narrative_style`, so they always fall back to the plain label.
 * Labels stay Title Case here; the pill renders them uppercase via the `uppercase` utility.
 */
function formatActionLabel(entry: NarrativeHistoryEntry, prevEntry?: NarrativeHistoryEntry): string {
  const labels: Record<string, string> = {
    generate: 'Generated',
    initial_save: 'Initial Save',
    regenerate: 'Regenerated',
    customize: 'Customized',
    proofread_apply: 'Edits Applied',
    manual_edit: 'Manually Edited',
    auto_save: 'Auto-saved',
    manual_save: 'Saved',
    restore: 'Restored',
  };

  const action = entry.action;

  if (action === 'regenerate') {
    const current = entry.narrative_style;
    const previous = prevEntry?.narrative_style;
    // Only tag when BOTH sides are known and the style actually changed.
    if (current && previous && current !== previous) {
      const styleWords = NARRATIVE_STYLE_LABELS[current];
      if (styleWords) return `${labels.regenerate} - ${styleWords}`;
    }
    // Otherwise fall through to the plain 'Regenerated' label below.
  }

  return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** True when a history field actually holds content (guards '' and whitespace-only). */
function hasText(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
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

interface NarrativeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: Narrative | null;
  senderName?: string;
  senderShortName?: string;
  /** Fired after a version restore succeeds, so the parent list can refresh. */
  onRestored?: () => void;
}

export default function NarrativeDetailModal({
  isOpen,
  onClose,
  narrative,
  senderName,
  senderShortName,
  onRestored,
}: NarrativeDetailModalProps) {
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // Starts NULL — only a user click on a version's Restore button sets it, so the
  // restore modal can never register on the overlay stack in the same commit as
  // this one. `isOpen` below is a plain boolean derived from it.
  const [restoreEntry, setRestoreEntry] = useState<NarrativeHistoryEntry | null>(null);

  // Version history state
  const [actionHistory, setActionHistory] = useState<NarrativeHistoryEntry[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  // Per-version Block / C-C-C format, keyed by entry.version. Unset === 'ccc'.
  const [versionFormats, setVersionFormats] = useState<Record<number, 'block' | 'ccc'>>({});
  // Bumped on a successful restore to re-run the history fetch below, which
  // otherwise only fires when the modal opens or the narrative changes.
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Live copy of the narrative row. The `narrative` prop is owned by the parent
  // list and goes stale the moment a restore rewrites the row, so display and
  // exports read THIS instead. Re-seeded during render (not in an effect) when the
  // parent selects a different row, so a new selection never paints stale text.
  const [liveNarrative, setLiveNarrative] = useState<Narrative | null>(narrative);
  const [seededId, setSeededId] = useState<string | null>(narrative?.id ?? null);
  if ((narrative?.id ?? null) !== seededId) {
    setSeededId(narrative?.id ?? null);
    setLiveNarrative(narrative);
  }

  // Fetch full narrative detail (including action_history) when modal opens
  useEffect(() => {
    if (!isOpen || !narrative?.id) {
      setActionHistory([]);
      setExpandedVersions(new Set());
      setVersionFormats({});
      setRestoreEntry(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/narratives/${narrative.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.narrative?.action_history)) {
          setActionHistory(data.narrative.action_history);
        }
      } catch {
        // Silently fail — version history is supplementary
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, narrative?.id, historyRefresh]);

  if (!narrative) return null;

  // Everything below reads `view`, not the raw prop: after a restore it holds the
  // restored text while the parent's copy is still stale.
  const view = liveNarrative ?? narrative;

  const createdDate = new Date(view.created_at).toLocaleDateString();
  const updatedDate = new Date(view.updated_at || view.created_at).toLocaleDateString();
  const updatedTime = new Date(view.updated_at || view.created_at).toLocaleTimeString();

  const vehicleInfo = {
    year: view.vehicle_year ? String(view.vehicle_year) : '',
    make: view.vehicle_make || '',
    model: view.vehicle_model || '',
    roNumber: view.ro_number || '',
  };

  /** Normalize saved-narrative fields to the shared ExportPayload format */
  const buildPayload = (): ExportPayload => ({
    narrative: {
      block_narrative: view.full_narrative || '',
      concern: view.concern || '',
      cause: view.cause || '',
      correction: view.correction || '',
    },
    displayFormat: 'ccc',
    vehicleInfo,
    preparedBy: senderShortName || '',
  });

  /**
   * A restore succeeded. Mirror the restored text locally so this modal shows it
   * immediately, bump the history fetch so the new `Restored` entry appears
   * without closing, then let the parent list refresh itself.
   */
  const handleRestored = (restored: {
    block_narrative: string;
    concern: string;
    cause: string;
    correction: string;
  }) => {
    setLiveNarrative((prev) =>
      prev
        ? {
            ...prev,
            full_narrative: restored.block_narrative,
            concern: restored.concern,
            cause: restored.cause,
            correction: restored.correction,
            updated_at: new Date().toISOString(),
          }
        : prev,
    );
    setHistoryRefresh((n) => n + 1);
    onRestored?.();
  };

  const handleCopy = async () => {
    const text = `CONCERN:\n${view.concern || ''}\n\nCAUSE:\n${view.cause || ''}\n\nCORRECTION:\n${view.correction || ''}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleOpenPdf = async () => {
    setIsOpeningPdf(true);
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, '_blank');

      if (!tab) {
        toast.error('Pop-up blocked — please allow pop-ups for this site');
        URL.revokeObjectURL(url);
        return;
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setIsOpeningPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      await downloadExport('docx', buildPayload());
      toast.success('Word document downloaded');
    } catch {
      toast.error('Failed to generate Word document');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const toggleVersion = (version: number) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  };

  /** Enter / Space activate the row header when it is acting as a button. */
  const handleHeaderKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>, version: number) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); // Space must not scroll the modal
      toggleVersion(version);
    }
  };

  const setVersionFormat = (version: number, format: 'block' | 'ccc') => {
    setVersionFormats((prev) => ({ ...prev, [version]: format }));
  };

  const isExporting = isOpeningPdf || isGeneratingDocx;

  // Sort history by version ascending (chronological)
  const sortedHistory = [...actionHistory].sort((a, b) => a.version - b.version);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saved Narrative" width="max-w-5xl">
      {/* Meta Info */}
      <div className="font-data flex flex-wrap gap-4 text-sm text-[var(--text-muted)] mb-4">
        <span><span className="text-[var(--text-secondary)]">R.O. #:</span> {view.ro_number || 'N/A'}</span>
        <span><span className="text-[var(--text-secondary)]">Vehicle:</span> {view.vehicle_year || ''} {view.vehicle_make || ''} {view.vehicle_model || ''}</span>
        <span><span className="text-[var(--text-secondary)]">Created:</span> {createdDate}</span>
        <span><span className="text-[var(--text-secondary)]">Last Updated:</span> {updatedDate} {updatedTime}</span>
        <span><span className="text-[var(--text-secondary)]">Type:</span> {view.story_type === 'diagnostic_only' ? 'Diagnostic Only' : 'Repair Complete'}</span>
      </div>

      {/* Concern */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-1">Concern</h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
          <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">{view.concern || '—'}</p>
        </div>
      </div>

      {/* Cause */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-1">Cause</h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
          <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">{view.cause || '—'}</p>
        </div>
      </div>

      {/* Correction */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-1">Correction</h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
          <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">{view.correction || '—'}</p>
        </div>
      </div>

      {/* Update with Repair button — only for diagnostic_only narratives */}
      {view.story_type === 'diagnostic_only' && (
        <div className="mb-4">
          <Button
            size="fullWidth"
            onClick={() => setShowUpdateModal(true)}
            className="flex items-center justify-center gap-2"
          >
            <ArrowUpCircle size={16} />
            UPDATE NARRATIVE WITH REPAIR
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          size="medium"
          onClick={handleCopy}
          className="flex items-center gap-2"
        >
          <Copy size={15} />
          COPY
        </Button>
        <Button
          variant="secondary"
          size="medium"
          onClick={handleOpenPdf}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <ExternalLink size={15} />
          {isOpeningPdf ? 'OPENING...' : 'VIEW / PRINT / DOWNLOAD'}
        </Button>
        <Button
          variant="secondary"
          size="medium"
          onClick={handleDownloadDocx}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <FileText size={15} />
          {isGeneratingDocx ? 'DOCX...' : 'WORD'}
        </Button>
        <Button
          variant="secondary"
          size="medium"
          onClick={() => setShowEmailModal(true)}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Mail size={15} />
          EMAIL
        </Button>
      </div>

      {/* Version History — only show if 2+ entries */}
      {sortedHistory.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide">Version History</h4>
            <div className="h-[2px] flex-1 bg-[var(--accent-15)]" />
          </div>

          <div className="relative pl-6">
            {/* Vertical timeline line */}
            <div
              className="absolute left-[9px] top-2 bottom-2 w-[2px]"
              style={{ backgroundColor: 'var(--accent-30)' }}
            />

            <div className="space-y-4">
              {sortedHistory.map((entry, idx) => {
                const pillColor = ACTION_PILL_COLORS[entry.action] || 'var(--accent-primary)';
                // Previous entry in version-ascending order (not previous of the same action).
                const prevEntry = idx > 0 ? sortedHistory[idx - 1] : undefined;
                const hasBlock = hasText(entry.narrative_text);
                const hasCcc = hasText(entry.concern) || hasText(entry.cause) || hasText(entry.correction);
                // Lightweight events (no block text AND no C/C/C) are non-expandable markers.
                const isExpandable = hasBlock || hasCcc;
                const isExpanded = isExpandable && expandedVersions.has(entry.version);
                const versionFormat = versionFormats[entry.version] ?? 'ccc';

                return (
                  <div key={`${entry.version}-${entry.at}`} className="relative">
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-6 top-[6px] w-[14px] h-[14px] rounded-full border-2"
                      style={{
                        borderColor: pillColor,
                        backgroundColor: `color-mix(in srgb, ${pillColor} 30%, transparent)`,
                      }}
                    />

                    <div className="min-w-0">
                      {/* Row header — the ENTIRE badge row is the click target when expandable.
                          Kept as a SIBLING of the expanded body below so toggle clicks can never
                          bubble back into it and collapse the row. */}
                      <div
                        className={`group flex items-center gap-2 flex-wrap rounded-lg px-2 py-1 -mx-2 ${
                          isExpandable
                            ? 'cursor-pointer transition-all duration-200 hover:bg-[var(--accent-10)] hover:shadow-[0_0_10px_var(--accent-15)]'
                            : ''
                        }`}
                        role={isExpandable ? 'button' : undefined}
                        tabIndex={isExpandable ? 0 : undefined}
                        aria-expanded={isExpandable ? isExpanded : undefined}
                        onClick={isExpandable ? () => toggleVersion(entry.version) : undefined}
                        onKeyDown={isExpandable ? (e) => handleHeaderKeyDown(e, entry.version) : undefined}
                        title={isExpandable ? (isExpanded ? 'Collapse' : 'Expand narrative snapshot') : undefined}
                      >
                        {/* Action pill badge */}
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${pillColor} 15%, transparent)`,
                            color: pillColor,
                            border: `1px solid ${pillColor}`,
                          }}
                        >
                          {formatActionLabel(entry, prevEntry)}
                        </span>

                        {/* Version badge */}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-10)] text-[var(--text-muted)]">
                          Version {entry.version}
                        </span>

                        {/* Timestamp */}
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatTimestamp(entry.at)}
                        </span>

                        {/* Expand indicator — NON-interactive (the whole row header is the button) */}
                        {isExpandable && (
                          <span
                            aria-hidden="true"
                            className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors p-0.5"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </div>

                      {/* Expanded version snapshot — SIBLING of the clickable header above */}
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

                              {versionFormat === 'block' ? (
                                <div className="whitespace-pre-wrap bg-[var(--bg-input)] p-3 rounded-lg text-xs border border-[var(--accent-10)] text-[var(--text-muted)] leading-relaxed opacity-90">
                                  {hasBlock
                                    ? entry.narrative_text
                                    : 'No block narrative recorded for this version.'}
                                </div>
                              ) : (
                                <div className="bg-[var(--bg-input)] p-3 rounded-lg text-xs border border-[var(--accent-10)] text-[var(--text-muted)] leading-relaxed opacity-90">
                                  {[
                                    { label: 'Concern', text: entry.concern },
                                    { label: 'Cause', text: entry.cause },
                                    { label: 'Correction', text: entry.correction },
                                  ].map((section, i) => (
                                    <div key={section.label}>
                                      {i > 0 && <div className="border-t border-[var(--accent-10)] my-3" />}
                                      <p className="text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wide">
                                        {section.label}
                                      </p>
                                      <p className="whitespace-pre-wrap">
                                        {hasText(section.text)
                                          ? section.text
                                          : 'Not recorded for this version.'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Per-version format toggle — real buttons, outside the clickable header */}
                              <div className="flex gap-2 mt-2">
                                {([
                                  { value: 'block' as const, label: 'Block' },
                                  { value: 'ccc' as const, label: 'C/C/C' },
                                ]).map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVersionFormat(entry.version, opt.value);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                      versionFormat === opt.value
                                        ? 'bg-[var(--accent-primary)] text-[var(--btn-text-on-accent)]'
                                        : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}

                                {/* Restore trigger — a real <button> in the expanded body, which is
                                    a SIBLING of the clickable row header, so there is no nested
                                    button. stopPropagation matches the toggles above. Only reachable
                                    on expandable entries, since this row only renders when expanded. */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRestoreEntry(entry);
                                  }}
                                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border border-[var(--accent-vivid)] text-[var(--accent-vivid)] hover:bg-[var(--accent-10)]"
                                  title={`Restore Version ${entry.version}`}
                                >
                                  <RotateCcw size={12} />
                                  Restore This Version
                                </button>
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
        </div>
      )}

      <EmailExportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        narrative={{
          block_narrative: view.full_narrative || '',
          concern: view.concern || '',
          cause: view.cause || '',
          correction: view.correction || '',
        }}
        displayFormat="ccc"
        vehicleInfo={vehicleInfo}
        senderName={senderName || ''}
        senderShortName={senderShortName}
        storyType={view.story_type}
        narrativeStyle={view.narrative_style ?? null}
      />

      <UpdateWithRepairModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
        }}
        narrative={view}
      />

      <RestoreVersionModal
        isOpen={!!restoreEntry}
        onClose={() => setRestoreEntry(null)}
        entry={restoreEntry}
        narrativeId={view.id}
        vehicleInfo={vehicleInfo}
        displayFormat={restoreEntry ? (versionFormats[restoreEntry.version] ?? 'ccc') : 'ccc'}
        senderName={senderName || ''}
        senderShortName={senderShortName}
        storyType={view.story_type}
        narrativeStyle={restoreEntry?.narrative_style ?? view.narrative_style ?? null}
        onRestored={handleRestored}
      />
    </Modal>
  );
}

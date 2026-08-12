'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, FileText, Mail, RotateCcw } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { downloadExport } from '@/lib/exportUtils';
import type { ExportPayload } from '@/lib/exportUtils';
import EmailExportModal from '@/components/narrative/EmailExportModal';
import type { NarrativeHistoryEntry } from '@/types/database';

/**
 * Timestamp shape copied verbatim from NarrativeDetailModal's history timeline so
 * the version named here reads identically to the row the user clicked.
 */
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

/** True when a history field actually holds content (guards '' and whitespace-only). */
function hasText(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

interface RestoreVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The version being restored. Nullable so the parent can clear its selection on close. */
  entry: NarrativeHistoryEntry | null;
  /** Parent `narratives` row id — the PATCH target. */
  narrativeId: string;
  vehicleInfo: { year: string; make: string; model: string; roNumber: string };
  /** The format the user had selected for this version in the history timeline. */
  displayFormat: 'block' | 'ccc';
  senderName: string;
  senderShortName?: string;
  storyType?: 'diagnostic_only' | 'repair_complete' | null;
  narrativeStyle?: string | null;
  onRestored: (restored: {
    block_narrative: string;
    concern: string;
    cause: string;
    correction: string;
  }) => void;
}

export default function RestoreVersionModal({
  isOpen,
  onClose,
  entry: entryProp,
  narrativeId,
  vehicleInfo,
  displayFormat,
  senderName,
  senderShortName,
  storyType,
  narrativeStyle,
  onRestored,
}: RestoreVersionModalProps) {
  // Nested overlay flags — both start FALSE and are only ever flipped by a user
  // click, so this modal (and the email modal inside it) always registers on the
  // overlay stack strictly AFTER the modal that owns it.
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Remember the last non-null entry so the 200ms close fade still has content to
  // paint after the parent clears its selection. React's documented "adjust state
  // during render" pattern — it re-renders before paint, so there is no flash on
  // open either (an effect would land one frame late).
  const [lastEntry, setLastEntry] = useState<NarrativeHistoryEntry | null>(entryProp);
  if (entryProp && entryProp !== lastEntry) setLastEntry(entryProp);
  const entry = entryProp ?? lastEntry;

  const isExporting = isOpeningPdf || isGeneratingDocx;

  /**
   * Export payload built from THIS VERSION's snapshot — never the narrative's
   * current text. `narrative_text` is the history layer's name for the block
   * narrative; the export layer calls the same value `block_narrative`.
   */
  const buildSnapshotPayload = (): ExportPayload => ({
    narrative: {
      block_narrative: entry?.narrative_text || '',
      concern: entry?.concern || '',
      cause: entry?.cause || '',
      correction: entry?.correction || '',
    },
    displayFormat,
    vehicleInfo,
    preparedBy: senderShortName || '',
  });

  const handleCopy = async () => {
    const text = `CONCERN:\n${entry?.concern || ''}\n\nCAUSE:\n${entry?.cause || ''}\n\nCORRECTION:\n${entry?.correction || ''}`;
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
        body: JSON.stringify(buildSnapshotPayload()),
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
      await downloadExport('docx', buildSnapshotPayload());
      toast.success('Word document downloaded');
    } catch {
      toast.error('Failed to generate Word document');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  /**
   * Restore this snapshot as the narrative's current text.
   *
   * The client NEVER sends `action_history` — the PATCH route reads the existing
   * history, computes maxVersion + 1, and appends server-side. Sending an array
   * from here is exactly the truncation risk this design avoids.
   *
   * `action_type` is the literal 'restore'. It must never be 'auto_save', which
   * the route treats as a rolling in-place REPLACE of the last history entry.
   */
  const handleRestore = async () => {
    if (!entry || isRestoring) return;

    const restored = {
      block_narrative: entry.narrative_text || '',
      concern: entry.concern || '',
      cause: entry.cause || '',
      correction: entry.correction || '',
    };

    setIsRestoring(true);
    try {
      const res = await fetch(`/api/narratives/${narrativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'restore',
          narrative: restored,
          ...(entry.narrative_style ? { narrative_style: entry.narrative_style } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || 'Failed to restore this version');
        return; // Modal stays open; onRestored is NOT called.
      }

      toast.success(`Version ${entry.version} restored`);
      onRestored(restored);
      onClose();
    } catch {
      toast.error('Failed to restore this version');
    } finally {
      setIsRestoring(false);
    }
  };

  const sections = [
    { label: 'Concern', text: entry?.concern },
    { label: 'Cause', text: entry?.cause },
    { label: 'Correction', text: entry?.correction },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restore Version"
      width="max-w-3xl"
      backdropClassName="bg-black/90 backdrop-blur-[24px]"
    >
      {entry && (
        <>
          {/* Which version, and when it was recorded */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Version {entry.version}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Recorded {formatTimestamp(entry.at)}
            </p>
          </div>

          {/* This version's narrative, in the format the user was viewing */}
          {displayFormat === 'block' ? (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-1">
                Narrative
              </h4>
              <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
                <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">
                  {hasText(entry.narrative_text)
                    ? entry.narrative_text
                    : 'No block narrative recorded for this version.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-5 space-y-4">
              {sections.map((section) => (
                <div key={section.label}>
                  <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-1">
                    {section.label}
                  </h4>
                  <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
                    <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">
                      {hasText(section.text) ? section.text : 'Not recorded for this version.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exports — every one of these exports THIS VERSION's snapshot */}
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

          {/* The restore action itself — the primary, unmistakable choice */}
          <div className="pt-4 border-t border-[var(--accent-15)]">
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Restoring replaces this narrative&apos;s current text with the version above. Nothing
              is deleted — the restore is recorded as a new entry in the version history.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="medium"
                onClick={handleRestore}
                disabled={isRestoring}
                className="flex items-center gap-2"
              >
                <RotateCcw size={15} />
                {isRestoring ? 'RESTORING...' : 'RESTORE THIS VERSION'}
              </Button>
              <Button
                variant="ghost"
                size="medium"
                onClick={onClose}
                disabled={isRestoring}
                className="flex items-center gap-2"
              >
                CANCEL
              </Button>
            </div>
          </div>

          <EmailExportModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            narrative={{
              block_narrative: entry.narrative_text || '',
              concern: entry.concern || '',
              cause: entry.cause || '',
              correction: entry.correction || '',
            }}
            displayFormat={displayFormat}
            vehicleInfo={vehicleInfo}
            senderName={senderName}
            senderShortName={senderShortName}
            storyType={storyType}
            narrativeStyle={narrativeStyle ?? null}
          />
        </>
      )}
    </Modal>
  );
}

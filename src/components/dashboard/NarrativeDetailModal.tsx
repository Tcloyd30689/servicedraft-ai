'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, FileText, Mail, ArrowUpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { downloadExport } from '@/lib/exportUtils';
import type { ExportPayload } from '@/lib/exportUtils';
import EmailExportModal from '@/components/narrative/EmailExportModal';
import UpdateWithRepairModal from '@/components/dashboard/UpdateWithRepairModal';
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
};

function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    generate: 'Generated',
    initial_save: 'Initial Save',
    regenerate: 'Regenerated',
    customize: 'Customized',
    proofread_apply: 'Edits Applied',
    manual_edit: 'Manually Edited',
    auto_save: 'Auto-saved',
    manual_save: 'Saved',
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

interface NarrativeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: Narrative | null;
  senderName?: string;
}

export default function NarrativeDetailModal({
  isOpen,
  onClose,
  narrative,
  senderName,
}: NarrativeDetailModalProps) {
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Version history state
  const [actionHistory, setActionHistory] = useState<NarrativeHistoryEntry[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());

  // Fetch full narrative detail (including action_history) when modal opens
  useEffect(() => {
    if (!isOpen || !narrative?.id) {
      setActionHistory([]);
      setExpandedVersions(new Set());
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
  }, [isOpen, narrative?.id]);

  if (!narrative) return null;

  const createdDate = new Date(narrative.created_at).toLocaleDateString();
  const updatedDate = new Date(narrative.updated_at || narrative.created_at).toLocaleDateString();
  const updatedTime = new Date(narrative.updated_at || narrative.created_at).toLocaleTimeString();

  /** Normalize saved-narrative fields to the shared ExportPayload format */
  const buildPayload = (): ExportPayload => ({
    narrative: {
      block_narrative: narrative.full_narrative || '',
      concern: narrative.concern || '',
      cause: narrative.cause || '',
      correction: narrative.correction || '',
    },
    displayFormat: 'ccc',
    vehicleInfo: {
      year: narrative.vehicle_year ? String(narrative.vehicle_year) : '',
      make: narrative.vehicle_make || '',
      model: narrative.vehicle_model || '',
      roNumber: narrative.ro_number || '',
    },
  });

  const handleCopy = async () => {
    const text = `CONCERN:\n${narrative.concern || ''}\n\nCAUSE:\n${narrative.cause || ''}\n\nCORRECTION:\n${narrative.correction || ''}`;
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

  const isExporting = isOpeningPdf || isGeneratingDocx;

  // Sort history by version ascending (chronological)
  const sortedHistory = [...actionHistory].sort((a, b) => a.version - b.version);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saved Narrative" width="max-w-5xl">
      {/* Meta Info */}
      <div className="font-data flex flex-wrap gap-4 text-sm text-[var(--text-muted)] mb-4">
        <span><span className="text-[var(--text-secondary)]">R.O. #:</span> {narrative.ro_number || 'N/A'}</span>
        <span><span className="text-[var(--text-secondary)]">Vehicle:</span> {narrative.vehicle_year || ''} {narrative.vehicle_make || ''} {narrative.vehicle_model || ''}</span>
        <span><span className="text-[var(--text-secondary)]">Created:</span> {createdDate}</span>
        <span><span className="text-[var(--text-secondary)]">Last Updated:</span> {updatedDate} {updatedTime}</span>
        <span><span className="text-[var(--text-secondary)]">Type:</span> {narrative.story_type === 'diagnostic_only' ? 'Diagnostic Only' : 'Repair Complete'}</span>
      </div>

      {/* Concern */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-1">Concern</h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
          <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">{narrative.concern || '—'}</p>
        </div>
      </div>

      {/* Cause */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-1">Cause</h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
          <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">{narrative.cause || '—'}</p>
        </div>
      </div>

      {/* Correction */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-1">Correction</h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
          <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">{narrative.correction || '—'}</p>
        </div>
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
                const isExpandable = !!entry.narrative_text;
                const isExpanded = expandedVersions.has(entry.version);

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
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-10)] text-[var(--text-muted)]">
                          Version {entry.version}
                        </span>

                        {/* Timestamp */}
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatTimestamp(entry.at)}
                        </span>

                        {/* Expand toggle */}
                        {isExpandable && (
                          <button
                            onClick={() => toggleVersion(entry.version)}
                            className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer p-0.5"
                            title={isExpanded ? 'Collapse' : 'Expand narrative snapshot'}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>

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
        </div>
      )}

      {/* Update with Repair button — only for diagnostic_only narratives */}
      {narrative.story_type === 'diagnostic_only' && (
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
      <div className="flex flex-wrap gap-3">
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

      <EmailExportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        narrative={{
          block_narrative: narrative.full_narrative || '',
          concern: narrative.concern || '',
          cause: narrative.cause || '',
          correction: narrative.correction || '',
        }}
        displayFormat="ccc"
        vehicleInfo={{
          year: narrative.vehicle_year ? String(narrative.vehicle_year) : '',
          make: narrative.vehicle_make || '',
          model: narrative.vehicle_model || '',
          roNumber: narrative.ro_number || '',
        }}
        senderName={senderName || ''}
      />

      <UpdateWithRepairModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
        }}
        narrative={narrative}
      />
    </Modal>
  );
}

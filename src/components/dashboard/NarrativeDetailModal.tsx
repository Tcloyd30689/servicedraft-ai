'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, FileText, Mail, ArrowUpCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { downloadExport } from '@/lib/exportUtils';
import type { ExportPayload } from '@/lib/exportUtils';
import EmailExportModal from '@/components/narrative/EmailExportModal';
import UpdateWithRepairModal from '@/components/dashboard/UpdateWithRepairModal';
import type { Narrative } from '@/types/database';

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

  const isExporting = isOpeningPdf || isGeneratingDocx;

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

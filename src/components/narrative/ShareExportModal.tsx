'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, FileText, Mail } from 'lucide-react';
import { logActivity } from '@/lib/activityLogger';
import { updateTrackerAction } from '@/lib/narrativeTracker';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { downloadExport } from '@/lib/exportUtils';
import type { ExportPayload } from '@/lib/exportUtils';
import EmailExportModal from '@/components/narrative/EmailExportModal';
import type { NarrativeData } from '@/stores/narrativeStore';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  trackerId?: string | null;
  vehicleInfo?: { year?: string; make?: string; model?: string; roNumber?: string };
  senderName?: string;
  onBeforeExport?: () => Promise<void>;
}

export default function ShareExportModal({
  isOpen,
  onClose,
  narrative,
  displayFormat,
  trackerId,
  vehicleInfo,
  senderName,
  onBeforeExport,
}: ShareExportModalProps) {
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const getTextContent = (): string => {
    if (displayFormat === 'block') {
      return narrative.block_narrative;
    }
    return `CONCERN:\n${narrative.concern}\n\nCAUSE:\n${narrative.cause}\n\nCORRECTION:\n${narrative.correction}`;
  };

  /** Build the normalized payload used by PDF, DOCX, and Print exports */
  const buildPayload = (): ExportPayload => ({
    narrative: {
      block_narrative: narrative.block_narrative,
      concern: narrative.concern,
      cause: narrative.cause,
      correction: narrative.correction,
    },
    displayFormat,
    vehicleInfo: {
      year: vehicleInfo?.year || '',
      make: vehicleInfo?.make || '',
      model: vehicleInfo?.model || '',
      roNumber: vehicleInfo?.roNumber || '',
    },
  });

  const handleCopy = async () => {
    try {
      await onBeforeExport?.();
      await navigator.clipboard.writeText(getTextContent());
      if (trackerId) updateTrackerAction(trackerId, 'export_copy');
      logActivity('export_copy');
      toast.success('Copied to clipboard');
      onClose();
    } catch {
      toast.error('Failed to copy text');
    }
  };

  const handleOpenPdf = async () => {
    setIsOpeningPdf(true);
    try {
      await onBeforeExport?.();

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

      if (trackerId) updateTrackerAction(trackerId, 'export_print');
      logActivity('export_print');
      onClose();
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setIsOpeningPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      await onBeforeExport?.();
      await downloadExport('docx', buildPayload());
      if (trackerId) updateTrackerAction(trackerId, 'export_docx');
      logActivity('export_docx');
      toast.success('Word document downloaded');
      onClose();
    } catch {
      toast.error('Failed to generate Word document');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const handleEmailExport = async () => {
    await onBeforeExport?.();
    setShowEmailModal(true);
  };

  const isExporting = isOpeningPdf || isGeneratingDocx;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Share / Export Story">
        <div className="space-y-3">
          <Button
            variant="secondary"
            size="fullWidth"
            onClick={handleCopy}
            className="flex items-center justify-center gap-3"
          >
            <Copy size={18} />
            COPY TEXT TO CLIPBOARD
          </Button>

          <Button
            variant="secondary"
            size="fullWidth"
            onClick={handleOpenPdf}
            disabled={isExporting}
            className="flex items-center justify-center gap-3"
          >
            <ExternalLink size={18} />
            {isOpeningPdf ? 'OPENING PDF...' : 'VIEW / PRINT / DOWNLOAD'}
          </Button>

          <Button
            variant="secondary"
            size="fullWidth"
            onClick={handleEmailExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-3"
          >
            <Mail size={18} />
            EMAIL NARRATIVE
          </Button>

          <Button
            variant="secondary"
            size="fullWidth"
            onClick={handleDownloadDocx}
            disabled={isExporting}
            className="flex items-center justify-center gap-3"
          >
            <FileText size={18} />
            {isGeneratingDocx ? 'GENERATING DOCUMENT...' : 'DOWNLOAD AS WORD DOCUMENT'}
          </Button>
        </div>
      </Modal>

      <EmailExportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        narrative={narrative}
        displayFormat={displayFormat}
        vehicleInfo={{
          year: vehicleInfo?.year || '',
          make: vehicleInfo?.make || '',
          model: vehicleInfo?.model || '',
          roNumber: vehicleInfo?.roNumber || '',
        }}
        senderName={senderName || ''}
      />
    </>
  );
}

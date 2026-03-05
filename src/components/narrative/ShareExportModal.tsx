'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Printer, FileDown, FileText, Mail } from 'lucide-react';
import { logActivity } from '@/lib/activityLogger';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { downloadExport, buildPrintHtml } from '@/lib/exportUtils';
import type { ExportPayload } from '@/lib/exportUtils';
import EmailExportModal from '@/components/narrative/EmailExportModal';
import type { NarrativeData } from '@/stores/narrativeStore';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  vehicleInfo?: { year?: string; make?: string; model?: string; roNumber?: string };
  senderName?: string;
  onBeforeExport?: () => Promise<void>;
}

export default function ShareExportModal({
  isOpen,
  onClose,
  narrative,
  displayFormat,
  vehicleInfo,
  senderName,
  onBeforeExport,
}: ShareExportModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
      logActivity('export_copy');
      toast.success('Copied to clipboard');
      onClose();
    } catch {
      toast.error('Failed to copy text');
    }
  };

  const handlePrint = async () => {
    await onBeforeExport?.();

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      toast.error('Failed to prepare print content');
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(buildPrintHtml(buildPayload()));
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);

    logActivity('export_print');
    onClose();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await onBeforeExport?.();
      await downloadExport('pdf', buildPayload());
      logActivity('export_pdf');
      toast.success('PDF downloaded');
      onClose();
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      await onBeforeExport?.();
      await downloadExport('docx', buildPayload());
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

  const isExporting = isGeneratingPdf || isGeneratingDocx;

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
            onClick={handlePrint}
            className="flex items-center justify-center gap-3"
          >
            <Printer size={18} />
            PRINT GENERATED NARRATIVE
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
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center justify-center gap-3"
          >
            <FileDown size={18} />
            {isGeneratingPdf ? 'GENERATING PDF...' : 'DOWNLOAD AS PDF DOCUMENT'}
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

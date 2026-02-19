'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Printer, FileDown, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { downloadExport } from '@/lib/exportUtils';
import type { ExportPayload } from '@/lib/exportUtils';
import type { Narrative } from '@/types/database';

interface NarrativeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: Narrative | null;
}

export default function NarrativeDetailModal({
  isOpen,
  onClose,
  narrative,
}: NarrativeDetailModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  if (!narrative) return null;

  const dateStr = new Date(narrative.created_at).toLocaleDateString();
  const timeStr = new Date(narrative.created_at).toLocaleTimeString();

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

  const handlePrint = () => {
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
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ServiceDraft.AI - Saved Narrative</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          h3 { margin-top: 20px; color: #333; }
          p { margin: 10px 0; }
          .meta { color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <h2>ServiceDraft.AI - Saved Narrative</h2>
        <p class="meta">R.O. #: ${narrative.ro_number || 'N/A'} | Vehicle: ${narrative.vehicle_year || ''} ${narrative.vehicle_make || ''} ${narrative.vehicle_model || ''} | Date: ${dateStr}</p>
        <hr />
        <h3>CONCERN</h3>
        <p style="white-space:pre-wrap;">${narrative.concern || ''}</p>
        <h3>CAUSE</h3>
        <p style="white-space:pre-wrap;">${narrative.cause || ''}</p>
        <h3>CORRECTION</h3>
        <p style="white-space:pre-wrap;">${narrative.correction || ''}</p>
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadExport('pdf', buildPayload());
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
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

  const isExporting = isGeneratingPdf || isGeneratingDocx;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saved Narrative" width="max-w-[700px]">
      {/* Meta Info */}
      <div className="flex flex-wrap gap-4 text-sm text-[#9ca3af] mb-4">
        <span><span className="text-[#c4b5fd]">R.O. #:</span> {narrative.ro_number || 'N/A'}</span>
        <span><span className="text-[#c4b5fd]">Vehicle:</span> {narrative.vehicle_year || ''} {narrative.vehicle_make || ''} {narrative.vehicle_model || ''}</span>
        <span><span className="text-[#c4b5fd]">Saved:</span> {dateStr} {timeStr}</span>
        <span><span className="text-[#c4b5fd]">Type:</span> {narrative.story_type === 'diagnostic_only' ? 'Diagnostic Only' : 'Repair Complete'}</span>
      </div>

      {/* Concern */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[#a855f7] uppercase tracking-wide mb-1">Concern</h4>
        <div className="bg-[#0f0520] border border-[#6b21a8] rounded-lg p-3">
          <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{narrative.concern || '—'}</p>
        </div>
      </div>

      {/* Cause */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[#a855f7] uppercase tracking-wide mb-1">Cause</h4>
        <div className="bg-[#0f0520] border border-[#6b21a8] rounded-lg p-3">
          <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{narrative.cause || '—'}</p>
        </div>
      </div>

      {/* Correction */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[#a855f7] uppercase tracking-wide mb-1">Correction</h4>
        <div className="bg-[#0f0520] border border-[#6b21a8] rounded-lg p-3">
          <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{narrative.correction || '—'}</p>
        </div>
      </div>

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
          onClick={handlePrint}
          className="flex items-center gap-2"
        >
          <Printer size={15} />
          PRINT
        </Button>
        <Button
          variant="secondary"
          size="medium"
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <FileDown size={15} />
          {isGeneratingPdf ? 'PDF...' : 'PDF'}
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
      </div>
    </Modal>
  );
}

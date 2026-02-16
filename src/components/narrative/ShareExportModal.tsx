'use client';

import { useRef } from 'react';
import toast from 'react-hot-toast';
import { Copy, Printer, FileDown } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { NarrativeData } from '@/stores/narrativeStore';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  vehicleInfo?: { year?: string; make?: string; model?: string; roNumber?: string };
}

export default function ShareExportModal({
  isOpen,
  onClose,
  narrative,
  displayFormat,
  vehicleInfo,
}: ShareExportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const getTextContent = (): string => {
    if (displayFormat === 'block') {
      return narrative.block_narrative;
    }
    return `CONCERN:\n${narrative.concern}\n\nCAUSE:\n${narrative.cause}\n\nCORRECTION:\n${narrative.correction}`;
  };

  const getVehicleHeader = (): string => {
    const parts: string[] = [];
    if (vehicleInfo?.year) parts.push(vehicleInfo.year);
    if (vehicleInfo?.make) parts.push(vehicleInfo.make);
    if (vehicleInfo?.model) parts.push(vehicleInfo.model);
    const vehicleLine = parts.length > 0 ? parts.join(' ') : '';
    const roLine = vehicleInfo?.roNumber ? `R.O. #${vehicleInfo.roNumber}` : '';
    return [vehicleLine, roLine].filter(Boolean).join(' — ');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getTextContent());
      toast.success('Copied to clipboard');
      onClose();
    } catch {
      toast.error('Failed to copy text');
    }
  };

  const handlePrint = () => {
    const header = getVehicleHeader();
    const content = displayFormat === 'block'
      ? narrative.block_narrative
      : `CONCERN:\n${narrative.concern}\n\nCAUSE:\n${narrative.cause}\n\nCORRECTION:\n${narrative.correction}`;

    // Create a hidden iframe for printing
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
        <title>ServiceDraft.AI - Narrative</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #000; }
          h2 { margin-bottom: 4px; }
          h3 { margin-top: 20px; color: #333; }
          p { margin: 10px 0; }
          hr { margin: 12px 0; }
          .vehicle-header { color: #555; font-size: 14px; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h2>ServiceDraft.AI - Generated Narrative</h2>
        ${header ? `<p class="vehicle-header">${header}</p>` : ''}
        <hr />
        <pre style="white-space:pre-wrap; font-family: Arial, sans-serif; font-size: 14px;">${content}</pre>
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Clean up after a delay
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);

    onClose();
  };

  const handleDownloadPdf = () => {
    const header = getVehicleHeader();
    const content = displayFormat === 'block'
      ? narrative.block_narrative
      : `CONCERN:\n${narrative.concern}\n\nCAUSE:\n${narrative.cause}\n\nCORRECTION:\n${narrative.correction}`;

    // Build a simple text-based file and trigger download
    const docContent = [
      'ServiceDraft.AI - Generated Narrative',
      header ? header : '',
      '─'.repeat(50),
      '',
      content,
      '',
      '─'.repeat(50),
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    ].filter((line, i) => i !== 1 || line !== '').join('\n');

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = vehicleInfo?.roNumber
      ? `narrative_RO${vehicleInfo.roNumber}.txt`
      : `narrative_${new Date().toISOString().slice(0, 10)}.txt`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Narrative downloaded');
    onClose();
  };

  return (
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
          onClick={handleDownloadPdf}
          className="flex items-center justify-center gap-3"
        >
          <FileDown size={18} />
          DOWNLOAD AS PDF DOCUMENT
        </Button>
      </div>

      {/* Hidden print container */}
      <div ref={printRef} style={{ display: 'none' }} />
    </Modal>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { narrative, displayFormat, vehicleInfo } = await request.json();

    if (!narrative) {
      return NextResponse.json({ error: 'No narrative data provided' }, { status: 400 });
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const mL = 20; // margin left
    const mR = 20; // margin right
    const mT = 15; // margin top
    const mB = 20; // margin bottom
    const contentWidth = pageWidth - mL - mR;

    let y = mT;

    // ── Helper: draw underlined text ──
    const textUnderline = (text: string, x: number, yPos: number, opts?: { align?: 'left' | 'right' | 'center' }) => {
      doc.text(text, x, yPos, opts);
      const tw = doc.getTextWidth(text);
      const lineY = yPos + 0.8;
      let lineX = x;
      if (opts?.align === 'right') lineX = x - tw;
      else if (opts?.align === 'center') lineX = x - tw / 2;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(lineX, lineY, lineX + tw, lineY);
    };

    // ── Helper: render wrapped text with page breaks ──
    const renderText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic', lineSpacing = 1.5) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines: string[] = doc.splitTextToSize(text, contentWidth);
      const lh = fontSize * 0.352778 * lineSpacing;
      for (const line of lines) {
        if (y + lh > pageHeight - mB) {
          doc.addPage();
          y = mT;
        }
        doc.text(line, mL, y);
        y += lh;
      }
    };

    // ══════════════════════════════════════════════
    // LOGO — read for footer placement (bottom-right of every page)
    // ══════════════════════════════════════════════
    const logoWidth = 18;    // Near-square aspect ratio matching vector logo
    const logoHeight = 17;   // Corrected to prevent horizontal stretching
    let logoBase64: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'ServiceDraft-Ai Vector Logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch {
      // logo unavailable — footer image will be skipped
    }

    // ══════════════════════════════════════════════
    // TWO-COLUMN HEADER
    // ══════════════════════════════════════════════
    const headerY = y + 2; // align with top of logo area
    const rightColX = pageWidth - mR; // right-aligned anchor

    // ── Left column: Vehicle Information ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    textUnderline('Vehicle Information:', mL, headerY);

    const vYear = vehicleInfo?.year || '';
    const vMake = vehicleInfo?.make || '';
    const vModel = vehicleInfo?.model || '';

    let fieldY = headerY + 7;
    const drawLabelValue = (label: string, value: string, atY: number) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(label, mL + 3, atY);
      const lw = doc.getTextWidth(label);
      doc.setFont('helvetica', 'normal');
      doc.text(value, mL + 3 + lw + 1, atY);
    };

    drawLabelValue('YEAR: ', vYear, fieldY);
    fieldY += 5.5;
    drawLabelValue('MAKE: ', vMake, fieldY);
    fieldY += 5.5;
    drawLabelValue('MODEL: ', vModel, fieldY);

    // ── Right column: Repair Order # ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    textUnderline('Repair Order #:', rightColX, headerY, { align: 'right' });

    const roNumber = vehicleInfo?.roNumber || '';
    if (roNumber) {
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(roNumber, rightColX, headerY + 12, { align: 'right' });
    }

    // Move y past the header section (logo height or field list, whichever is taller)
    y = fieldY + 8;

    // ══════════════════════════════════════════════
    // TITLE — "REPAIR NARRATIVE"
    // ══════════════════════════════════════════════
    y += 8; // generous spacing before title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleX = pageWidth / 2;
    textUnderline('REPAIR NARRATIVE', titleX, y, { align: 'center' });
    y += 12; // generous spacing after title

    // ══════════════════════════════════════════════
    // NARRATIVE BODY
    // ══════════════════════════════════════════════
    if (displayFormat === 'block') {
      renderText(narrative.block_narrative, 11, 'normal');
    } else {
      // ── C/C/C Format ──
      const sections = [
        { title: 'CONCERN:', content: narrative.concern },
        { title: 'CAUSE:', content: narrative.cause },
        { title: 'CORRECTION:', content: narrative.correction },
      ];

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        // Section header: 13pt bold italic underlined
        if (y + 8 > pageHeight - mB) {
          doc.addPage();
          y = mT;
        }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bolditalic');
        textUnderline(section.title, mL, y);
        y += 6;

        // Section body: 11pt regular
        renderText(section.content, 11, 'normal');

        // Generous spacing between sections (except after last)
        if (i < sections.length - 1) {
          y += 8;
        }
      }
    }

    // ══════════════════════════════════════════════
    // FOOTER LOGO — bottom-right of every page
    // ══════════════════════════════════════════════
    if (logoBase64) {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.addImage(
          logoBase64, 'PNG',
          pageWidth - mR - logoWidth,
          pageHeight - logoHeight - 5,
          logoWidth, logoHeight
        );
      }
    }

    // ── Generate and return ──
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = vehicleInfo?.roNumber
      ? `narrative_RO${vehicleInfo.roNumber}.pdf`
      : `narrative_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

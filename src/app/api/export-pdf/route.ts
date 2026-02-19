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

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 15;
    const marginBottom = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let y = marginTop;

    // --- Logo (top-right, small letterhead) ---
    try {
      const logoBwPath = path.join(process.cwd(), 'public', 'logo-bw.png');
      const logoFallbackPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoPath = fs.existsSync(logoBwPath) ? logoBwPath : logoFallbackPath;
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

      const logoWidth = 35;
      const logoHeight = 9;
      doc.addImage(logoBase64, 'PNG', pageWidth - marginRight - logoWidth, y, logoWidth, logoHeight);
    } catch {
      // Fallback: text-based logo
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text('ServiceDraft.AI', pageWidth - marginRight, y + 5, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    y += 14;

    // --- Vehicle Info Header ---
    const vehicleParts = [vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model].filter(Boolean);
    if (vehicleParts.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(vehicleParts.join(' ').toUpperCase(), marginLeft, y);
      y += 7;
    }

    if (vehicleInfo?.roNumber) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`R.O.# ${vehicleInfo.roNumber}`, marginLeft, y);
      y += 8;
    }

    // --- Separator Line ---
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 8;

    // --- Text rendering helper with automatic page breaks ---
    const renderText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', lineSpacing = 1.5) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines: string[] = doc.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.352778 * lineSpacing;

      for (const line of lines) {
        if (y + lineHeight > pageHeight - marginBottom) {
          doc.addPage();
          y = marginTop;
        }
        doc.text(line, marginLeft, y);
        y += lineHeight;
      }
    };

    // --- Narrative Content ---
    if (displayFormat === 'block') {
      renderText(narrative.block_narrative, 11, 'normal');
    } else {
      // C/C/C format with section headers
      renderText('CONCERN:', 14, 'bold', 1.3);
      y += 1;
      renderText(narrative.concern, 11, 'normal');
      y += 5;

      renderText('CAUSE:', 14, 'bold', 1.3);
      y += 1;
      renderText(narrative.cause, 11, 'normal');
      y += 5;

      renderText('CORRECTION:', 14, 'bold', 1.3);
      y += 1;
      renderText(narrative.correction, 11, 'normal');
    }

    // --- Generate PDF buffer ---
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
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Footer,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  UnderlineType,
} from 'docx';
import fs from 'fs';
import path from 'path';

// Invisible border config for layout tables
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

export async function POST(request: NextRequest) {
  try {
    const { narrative, displayFormat, vehicleInfo } = await request.json();

    if (!narrative) {
      return NextResponse.json({ error: 'No narrative data provided' }, { status: 400 });
    }

    const children: (Paragraph | Table)[] = [];
    const vYear = vehicleInfo?.year || '';
    const vMake = vehicleInfo?.make || '';
    const vModel = vehicleInfo?.model || '';
    const roNumber = vehicleInfo?.roNumber || '';

    // ══════════════════════════════════════════════
    // LOGO — document footer, right-aligned (bottom of every page)
    // ══════════════════════════════════════════════
    let footerParagraph: Paragraph;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'ServiceDraft-ai-tight logo.PNG');
      const logoBuffer = fs.readFileSync(logoPath);
      footerParagraph = new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: logoBuffer,
            transformation: { width: 79, height: 61 }, // 15% smaller, 1.3:1 aspect ratio
          }),
        ],
        alignment: AlignmentType.RIGHT,
      });
    } catch {
      footerParagraph = new Paragraph({
        children: [
          new TextRun({
            text: 'ServiceDraft.AI',
            italics: true,
            size: 18,
            font: 'Arial',
            color: '888888',
          }),
        ],
        alignment: AlignmentType.RIGHT,
      });
    }

    // ══════════════════════════════════════════════
    // TWO-COLUMN HEADER (invisible table)
    // ══════════════════════════════════════════════
    // Helper: label:value paragraph for vehicle info
    const labelValue = (label: string, value: string): Paragraph =>
      new Paragraph({
        children: [
          new TextRun({ text: label, bold: true, size: 22, font: 'Arial' }),
          new TextRun({ text: value, size: 22, font: 'Arial' }),
        ],
        spacing: { after: 40 },
      });

    const leftCellChildren: Paragraph[] = [
      // "Vehicle Information:" bold underlined
      new Paragraph({
        children: [
          new TextRun({
            text: 'Vehicle Information:',
            bold: true,
            underline: { type: UnderlineType.SINGLE },
            size: 22, // 11pt
            font: 'Arial',
          }),
        ],
        spacing: { after: 80 },
      }),
      labelValue('YEAR: ', vYear),
      labelValue('MAKE: ', vMake),
      labelValue('MODEL: ', vModel),
    ];

    const rightCellChildren: Paragraph[] = [
      // "Repair Order #:" bold underlined
      new Paragraph({
        children: [
          new TextRun({
            text: 'Repair Order #:',
            bold: true,
            underline: { type: UnderlineType.SINGLE },
            size: 22, // 11pt
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
      }),
      // R.O. number large and bold
      new Paragraph({
        children: [
          new TextRun({
            text: roNumber,
            bold: true,
            size: 40, // 20pt
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    ];

    children.push(
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: leftCellChildren,
                width: { size: 55, type: WidthType.PERCENTAGE },
                borders: noBorders,
              }),
              new TableCell({
                children: rightCellChildren,
                width: { size: 45, type: WidthType.PERCENTAGE },
                borders: noBorders,
              }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
      })
    );

    // ══════════════════════════════════════════════
    // TITLE — "REPAIR NARRATIVE"
    // ══════════════════════════════════════════════
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'REPAIR NARRATIVE',
            bold: true,
            underline: { type: UnderlineType.SINGLE },
            size: 36, // 18pt
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
      })
    );

    // ══════════════════════════════════════════════
    // NARRATIVE BODY
    // ══════════════════════════════════════════════
    if (displayFormat === 'block') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: narrative.block_narrative,
              size: 22, // 11pt
              font: 'Arial',
            }),
          ],
          spacing: { line: 360 }, // 1.5 line spacing
        })
      );
    } else {
      // C/C/C format
      const sections = [
        { title: 'CONCERN:', content: narrative.concern },
        { title: 'CAUSE:', content: narrative.cause },
        { title: 'CORRECTION:', content: narrative.correction },
      ];

      for (const section of sections) {
        // Section header: 13pt bold italic underlined
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                italics: true,
                underline: { type: UnderlineType.SINGLE },
                size: 26, // 13pt
                font: 'Arial',
              }),
            ],
            spacing: { before: 300 },
          })
        );

        // Section body: 11pt regular
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.content,
                size: 22, // 11pt
                font: 'Arial',
              }),
            ],
            spacing: { line: 360, after: 200 },
          })
        );
      }
    }

    // ── Build document ──
    const doc = new Document({
      sections: [{
        footers: { default: new Footer({ children: [footerParagraph] }) },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = vehicleInfo?.roNumber
      ? `narrative_RO${vehicleInfo.roNumber}.docx`
      : `narrative_${new Date().toISOString().slice(0, 10)}.docx`;

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('DOCX export error:', error);
    return NextResponse.json({ error: 'Failed to generate Word document' }, { status: 500 });
  }
}

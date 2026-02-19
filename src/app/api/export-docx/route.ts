import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  ImageRun,
  BorderStyle,
} from 'docx';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { narrative, displayFormat, vehicleInfo } = await request.json();

    if (!narrative) {
      return NextResponse.json({ error: 'No narrative data provided' }, { status: 400 });
    }

    // --- Header with logo (top-right letterhead) ---
    let headerChildren: Paragraph[];
    try {
      const logoBwPath = path.join(process.cwd(), 'public', 'logo-bw.png');
      const logoFallbackPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoPath = fs.existsSync(logoBwPath) ? logoBwPath : logoFallbackPath;
      const logoBuffer = fs.readFileSync(logoPath);

      headerChildren = [
        new Paragraph({
          children: [
            new ImageRun({
              type: 'png',
              data: logoBuffer,
              transformation: { width: 120, height: 30 },
            }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
      ];
    } catch {
      // Fallback: text-based logo
      headerChildren = [
        new Paragraph({
          children: [
            new TextRun({
              text: 'ServiceDraft.AI',
              italics: true,
              size: 16,
              font: 'Arial',
              color: '888888',
            }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
      ];
    }

    // --- Document body ---
    const children: Paragraph[] = [];

    // Vehicle info header
    const vehicleParts = [vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model].filter(Boolean);
    if (vehicleParts.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: vehicleParts.join(' ').toUpperCase(),
              bold: true,
              size: 28, // 14pt in half-points
              font: 'Arial',
            }),
          ],
        })
      );
    }

    if (vehicleInfo?.roNumber) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `R.O.# ${vehicleInfo.roNumber}`,
              bold: true,
              size: 22, // 11pt
              font: 'Arial',
            }),
          ],
        })
      );
    }

    // Separator line
    children.push(
      new Paragraph({
        children: [],
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: '000000',
          },
        },
        spacing: { after: 200 },
      })
    );

    // --- Narrative Content ---
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
          spacing: { line: 360 }, // 1.5 line spacing (240 = single)
        })
      );
    } else {
      // C/C/C format with section headers
      const sections = [
        { title: 'CONCERN:', content: narrative.concern },
        { title: 'CAUSE:', content: narrative.cause },
        { title: 'CORRECTION:', content: narrative.correction },
      ];

      for (const section of sections) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                size: 28, // 14pt
                font: 'Arial',
              }),
            ],
            spacing: { before: 240 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.content,
                size: 22, // 11pt
                font: 'Arial',
              }),
            ],
            spacing: { line: 360, after: 120 },
          })
        );
      }
    }

    // --- Create document ---
    const doc = new Document({
      sections: [
        {
          headers: {
            default: new Header({ children: headerChildren }),
          },
          children,
        },
      ],
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
    return NextResponse.json(
      { error: 'Failed to generate Word document' },
      { status: 500 }
    );
  }
}

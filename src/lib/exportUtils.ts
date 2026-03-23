/**
 * Shared export utilities for PDF, DOCX, Print, and Email document generation.
 * Used by ShareExportModal (narrative page), NarrativeDetailModal (dashboard),
 * and the send-email API route.
 */

export interface ExportNarrative {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

export interface ExportVehicleInfo {
  year: string;
  make: string;
  model: string;
  roNumber: string;
}

export interface ExportPayload {
  narrative: ExportNarrative;
  displayFormat: 'block' | 'ccc';
  vehicleInfo: ExportVehicleInfo;
}

/**
 * Calls the server-side export API and triggers a file download.
 * Shared by all export paths so documents are always generated identically.
 */
export async function downloadExport(
  type: 'pdf' | 'docx',
  payload: ExportPayload
): Promise<void> {
  const endpoint = type === 'pdf' ? '/api/export-pdf' : '/api/export-docx';
  const ext = type === 'pdf' ? 'pdf' : 'docx';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`${type.toUpperCase()} generation failed`);

  const blob = await res.blob();
  const filename = payload.vehicleInfo.roNumber
    ? `narrative_RO${payload.vehicleInfo.roNumber}.${ext}`
    : `narrative_${new Date().toISOString().slice(0, 10)}.${ext}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds formatted HTML for print output that visually matches the PDF export.
 * Used by print handlers in ShareExportModal and NarrativeDetailModal.
 *
 * Layout matches the PDF exactly:
 * - Two-column header: Vehicle Information (left) + R.O.# (right)
 * - "REPAIR NARRATIVE" centered title (18pt bold underlined)
 * - C/C/C sections (13pt bold italic underlined headers, 11pt body)
 * - Or block format (11pt body paragraph)
 * - Footer logo bottom-right
 */
export function buildPrintHtml(payload: ExportPayload): string {
  const { narrative, displayFormat, vehicleInfo } = payload;

  const narrativeHtml = displayFormat === 'block'
    ? `<p style="margin:0;font-size:11pt;line-height:1.5;color:#000;">${escapeHtml(narrative.block_narrative)}</p>`
    : `
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px 0;font-size:13pt;font-weight:bold;font-style:italic;text-decoration:underline;color:#000;font-family:Arial,Helvetica,sans-serif;">CONCERN:</p>
        <p style="margin:0;font-size:11pt;line-height:1.5;color:#000;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(narrative.concern)}</p>
      </div>
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px 0;font-size:13pt;font-weight:bold;font-style:italic;text-decoration:underline;color:#000;font-family:Arial,Helvetica,sans-serif;">CAUSE:</p>
        <p style="margin:0;font-size:11pt;line-height:1.5;color:#000;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(narrative.cause)}</p>
      </div>
      <div>
        <p style="margin:0 0 4px 0;font-size:13pt;font-weight:bold;font-style:italic;text-decoration:underline;color:#000;font-family:Arial,Helvetica,sans-serif;">CORRECTION:</p>
        <p style="margin:0;font-size:11pt;line-height:1.5;color:#000;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(narrative.correction)}</p>
      </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <title>Repair Narrative</title>
  <style>
    @page {
      size: letter;
      margin: 13mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 10mm 13mm 13mm 13mm;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .footer-logo {
      position: fixed;
      bottom: 3mm;
      right: 13mm;
    }
    .footer-logo img {
      width: 25mm;
      height: auto;
    }
  </style>
</head>
<body>
  <!-- Two-column header -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="vertical-align:top;width:60%;">
        <p style="margin:0 0 5px 0;font-size:11pt;font-weight:bold;text-decoration:underline;color:#000;font-family:Arial,Helvetica,sans-serif;">Vehicle Information:</p>
        ${vehicleInfo.year ? `<p style="margin:0 0 3px 3mm;font-size:11pt;color:#000;font-family:Arial,Helvetica,sans-serif;"><strong>YEAR:</strong> ${escapeHtml(vehicleInfo.year)}</p>` : ''}
        ${vehicleInfo.make ? `<p style="margin:0 0 3px 3mm;font-size:11pt;color:#000;font-family:Arial,Helvetica,sans-serif;"><strong>MAKE:</strong> ${escapeHtml(vehicleInfo.make)}</p>` : ''}
        ${vehicleInfo.model ? `<p style="margin:0 0 3px 3mm;font-size:11pt;color:#000;font-family:Arial,Helvetica,sans-serif;"><strong>MODEL:</strong> ${escapeHtml(vehicleInfo.model)}</p>` : ''}
      </td>
      <td style="vertical-align:top;width:40%;text-align:right;">
        <p style="margin:0 0 5px 0;font-size:11pt;font-weight:bold;text-decoration:underline;color:#000;font-family:Arial,Helvetica,sans-serif;">Repair Order #:</p>
        ${vehicleInfo.roNumber ? `<p style="margin:0;font-size:20pt;font-weight:bold;color:#000;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(vehicleInfo.roNumber)}</p>` : ''}
      </td>
    </tr>
  </table>

  <!-- Title -->
  <p style="margin:24px 0 20px 0;font-size:18pt;font-weight:bold;text-decoration:underline;text-align:center;color:#000;font-family:Arial,Helvetica,sans-serif;">
    REPAIR NARRATIVE
  </p>

  <!-- Narrative body -->
  ${narrativeHtml}

  <!-- Footer logo -->
  <div class="footer-logo">
    <img src="https://servicedraft.ai/ServiceDraft-Ai%20Vector%20Logo.png" alt="ServiceDraft.AI" />
  </div>
</body>
</html>`;
}

/**
 * Builds formatted HTML for email that visually matches the PDF export.
 * Uses table-based layout with inline CSS for email client compatibility.
 *
 * Layout matches the PDF:
 * - Two-column header: Vehicle Information with YEAR/MAKE/MODEL labels (left) + R.O.# (right)
 * - "REPAIR NARRATIVE" centered title
 * - C/C/C sections with bold italic underlined headers, or block paragraph
 * - Footer with logo
 */
export function buildEmailHtml(
  narrative: ExportNarrative,
  displayFormat: 'block' | 'ccc',
  vehicleInfo: ExportVehicleInfo,
  senderName: string,
): string {
  const narrativeHtml =
    displayFormat === 'block'
      ? `<p style="margin:0;padding:0;font-size:14px;line-height:1.7;color:#222222;white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(narrative.block_narrative)}</p>`
      : `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr><td style="padding:0 0 6px 0;font-size:13px;font-weight:bold;font-style:italic;text-decoration:underline;color:#000000;font-family:Arial,Helvetica,sans-serif;">CONCERN:</td></tr>
          <tr><td style="padding:0 0 20px 0;font-size:14px;line-height:1.7;color:#222222;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;">${escapeHtml(narrative.concern)}</td></tr>
          <tr><td style="padding:0 0 6px 0;font-size:13px;font-weight:bold;font-style:italic;text-decoration:underline;color:#000000;font-family:Arial,Helvetica,sans-serif;">CAUSE:</td></tr>
          <tr><td style="padding:0 0 20px 0;font-size:14px;line-height:1.7;color:#222222;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;">${escapeHtml(narrative.cause)}</td></tr>
          <tr><td style="padding:0 0 6px 0;font-size:13px;font-weight:bold;font-style:italic;text-decoration:underline;color:#000000;font-family:Arial,Helvetica,sans-serif;">CORRECTION:</td></tr>
          <tr><td style="padding:0;font-size:14px;line-height:1.7;color:#222222;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;">${escapeHtml(narrative.correction)}</td></tr>
        </table>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repair Narrative</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-collapse:collapse;">

          <!-- White Body -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 28px 0 28px;border-radius:8px 8px 0 0;">
              <!-- Two-column header: Vehicle Info (left) + R.O.# (right) -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:20px;">
                <tr>
                  <td valign="top" style="width:60%;">
                    <p style="margin:0 0 5px 0;font-size:11px;font-weight:bold;text-decoration:underline;color:#000000;font-family:Arial,Helvetica,sans-serif;">Vehicle Information:</p>
                    ${vehicleInfo.year ? `<p style="margin:0 0 3px 8px;font-size:11px;color:#222222;font-family:Arial,Helvetica,sans-serif;"><strong>YEAR:</strong> ${escapeHtml(vehicleInfo.year)}</p>` : ''}
                    ${vehicleInfo.make ? `<p style="margin:0 0 3px 8px;font-size:11px;color:#222222;font-family:Arial,Helvetica,sans-serif;"><strong>MAKE:</strong> ${escapeHtml(vehicleInfo.make)}</p>` : ''}
                    ${vehicleInfo.model ? `<p style="margin:0 0 3px 8px;font-size:11px;color:#222222;font-family:Arial,Helvetica,sans-serif;"><strong>MODEL:</strong> ${escapeHtml(vehicleInfo.model)}</p>` : ''}
                  </td>
                  <td valign="top" align="right" style="width:40%;">
                    ${vehicleInfo.roNumber ? `
                    <p style="margin:0 0 5px 0;font-size:11px;font-weight:bold;text-decoration:underline;color:#000000;font-family:Arial,Helvetica,sans-serif;">Repair Order #:</p>
                    <p style="margin:0;font-size:20px;font-weight:bold;color:#222222;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(vehicleInfo.roNumber)}</p>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <p style="margin:0 0 20px 0;font-size:18px;font-weight:bold;text-decoration:underline;text-align:center;color:#000000;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;">
                REPAIR NARRATIVE
              </p>

              <!-- Narrative Content -->
              ${narrativeHtml}
            </td>
          </tr>

          <!-- Sender Line -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 28px 8px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr><td style="border-top:1px solid #e5e7eb;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>
              ${senderName ? `<p style="margin:12px 0 0 0;font-size:12px;color:#888888;font-family:Arial,Helvetica,sans-serif;">Sent by ${escapeHtml(senderName)}</p>` : ''}
            </td>
          </tr>

          <!-- Footer with logo -->
          <tr>
            <td style="background-color:#ffffff;padding:12px 28px 24px 28px;border-radius:0 0 8px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="font-size:11px;color:#aaaaaa;font-family:Arial,Helvetica,sans-serif;">
                    Generated by ServiceDraft.AI
                  </td>
                  <td align="right">
                    <img src="https://servicedraft.ai/ServiceDraft-Ai%20Vector%20Logo.png" alt="ServiceDraft.AI" width="75" height="36" style="display:block;border:0;outline:none;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds plain-text fallback for email clients that don't render HTML.
 * Matches the same information structure as the HTML version.
 */
export function buildPlainTextEmail(
  narrative: ExportNarrative,
  displayFormat: 'block' | 'ccc',
  vehicleInfo: ExportVehicleInfo,
  senderName: string,
): string {
  const lines: string[] = [];

  lines.push('Vehicle Information:');
  if (vehicleInfo.year) lines.push(`  YEAR: ${vehicleInfo.year}`);
  if (vehicleInfo.make) lines.push(`  MAKE: ${vehicleInfo.make}`);
  if (vehicleInfo.model) lines.push(`  MODEL: ${vehicleInfo.model}`);
  if (vehicleInfo.roNumber) {
    lines.push('');
    lines.push(`Repair Order #: ${vehicleInfo.roNumber}`);
  }
  lines.push('');
  lines.push('----------------------------------------');
  lines.push('           REPAIR NARRATIVE');
  lines.push('----------------------------------------');
  lines.push('');

  if (displayFormat === 'block') {
    lines.push(narrative.block_narrative);
  } else {
    lines.push('CONCERN:');
    lines.push(narrative.concern);
    lines.push('');
    lines.push('CAUSE:');
    lines.push(narrative.cause);
    lines.push('');
    lines.push('CORRECTION:');
    lines.push(narrative.correction);
  }

  lines.push('');
  lines.push('----------------------------------------');
  if (senderName) lines.push(`Sent by ${senderName}`);
  lines.push('Generated by ServiceDraft.AI');

  return lines.join('\n');
}

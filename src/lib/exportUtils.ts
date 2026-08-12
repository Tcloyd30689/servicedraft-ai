/**
 * Shared export utilities for PDF, DOCX, and Email document generation.
 *
 * - `downloadExport` (PDF/DOCX) is used by ShareExportModal (narrative page)
 *   and NarrativeDetailModal (dashboard).
 * - `buildEmailHtml` / `buildPlainTextEmail` are used only by the send-email
 *   API route (src/app/api/send-email/route.ts).
 *
 * The email builders emit literal colors and inline styles only — no CSS
 * variables, no flexbox, no external stylesheets, no web fonts — because email
 * clients (Outlook in particular) do not support them.
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
  /** "F. Lastname" — rendered in the document header. Omitted when unavailable. */
  preparedBy?: string;
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
 * Builds the intro/purpose sentence that opens the email body.
 *
 * Shared by buildEmailHtml() and buildPlainTextEmail() so the HTML and
 * plain-text versions can never drift apart. Degrades gracefully: senderName is
 * '' when the profile has no name, and vehicle fields are frequently blank.
 *
 * Returns RAW text. Callers emitting HTML MUST pass the result through
 * escapeHtml() — senderName and the vehicle fields are client-supplied and the
 * API route does not sanitize them.
 */
function buildEmailIntroLine(vehicleInfo: ExportVehicleInfo, senderName: string): string {
  const name = (senderName || '').trim();
  const vehicle = [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model]
    .filter(Boolean)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');

  if (name && vehicle) return `${name} has sent you a repair narrative for the ${vehicle}.`;
  if (name) return `${name} has sent you a repair narrative.`;
  if (vehicle) return `You have received a repair narrative for the ${vehicle}.`;
  return 'You have received a repair narrative.';
}

/**
 * Builds formatted HTML for email that visually matches the PDF export.
 * Uses table-based layout with inline CSS for email client compatibility.
 *
 * Layout:
 * - Intro line: who sent the narrative and for which vehicle
 * - Two-column header: Vehicle Information with YEAR/MAKE/MODEL labels (left) + R.O.# (right)
 * - "REPAIR NARRATIVE" centered title
 * - C/C/C sections with bold italic underlined headers, or block paragraph
 * - "Sent by …" attribution line
 * - ServiceDraft.AI call-to-action footer (clickable logo + link + attribution)
 *
 * The copy is the same for every story type — the intro line reads
 * "repair narrative" in all cases — so story_type is not a parameter here.
 */
export function buildEmailHtml(
  narrative: ExportNarrative,
  displayFormat: 'block' | 'ccc',
  vehicleInfo: ExportVehicleInfo,
  senderName: string,
): string {
  const introLine = buildEmailIntroLine(vehicleInfo, senderName);
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
              <!-- Intro / purpose line -->
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#222222;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(introLine)}</p>

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

          <!-- Footer: ServiceDraft.AI call to action -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:16px 28px 28px 28px;border-radius:0 0 8px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 0 12px 0;">
                    <a href="https://servicedraft.ai" target="_blank" rel="noopener noreferrer" style="text-decoration:none;border:0;outline:none;">
                      <img src="https://servicedraft.ai/ServiceDraft-Ai%20Vector%20Logo.png" alt="ServiceDraft.AI" width="105" height="50" style="display:block;border:0;outline:none;width:105px;height:50px;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 8px 0;font-size:12px;line-height:1.5;color:#666666;font-family:Arial,Helvetica,sans-serif;">
                    Warranty-ready repair narratives in seconds.
                    <a href="https://servicedraft.ai" target="_blank" rel="noopener noreferrer" style="color:#9333ea;text-decoration:underline;font-family:Arial,Helvetica,sans-serif;">servicedraft.ai</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:11px;line-height:1.5;color:#aaaaaa;font-family:Arial,Helvetica,sans-serif;">
                    Generated by ServiceDraft.AI
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
 * Matches the same information structure as the HTML version, including the
 * shared intro line and the ServiceDraft.AI call to action (as a bare URL,
 * since plain text cannot carry the logo image).
 */
export function buildPlainTextEmail(
  narrative: ExportNarrative,
  displayFormat: 'block' | 'ccc',
  vehicleInfo: ExportVehicleInfo,
  senderName: string,
): string {
  const lines: string[] = [];

  lines.push(buildEmailIntroLine(vehicleInfo, senderName));
  lines.push('');

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
  lines.push('Warranty-ready repair narratives in seconds - https://servicedraft.ai');

  return lines.join('\n');
}

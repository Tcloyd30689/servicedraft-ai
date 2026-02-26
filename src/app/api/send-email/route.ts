import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

interface NarrativeData {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

interface SendEmailRequest {
  to: string[];
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  vehicleInfo: {
    year: string;
    make: string;
    model: string;
    roNumber: string;
  };
  senderName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildSubjectLine(vehicleInfo: SendEmailRequest['vehicleInfo']): string {
  const parts: string[] = [];
  if (vehicleInfo.year) parts.push(vehicleInfo.year);
  if (vehicleInfo.make) parts.push(vehicleInfo.make);
  if (vehicleInfo.model) parts.push(vehicleInfo.model);
  const vehicle = parts.join(' ');
  const ro = vehicleInfo.roNumber ? `R.O. #${vehicleInfo.roNumber}` : '';
  const segments = [vehicle, ro].filter(Boolean);
  return segments.length > 0
    ? `Repair Narrative — ${segments.join(' — ')}`
    : 'Repair Narrative — ServiceDraft.AI';
}

function buildHtmlEmail(
  narrative: NarrativeData,
  displayFormat: 'block' | 'ccc',
  vehicleInfo: SendEmailRequest['vehicleInfo'],
  senderName: string,
): string {
  const vehicleLine = [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  const narrativeHtml =
    displayFormat === 'block'
      ? `<p style="margin:0;padding:0;font-size:14px;line-height:1.7;color:#222222;white-space:pre-wrap;">${escapeHtml(narrative.block_narrative)}</p>`
      : `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr><td style="padding:0 0 6px 0;font-size:13px;font-weight:bold;font-style:italic;text-decoration:underline;color:#333333;font-family:Arial,Helvetica,sans-serif;">CONCERN:</td></tr>
          <tr><td style="padding:0 0 20px 0;font-size:14px;line-height:1.7;color:#222222;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;">${escapeHtml(narrative.concern)}</td></tr>
          <tr><td style="padding:0 0 6px 0;font-size:13px;font-weight:bold;font-style:italic;text-decoration:underline;color:#333333;font-family:Arial,Helvetica,sans-serif;">CAUSE:</td></tr>
          <tr><td style="padding:0 0 20px 0;font-size:14px;line-height:1.7;color:#222222;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;">${escapeHtml(narrative.cause)}</td></tr>
          <tr><td style="padding:0 0 6px 0;font-size:13px;font-weight:bold;font-style:italic;text-decoration:underline;color:#333333;font-family:Arial,Helvetica,sans-serif;">CORRECTION:</td></tr>
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

          <!-- Header Bar -->
          <tr>
            <td style="background-color:#1a0a2e;padding:18px 28px;border-radius:8px 8px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="font-size:20px;font-weight:bold;color:#c084fc;font-family:Arial,Helvetica,sans-serif;letter-spacing:2px;">
                    SERVICEDRAFT.AI
                  </td>
                  <td align="right" style="font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">
                    REPAIR NARRATIVE
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- White Body -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 28px 0 28px;">
              <!-- Vehicle Info + R.O.# -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:20px;">
                <tr>
                  <td valign="top" style="width:60%;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:bold;text-decoration:underline;color:#555555;font-family:Arial,Helvetica,sans-serif;">VEHICLE INFORMATION</p>
                    ${vehicleLine ? `<p style="margin:0;font-size:14px;font-weight:bold;color:#222222;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(vehicleLine)}</p>` : ''}
                  </td>
                  <td valign="top" align="right" style="width:40%;">
                    ${vehicleInfo.roNumber ? `
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:bold;text-decoration:underline;color:#555555;font-family:Arial,Helvetica,sans-serif;">REPAIR ORDER #</p>
                    <p style="margin:0;font-size:20px;font-weight:bold;color:#222222;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(vehicleInfo.roNumber)}</p>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:20px;">
                <tr><td style="border-top:2px solid #e5e7eb;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>

              <!-- Title -->
              <p style="margin:0 0 20px 0;font-size:18px;font-weight:bold;text-decoration:underline;text-align:center;color:#1a0a2e;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;">
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

          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;padding:12px 28px 24px 28px;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;font-family:Arial,Helvetica,sans-serif;">
                Generated by ServiceDraft.AI &mdash; AI-Powered Repair Narrative Generator
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPlainTextEmail(
  narrative: NarrativeData,
  displayFormat: 'block' | 'ccc',
  vehicleInfo: SendEmailRequest['vehicleInfo'],
  senderName: string,
): string {
  const vehicleLine = [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  const lines: string[] = [
    'SERVICEDRAFT.AI — REPAIR NARRATIVE',
    '========================================',
    '',
  ];

  if (vehicleLine) lines.push(`VEHICLE: ${vehicleLine}`);
  if (vehicleInfo.roNumber) lines.push(`R.O. #: ${vehicleInfo.roNumber}`);
  if (vehicleLine || vehicleInfo.roNumber) {
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('');
  }

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
  lines.push('Generated by ServiceDraft.AI — AI-Powered Repair Narrative Generator');

  return lines.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check for API key
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Email service not configured. RESEND_API_KEY is missing.' },
        { status: 500 },
      );
    }

    const body: SendEmailRequest = await request.json();
    const { to, narrative, displayFormat, vehicleInfo, senderName } = body;

    // Validate recipients
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: 'At least one recipient email is required.' }, { status: 400 });
    }

    if (to.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 recipients allowed.' }, { status: 400 });
    }

    const invalidEmails = to.filter((email) => !EMAIL_REGEX.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email address: ${invalidEmails.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate narrative data
    if (!narrative || (!narrative.block_narrative && !narrative.concern)) {
      return NextResponse.json({ error: 'Narrative content is required.' }, { status: 400 });
    }

    const resend = new Resend(apiKey);
    const subject = buildSubjectLine(vehicleInfo);
    const html = buildHtmlEmail(narrative, displayFormat, vehicleInfo, senderName);
    const text = buildPlainTextEmail(narrative, displayFormat, vehicleInfo, senderName);

    const { error } = await resend.emails.send({
      from: 'ServiceDraft.AI <noreply@servicedraft.ai>',
      replyTo: user.email || undefined,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json(
        { error: `Failed to send email: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, sentTo: to });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
  }
}

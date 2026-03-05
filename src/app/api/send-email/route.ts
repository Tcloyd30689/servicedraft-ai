import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { buildEmailHtml, buildPlainTextEmail } from '@/lib/exportUtils';
import type { ExportNarrative, ExportVehicleInfo } from '@/lib/exportUtils';

interface SendEmailRequest {
  to: string[];
  narrative: ExportNarrative;
  displayFormat: 'block' | 'ccc';
  vehicleInfo: ExportVehicleInfo;
  senderName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildSubjectLine(vehicleInfo: ExportVehicleInfo): string {
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
    const html = buildEmailHtml(narrative, displayFormat, vehicleInfo, senderName);
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

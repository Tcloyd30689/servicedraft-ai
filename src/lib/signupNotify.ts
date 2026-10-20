// Owner notification for sign-up activity.
//
// Fire-and-forget: every caller invokes this as
//   void notifyOwnersOfSignup(...).catch(() => {})
// and never awaits it on a response path. The function itself never throws
// and never returns anything a caller could branch on, so a Resend outage, a
// missing API key, or a Supabase hiccup can never change a signup response.
//
// This is informational only. There is no approval flow.

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

/**
 * Roles that receive the sign-up notification email.
 *
 * Intended one-line expansion: add 'admin' here when admins should also be
 * notified. Nothing else needs to change.
 */
const NOTIFY_ROLES: string[] = ['owner'];

const FROM_ADDRESS = 'ServiceDraft.AI <noreply@servicedraft.ai>';

export type SignupNotifyKind = 'attempt' | 'created';

export interface SignupNotifyDetails {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  userId?: string;
  ip?: string | null;
  userAgent?: string | null;
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(url, serviceKey);
}

/** Minimal HTML escaping so user-supplied strings cannot inject markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEastern(date: Date): string {
  try {
    return (
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }).format(date)
    );
  } catch {
    return date.toISOString();
  }
}

/**
 * Looks up every notification recipient (deduped, lowercased) from
 * public.users where role is in NOTIFY_ROLES.
 */
async function fetchRecipients(): Promise<string[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('users')
    .select('email')
    .in('role', NOTIFY_ROLES)
    .not('email', 'is', null);

  if (error) {
    throw new Error(`Recipient lookup failed: ${error.message}`);
  }

  const seen = new Set<string>();
  for (const row of (data || []) as Array<{ email: string | null }>) {
    const email = (row.email || '').trim().toLowerCase();
    if (email) seen.add(email);
  }
  return Array.from(seen);
}

interface EmailCopy {
  subject: string;
  html: string;
  text: string;
}

function buildEmail(kind: SignupNotifyKind, details: SignupNotifyDetails, now: Date): EmailCopy {
  const isCreated = kind === 'created';
  const heading = isCreated ? 'New account created' : 'New sign-up attempt';
  const subject = `[ServiceDraft.AI] ${heading} - ${details.email}`;
  const timestamp = formatEastern(now);

  const fullName = [details.firstName, details.lastName].filter(Boolean).join(' ').trim();

  // Ordered rows; only rows with a value are rendered.
  const rows: Array<[string, string | undefined | null]> = [
    ['Event', isCreated ? 'Account created (profile completed)' : 'Sign-up attempt (verification code requested)'],
    ['Email', details.email],
    ['Name', fullName || undefined],
    ['Position', details.position],
    ['User ID', details.userId],
    ['Time (US Eastern)', timestamp],
    ['IP address', details.ip],
    ['User agent', details.userAgent],
  ];
  const present = rows.filter((r): r is [string, string] => typeof r[1] === 'string' && r[1].trim().length > 0);

  const intro = isCreated
    ? 'A new user finished setting up their ServiceDraft.AI account.'
    : 'Someone requested a sign-up verification code for ServiceDraft.AI. This does not mean an account exists yet.';

  const htmlRows = present
    .map(
      ([label, value]) => `
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #707080; vertical-align: top; width: 140px; white-space: nowrap;">${escapeHtml(label)}</td>
                <td style="padding: 8px 0; font-size: 14px; color: #e0e0e0; word-break: break-word;">${escapeHtml(value)}</td>
              </tr>`,
    )
    .join('');

  // Visual style mirrors docs/email-templates/confirm-signup.html (dark card).
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heading)} — ServiceDraft.AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #12121a; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.02em;">
                ServiceDraft.AI
              </h1>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: rgba(255,255,255,0.08);"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 32px 12px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #e0e0e0;">
                ${escapeHtml(heading)}
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #a0a0b0;">
                ${escapeHtml(intro)}
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08);">${htmlRows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #505060;">
                No action is required. You are receiving this because your account holds a notification role for ServiceDraft.AI sign-up activity.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `SERVICEDRAFT.AI — ${heading}`,
    '',
    intro,
    '',
    ...present.map(([label, value]) => `${label}: ${value}`),
    '',
    'No action is required. You are receiving this because your account holds a notification role for ServiceDraft.AI sign-up activity.',
  ].join('\n');

  return { subject, html, text };
}

/**
 * Emails every NOTIFY_ROLES user about a sign-up attempt or a created account.
 *
 * Never throws. Never awaited on a response path. Logs and returns on any
 * missing configuration or failure.
 */
export async function notifyOwnersOfSignup(
  kind: SignupNotifyKind,
  details: SignupNotifyDetails,
): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[signupNotify] RESEND_API_KEY is missing; skipping sign-up notification.');
      return;
    }

    const recipients = await fetchRecipients();
    if (recipients.length === 0) {
      console.warn(
        `[signupNotify] No recipients with role in [${NOTIFY_ROLES.join(', ')}]; skipping sign-up notification.`,
      );
      return;
    }

    const { subject, html, text } = buildEmail(kind, details, new Date());

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
      text,
    });

    if (error) {
      console.error(`[signupNotify] Resend rejected ${kind} notification:`, error);
      return;
    }

    console.log(`[signupNotify] Sent ${kind} notification to ${recipients.length} recipient(s).`);
  } catch (err) {
    console.error(`[signupNotify] Failed to send ${kind} notification:`, err);
  }
}

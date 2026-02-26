import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(url, serviceKey);
}

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return { userId: user.id };
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...params } = body;
    const svc = createServiceClient();

    switch (action) {
      case 'list_users': {
        const { data: users, error: usersError } = await svc
          .from('users')
          .select('id, email, first_name, last_name, position, subscription_status, is_restricted, role, created_at')
          .order('created_at', { ascending: false });

        if (usersError) {
          return NextResponse.json({ success: false, error: usersError.message }, { status: 500 });
        }

        // Get narrative counts per user
        const { data: narrativeRows } = await svc
          .from('narratives')
          .select('user_id');

        const countMap: Record<string, number> = {};
        (narrativeRows || []).forEach((n: { user_id: string }) => {
          countMap[n.user_id] = (countMap[n.user_id] || 0) + 1;
        });

        // Get last activity per user (ordered desc, first per user_id = most recent)
        const { data: activityRows } = await svc
          .from('activity_log')
          .select('user_id, created_at')
          .order('created_at', { ascending: false });

        const lastActiveMap: Record<string, string> = {};
        (activityRows || []).forEach((a: { user_id: string; created_at: string }) => {
          if (!lastActiveMap[a.user_id]) lastActiveMap[a.user_id] = a.created_at;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedUsers = (users || []).map((u: any) => ({
          ...u,
          narrative_count: countMap[u.id] || 0,
          last_active: lastActiveMap[u.id] || null,
        }));

        return NextResponse.json({ success: true, data: enrichedUsers });
      }

      case 'get_user_details': {
        const { userId } = params;
        if (!userId) {
          return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        }

        const [profileRes, activityRes, narrativesRes] = await Promise.all([
          svc.from('users').select('*').eq('id', userId).single(),
          svc.from('activity_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
          svc.from('narratives').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            profile: profileRes.data,
            recent_activity: activityRes.data || [],
            recent_narratives: narrativesRes.data || [],
          },
        });
      }

      case 'send_password_reset': {
        const { email } = params;
        if (!email) {
          return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const resendKey = process.env.RESEND_API_KEY;

        if (resendKey) {
          // Generate link via admin API, send branded email via Resend
          const { data, error } = await svc.auth.admin.generateLink({
            type: 'recovery',
            email,
          });

          if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
          }

          if (data?.properties?.action_link) {
            const { Resend } = await import('resend');
            const resend = new Resend(resendKey);
            const { error: emailError } = await resend.emails.send({
              from: 'ServiceDraft.AI <noreply@servicedraft.ai>',
              to: email,
              subject: 'Password Reset — ServiceDraft.AI',
              html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                <p style="color:#333;font-size:14px;">An administrator has initiated a password reset for your account.</p>
                <p style="margin:20px 0;"><a href="${data.properties.action_link}" style="display:inline-block;padding:12px 24px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Reset Password</a></p>
                <p style="color:#888;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
                <p style="color:#aaa;font-size:11px;margin-top:24px;">ServiceDraft.AI</p>
              </div>`,
              text: `Password Reset — ServiceDraft.AI\n\nAn administrator has initiated a password reset for your account.\n\nReset your password: ${data.properties.action_link}\n\nIf you did not request this, you can safely ignore this email.`,
            });

            if (emailError) {
              return NextResponse.json({ success: false, error: `Failed to send email: ${emailError.message}` }, { status: 500 });
            }
          }
        } else {
          // Fall back to Supabase built-in email
          const { error } = await svc.auth.resetPasswordForEmail(email);
          if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
          }
        }

        return NextResponse.json({ success: true });
      }

      case 'restrict_user': {
        const { userId, restricted } = params;
        if (!userId || typeof restricted !== 'boolean') {
          return NextResponse.json({ success: false, error: 'userId and restricted (boolean) are required' }, { status: 400 });
        }

        const { error } = await svc
          .from('users')
          .update({ is_restricted: restricted })
          .eq('id', userId);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'delete_user': {
        const { userId } = params;
        if (!userId) {
          return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        }

        const { error } = await svc.auth.admin.deleteUser(userId);
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'change_subscription': {
        const { userId, status } = params;
        if (!userId || !status) {
          return NextResponse.json({ success: false, error: 'userId and status are required' }, { status: 400 });
        }

        const validStatuses = ['active', 'trial', 'expired', 'bypass'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        const { error } = await svc
          .from('users')
          .update({ subscription_status: status })
          .eq('id', userId);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('Admin API error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

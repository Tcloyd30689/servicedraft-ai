import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { buildInsightsAggregate } from '@/lib/insightsAggregate';

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

  // qa_tester: read-only owner-equivalent (Sprint G-4a)
  if (!profile || (profile.role !== 'owner' && profile.role !== 'qa_tester')) return null;
  return { userId: user.id, role: profile.role as string };
}

/**
 * GET /api/admin/insights
 *
 * Beta-insights dashboard numbers: feedback ratios, recent thumbs-down
 * comments, per-survey response breakdowns, and narrative usage rates.
 *
 * Also returns `data.proofreadFeedback` — thumbs up/down left on individual
 * REVIEW & PROOFREAD suggestions (public.proofread_feedback). It is a SEPARATE
 * top-level key and is never merged into `data.feedback`, which counts
 * generated-story ratings only. Like the rest of the payload it carries no
 * user_id, tracker_id or proofread_run_id — distinct runs/users are counts.
 *
 * Everything is aggregated in JavaScript (see src/lib/insightsAggregate.ts) —
 * no raw SQL. Read-only, so qa_tester is allowed. An empty database returns
 * zeros, empty arrays and null ratios rather than erroring or dividing by zero.
 */
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const svc = createServiceClient();
    const data = await buildInsightsAggregate(svc);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Admin insights GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

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

async function getAuthUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return { userId: user.id, role: profile.role as string, teamId: profile.team_id as string | null };
}

// GET: Fetch activity logs for a team's members
// Query params: team_id, page (1-based), filter (action_type), search, sort (asc|desc)
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'owner' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized — admin or owner only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let teamId = searchParams.get('team_id');
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 25;
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'desc';

    // Admin can only query their own team
    if (authUser.role === 'admin') {
      if (!authUser.teamId) {
        return NextResponse.json({ success: true, data: [], totalCount: 0 });
      }
      teamId = authUser.teamId;
    }

    if (!teamId) {
      return NextResponse.json({ error: 'team_id query parameter is required' }, { status: 400 });
    }

    const svc = createServiceClient();

    // Get team member IDs
    const { data: members } = await svc
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('team_id', teamId);

    if (!members || members.length === 0) {
      return NextResponse.json({ success: true, data: [], totalCount: 0 });
    }

    let memberIds = members.map((m: { id: string }) => m.id);

    // If search is provided, filter member IDs by name or email
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchingMembers = members.filter((m: { first_name: string | null; last_name: string | null; email: string }) => {
        const name = [m.first_name, m.last_name].filter(Boolean).join(' ').toLowerCase();
        return name.includes(q) || m.email.toLowerCase().includes(q);
      });

      if (matchingMembers.length === 0) {
        return NextResponse.json({ success: true, data: [], totalCount: 0 });
      }

      memberIds = matchingMembers.map((m: { id: string }) => m.id);
    }

    // Build the member lookup map for name/email
    const memberMap: Record<string, { name: string; email: string }> = {};
    members.forEach((m: { id: string; first_name: string | null; last_name: string | null; email: string }) => {
      memberMap[m.id] = {
        name: [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Unknown',
        email: m.email,
      };
    });

    // Query activity_log
    const from = (pageParam - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = svc
      .from('activity_log')
      .select('id, user_id, action_type, story_type, input_data, output_preview, metadata, created_at', { count: 'exact' })
      .in('user_id', memberIds);

    if (filter !== 'all') {
      query = query.eq('action_type', filter);
    }

    query = query
      .order('created_at', { ascending: sort === 'asc' })
      .range(from, to);

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('Team activity log query error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedLogs = (logs || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      action_type: row.action_type,
      story_type: row.story_type,
      input_data: row.input_data,
      output_preview: row.output_preview,
      metadata: row.metadata || {},
      created_at: row.created_at,
      user_name: memberMap[row.user_id]?.name || 'Unknown',
      user_email: memberMap[row.user_id]?.email || 'N/A',
    }));

    return NextResponse.json({ success: true, data: enrichedLogs, totalCount: count ?? 0 });
  } catch (err) {
    console.error('Team activity GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

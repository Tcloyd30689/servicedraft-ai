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

// GET: Fetch narrative tracker entries for a team's members
// Query params:
//   team_id, page (1-based), filter (all|regenerated|customized|proofread|saved|exported),
//   search, sort (asc|desc)
//   detail_id — when present, fetch a single tracker entry by ID with all columns
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
    const detailId = searchParams.get('detail_id');

    // Admin can only query their own team
    if (authUser.role === 'admin') {
      if (!authUser.teamId) {
        return NextResponse.json({ success: true, data: [], totalCount: 0 });
      }
      teamId = authUser.teamId;
    }

    if (!teamId && !detailId) {
      return NextResponse.json({ error: 'team_id query parameter is required' }, { status: 400 });
    }

    const svc = createServiceClient();

    // ─── Detail mode: fetch a single tracker entry by ID ───────────
    if (detailId) {
      const { data: trackerDetail, error: detailError } = await svc
        .from('narrative_tracker')
        .select('*')
        .eq('id', detailId)
        .single();

      if (detailError || !trackerDetail) {
        return NextResponse.json({ error: detailError?.message || 'Tracker entry not found' }, { status: 404 });
      }

      // Verify the tracker entry belongs to a team member (same team check)
      const { data: trackerUser } = await svc
        .from('users')
        .select('team_id')
        .eq('id', trackerDetail.user_id)
        .single();

      // Admin must verify the user is in their team
      const effectiveTeamId = teamId || authUser.teamId;
      if (authUser.role === 'admin' && trackerUser?.team_id !== effectiveTeamId) {
        return NextResponse.json({ error: 'Access denied — entry does not belong to your team' }, { status: 403 });
      }

      // Fetch user info
      const { data: detailUser } = await svc
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', trackerDetail.user_id)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          ...trackerDetail,
          user_first_name: detailUser?.first_name || null,
          user_last_name: detailUser?.last_name || null,
          user_email: detailUser?.email || 'Unknown',
        },
      });
    }

    // ─── List mode: fetch paginated tracker entries for team ───────
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 25;
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'desc';

    // Get team member IDs
    const { data: members } = await svc
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('team_id', teamId!);

    if (!members || members.length === 0) {
      return NextResponse.json({ success: true, data: [], totalCount: 0 });
    }

    let memberIds = members.map((m: { id: string }) => m.id);

    // Build member lookup map
    const memberMap: Record<string, { first_name: string | null; last_name: string | null; email: string }> = {};
    members.forEach((m: { id: string; first_name: string | null; last_name: string | null; email: string }) => {
      memberMap[m.id] = { first_name: m.first_name, last_name: m.last_name, email: m.email };
    });

    // Search: filter by user name/email or RO number
    let searchUserIds: string[] | null = null;
    if (search.trim()) {
      const q = search.trim().toLowerCase();

      // Find matching members by name or email
      const matchingMembers = members.filter((m: { first_name: string | null; last_name: string | null; email: string }) => {
        const name = [m.first_name, m.last_name].filter(Boolean).join(' ').toLowerCase();
        return name.includes(q) || m.email.toLowerCase().includes(q);
      });

      searchUserIds = matchingMembers.map((m: { id: string }) => m.id);
    }

    // Build the main query
    const from = (pageParam - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = svc
      .from('narrative_tracker')
      .select('id, user_id, ro_number, vehicle_year, vehicle_make, vehicle_model, story_type, created_at, last_action_at, is_regenerated, is_customized, is_proofread, is_saved, is_exported, export_type', { count: 'exact' })
      .in('user_id', memberIds);

    // Apply boolean-based filter
    if (filter === 'regenerated') query = query.eq('is_regenerated', true);
    else if (filter === 'customized') query = query.eq('is_customized', true);
    else if (filter === 'proofread') query = query.eq('is_proofread', true);
    else if (filter === 'saved') query = query.eq('is_saved', true);
    else if (filter === 'exported') query = query.eq('is_exported', true);

    // Apply search — match RO number OR user IDs
    if (search.trim()) {
      if (searchUserIds && searchUserIds.length > 0) {
        query = query.or(`ro_number.ilike.%${search.trim()}%,user_id.in.(${searchUserIds.join(',')})`);
      } else {
        // No user matches — only search by RO number
        query = query.ilike('ro_number', `%${search.trim()}%`);
      }
    }

    query = query
      .order('last_action_at', { ascending: sort === 'asc' })
      .range(from, to);

    const { data: trackerRows, count, error } = await query;

    if (error) {
      console.error('Team tracker query error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich each row with user info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedEntries = (trackerRows || []).map((row: any) => {
      const u = memberMap[row.user_id] || { first_name: null, last_name: null, email: 'Unknown' };
      return {
        ...row,
        user_first_name: u.first_name,
        user_last_name: u.last_name,
        user_email: u.email,
      };
    });

    return NextResponse.json({ success: true, data: enrichedEntries, totalCount: count ?? 0 });
  } catch (err) {
    console.error('Team activity GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

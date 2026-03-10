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

// GET: List members of a team
// Owner can query any team via ?team_id=xxx. Admin can only query their own team.
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

    // Admin can only query their own team
    if (authUser.role === 'admin') {
      if (!authUser.teamId) {
        return NextResponse.json({ success: true, data: [] });
      }
      teamId = authUser.teamId;
    }

    // Owner must provide a team_id
    if (!teamId) {
      return NextResponse.json({ error: 'team_id query parameter is required' }, { status: 400 });
    }

    const svc = createServiceClient();

    // Get team members
    const { data: members, error: membersError } = await svc
      .from('users')
      .select('id, first_name, last_name, email, role, position, team_id')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    // Get narrative counts per member
    const memberIds = (members || []).map((m: { id: string }) => m.id);

    let narrativeCounts: Record<string, number> = {};
    let lastActiveMap: Record<string, string> = {};

    if (memberIds.length > 0) {
      const { data: narrativeRows } = await svc
        .from('narratives')
        .select('user_id')
        .in('user_id', memberIds);

      (narrativeRows || []).forEach((n: { user_id: string }) => {
        narrativeCounts[n.user_id] = (narrativeCounts[n.user_id] || 0) + 1;
      });

      // Get last activity per member
      const { data: activityRows } = await svc
        .from('activity_log')
        .select('user_id, created_at')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false });

      (activityRows || []).forEach((a: { user_id: string; created_at: string }) => {
        if (!lastActiveMap[a.user_id]) lastActiveMap[a.user_id] = a.created_at;
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedMembers = (members || []).map((m: any) => ({
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email,
      role: m.role,
      position: m.position,
      last_active: lastActiveMap[m.id] || null,
      narrative_count: narrativeCounts[m.id] || 0,
    }));

    return NextResponse.json({ success: true, data: enrichedMembers });
  } catch (err) {
    console.error('Team members GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a member's role
// Admin can promote user→admin within their team. Owner can change any role except owner.
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'owner' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized — admin or owner only' }, { status: 403 });
    }

    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'userId and newRole are required' }, { status: 400 });
    }

    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'newRole must be "user" or "admin"' }, { status: 400 });
    }

    const svc = createServiceClient();

    // Get the target user's current info
    const { data: targetUser } = await svc
      .from('users')
      .select('role, team_id')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot change an owner's role
    if (targetUser.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 });
    }

    // Admin can only manage users within their own team
    if (authUser.role === 'admin') {
      if (!authUser.teamId || targetUser.team_id !== authUser.teamId) {
        return NextResponse.json({ error: 'You can only manage members in your own team' }, { status: 403 });
      }
      // Admin can only promote user→admin, not demote admin→user
      if (newRole === 'user' && targetUser.role === 'admin') {
        return NextResponse.json({ error: 'Admins cannot demote other admins' }, { status: 403 });
      }
    }

    const { error } = await svc
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Team members PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

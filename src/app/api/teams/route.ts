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

// GET: List all teams (owner) or get current user's team (admin/user)
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = createServiceClient();

    if (authUser.role === 'owner') {
      // Owner sees all teams
      const { data: teams, error } = await svc
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get member counts for each team
      const { data: users } = await svc
        .from('users')
        .select('team_id');

      const memberCounts: Record<string, number> = {};
      (users || []).forEach((u: { team_id: string | null }) => {
        if (u.team_id) {
          memberCounts[u.team_id] = (memberCounts[u.team_id] || 0) + 1;
        }
      });

      const enrichedTeams = (teams || []).map((t: { id: string }) => ({
        ...t,
        member_count: memberCounts[t.id] || 0,
      }));

      return NextResponse.json({ success: true, data: enrichedTeams });
    }

    // Admin or user — return their own team
    if (!authUser.teamId) {
      return NextResponse.json({ success: true, data: null });
    }

    const { data: team, error } = await svc
      .from('teams')
      .select('*')
      .eq('id', authUser.teamId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: team });
  } catch (err) {
    console.error('Teams GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new team (owner only)
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized — owner only' }, { status: 403 });
    }

    const { name, access_code, description } = await request.json();

    if (!name?.trim() || !access_code?.trim()) {
      return NextResponse.json({ error: 'name and access_code are required' }, { status: 400 });
    }

    const svc = createServiceClient();

    const { data: team, error } = await svc
      .from('teams')
      .insert({
        name: name.trim(),
        access_code: access_code.trim(),
        description: description?.trim() || null,
        created_by: authUser.userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Access code already in use' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (err) {
    console.error('Teams POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update team details (owner only)
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized — owner only' }, { status: 403 });
    }

    const { id, name, access_code, description, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Team id is required' }, { status: 400 });
    }

    const svc = createServiceClient();

    const updates: Record<string, string | boolean | null> = {};
    if (name !== undefined) updates.name = name.trim();
    if (access_code !== undefined) updates.access_code = access_code.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: team, error } = await svc
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Access code already in use' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: team });
  } catch (err) {
    console.error('Teams PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Soft-delete a team (owner only, sets is_active = false)
export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized — owner only' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Team id is required' }, { status: 400 });
    }

    const svc = createServiceClient();

    const { error } = await svc
      .from('teams')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Teams DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    .select('role, group_id')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return { userId: user.id, role: profile.role as string, groupId: profile.group_id as string | null };
}

// GET: List all groups (owner) or get current user's group (admin/user)
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = createServiceClient();

    if (authUser.role === 'owner') {
      // Owner sees all groups
      const { data: groups, error } = await svc
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get member counts for each group
      const { data: users } = await svc
        .from('users')
        .select('group_id');

      const memberCounts: Record<string, number> = {};
      (users || []).forEach((u: { group_id: string | null }) => {
        if (u.group_id) {
          memberCounts[u.group_id] = (memberCounts[u.group_id] || 0) + 1;
        }
      });

      const enrichedGroups = (groups || []).map((g: { id: string }) => ({
        ...g,
        member_count: memberCounts[g.id] || 0,
      }));

      return NextResponse.json({ success: true, data: enrichedGroups });
    }

    // Admin or user — return their own group
    if (!authUser.groupId) {
      return NextResponse.json({ success: true, data: null });
    }

    const { data: group, error } = await svc
      .from('groups')
      .select('*')
      .eq('id', authUser.groupId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: group });
  } catch (err) {
    console.error('Groups GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new group (owner only)
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

    // Ensure access code doesn't match the master access code
    const masterCode = process.env.ACCESS_CODE;
    if (masterCode && access_code.trim() === masterCode) {
      return NextResponse.json({ error: 'Access code cannot match the master access code' }, { status: 400 });
    }

    const svc = createServiceClient();

    const { data: group, error } = await svc
      .from('groups')
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

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (err) {
    console.error('Groups POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update group details (owner only)
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized — owner only' }, { status: 403 });
    }

    const { id, name, access_code, description } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Group id is required' }, { status: 400 });
    }

    // Ensure access code doesn't match the master access code
    if (access_code) {
      const masterCode = process.env.ACCESS_CODE;
      if (masterCode && access_code.trim() === masterCode) {
        return NextResponse.json({ error: 'Access code cannot match the master access code' }, { status: 400 });
      }
    }

    const svc = createServiceClient();

    const updates: Record<string, string | null> = {};
    if (name !== undefined) updates.name = name.trim();
    if (access_code !== undefined) updates.access_code = access_code.trim();
    if (description !== undefined) updates.description = description?.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: group, error } = await svc
      .from('groups')
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

    return NextResponse.json({ success: true, data: group });
  } catch (err) {
    console.error('Groups PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Soft-delete a group (owner only, sets is_active = false)
export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized — owner only' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Group id is required' }, { status: 400 });
    }

    const svc = createServiceClient();

    const { error } = await svc
      .from('groups')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Groups DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface NarrativeHistoryEntry {
  action: string;
  version: number;
  at: string;
  narrative_text?: string;
  concern?: string;
  cause?: string;
  correction?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: narrative, error } = await supabase
      .from('narratives')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !narrative) {
      return NextResponse.json({ error: 'Narrative not found' }, { status: 404 });
    }

    if (narrative.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, narrative });
  } catch (err) {
    console.error('GET /api/narratives/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action_type, narrative } = body as {
      action_type: string;
      narrative: {
        block_narrative: string;
        concern: string;
        cause: string;
        correction: string;
      };
    };

    if (!action_type || !narrative) {
      return NextResponse.json({ error: 'Missing action_type or narrative' }, { status: 400 });
    }

    // Fetch existing row
    const { data: existing, error: fetchError } = await supabase
      .from('narratives')
      .select('id, user_id, action_history')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Narrative not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Compute next version
    const history: NarrativeHistoryEntry[] = Array.isArray(existing.action_history)
      ? existing.action_history
      : [];
    const maxVersion = history.reduce((max, e) => Math.max(max, e.version || 0), 0);
    const nextVersion = maxVersion + 1;

    const now = new Date().toISOString();
    const newEntry: NarrativeHistoryEntry = {
      action: action_type,
      version: nextVersion,
      at: now,
      narrative_text: narrative.block_narrative,
      concern: narrative.concern,
      cause: narrative.cause,
      correction: narrative.correction,
    };

    // Try RPC first, fall back to read-modify-write
    let rpcFailed = false;
    try {
      const { error: rpcError } = await supabase.rpc('append_narrative_history', {
        p_narrative_id: id,
        p_entry: newEntry,
      });
      if (rpcError) {
        console.warn('append_narrative_history RPC unavailable, falling back:', rpcError.message);
        rpcFailed = true;
      }
    } catch {
      console.warn('append_narrative_history RPC call failed, using fallback');
      rpcFailed = true;
    }

    if (rpcFailed) {
      // Read-modify-write fallback
      const updatedHistory = [...history, newEntry];
      const { error: updateError } = await supabase
        .from('narratives')
        .update({
          action_history: updatedHistory,
          concern: narrative.concern,
          cause: narrative.cause,
          correction: narrative.correction,
          full_narrative: narrative.block_narrative,
          updated_at: now,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Fallback update failed:', updateError.message);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // RPC handled action_history + updated_at; update the narrative fields
      const { error: updateError } = await supabase
        .from('narratives')
        .update({
          concern: narrative.concern,
          cause: narrative.cause,
          correction: narrative.correction,
          full_narrative: narrative.block_narrative,
          updated_at: now,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Field update after RPC failed:', updateError.message);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, version: nextVersion });
  } catch (err) {
    console.error('PATCH /api/narratives/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

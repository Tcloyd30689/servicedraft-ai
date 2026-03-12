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

export async function POST(request: Request) {
  try {
    // Authenticate user via server session
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    const svc = createServiceClient();

    switch (action) {
      case 'create': {
        const {
          ro_number, vehicle_year, vehicle_make, vehicle_model, story_type,
          full_narrative, concern, cause, correction, customization,
        } = body;

        if (!full_narrative) {
          return NextResponse.json({ success: false, error: 'full_narrative is required' }, { status: 400 });
        }

        // Build initial action_history entry
        const initialEntry = {
          action: 'generate',
          at: new Date().toISOString(),
          version: 1,
          narrative_text: full_narrative,
          concern: concern || null,
          cause: cause || null,
          correction: correction || null,
          customization: customization || null,
        };

        const { data, error } = await svc
          .from('narrative_tracker')
          .insert({
            user_id: user.id,
            ro_number: ro_number || null,
            vehicle_year: vehicle_year || null,
            vehicle_make: vehicle_make || null,
            vehicle_model: vehicle_model || null,
            story_type: story_type || null,
            full_narrative,
            concern: concern || null,
            cause: cause || null,
            correction: correction || null,
            action_history: [initialEntry],
          })
          .select('id')
          .single();

        if (error) {
          console.error('Tracker create error:', error.message);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: { id: data.id } });
      }

      case 'update': {
        const { trackerId, actionType, narrative_text, concern, cause, correction, customization, export_type } = body;

        if (!trackerId || !actionType) {
          return NextResponse.json({ success: false, error: 'trackerId and actionType are required' }, { status: 400 });
        }

        // Verify ownership
        const { data: trackerRow, error: fetchError } = await svc
          .from('narrative_tracker')
          .select('id, user_id, action_history')
          .eq('id', trackerId)
          .single();

        if (fetchError || !trackerRow) {
          return NextResponse.json({ success: false, error: 'Tracker entry not found' }, { status: 404 });
        }

        if (trackerRow.user_id !== user.id) {
          return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        const now = new Date().toISOString();

        // Determine if this is a version-creating action
        const versionActions = ['regenerate', 'customize', 'proofread_apply'];
        const isVersionAction = versionActions.includes(actionType);

        // Build action_history entry
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const historyEntry: Record<string, any> = {
          action: actionType,
          at: now,
        };

        if (isVersionAction) {
          // Find max version number from existing history
          const history = trackerRow.action_history as Array<{ version?: number }>;
          let maxVersion = 0;
          for (const entry of history) {
            if (entry.version && entry.version > maxVersion) {
              maxVersion = entry.version;
            }
          }
          historyEntry.version = maxVersion + 1;
          historyEntry.narrative_text = narrative_text || null;
          historyEntry.concern = concern || null;
          historyEntry.cause = cause || null;
          historyEntry.correction = correction || null;
          historyEntry.customization = customization || null;
        }

        // Atomically append history entry and bump last_action_at via RPC
        const { error: rpcError } = await svc.rpc('append_tracker_history', {
          p_tracker_id: trackerId,
          p_entry: historyEntry,
        });

        if (rpcError) {
          console.error('Tracker RPC error:', rpcError.message);
          return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 });
        }

        // Build column updates based on actionType
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: Record<string, any> = {};

        switch (actionType) {
          case 'regenerate':
            updates.is_regenerated = true;
            updates.regenerated_at = now;
            updates.full_narrative = narrative_text;
            if (concern !== undefined) updates.concern = concern;
            if (cause !== undefined) updates.cause = cause;
            if (correction !== undefined) updates.correction = correction;
            break;

          case 'customize':
            updates.is_customized = true;
            updates.customized_at = now;
            updates.full_narrative = narrative_text;
            if (concern !== undefined) updates.concern = concern;
            if (cause !== undefined) updates.cause = cause;
            if (correction !== undefined) updates.correction = correction;
            break;

          case 'proofread':
            updates.is_proofread = true;
            updates.proofread_at = now;
            break;

          case 'proofread_apply':
            updates.is_proofread = true;
            updates.proofread_at = now;
            updates.full_narrative = narrative_text;
            if (concern !== undefined) updates.concern = concern;
            if (cause !== undefined) updates.cause = cause;
            if (correction !== undefined) updates.correction = correction;
            break;

          case 'save':
            updates.is_saved = true;
            updates.saved_at = now;
            break;

          case 'export_copy':
          case 'export_print':
          case 'export_pdf':
          case 'export_docx':
            updates.is_exported = true;
            updates.exported_at = now;
            updates.export_type = actionType.replace('export_', '');
            break;

          default:
            // Unknown actionType — still logged in history via RPC, no column update needed
            break;
        }

        // Apply column updates if any
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await svc
            .from('narrative_tracker')
            .update(updates)
            .eq('id', trackerId);

          if (updateError) {
            console.error('Tracker update error:', updateError.message);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('Narrative tracker API error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

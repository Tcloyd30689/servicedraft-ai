import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

/**
 * public.proofread_feedback has RLS enabled with NO policies, so only the
 * service-role client can read or write it. Identity still comes from the
 * cookie-based server client — user_id is ALWAYS the verified session user and
 * never read from the request body.
 */
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(url, serviceKey);
}

/** The owner asked for a very high limit on the free-text feedback. */
const MAX_COMMENT_LENGTH = 5000;
const MAX_SUGGESTION_TEXT_LENGTH = 2000;
const MAX_ISSUE_TYPE_LENGTH = 200;
const MAX_META_LENGTH = 100;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

/** Optional free-form string: undefined/null -> null, non-string -> error. */
function optionalString(
  value: unknown,
  field: string,
  maxLength: number,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false, error: `${field} must be a string` };
  return { ok: true, value: value.slice(0, maxLength) };
}

/**
 * POST /api/proofread-feedback
 *
 * Records a thumbs-up / thumbs-down (plus an optional comment) for ONE
 * suggestion inside ONE proofread run. One row per
 * (user_id, proofread_run_id, suggestion_index); the upsert is manual
 * (SELECT -> UPDATE or INSERT), matching /api/feedback and /api/surveys.
 *
 * Body:
 *   proofread_run_id  uuid string (generated client-side per proofread run)
 *   suggestion_index  integer >= 0
 *   rating            'up' | 'down'
 *   suggestion_text   optional string (truncated to 2000)
 *   issue_type        optional string (truncated to 200)
 *   comment           optional string, trimmed, empty -> null, 400 above 5000
 *   tracker_id        optional uuid string or null
 *   story_type        optional string
 *   narrative_style   optional string
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // A literal `null` / array / scalar body parses fine but is not indexable —
    // reject it as a 400 rather than letting the property read throw a 500.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (body.rating !== 'up' && body.rating !== 'down') {
      return NextResponse.json(
        { error: "rating must be either 'up' or 'down'" },
        { status: 400 }
      );
    }
    const rating: 'up' | 'down' = body.rating;

    if (!isUuid(body.proofread_run_id)) {
      return NextResponse.json(
        { error: 'proofread_run_id must be a uuid string' },
        { status: 400 }
      );
    }
    const proofreadRunId = body.proofread_run_id.trim().toLowerCase();

    if (
      typeof body.suggestion_index !== 'number' ||
      !Number.isInteger(body.suggestion_index) ||
      body.suggestion_index < 0
    ) {
      return NextResponse.json(
        { error: 'suggestion_index must be an integer >= 0' },
        { status: 400 }
      );
    }
    const suggestionIndex: number = body.suggestion_index;

    const suggestionText = optionalString(body.suggestion_text, 'suggestion_text', MAX_SUGGESTION_TEXT_LENGTH);
    if (!suggestionText.ok) {
      return NextResponse.json({ error: suggestionText.error }, { status: 400 });
    }

    const issueType = optionalString(body.issue_type, 'issue_type', MAX_ISSUE_TYPE_LENGTH);
    if (!issueType.ok) {
      return NextResponse.json({ error: issueType.error }, { status: 400 });
    }

    let comment: string | null = null;
    if (body.comment !== undefined && body.comment !== null) {
      if (typeof body.comment !== 'string') {
        return NextResponse.json({ error: 'comment must be a string' }, { status: 400 });
      }
      const trimmedComment = body.comment.trim();
      if (trimmedComment.length > MAX_COMMENT_LENGTH) {
        return NextResponse.json(
          { error: `comment must be ${MAX_COMMENT_LENGTH} characters or fewer` },
          { status: 400 }
        );
      }
      comment = trimmedComment.length > 0 ? trimmedComment : null;
    }

    let trackerId: string | null = null;
    if (body.tracker_id !== undefined && body.tracker_id !== null) {
      if (!isUuid(body.tracker_id)) {
        return NextResponse.json(
          { error: 'tracker_id must be a uuid string or null' },
          { status: 400 }
        );
      }
      trackerId = body.tracker_id.trim().toLowerCase();
    }

    const storyType = optionalString(body.story_type, 'story_type', MAX_META_LENGTH);
    if (!storyType.ok) {
      return NextResponse.json({ error: storyType.error }, { status: 400 });
    }

    const narrativeStyle = optionalString(body.narrative_style, 'narrative_style', MAX_META_LENGTH);
    if (!narrativeStyle.ok) {
      return NextResponse.json({ error: narrativeStyle.error }, { status: 400 });
    }

    const svc = createServiceClient();

    // 1. Look for this user's existing vote on this suggestion in this run.
    // SCOPING INVARIANT: user_id comes from the verified session, never the request.
    const { data: existing, error: lookupError } = await svc
      .from('proofread_feedback')
      .select('id')
      .eq('user_id', user.id)
      .eq('proofread_run_id', proofreadRunId)
      .eq('suggestion_index', suggestionIndex)
      .maybeSingle();

    if (lookupError) {
      console.error('Failed to look up proofread feedback:', lookupError.message);
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    // 2. Row exists -> update it in place (still scoped to this user).
    if (existing) {
      const { data, error } = await svc
        .from('proofread_feedback')
        .update({
          rating,
          comment,
          suggestion_text: suggestionText.value,
          issue_type: issueType.value,
          tracker_id: trackerId,
          story_type: storyType.value,
          narrative_style: narrativeStyle.value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to update proofread feedback:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: data.id }, { status: 200 });
    }

    // 3. No row yet -> insert one owned by the session user.
    const { data, error } = await svc
      .from('proofread_feedback')
      .insert({
        tracker_id: trackerId,
        user_id: user.id,
        proofread_run_id: proofreadRunId,
        suggestion_index: suggestionIndex,
        suggestion_text: suggestionText.value,
        issue_type: issueType.value,
        rating,
        comment,
        story_type: storyType.value,
        narrative_style: narrativeStyle.value,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create proofread feedback:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 200 });
  } catch (err) {
    console.error('Proofread feedback POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

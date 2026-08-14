import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_COMMENT_LENGTH = 500;

/**
 * POST /api/feedback
 *
 * Records a single thumbs-up / thumbs-down rating (plus an optional comment)
 * per (tracker_id, user_id) pair. The upsert is done manually — SELECT then
 * UPDATE or INSERT — because we cannot rely on a unique constraint existing
 * on (tracker_id, user_id).
 *
 * Uses the cookie-based server client so RLS applies. Every query is scoped by
 * user_id so a user can never read or write another user's feedback row.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    if (typeof body.tracker_id !== 'string' || !body.tracker_id.trim()) {
      return NextResponse.json(
        { error: 'tracker_id is required' },
        { status: 400 }
      );
    }

    if (body.rating !== 'up' && body.rating !== 'down') {
      return NextResponse.json(
        { error: "rating must be either 'up' or 'down'" },
        { status: 400 }
      );
    }

    let comment: string | null = null;
    if (body.comment !== undefined && body.comment !== null) {
      if (typeof body.comment !== 'string') {
        return NextResponse.json(
          { error: 'comment must be a string' },
          { status: 400 }
        );
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

    if (body.story_type !== undefined && body.story_type !== null && typeof body.story_type !== 'string') {
      return NextResponse.json(
        { error: 'story_type must be a string' },
        { status: 400 }
      );
    }

    if (body.narrative_style !== undefined && body.narrative_style !== null && typeof body.narrative_style !== 'string') {
      return NextResponse.json(
        { error: 'narrative_style must be a string' },
        { status: 400 }
      );
    }

    const trackerId = body.tracker_id.trim();
    const storyType = typeof body.story_type === 'string' ? body.story_type : null;
    const narrativeStyle = typeof body.narrative_style === 'string' ? body.narrative_style : null;

    // 1. Look for this user's existing feedback row for this tracker.
    const { data: existing, error: lookupError } = await supabase
      .from('narrative_feedback')
      .select('id')
      .eq('tracker_id', trackerId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (lookupError) {
      console.error('Failed to look up narrative feedback:', lookupError.message);
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    // 2. Row exists → update it in place.
    if (existing) {
      const { data, error } = await supabase
        .from('narrative_feedback')
        .update({
          rating: body.rating,
          comment,
          story_type: storyType,
          narrative_style: narrativeStyle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .select('id, rating')
        .single();

      if (error) {
        console.error('Failed to update narrative feedback:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, feedback: data }, { status: 200 });
    }

    // 3. No row yet → insert a new one.
    const { data, error } = await supabase
      .from('narrative_feedback')
      .insert({
        tracker_id: trackerId,
        user_id: user.id,
        rating: body.rating,
        comment,
        story_type: storyType,
        narrative_style: narrativeStyle,
      })
      .select('id, rating')
      .single();

    if (error) {
      console.error('Failed to create narrative feedback:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback: data }, { status: 200 });
  } catch (err) {
    console.error('Feedback POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

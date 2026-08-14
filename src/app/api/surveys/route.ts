import { NextRequest, NextResponse } from 'next/server';
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

const MAX_RESPONSE_VALUE_LENGTH = 1000;

interface ActiveQuestionRow {
  id: string;
  question_text: string;
  input_type: string;
  options: string[] | null;
  display_chance: number;
  created_at: string;
}

/**
 * GET /api/surveys
 *
 * Returns at most ONE active survey question the signed-in user has neither
 * answered nor dismissed, or null when nothing is eligible.
 *
 * The user is identified with the cookie-based server client; the data reads
 * use the service-role client because survey_questions is global (not
 * user-owned) data and we cannot verify what its RLS policies permit for an
 * ordinary user without running SQL. Because RLS is bypassed, user_id is taken
 * from the verified session on every query and never from the request.
 */
export async function GET() {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = createServiceClient();

    const [questionsRes, seenRes] = await Promise.all([
      svc
        .from('survey_questions')
        .select('id, question_text, input_type, options, display_chance, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      // SCOPING INVARIANT: user_id comes from the verified session, never the request.
      svc.from('survey_responses').select('survey_id').eq('user_id', user.id),
    ]);

    if (questionsRes.error) {
      console.error('Failed to fetch active survey questions:', questionsRes.error.message);
      return NextResponse.json({ error: questionsRes.error.message }, { status: 500 });
    }

    if (seenRes.error) {
      console.error('Failed to fetch survey responses for user:', seenRes.error.message);
      return NextResponse.json({ error: seenRes.error.message }, { status: 500 });
    }

    const seenIds = new Set<string>(
      (seenRes.data || []).map((row: { survey_id: string }) => row.survey_id)
    );

    const eligible = (questionsRes.data || []).filter(
      (question: ActiveQuestionRow) => !seenIds.has(question.id)
    );

    if (eligible.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    // Deterministic pick: the oldest eligible question (created_at ascending).
    const question: ActiveQuestionRow = eligible[0];

    return NextResponse.json({
      success: true,
      data: {
        id: question.id,
        question_text: question.question_text,
        input_type: question.input_type,
        options: question.options,
        display_chance: question.display_chance,
      },
    });
  } catch (err) {
    console.error('Surveys GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/surveys
 *
 * Records a response or a dismissal — one row per (survey_id, user_id). The
 * upsert is done manually (SELECT then UPDATE or INSERT) because we cannot
 * rely on a unique constraint existing on (survey_id, user_id).
 *
 * Same client split as GET: cookie client for identity, service client for
 * data. user_id always comes from the verified session.
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

    if (typeof body.survey_id !== 'string' || !body.survey_id.trim()) {
      return NextResponse.json({ error: 'survey_id is required' }, { status: 400 });
    }
    const surveyId = body.survey_id.trim();

    let responseValue: string | null = null;
    if (body.response_value !== undefined && body.response_value !== null) {
      if (typeof body.response_value !== 'string') {
        return NextResponse.json({ error: 'response_value must be a string' }, { status: 400 });
      }
      const trimmed = body.response_value.trim();
      if (trimmed.length > MAX_RESPONSE_VALUE_LENGTH) {
        return NextResponse.json(
          { error: `response_value must be ${MAX_RESPONSE_VALUE_LENGTH} characters or fewer` },
          { status: 400 }
        );
      }
      responseValue = trimmed.length > 0 ? trimmed : null;
    }

    let wasDismissed = false;
    if (body.was_dismissed !== undefined && body.was_dismissed !== null) {
      if (typeof body.was_dismissed !== 'boolean') {
        return NextResponse.json({ error: 'was_dismissed must be a boolean' }, { status: 400 });
      }
      wasDismissed = body.was_dismissed;
    }

    const svc = createServiceClient();

    // 1. survey_id must refer to a real question.
    const { data: question, error: questionError } = await svc
      .from('survey_questions')
      .select('id')
      .eq('id', surveyId)
      .maybeSingle();

    if (questionError) {
      // A malformed id (non-uuid) surfaces here as a query error.
      console.error('Failed to look up survey question:', questionError.message);
      return NextResponse.json({ error: 'Unknown survey_id' }, { status: 400 });
    }

    if (!question) {
      return NextResponse.json({ error: 'Unknown survey_id' }, { status: 400 });
    }

    // 2. Look for this user's existing row for this question.
    // SCOPING INVARIANT: user_id comes from the verified session, never the request.
    const { data: existing, error: lookupError } = await svc
      .from('survey_responses')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (lookupError) {
      console.error('Failed to look up survey response:', lookupError.message);
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    // 3. Row exists → update it in place (still scoped to this user).
    if (existing) {
      const { data, error } = await svc
        .from('survey_responses')
        .update({
          response_value: responseValue,
          was_dismissed: wasDismissed,
        })
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .select('id, survey_id, response_value, was_dismissed')
        .single();

      if (error) {
        console.error('Failed to update survey response:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    // 4. No row yet → insert one owned by the session user.
    const { data, error } = await svc
      .from('survey_responses')
      .insert({
        survey_id: surveyId,
        user_id: user.id,
        response_value: responseValue,
        was_dismissed: wasDismissed,
      })
      .select('id, survey_id, response_value, was_dismissed')
      .single();

    if (error) {
      console.error('Failed to create survey response:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('Surveys POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // qa_tester: read-only owner-equivalent (Sprint G-4a)
  if (!profile || (profile.role !== 'owner' && profile.role !== 'qa_tester')) return null;
  return { userId: user.id, role: profile.role as string };
}

const MAX_QUESTION_TEXT_LENGTH = 500;
const MAX_OPTIONS = 10;
const MAX_OPTION_LENGTH = 100;
const VALID_INPUT_TYPES = ['text', 'choice'] as const;

type SurveyInputType = (typeof VALID_INPUT_TYPES)[number];

interface ValidatedSurveyFields {
  question_text?: string;
  input_type?: SurveyInputType;
  options?: string[] | null;
  display_chance?: number;
  is_active?: boolean;
}

interface SurveyQuestionRow {
  id: string;
  question_text: string;
  input_type: string;
  options: string[] | null;
  is_active: boolean;
  display_chance: number;
  created_by: string | null;
  created_at: string;
}

/**
 * Shared validation for POST (create) and PATCH (edit/toggle).
 *
 * - requireAll: true  → create. question_text / input_type / display_chance are
 *   mandatory; is_active defaults to true when omitted.
 * - requireAll: false → patch. Only keys present in the body are validated and
 *   returned, so a toggle-only call never blanks the other columns.
 *
 * fallbackInputType is the input_type already stored on the row (PATCH only);
 * it decides how `options` is treated when the body does not change input_type.
 */
function validateSurveyFields(
  body: Record<string, unknown>,
  opts: { requireAll: boolean; fallbackInputType?: string | null }
): { error: string } | { values: ValidatedSurveyFields } {
  const values: ValidatedSurveyFields = {};

  // question_text — non-empty after trim, max 500 chars
  if (body.question_text !== undefined) {
    if (typeof body.question_text !== 'string') {
      return { error: 'question_text must be a string' };
    }
    const trimmed = body.question_text.trim();
    if (!trimmed) {
      return { error: 'question_text cannot be empty' };
    }
    if (trimmed.length > MAX_QUESTION_TEXT_LENGTH) {
      return { error: `question_text must be ${MAX_QUESTION_TEXT_LENGTH} characters or fewer` };
    }
    values.question_text = trimmed;
  } else if (opts.requireAll) {
    return { error: 'question_text is required' };
  }

  // input_type — exactly 'text' or 'choice'
  if (body.input_type !== undefined) {
    if (
      typeof body.input_type !== 'string' ||
      !VALID_INPUT_TYPES.includes(body.input_type as SurveyInputType)
    ) {
      return { error: "input_type must be either 'text' or 'choice'" };
    }
    values.input_type = body.input_type as SurveyInputType;
  } else if (opts.requireAll) {
    return { error: 'input_type is required' };
  }

  const effectiveInputType = values.input_type ?? opts.fallbackInputType ?? null;
  const optionsProvided = body.options !== undefined && body.options !== null;

  // options — required and validated for 'choice', stored as null for 'text'
  if (effectiveInputType === 'choice') {
    if (optionsProvided) {
      if (!Array.isArray(body.options)) {
        return { error: 'options must be an array of strings' };
      }
      if (body.options.length === 0) {
        return { error: "options must contain at least one option when input_type is 'choice'" };
      }
      if (body.options.length > MAX_OPTIONS) {
        return { error: `options must contain ${MAX_OPTIONS} entries or fewer` };
      }
      const cleaned: string[] = [];
      for (const option of body.options) {
        if (typeof option !== 'string') {
          return { error: 'each option must be a string' };
        }
        const trimmedOption = option.trim();
        if (!trimmedOption) {
          return { error: 'options cannot contain empty values' };
        }
        if (trimmedOption.length > MAX_OPTION_LENGTH) {
          return { error: `each option must be ${MAX_OPTION_LENGTH} characters or fewer` };
        }
        cleaned.push(trimmedOption);
      }
      values.options = cleaned;
    } else if (opts.requireAll || values.input_type !== undefined) {
      // Creating a choice question, or switching an existing row to 'choice',
      // must supply the choices.
      return { error: "options is required when input_type is 'choice'" };
    }
  } else if (effectiveInputType === 'text') {
    if (opts.requireAll || values.input_type !== undefined || body.options !== undefined) {
      values.options = null;
    }
  }

  // display_chance — integer 1-100 inclusive
  if (body.display_chance !== undefined) {
    const displayChance = body.display_chance;
    if (
      typeof displayChance !== 'number' ||
      !Number.isInteger(displayChance) ||
      displayChance < 1 ||
      displayChance > 100
    ) {
      return { error: 'display_chance must be an integer between 1 and 100' };
    }
    values.display_chance = displayChance;
  } else if (opts.requireAll) {
    return { error: 'display_chance is required' };
  }

  // is_active — boolean (defaults to true on create)
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') {
      return { error: 'is_active must be a boolean' };
    }
    values.is_active = body.is_active;
  } else if (opts.requireAll) {
    values.is_active = true;
  }

  return { values };
}

/**
 * GET /api/admin/surveys
 *
 * Lists every survey question (active and inactive), newest first, each with
 * response and dismissal counts aggregated in JavaScript. Read-only, so
 * qa_tester is allowed.
 */
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const svc = createServiceClient();

    const [questionsRes, responsesRes] = await Promise.all([
      svc
        .from('survey_questions')
        .select('id, question_text, input_type, options, is_active, display_chance, created_by, created_at')
        .order('created_at', { ascending: false }),
      svc.from('survey_responses').select('survey_id, was_dismissed'),
    ]);

    if (questionsRes.error) {
      console.error('Failed to fetch survey questions:', questionsRes.error.message);
      return NextResponse.json({ success: false, error: questionsRes.error.message }, { status: 500 });
    }

    if (responsesRes.error) {
      console.error('Failed to fetch survey responses:', responsesRes.error.message);
      return NextResponse.json({ success: false, error: responsesRes.error.message }, { status: 500 });
    }

    // Aggregate in JavaScript — no raw SQL.
    const responseCounts: Record<string, number> = {};
    const dismissCounts: Record<string, number> = {};

    (responsesRes.data || []).forEach((row: { survey_id: string; was_dismissed: boolean | null }) => {
      if (row.was_dismissed) {
        dismissCounts[row.survey_id] = (dismissCounts[row.survey_id] || 0) + 1;
      } else {
        responseCounts[row.survey_id] = (responseCounts[row.survey_id] || 0) + 1;
      }
    });

    const data = (questionsRes.data || []).map((question: SurveyQuestionRow) => ({
      ...question,
      response_count: responseCounts[question.id] || 0,
      dismiss_count: dismissCounts[question.id] || 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Admin surveys GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/surveys
 *
 * Creates a survey question. Mutating, so qa_tester is denied.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // qa_tester is read-only, deny-by-default on every mutation (Sprint G-4a).
    if (admin.role === 'qa_tester') {
      return NextResponse.json({ success: false, error: 'Forbidden — qa_tester is read-only' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    // A literal `null` / array / scalar body parses fine but is not indexable.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const validated = validateSurveyFields(body, { requireAll: true });
    if ('error' in validated) {
      return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
    }

    const svc = createServiceClient();

    const { data, error } = await svc
      .from('survey_questions')
      .insert({
        question_text: validated.values.question_text,
        input_type: validated.values.input_type,
        options: validated.values.options ?? null,
        display_chance: validated.values.display_chance,
        is_active: validated.values.is_active,
        created_by: admin.userId,
      })
      .select('id, question_text, input_type, options, is_active, display_chance, created_by, created_at')
      .single();

    if (error) {
      console.error('Failed to create survey question:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Admin surveys POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/surveys
 *
 * Edits or toggles a survey question. Only keys present in the body are
 * written, so a toggle-only call cannot blank the other fields. Mutating, so
 * qa_tester is denied.
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // qa_tester is read-only, deny-by-default on every mutation (Sprint G-4a).
    if (admin.role === 'qa_tester') {
      return NextResponse.json({ success: false, error: 'Forbidden — qa_tester is read-only' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    // A literal `null` / array / scalar body parses fine but is not indexable.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (typeof body.id !== 'string' || !body.id.trim()) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const questionId = body.id.trim();

    const svc = createServiceClient();

    const { data: existing, error: lookupError } = await svc
      .from('survey_questions')
      .select('id, input_type')
      .eq('id', questionId)
      .maybeSingle();

    if (lookupError) {
      console.error('Failed to look up survey question:', lookupError.message);
      return NextResponse.json({ success: false, error: 'Survey question not found' }, { status: 404 });
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Survey question not found' }, { status: 404 });
    }

    const validated = validateSurveyFields(body, {
      requireAll: false,
      fallbackInputType: existing.input_type,
    });
    if ('error' in validated) {
      return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
    }

    // Only include keys that were actually provided.
    const updates: Record<string, unknown> = {};
    if (validated.values.question_text !== undefined) updates.question_text = validated.values.question_text;
    if (validated.values.input_type !== undefined) updates.input_type = validated.values.input_type;
    if (validated.values.options !== undefined) updates.options = validated.values.options;
    if (validated.values.display_chance !== undefined) updates.display_chance = validated.values.display_chance;
    if (validated.values.is_active !== undefined) updates.is_active = validated.values.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No updatable fields provided' }, { status: 400 });
    }

    const { data, error } = await svc
      .from('survey_questions')
      .update(updates)
      .eq('id', questionId)
      .select('id, question_text, input_type, options, is_active, display_chance, created_by, created_at')
      .single();

    if (error) {
      console.error('Failed to update survey question:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Admin surveys PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

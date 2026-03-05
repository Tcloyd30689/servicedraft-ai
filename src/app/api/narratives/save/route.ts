import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const narrativeData = {
      user_id: user.id,
      ro_number: body.ro_number || null,
      vehicle_year: body.vehicle_year || null,
      vehicle_make: body.vehicle_make || null,
      vehicle_model: body.vehicle_model || null,
      concern: body.concern,
      cause: body.cause,
      correction: body.correction,
      full_narrative: body.full_narrative,
      story_type: body.story_type,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('narratives')
      .insert(narrativeData)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save narrative:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id || null });
  } catch (err) {
    console.error('Save narrative API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

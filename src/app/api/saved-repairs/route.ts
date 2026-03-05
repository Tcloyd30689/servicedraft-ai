import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('saved_repairs')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch saved repairs:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: data });
  } catch (err) {
    console.error('Saved repairs GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.template_name || !body.story_type) {
      return NextResponse.json(
        { error: 'template_name and story_type are required' },
        { status: 400 }
      );
    }

    if (!['diagnostic', 'repair'].includes(body.story_type)) {
      return NextResponse.json(
        { error: 'story_type must be "diagnostic" or "repair"' },
        { status: 400 }
      );
    }

    const templateData = {
      user_id: user.id,
      template_name: body.template_name,
      story_type: body.story_type,
      year: body.year || null,
      make: body.make || null,
      model: body.model || null,
      customer_concern: body.customer_concern || null,
      codes_present: body.codes_present || null,
      codes_present_option: body.codes_present_option || 'include',
      diagnostics_performed: body.diagnostics_performed || null,
      diagnostics_option: body.diagnostics_option || 'include',
      root_cause: body.root_cause || null,
      root_cause_option: body.root_cause_option || 'include',
      repair_performed: body.repair_performed || null,
      repair_option: body.repair_option || null,
      repair_verification: body.repair_verification || null,
      verification_option: body.verification_option || null,
      recommended_action: body.recommended_action || null,
      recommended_option: body.recommended_option || null,
    };

    const { data, error } = await supabase
      .from('saved_repairs')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create saved repair:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (err) {
    console.error('Saved repairs POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

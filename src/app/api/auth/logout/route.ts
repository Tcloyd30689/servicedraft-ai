import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[/api/auth/logout] Sign-out error:', error.message);
      // Still return success — clearing cookies is what matters
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/auth/logout] Unexpected error:', err);
    return NextResponse.json({ success: true }); // Always succeed — user wants to leave
  }
}

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
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
  const { accessCode, mode, userId } = await request.json();

  // Access code bypass for beta
  if (accessCode) {
    const validCode = process.env.ACCESS_CODE;
    if (!validCode) {
      return NextResponse.json(
        { error: 'Access code system not configured' },
        { status: 500 },
      );
    }

    // Check master access code first (owner/direct users — no team assignment)
    if (accessCode === validCode) {
      return NextResponse.json({ success: true, method: 'access_code' });
    }

    // Check if the code matches any team's access_code
    try {
      const svc = createServiceClient();
      const { data: team } = await svc
        .from('teams')
        .select('id')
        .eq('access_code', accessCode)
        .eq('is_active', true)
        .single();

      if (team) {
        return NextResponse.json({ success: true, method: 'access_code', team_id: team.id });
      }
    } catch {
      // Team lookup failed — fall through to invalid code
    }

    return NextResponse.json(
      { error: 'Invalid access code' },
      { status: 400 },
    );
  }

  // Stripe checkout session
  if (mode === 'checkout') {
    try {
      const priceId = process.env.STRIPE_PRICE_ID;
      if (!priceId) {
        return NextResponse.json(
          { error: 'Stripe is not configured. Please use an access code.' },
          { status: 400 },
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?step=3&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?step=2`,
        metadata: { userId: userId || '' },
      });

      return NextResponse.json({ url: session.url });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: 'Invalid request' },
    { status: 400 },
  );
}

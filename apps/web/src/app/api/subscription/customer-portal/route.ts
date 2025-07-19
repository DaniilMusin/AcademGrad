import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

let stripe: any = null;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil',
  });
} catch (error) {
  // Stripe initialization failed (e.g., during build time)
  console.warn('Stripe initialization failed:', error);
}

let supabase: any = null;
try {
  supabase = createClient();
} catch (error) {
  // Supabase client creation failed (e.g., during build time)
  console.warn('Supabase client creation failed:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { return_url } = await request.json();

    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Отсутствует токен авторизации' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Пользователь не авторизован' },
        { status: 401 }
      );
    }

    // Get the user's profile to find their Stripe customer ID (commented out - profiles table not in schema)
    // const { data: profile, error: profileError } = await supabase
    //   .from('profiles')
    //   .select('stripe_customer_id')
    //   .eq('id', user.id)
    //   .single();

    // if (profileError || !profile?.stripe_customer_id) {
    //   return NextResponse.json(
    //     { error: 'Stripe Customer ID не найден' },
    //     { status: 404 }
    //   );
    // }

    // Mock profile for now
    const profile = { stripe_customer_id: 'cus_mock_customer_id' };

    // Create the customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: return_url || `${request.nextUrl.origin}/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
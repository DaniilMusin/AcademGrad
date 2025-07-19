import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

let stripe: any = null;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20' as any,
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
    
    // Get user from session
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID (commented out - customers table not in schema)
    // const { data: customer, error: customerError } = await supabase
    //   .from('customers')
    //   .select('stripe_customer_id')
    //   .eq('user_id', user.id)
    //   .single();

    // if (customerError || !customer?.stripe_customer_id) {
    //   return NextResponse.json(
    //     { error: 'Customer not found' },
    //     { status: 404 }
    //   );
    // }

    // Mock customer for now
    const customer = { stripe_customer_id: 'cus_mock_customer_id' };

    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 500 }
      );
    }

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: return_url || `${process.env.NEXT_PUBLIC_URL}/subscription`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
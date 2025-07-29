import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { price_id, user_id, success_url, cancel_url } = await request.json();

    // Validate required fields
    if (!price_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: price_id, user_id' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Get user data from Supabase
    const { data: user } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    let customer;
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email')
      .eq('user_id', user_id)
      .single();

    if (userProfile?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(userProfile.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: userProfile?.email || user.user?.email,
        metadata: {
          user_id: user_id,
        },
      });

      // Save customer ID to database
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user_id,
          stripe_customer_id: customer.id,
        });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?canceled=true`,
      metadata: {
        user_id: user_id,
        price_id: price_id,
      },
      subscription_data: {
        metadata: {
          user_id: user_id,
        },
      },
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true,
      },
    });

    // Log the checkout attempt
    try {
      await supabase
        .from('user_events')
        .insert({
          user_id: user_id,
          title: 'Checkout Initiated',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          event_type: 'checkout_initiated',
          is_draft: false
        });
    } catch (error) {
      console.error('Failed to log checkout event:', error);
      // Continue with checkout even if logging fails
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      status: 'success'
    });

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'subscription']
    });

    return NextResponse.json({
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        metadata: session.metadata,
        subscription: session.subscription
      },
      status: 'success'
    });

  } catch (error) {
    console.error('Checkout session retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

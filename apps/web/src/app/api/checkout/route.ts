import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createClient();
    
    const { price_id, user_id } = await request.json();

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

    // For now, return a mock response until Stripe is fully integrated
    // This is a placeholder that can be replaced with actual Stripe integration
    const mockCheckoutSession = {
      id: 'cs_test_mock_session_id',
      url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/success?session_id=cs_test_mock_session_id`,
      payment_status: 'unpaid',
      amount_total: 2999, // $29.99
      currency: 'usd',
      customer_email: '',
      created: Date.now(),
      expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      metadata: {
        user_id: user_id,
        price_id: price_id
      }
    };

    // Log the checkout attempt (commented out due to TypeScript issues)
    // try {
    //   await supabase
    //     .from('user_events')
    //     .insert({
    //       user_id: user_id,
    //       title: 'Checkout Initiated',
    //       start_time: new Date().toISOString(),
    //       end_time: new Date().toISOString(),
    //       event_type: 'checkout_initiated',
    //       is_draft: false
    //     });
    // } catch (error) {
    //   console.error('Failed to log checkout event:', error);
    //   // Continue with checkout even if logging fails
    // }

    return NextResponse.json({
      sessionId: mockCheckoutSession.id,
      url: mockCheckoutSession.url,
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

    // Mock session retrieval
    const mockSession = {
      id: session_id,
      payment_status: 'paid',
      amount_total: 2999,
      currency: 'usd',
      customer_email: 'user@example.com',
      metadata: {
        user_id: 'user_123',
        price_id: 'price_premium'
      }
    };

    return NextResponse.json({
      session: mockSession,
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

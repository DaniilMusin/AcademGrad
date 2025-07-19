import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

let supabase: any = null;
try {
  supabase = createClient();
} catch (error) {
  // Supabase client creation failed (e.g., during build time)
  console.warn('Supabase client creation failed:', error);
}

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID!;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!;
const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

interface YooKassaPayment {
  amount: {
    value: string;
    currency: string;
  };
  confirmation: {
    type: string;
    return_url: string;
  };
  capture: boolean;
  description: string;
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const { plan, return_url } = await request.json();
    
    if (!plan || !['basic', 'premium', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get user from session
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    // Plan pricing in rubles
    const planPricing = {
      basic: { price: 499, name: 'Базовый план' },
      premium: { price: 999, name: 'Премиум план' },
      pro: { price: 1999, name: 'Про план' },
    };

    const selectedPlan = planPricing[plan as keyof typeof planPricing];

    // Generate idempotency key
    const idempotencyKey = `${user.id}-${plan}-${Date.now()}`;

    // Create payment in YooKassa
    const paymentData: YooKassaPayment = {
      amount: {
        value: selectedPlan.price.toString(),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: return_url || `${process.env.NEXT_PUBLIC_URL}/dashboard?payment=success`,
      },
      capture: true,
      description: `AcademGrad - ${selectedPlan.name}`,
      metadata: {
        user_id: user.id,
        plan: plan,
        email: user.email || '',
      },
    };

    const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotencyKey,
        'Authorization': `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YooKassa API error:', errorData);
      return NextResponse.json(
        { error: 'Payment creation failed' },
        { status: response.status }
      );
    }

    const payment = await response.json();

    // Save payment to database (commented out - payments table not in schema)
    // const { error: dbError } = await supabase
    //   .from('payments')
    //   .insert({
    //     user_id: user.id,
    //     payment_id: payment.id,
    //     provider: 'yookassa',
    //     amount: selectedPlan.price,
    //     currency: 'RUB',
    //     status: payment.status,
    //     plan: plan,
    //     metadata: payment,
    //     created_at: new Date().toISOString(),
    //   });

    // if (dbError) {
    //   console.error('Database error:', dbError);
    //   // Don't fail the request, just log the error
    // }

    return NextResponse.json({
      payment_id: payment.id,
      status: payment.status,
      confirmation_url: payment.confirmation.confirmation_url,
      amount: selectedPlan.price,
      currency: 'RUB',
    });

  } catch (error) {
    console.error('YooKassa payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle YooKassa webhooks
export async function PUT(request: NextRequest) {
  try {
    const payment = await request.json();

    console.log('YooKassa webhook received:', payment);

    // Verify webhook signature if needed
    // const signature = request.headers.get('x-yookassa-signature');

    // Update payment status in database (commented out - payments table not in schema)
    // const { error } = await supabase
    //   .from('payments')
    //   .update({
    //     status: payment.status,
    //     metadata: payment,
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq('payment_id', payment.id)
    //   .eq('provider', 'yookassa');

    // if (error) {
    //   console.error('Database update error:', error);
    //   return NextResponse.json(
    //     { error: 'Database update failed' },
    //     { status: 500 }
    //   );
    // }

    // If payment succeeded, activate subscription (commented out - payments table not in schema)
    // if (payment.status === 'succeeded') {
    //   const { data: paymentRecord } = await supabase
    //     .from('payments')
    //     .select('user_id, plan')
    //     .eq('payment_id', payment.id)
    //     .single();

    //   if (paymentRecord) {
    //     // Activate user subscription
    //     await supabase
    //       .from('subscriptions')
    //       .upsert({
    //         user_id: paymentRecord.user_id,
    //         plan: paymentRecord.plan,
    //         status: 'active',
    //         provider: 'yookassa',
    //         current_period_start: new Date().toISOString(),
    //         current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    //         created_at: new Date().toISOString(),
    //         updated_at: new Date().toISOString(),
    //       }, {
    //         onConflict: 'user_id',
    //       });
    //   }
    // }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('YooKassa webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
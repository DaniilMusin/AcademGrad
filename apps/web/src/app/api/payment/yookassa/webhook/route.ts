import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface YooKassaWebhookEvent {
  type: string;
  event: string;
  object: {
    id: string;
    status: string;
    amount: {
      value: string;
      currency: string;
    };
    metadata?: Record<string, string>;
    paid: boolean;
    created_at: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const event: YooKassaWebhookEvent = JSON.parse(rawBody);

    // Verify webhook signature (optional but recommended)
    // This would require additional setup in YooKassa dashboard
    
    if (event.type !== 'notification' || event.event !== 'payment.succeeded') {
      console.log(`Ignoring event: ${event.event}`);
      return NextResponse.json({ status: 'ignored' });
    }

    const payment = event.object;
    
    if (!payment.paid) {
      console.log(`Payment ${payment.id} not paid yet`);
      return NextResponse.json({ status: 'not_paid' });
    }

    // Update payment status in database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: payment.status,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('provider_payment_id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      );
    }

    // If payment has metadata with user_id and plan_id, create subscription
    if (payment.metadata?.user_id && payment.metadata?.plan_id) {
      const userId = payment.metadata.user_id;
      const planId = payment.metadata.plan_id;

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('Error fetching plan:', planError);
        return NextResponse.json({ status: 'plan_not_found' });
      }

      // Calculate subscription period
      const startDate = new Date();
      const endDate = new Date();
      
      if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + plan.interval_count);
      } else if (plan.interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + plan.interval_count);
      }

      // Create or update subscription
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          plan_name: plan.name,
          plan_price: parseFloat(payment.amount.value),
          provider: 'yookassa',
          provider_subscription_id: payment.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        return NextResponse.json(
          { error: 'Subscription creation failed' },
          { status: 500 }
        );
      }

      // Send welcome email or notification
      try {
        await fetch(`${request.nextUrl.origin}/api/email/welcome`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            plan_name: plan.name,
          }),
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the webhook for email issues
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Error processing YooKassa webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint for YooKassa webhook
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
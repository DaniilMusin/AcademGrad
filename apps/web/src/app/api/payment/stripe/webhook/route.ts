import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          // Handle successful subscription
          await handleSubscriptionSuccess(session, supabase);
        }
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(deletedSubscription, supabase);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).subscription) {
          await handleInvoicePaymentSucceeded(invoice, supabase);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        if ((failedInvoice as any).subscription) {
          await handleInvoicePaymentFailed(failedInvoice, supabase);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionSuccess(session: Stripe.Checkout.Session, supabase: any) {
  const userId = session.metadata?.user_id;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
  const product = await stripe.products.retrieve(price.product as string);

  // Save subscription to database
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      plan_name: product.name,
      plan_price: price.unit_amount ? price.unit_amount / 100 : 0,
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Подписка активирована!',
      message: `Ваша подписка ${product.name} успешно активирована. Добро пожаловать в премиум!`,
      type: 'success'
    });

  // Log event
  await supabase
    .from('user_events')
    .insert({
      user_id: userId,
      title: 'Subscription Created',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      event_type: 'subscription_created',
      is_draft: false
    });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
  const product = await stripe.products.retrieve(price.product as string);

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      plan_name: product.name,
      plan_price: price.unit_amount ? price.unit_amount / 100 : 0,
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Create notification if subscription was cancelled
  if (subscription.cancel_at_period_end) {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Подписка будет отменена',
        message: `Ваша подписка будет отменена ${new Date((subscription as any).current_period_end * 1000).toLocaleDateString('ru-RU')}.`,
        type: 'warning'
      });
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Подписка отменена',
      message: 'Ваша подписка была отменена. Мы надеемся увидеть вас снова!',
      type: 'info'
    });

  // Log event
  await supabase
    .from('user_events')
    .insert({
      user_id: userId,
      title: 'Subscription Cancelled',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      event_type: 'subscription_cancelled',
      is_draft: false
    });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Create notification for successful payment
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Платеж прошел успешно',
      message: `Платеж на сумму ${invoice.amount_paid / 100}₽ успешно обработан.`,
      type: 'success'
    });

  // Log payment
  await supabase
    .from('user_events')
    .insert({
      user_id: userId,
      title: 'Payment Successful',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      event_type: 'payment_succeeded',
      is_draft: false
    });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Create notification for failed payment
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Ошибка платежа',
      message: `Не удалось обработать платеж. Пожалуйста, обновите способ оплаты.`,
      type: 'error'
    });

  // Log failed payment
  await supabase
    .from('user_events')
    .insert({
      user_id: userId,
      title: 'Payment Failed',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      event_type: 'payment_failed',
      is_draft: false
    });
}
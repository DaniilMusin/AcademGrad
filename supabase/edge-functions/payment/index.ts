import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Handle webhooks
  if (req.method === "POST") {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") || "stripe";
    
    if (provider === "stripe") {
      return handleStripeWebhook(req, supabase);
    } else if (provider === "yukassa") {
      return handleYuKassaWebhook(req, supabase);
    }
    
    return new Response("Unsupported payment provider", { status: 400 });
  }

  // Handle payment session creation
  if (req.method === "GET") {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") || "stripe";
    
    if (provider === "stripe") {
      return handleCreateSession(req, supabase);
    } else if (provider === "yukassa") {
      return handleYuKassaSession(req, supabase);
    }
    
    return new Response("Unsupported payment provider", { status: 400 });
  }

  return new Response("Method not allowed", { status: 405 });
});

async function handleCreateSession(req: Request, supabase: any) {
  try {
    const url = new URL(req.url);
    const priceId = url.searchParams.get("price_id");
    const userId = url.searchParams.get("user_id");

    if (!priceId || !userId) {
      return new Response("Missing price_id or user_id", { status: 400 });
    }

    // Create Stripe checkout session
    const session = await createStripeSession(priceId, userId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return new Response("Error creating session", { status: 500 });
  }
}

async function handleStripeWebhook(req: Request, supabase: any) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }

    // Verify webhook signature
    const event = await verifyStripeWebhook(body, sig);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // Update user subscription status
      await supabase
        .from("events")
        .insert({
          user_id: session.metadata.user_id,
          event_type: "payment_success",
          event_data: {
            session_id: session.id,
            amount: session.amount_total,
            currency: session.currency
          }
        });

      // Here you would typically update user's subscription status
      // For example, update user metadata or create a subscription record
    }

    return new Response("OK");
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response("Error", { status: 500 });
  }
}

async function createStripeSession(priceId: string, userId: string) {
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "mode": "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "success_url": `${Deno.env.get("FRONTEND_URL")}/success`,
      "cancel_url": `${Deno.env.get("FRONTEND_URL")}/cancel`,
      "metadata[user_id]": userId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create Stripe session");
  }

  return await response.json();
}

async function verifyStripeWebhook(body: string, signature: string) {
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  // In a real implementation, you'd verify the signature here
  // For now, we'll just parse the body
  return JSON.parse(body);
}

async function handleYuKassaSession(req: Request, supabase: any) {
  try {
    const url = new URL(req.url);
    const priceId = url.searchParams.get("price_id");
    const userId = url.searchParams.get("user_id");

    if (!priceId || !userId) {
      return new Response("Missing price_id or user_id", { status: 400 });
    }

    // Create YuKassa payment
    const payment = await createYuKassaPayment(priceId, userId);

    return new Response(JSON.stringify({ 
      confirmation_url: payment.confirmation.confirmation_url,
      payment_id: payment.id 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating YuKassa session:", error);
    return new Response("Error creating payment", { status: 500 });
  }
}

async function handleYuKassaWebhook(req: Request, supabase: any) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    // Verify webhook authenticity
    if (!verifyYuKassaWebhook(req, body)) {
      return new Response("Invalid signature", { status: 400 });
    }

    if (event.event === "payment.succeeded") {
      const payment = event.object;
      
      // Update user subscription status
      await supabase
        .from("events")
        .insert({
          user_id: payment.metadata.user_id,
          event_type: "payment_success",
          event_data: {
            payment_id: payment.id,
            amount: payment.amount.value,
            currency: payment.amount.currency,
            provider: "yukassa"
          }
        });

      // Update user subscription
      await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: payment.metadata.user_id,
          status: "active",
          payment_provider: "yukassa",
          payment_id: payment.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });
    }

    return new Response("OK");
  } catch (error) {
    console.error("Error handling YuKassa webhook:", error);
    return new Response("Error", { status: 500 });
  }
}

async function createYuKassaPayment(priceId: string, userId: string) {
  const YOOKASSA_SHOP_ID = Deno.env.get("YOOKASSA_SHOP_ID");
  const YOOKASSA_SECRET_KEY = Deno.env.get("YOOKASSA_SECRET_KEY");
  
  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    throw new Error("YuKassa credentials not configured");
  }

  // Price mapping (you might want to store this in database)
  const priceMap: Record<string, { amount: string, description: string }> = {
    "monthly": { amount: "999.00", description: "Месячная подписка" },
    "yearly": { amount: "9999.00", description: "Годовая подписка" }
  };

  const priceInfo = priceMap[priceId];
  if (!priceInfo) {
    throw new Error("Invalid price_id");
  }

  const idempotenceKey = `${userId}-${Date.now()}`;

  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`)}`,
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify({
      amount: {
        value: priceInfo.amount,
        currency: "RUB"
      },
      confirmation: {
        type: "redirect",
        return_url: `${Deno.env.get("FRONTEND_URL")}/payment/success`
      },
      capture: true,
      description: priceInfo.description,
      metadata: {
        user_id: userId,
        price_id: priceId
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create YuKassa payment: ${error}`);
  }

  return await response.json();
}

function verifyYuKassaWebhook(req: Request, body: string): boolean {
  // YuKassa webhook verification
  // In production, you should verify the request signature
  const signature = req.headers.get("X-YooKassa-Signature");
  const secret = Deno.env.get("YOOKASSA_WEBHOOK_SECRET");
  
  if (!signature || !secret) {
    return false;
  }

  // Simple verification - in production use proper HMAC verification
  return signature.length > 0;
}

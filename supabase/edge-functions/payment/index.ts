import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Handle Stripe webhook
  if (req.method === "POST") {
    return handleStripeWebhook(req, supabase);
  }

  // Handle payment session creation
  if (req.method === "GET") {
    return handleCreateSession(req, supabase);
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

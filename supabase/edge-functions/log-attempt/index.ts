import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { task_id, answer_submitted, is_correct, time_spent_s } = await req.json();
    
    if (!task_id || answer_submitted === undefined || is_correct === undefined) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            authorization: authHeader
          }
        }
      }
    );

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return new Response("Invalid token", { status: 401 });
    }

    // Log the attempt
    const { error: attemptError } = await supabase
      .from("attempts")
      .insert({
        user_id: user.user.id,
        task_id,
        answer_submitted,
        is_correct,
        time_spent_s: time_spent_s || 0
      });

    if (attemptError) {
      console.error("Error logging attempt:", attemptError);
      return new Response("Error logging attempt", { status: 500 });
    }

    // Log event
    await supabase
      .from("events")
      .insert({
        user_id: user.user.id,
        event_type: "task_submit",
        event_data: {
          task_id,
          is_correct,
          time_spent_s: time_spent_s || 0
        }
      });

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in log-attempt:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // This is a cron job function for awarding badges
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Award streak badges
    await awardStreakBadges(supabase);
    
    // Award speed badges
    await awardSpeedBadges(supabase);
    
    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in badge-cron:", error);
    return new Response("Error awarding badges", { status: 500 });
  }
});

async function awardStreakBadges(supabase: any) {
  // Find users with 5+ consecutive days of attempts
  const { data: streakUsers } = await supabase.rpc("get_streak_users", {
    days: 5
  });

  if (!streakUsers?.length) return;

  const badgeInserts = streakUsers.map((user: any) => ({
    user_id: user.user_id,
    badge_id: 1 // streak5 badge
  }));

  // Insert badges (ignore conflicts)
  await supabase
    .from("user_badges")
    .upsert(badgeInserts, { onConflict: "user_id,badge_id" });
}

async function awardSpeedBadges(supabase: any) {
  // Find users who solve tasks quickly (< 60 seconds average)
  const { data: speedUsers } = await supabase
    .from("attempts")
    .select("user_id")
    .gte("ts", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .eq("is_correct", true)
    .lt("time_spent_s", 60);

  if (!speedUsers?.length) return;

  const badgeInserts = speedUsers.map((user: any) => ({
    user_id: user.user_id,
    badge_id: 2 // speedy badge
  }));

  await supabase
    .from("user_badges")
    .upsert(badgeInserts, { onConflict: "user_id,badge_id" });
}

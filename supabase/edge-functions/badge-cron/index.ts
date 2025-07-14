import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BadgeRule {
  id: number;
  condition: string;
  description: string;
}

interface BadgeAward {
  user_id: string;
  badge_id: number;
}

// This list can be managed elsewhere but is here for clarity
const BADGE_RULES: BadgeRule[] = [
  { id: 1, condition: "streak_5", description: "Решай задачи 5 дней подряд" },
  { id: 2, condition: "speed_demon", description: "Решай задачи быстро (< 60 сек)" },
  { id: 3, condition: "perfectionist", description: "Реши 20 задач подряд без ошибок" },
  { id: 4, condition: "night_owl", description: "Решай задачи поздно вечером (22:00-02:00)" },
  { id: 5, condition: "early_bird", description: "Решай задачи рано утром (06:00-08:00)" },
  { id: 6, condition: "weekend_warrior", description: "Активно решай задачи на выходных" },
  { id: 7, condition: "topic_master", description: "Освой одну тему на 95%" },
  { id: 8, condition: "hundred_tasks", description: "Реши 100 задач" },
  { id: 9, condition: "first_correct", description: "Первая правильно решенная задача" },
  { id: 10, condition: "comeback_kid", description: "Вернись к решению задач после перерыва" }
];

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    console.log("🏆 Starting badge cron job");
    
    let totalAwarded = 0;
    
    // Award different types of badges
    totalAwarded += await awardStreakBadges(supabase);
    totalAwarded += await awardSpeedBadges(supabase);
    totalAwarded += await awardPerfectionistBadges(supabase);
    totalAwarded += await awardTimeBadges(supabase);
    totalAwarded += await awardMilestoneBadges(supabase);
    totalAwarded += await awardTopicMasterBadges(supabase);
    totalAwarded += await awardComebackBadges(supabase);
    
    console.log(`🎉 Badge cron completed: ${totalAwarded} badges awarded`);
    
    return new Response(JSON.stringify({ 
      status: "success", 
      badges_awarded: totalAwarded,
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("❌ Error in badge-cron:", error);
    return new Response(JSON.stringify({ 
      status: "error", 
      error: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

async function hasBadge(supabase: any, userId: string, badgeId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_badges")
    .select("user_id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .limit(1);
    
  if (error) {
      console.error(`Error checking for badge ${badgeId} for user ${userId}:`, error);
      return true; // Assume badge exists to prevent re-awarding on error
  }
  
  return data && data.length > 0;
}

async function awardBadges(supabase: any, badges: BadgeAward[]): Promise<number> {
  if (badges.length === 0) return 0;
  
  const { data, error } = await supabase
    .from("user_badges")
    .upsert(badges, { onConflict: "user_id,badge_id" });
  
  if (error) {
    console.error("Error awarding badges:", error);
    return 0;
  }
  
  console.log(`🎉 Awarded ${badges.length} badges`);
  return badges.length;
}


async function awardStreakBadges(supabase: any): Promise<number> {
  console.log("🔥 Checking streak badges");
  const { data: streakData, error } = await supabase.rpc("get_user_streaks");
  
  if (error || !streakData?.length) return 0;
  
  const badges: BadgeAward[] = [];
  
  for (const user of streakData) {
    if (user.streak >= 5 && !await hasBadge(supabase, user.user_id, 1)) {
      badges.push({ user_id: user.user_id, badge_id: 1 });
    }
  }
  
  return await awardBadges(supabase, badges);
}

async function awardSpeedBadges(supabase: any): Promise<number> {
  console.log("⚡ Checking speed badges");
  const { data: speedUsers, error } = await supabase
    .from("attempts")
    .select("user_id, avg_time:time_spent_s.avg()")
    .eq("is_correct", true)
    .gte("ts", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .group("user_id")
    .having("count", "gte", 10)
    .having("avg_time", "lt", 60);

  if (error || !speedUsers?.length) return 0;

  const badges: BadgeAward[] = [];
  
  for (const user of speedUsers) {
    if (!await hasBadge(supabase, user.user_id, 2)) {
      badges.push({ user_id: user.user_id, badge_id: 2 });
    }
  }
  
  return await awardBadges(supabase, badges);
}

async function awardPerfectionistBadges(supabase: any): Promise<number> {
    console.log("🎯 Checking perfectionist badges");
    const { data: perfectUsers, error } = await supabase.rpc("get_perfect_streaks", { min_streak: 20 });
  
    if (error || !perfectUsers?.length) return 0;
  
    const badges: BadgeAward[] = [];
  
    for (const user of perfectUsers) {
        if (!await hasBadge(supabase, user.user_id, 3)) {
            badges.push({ user_id: user.user_id, badge_id: 3 });
        }
    }
  
    return await awardBadges(supabase, badges);
}

async function awardTimeBadges(supabase: any): Promise<number> {
    console.log("🌙 Checking time-based badges");
    let totalAwarded = 0;

    // Night owl badge (22:00-02:00)
    const { data: nightOwls } = await supabase.rpc('get_time_based_users', {start_hour: 22, end_hour: 2});
    if (nightOwls?.length) {
        const badges: BadgeAward[] = [];
        for (const user of nightOwls) {
            if (!await hasBadge(supabase, user.user_id, 4)) {
                badges.push({ user_id: user.user_id, badge_id: 4 });
            }
        }
        totalAwarded += await awardBadges(supabase, badges);
    }

    // Early bird badge (06:00-08:00)
    const { data: earlyBirds } = await supabase.rpc('get_time_based_users', {start_hour: 6, end_hour: 8});
    if (earlyBirds?.length) {
        const badges: BadgeAward[] = [];
        for (const user of earlyBirds) {
            if (!await hasBadge(supabase, user.user_id, 5)) {
                badges.push({ user_id: user.user_id, badge_id: 5 });
            }
        }
        totalAwarded += await awardBadges(supabase, badges);
    }

    return totalAwarded;
}

async function awardMilestoneBadges(supabase: any): Promise<number> {
    console.log("🏁 Checking milestone badges");
    let totalAwarded = 0;

    // First correct answer
    const { data: firstTimers } = await supabase.rpc('get_first_correct_users');
    if (firstTimers?.length) {
        const badges: BadgeAward[] = [];
        for (const user of firstTimers) {
            if (!await hasBadge(supabase, user.user_id, 9)) {
                badges.push({ user_id: user.user_id, badge_id: 9 });
            }
        }
        totalAwarded += await awardBadges(supabase, badges);
    }

    // 100 tasks milestone
    const { data: hundredUsers } = await supabase.rpc('get_milestone_users', {min_attempts: 100});
    if (hundredUsers?.length) {
        const badges: BadgeAward[] = [];
        for (const user of hundredUsers) {
            if (!await hasBadge(supabase, user.user_id, 8)) {
                badges.push({ user_id: user.user_id, badge_id: 8 });
            }
        }
        totalAwarded += await awardBadges(supabase, badges);
    }

    return totalAwarded;
}

async function awardTopicMasterBadges(supabase: any): Promise<number> {
    console.log("🎓 Checking topic master badges");
    const { data: masters, error } = await supabase
        .from("weak_topics")
        .select("user_id")
        .lt("error_rate", 0.05)
        .gte("attempts_count", 10);

    if (error || !masters?.length) return 0;

    const badges: BadgeAward[] = [];
    for (const user of masters) {
        if (!await hasBadge(supabase, user.user_id, 7)) {
            badges.push({ user_id: user.user_id, badge_id: 7 });
        }
    }
    return await awardBadges(supabase, badges);
}

async function awardComebackBadges(supabase: any): Promise<number> {
    console.log("🔄 Checking comeback badges");
    const { data: comebackUsers, error } = await supabase.rpc("get_comeback_users");

    if (error || !comebackUsers?.length) return 0;

    const badges: BadgeAward[] = [];
    for (const user of comebackUsers) {
        if (!await hasBadge(supabase, user.user_id, 10)) {
            badges.push({ user_id: user.user_id, badge_id: 10 });
        }
    }
    return await awardBadges(supabase, badges);
}
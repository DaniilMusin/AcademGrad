import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Generate weekly reports for all users
    const { data: users } = await supabase.auth.admin.listUsers();
    
    if (!users?.users?.length) {
      return new Response("No users found", { status: 404 });
    }

    const reports = [];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = new Date();

    for (const user of users.users) {
      const report = await generateUserReport(supabase, user.id, weekStart, weekEnd);
      if (report) {
        reports.push(report);
      }
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      reports_generated: reports.length 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in weekly-report:", error);
    return new Response("Error generating reports", { status: 500 });
  }
});

async function generateUserReport(supabase: any, userId: string, weekStart: Date, weekEnd: Date) {
  try {
    // Get user's attempts for the week
    const { data: attempts } = await supabase
      .from("attempts")
      .select(`
        is_correct,
        time_spent_s,
        tasks (
          topic,
          difficulty
        )
      `)
      .eq("user_id", userId)
      .gte("ts", weekStart.toISOString())
      .lte("ts", weekEnd.toISOString());

    if (!attempts?.length) {
      return null;
    }

    // Calculate stats
    const tasksSolved = attempts.length;
    const correctAttempts = attempts.filter(a => a.is_correct).length;
    const accuracy = correctAttempts / tasksSolved;
    
    // Get topics covered
    const topicsSet = new Set(attempts.map(a => a.tasks.topic));
    const topicsCovered = Array.from(topicsSet);
    
    // Get weak topics (< 50% accuracy)
    const topicStats = {};
    attempts.forEach(a => {
      const topic = a.tasks.topic;
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total++;
      if (a.is_correct) {
        topicStats[topic].correct++;
      }
    });

    const weakTopics = Object.entries(topicStats)
      .filter(([_, stats]: [string, any]) => stats.correct / stats.total < 0.5)
      .map(([topic]) => topic);

    // Save report to database
    const { data: report } = await supabase
      .from("lesson_reports")
      .insert({
        user_id: userId,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        tasks_solved: tasksSolved,
        accuracy,
        topics_covered: topicsCovered,
        weak_topics: weakTopics
      })
      .select()
      .single();

    return report;
  } catch (error) {
    console.error("Error generating report for user:", userId, error);
    return null;
  }
}

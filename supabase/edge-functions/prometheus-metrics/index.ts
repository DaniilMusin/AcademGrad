import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const metrics = await generatePrometheusMetrics(supabase);
    
    return new Response(metrics, {
      headers: { 
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8"
      }
    });
  } catch (error) {
    console.error("Error generating metrics:", error);
    return new Response("Error generating metrics", { status: 500 });
  }
});

async function generatePrometheusMetrics(supabase: any): Promise<string> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Collect various metrics
  const metrics = [];

  // User metrics
  const userMetrics = await getUserMetrics(supabase);
  metrics.push(
    `# HELP app_users_total Total number of registered users`,
    `# TYPE app_users_total counter`,
    `app_users_total ${userMetrics.total}`,
    ``,
    `# HELP app_users_active_daily Daily active users`,
    `# TYPE app_users_active_daily gauge`,
    `app_users_active_daily ${userMetrics.dailyActive}`,
    ``,
    `# HELP app_users_active_weekly Weekly active users`,
    `# TYPE app_users_active_weekly gauge`,
    `app_users_active_weekly ${userMetrics.weeklyActive}`
  );

  // Task metrics
  const taskMetrics = await getTaskMetrics(supabase, oneDayAgo);
  metrics.push(
    ``,
    `# HELP app_tasks_attempted_daily Tasks attempted in the last 24 hours`,
    `# TYPE app_tasks_attempted_daily counter`,
    `app_tasks_attempted_daily ${taskMetrics.attempted}`,
    ``,
    `# HELP app_tasks_completed_daily Tasks completed successfully in the last 24 hours`,
    `# TYPE app_tasks_completed_daily counter`,
    `app_tasks_completed_daily ${taskMetrics.completed}`,
    ``,
    `# HELP app_tasks_accuracy_daily Success rate for tasks in the last 24 hours`,
    `# TYPE app_tasks_accuracy_daily gauge`,
    `app_tasks_accuracy_daily ${taskMetrics.accuracy}`
  );

  // Payment metrics
  const paymentMetrics = await getPaymentMetrics(supabase, oneDayAgo);
  metrics.push(
    ``,
    `# HELP app_payments_total_daily Total payments in the last 24 hours`,
    `# TYPE app_payments_total_daily counter`,
    `app_payments_total_daily ${paymentMetrics.count}`,
    ``,
    `# HELP app_revenue_daily_usd Revenue in USD for the last 24 hours`,
    `# TYPE app_revenue_daily_usd gauge`,
    `app_revenue_daily_usd ${paymentMetrics.revenue}`
  );

  // Subscription metrics
  const subscriptionMetrics = await getSubscriptionMetrics(supabase);
  metrics.push(
    ``,
    `# HELP app_subscriptions_active Active subscriptions`,
    `# TYPE app_subscriptions_active gauge`,
    `app_subscriptions_active ${subscriptionMetrics.active}`,
    ``,
    `# HELP app_subscriptions_churn_rate Monthly churn rate`,
    `# TYPE app_subscriptions_churn_rate gauge`,
    `app_subscriptions_churn_rate ${subscriptionMetrics.churnRate}`
  );

  // System metrics
  const systemMetrics = await getSystemMetrics(supabase);
  metrics.push(
    ``,
    `# HELP app_database_connections Database connections`,
    `# TYPE app_database_connections gauge`,
    `app_database_connections ${systemMetrics.dbConnections}`,
    ``,
    `# HELP app_edge_functions_invocations_daily Edge function invocations in the last 24 hours`,
    `# TYPE app_edge_functions_invocations_daily counter`,
    `app_edge_functions_invocations_daily ${systemMetrics.edgeFunctionCalls}`,
    ``,
    `# HELP app_storage_usage_bytes Storage usage in bytes`,
    `# TYPE app_storage_usage_bytes gauge`,
    `app_storage_usage_bytes ${systemMetrics.storageUsage}`
  );

  // Add topic-specific metrics
  const topicMetrics = await getTopicMetrics(supabase, oneDayAgo);
  topicMetrics.forEach(topic => {
    metrics.push(
      ``,
      `# HELP app_topic_attempts_daily Attempts per topic in the last 24 hours`,
      `# TYPE app_topic_attempts_daily counter`,
      `app_topic_attempts_daily{topic="${topic.name}"} ${topic.attempts}`,
      ``,
      `# HELP app_topic_accuracy_daily Accuracy per topic in the last 24 hours`,
      `# TYPE app_topic_accuracy_daily gauge`,
      `app_topic_accuracy_daily{topic="${topic.name}"} ${topic.accuracy}`
    );
  });

  return metrics.join('\n') + '\n';
}

async function getUserMetrics(supabase: any) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Total users
  const { count: total } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Daily active users (users who attempted tasks in last 24h)
  const { count: dailyActive } = await supabase
    .from("attempts")
    .select("user_id", { count: "exact", head: true })
    .gte("ts", oneDayAgo.toISOString())
    .not("user_id", "is", null);

  // Weekly active users
  const { count: weeklyActive } = await supabase
    .from("attempts")
    .select("user_id", { count: "exact", head: true })
    .gte("ts", oneWeekAgo.toISOString())
    .not("user_id", "is", null);

  return { 
    total: total || 0, 
    dailyActive: dailyActive || 0, 
    weeklyActive: weeklyActive || 0 
  };
}

async function getTaskMetrics(supabase: any, since: Date) {
  // Tasks attempted
  const { count: attempted } = await supabase
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .gte("ts", since.toISOString());

  // Tasks completed successfully
  const { count: completed } = await supabase
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .gte("ts", since.toISOString())
    .eq("is_correct", true);

  const accuracy = attempted > 0 ? (completed / attempted) : 0;

  return { 
    attempted: attempted || 0, 
    completed: completed || 0, 
    accuracy: Math.round(accuracy * 10000) / 10000 
  };
}

async function getPaymentMetrics(supabase: any, since: Date) {
  const { data: payments } = await supabase
    .from("events")
    .select("event_data")
    .eq("event_type", "payment_success")
    .gte("created_at", since.toISOString());

  const count = payments?.length || 0;
  const revenue = payments?.reduce((sum: number, payment: any) => {
    const amount = payment.event_data?.amount || 0;
    return sum + (amount / 100); // Convert cents to dollars
  }, 0) || 0;

  return { count, revenue };
}

async function getSubscriptionMetrics(supabase: any) {
  // Active subscriptions
  const { count: active } = await supabase
    .from("user_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Churn rate calculation (simplified)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count: cancelledLastMonth } = await supabase
    .from("user_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "cancelled")
    .gte("updated_at", thirtyDaysAgo.toISOString());

  const churnRate = active > 0 ? (cancelledLastMonth / active) : 0;

  return { 
    active: active || 0, 
    churnRate: Math.round(churnRate * 10000) / 10000 
  };
}

async function getSystemMetrics(supabase: any) {
  // These would typically come from system monitoring
  // For now, we'll provide placeholder values
  
  return {
    dbConnections: 10, // Would come from DB monitoring
    edgeFunctionCalls: 1000, // Would come from Supabase analytics
    storageUsage: 1024 * 1024 * 100 // 100MB placeholder
  };
}

async function getTopicMetrics(supabase: any, since: Date) {
  const { data: topicData } = await supabase
    .from("attempts")
    .select(`
      is_correct,
      tasks (topic)
    `)
    .gte("ts", since.toISOString());

  const topicStats: Record<string, { attempts: number, correct: number }> = {};

  topicData?.forEach((attempt: any) => {
    const topic = attempt.tasks?.topic || "unknown";
    if (!topicStats[topic]) {
      topicStats[topic] = { attempts: 0, correct: 0 };
    }
    topicStats[topic].attempts++;
    if (attempt.is_correct) {
      topicStats[topic].correct++;
    }
  });

  return Object.entries(topicStats).map(([name, stats]) => ({
    name,
    attempts: stats.attempts,
    accuracy: stats.attempts > 0 ? (stats.correct / stats.attempts) : 0
  }));
}
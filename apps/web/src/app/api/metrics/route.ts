import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Metrics {
  [key: string]: number;
}

export async function GET(request: NextRequest) {
  try {
    const metrics: Metrics = {};
    const timestamp = Date.now();

    // Database metrics
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });
      metrics['academgrad_users_total'] = totalUsers || 0;

      // Active users (last 24 hours)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      metrics['academgrad_users_active_24h'] = activeUsers || 0;

      // Active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .eq('status', 'active');
      metrics['academgrad_subscriptions_active'] = activeSubscriptions || 0;

      // Total tasks solved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: tasksSolvedToday } = await supabase
        .from('attempts')
        .select('id', { count: 'exact' })
        .gte('created_at', today.toISOString());
      metrics['academgrad_tasks_solved_today'] = tasksSolvedToday || 0;

      // Total tasks solved this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      const { count: tasksSolvedWeek } = await supabase
        .from('attempts')
        .select('id', { count: 'exact' })
        .gte('created_at', weekStart.toISOString());
      metrics['academgrad_tasks_solved_week'] = tasksSolvedWeek || 0;

      // Accuracy rate (last 1000 attempts)
      const { data: recentAttempts } = await supabase
        .from('attempts')
        .select('is_correct')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (recentAttempts && recentAttempts.length > 0) {
        const correctAttempts = recentAttempts.filter(a => a.is_correct).length;
        const accuracyRate = (correctAttempts / recentAttempts.length) * 100;
        metrics['academgrad_accuracy_rate_percent'] = Math.round(accuracyRate * 100) / 100;
      }

      // Revenue metrics (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (recentPayments) {
        const totalRevenue = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        metrics['academgrad_revenue_30d_rubles'] = totalRevenue;
        metrics['academgrad_payments_count_30d'] = recentPayments.length;
      }

      // Error rate (last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const { count: errorCount } = await supabase
        .from('logs')
        .select('id', { count: 'exact' })
        .eq('level', 'error')
        .gte('created_at', oneHourAgo.toISOString());
      metrics['academgrad_errors_1h'] = errorCount || 0;

    } catch (dbError) {
      console.error('Database metrics error:', dbError);
      metrics['academgrad_database_errors'] = 1;
    }

    // System metrics
    if (process.memoryUsage) {
      const memUsage = process.memoryUsage();
      metrics['academgrad_memory_used_bytes'] = memUsage.heapUsed;
      metrics['academgrad_memory_total_bytes'] = memUsage.heapTotal;
      metrics['academgrad_memory_rss_bytes'] = memUsage.rss;
      metrics['academgrad_memory_external_bytes'] = memUsage.external;
    }

    // Uptime
    metrics['academgrad_uptime_seconds'] = process.uptime();

    // Request timing
    const startTime = Date.now() - timestamp;
    metrics['academgrad_metrics_generation_ms'] = Date.now() - timestamp;

    // Convert to Prometheus format
    const prometheusFormat = Object.entries(metrics)
      .map(([name, value]) => {
        return `# HELP ${name} ${getMetricHelp(name)}
# TYPE ${name} ${getMetricType(name)}
${name} ${value}`;
      })
      .join('\n\n');

    const responseText = `${prometheusFormat}\n\n# HELP academgrad_metrics_timestamp Timestamp when metrics were generated
# TYPE academgrad_metrics_timestamp counter
academgrad_metrics_timestamp ${timestamp}`;

    return new Response(responseText, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Metrics generation failed' },
      { status: 500 }
    );
  }
}

function getMetricHelp(name: string): string {
  const helpTexts: Record<string, string> = {
    'academgrad_users_total': 'Total number of registered users',
    'academgrad_users_active_24h': 'Number of users active in last 24 hours',
    'academgrad_subscriptions_active': 'Number of active subscriptions',
    'academgrad_tasks_solved_today': 'Number of tasks solved today',
    'academgrad_tasks_solved_week': 'Number of tasks solved this week',
    'academgrad_accuracy_rate_percent': 'Task solving accuracy rate percentage',
    'academgrad_revenue_30d_rubles': 'Revenue in rubles for last 30 days',
    'academgrad_payments_count_30d': 'Number of payments in last 30 days',
    'academgrad_errors_1h': 'Number of errors in last hour',
    'academgrad_database_errors': 'Database connection errors',
    'academgrad_memory_used_bytes': 'Memory heap used in bytes',
    'academgrad_memory_total_bytes': 'Memory heap total in bytes',
    'academgrad_memory_rss_bytes': 'Memory RSS in bytes',
    'academgrad_memory_external_bytes': 'Memory external in bytes',
    'academgrad_uptime_seconds': 'Application uptime in seconds',
    'academgrad_metrics_generation_ms': 'Time taken to generate metrics in milliseconds',
  };
  
  return helpTexts[name] || 'Custom metric';
}

function getMetricType(name: string): string {
  if (name.includes('total') || name.includes('count') || name.includes('errors')) {
    return 'counter';
  }
  if (name.includes('rate') || name.includes('percent') || name.includes('accuracy')) {
    return 'gauge';
  }
  if (name.includes('bytes') || name.includes('seconds') || name.includes('ms')) {
    return 'gauge';
  }
  return 'gauge';
}
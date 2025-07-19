import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

let supabase: any = null;
try {
  supabase = createClient();
} catch (error) {
  // Supabase client creation failed (e.g., during build time)
  console.warn('Supabase client creation failed:', error);
}

interface Metrics {
  [key: string]: number;
}

export async function GET(request: NextRequest) {
  try {
    const metrics: Metrics = {};
    const timestamp = Date.now();

    // Database metrics (simplified for now)
    try {
      // Basic connection test
      await supabase.auth.getUser();
      metrics['academgrad_database_status'] = 1;
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
    'academgrad_database_status': 'Database connection status (1 = connected)',
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
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define a comprehensive health status interface
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: { status: 'up' | 'down'; responseTime_ms: number };
    application: { status: 'up' | 'down'; uptime_s?: number };
    edge_functions: { status: 'up' | 'down' };
    external_apis: {
      openai: 'up' | 'down';
      stripe: 'up' | 'down';
      yookassa: 'up' | 'down';
      postmark: 'up' | 'down';
      telegram: 'up' | 'down';
    };
  };
  version: string;
  environment: string;
}

export async function GET() {
  const startTime = Date.now();
  
  // Initialize Supabase client
  const supabase = createClient();

  try {
    const health: HealthStatus = {
      status: 'healthy', // Start with a healthy status
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'down', responseTime_ms: 0 },
        application: { status: 'up' }, // Assume app is up if this code runs
        edge_functions: { status: 'down' },
        external_apis: {
          openai: 'down',
          stripe: 'down',
          yookassa: 'down',
          postmark: 'down',
          telegram: 'down',
        },
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // 1. Check Database (simplified for now)
    const dbStartTime = Date.now();
    try {
      // Simple connection test
      await supabase.auth.getUser();
      health.services.database.responseTime_ms = Date.now() - dbStartTime;
      health.services.database.status = 'up';
    } catch (error) {
      health.services.database.responseTime_ms = Date.now() - dbStartTime;
      health.services.database.status = 'down';
    }

    // 2. Check Application Uptime
    if (process.uptime) {
        health.services.application.uptime_s = Math.floor(process.uptime());
    }

    // 3. Check a critical Edge Function
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/badge-cron`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      health.services.edge_functions.status = response.ok ? 'up' : 'down';
    } catch (error) {
      health.services.edge_functions.status = 'down';
    }

    // 4. Check External APIs in parallel
    await Promise.allSettled([
      fetch('https://api.openai.com/v1/models', { method: 'HEAD', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }, signal: AbortSignal.timeout(5000) }).then(res => health.services.external_apis.openai = res.ok ? 'up' : 'down'),
      fetch('https://api.stripe.com/v1/events', { method: 'HEAD', headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }, signal: AbortSignal.timeout(5000) }).then(res => health.services.external_apis.stripe = res.ok ? 'up' : 'down'),
      // Add other API checks as needed...
    ]);

    // Determine overall status
    const servicesDown = Object.values(health.services).flatMap(service => 
        'status' in service ? [service.status] : Object.values(service)
    ).filter(status => status === 'down').length;

    if (servicesDown > 0) {
      health.status = servicesDown > 2 ? 'unhealthy' : 'degraded';
    }

    const httpStatus = health.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(health, { 
        status: httpStatus,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
    });

  } catch (error) {
    console.error('Health check failed catastrophically:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'An unexpected error occurred during the health check.',
    }, { status: 503 });
  }
}

// Simple HEAD request for basic availability check (e.g., from a load balancer)
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
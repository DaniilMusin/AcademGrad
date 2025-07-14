import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    edge_functions: 'up' | 'down';
    external_apis: {
      openai: 'up' | 'down';
      stripe: 'up' | 'down';
      yookassa: 'up' | 'down';
      postmark: 'up' | 'down';
      telegram: 'up' | 'down';
    };
  };
  metrics: {
    response_time_ms: number;
    active_users: number;
    error_rate: number;
    memory_usage?: number;
  };
  version: string;
  environment: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'down',
        edge_functions: 'down',
        external_apis: {
          openai: 'down',
          stripe: 'down',
          yookassa: 'down',
          postmark: 'down',
          telegram: 'down',
        },
      },
      metrics: {
        response_time_ms: 0,
        active_users: 0,
        error_rate: 0,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Check database connection
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      health.services.database = error ? 'down' : 'up';
    } catch (error) {
      health.services.database = 'down';
    }

    // Check Edge Functions
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/badge-cron`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      });
      
      health.services.edge_functions = response.ok ? 'up' : 'down';
    } catch (error) {
      health.services.edge_functions = 'down';
    }

    // Check external APIs
    await Promise.allSettled([
      // OpenAI API
      fetch('https://api.openai.com/v1/models', {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      }).then(() => {
        health.services.external_apis.openai = 'up';
      }).catch(() => {
        health.services.external_apis.openai = 'down';
      }),

      // Stripe API
      fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      }).then(() => {
        health.services.external_apis.stripe = 'up';
      }).catch(() => {
        health.services.external_apis.stripe = 'down';
      }),

      // YooKassa API
      fetch('https://api.yookassa.ru/v3/payments', {
        method: 'HEAD',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        },
        signal: AbortSignal.timeout(5000),
      }).then(() => {
        health.services.external_apis.yookassa = 'up';
      }).catch(() => {
        health.services.external_apis.yookassa = 'down';
      }),

      // Postmark API
      fetch('https://api.postmarkapp.com/server', {
        method: 'HEAD',
        headers: {
          'X-Postmark-Server-Token': process.env.POSTMARK_API_TOKEN || '',
        },
        signal: AbortSignal.timeout(5000),
      }).then(() => {
        health.services.external_apis.postmark = 'up';
      }).catch(() => {
        health.services.external_apis.postmark = 'down';
      }),

      // Telegram Bot API
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      }).then(() => {
        health.services.external_apis.telegram = 'up';
      }).catch(() => {
        health.services.external_apis.telegram = 'down';
      }),
    ]);

    // Get metrics
    try {
      // Active users in last 24 hours
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      health.metrics.active_users = count || 0;

      // Error rate (simplified - would need proper logging in production)
      const { count: errorCount } = await supabase
        .from('logs')
        .select('id', { count: 'exact' })
        .eq('level', 'error')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
      
      health.metrics.error_rate = errorCount || 0;
    } catch (error) {
      // If metrics fail, continue with defaults
    }

    // Calculate response time
    health.metrics.response_time_ms = Date.now() - startTime;

    // Add memory usage if available
    if (process.memoryUsage) {
      const memUsage = process.memoryUsage();
      health.metrics.memory_usage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    }

    // Determine overall status
    const servicesDown = [
      health.services.database,
      health.services.edge_functions,
      ...Object.values(health.services.external_apis),
    ].filter(status => status === 'down').length;

    if (servicesDown === 0) {
      health.status = 'healthy';
    } else if (servicesDown <= 2) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }

    // Set appropriate HTTP status based on health
    const httpStatus = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': health.status,
      },
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      metrics: {
        response_time_ms: Date.now() - startTime,
        active_users: 0,
        error_rate: 100,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
      },
    });
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
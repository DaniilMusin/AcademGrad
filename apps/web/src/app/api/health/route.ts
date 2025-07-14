import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();
    
    const dbStatus = dbError ? 'unhealthy' : 'healthy';
    const responseTime = Date.now() - startTime;
    
    // Check if response time is reasonable (< 5 seconds)
    const performanceStatus = responseTime < 5000 ? 'healthy' : 'degraded';
    
    const healthStatus = {
      status: dbStatus === 'healthy' && performanceStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          responseTime: `${responseTime}ms`
        },
        application: {
          status: 'healthy',
          uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown'
        }
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: httpStatus });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        database: { status: 'unknown' },
        application: { status: 'unknown' }
      }
    }, { status: 503 });
  }
}

// Simple HEAD request for basic availability check
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
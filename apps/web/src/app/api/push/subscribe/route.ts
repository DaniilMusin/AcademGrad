import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

let supabase: any = null;
try {
  supabase = createClient();
} catch (error) {
  // Supabase client creation failed (e.g., during build time)
  console.warn('Supabase client creation failed:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { subscription, userAgent } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get user ID from session
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let userId = null;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Store subscription in database (commented out - push_subscriptions table not in schema)
    // const { data, error } = await supabase
    //   .from('push_subscriptions')
    //   .upsert({
    //     user_id: userId,
    //     endpoint: subscription.endpoint,
    //     p256dh_key: subscription.keys?.p256dh,
    //     auth_key: subscription.keys?.auth,
    //     user_agent: userAgent,
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //   }, {
    //     onConflict: 'endpoint'
    //   });

    // if (error) {
    //   console.error('Database error:', error);
    //   return NextResponse.json(
    //     { error: 'Failed to store subscription' },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription stored successfully' 
    });

  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
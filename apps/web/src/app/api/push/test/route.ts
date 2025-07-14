import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { title, body, icon, url } = await request.json();
    
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
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

    // Get user's subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active subscriptions found' },
        { status: 404 }
      );
    }

    // Send push notifications using web-push library
    const webpush = await import('web-push');
    
    // Configure VAPID keys
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@academgrad.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }

    const notification = {
      title,
      body,
      icon: icon || '/icon-192.svg',
      badge: '/icon-192.svg',
      data: {
        url: url || '/dashboard',
        timestamp: Date.now(),
      },
    };

    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notification)
        );

        return { success: true, endpoint: sub.endpoint };
      } catch (error) {
        console.error('Push send error:', error);
        return { success: false, endpoint: sub.endpoint, error };
      }
    });

    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success
    ).length;

    return NextResponse.json({ 
      success: true,
      message: `Notification sent to ${successful}/${subscriptions.length} devices`,
      results: results.map((result) => 
        result.status === 'fulfilled' ? result.value : { success: false }
      ),
    });

  } catch (error) {
    console.error('Push test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
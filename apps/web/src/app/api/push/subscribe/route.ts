import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, subscription } = await request.json();

    if (!userId || !subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Missing userId or invalid subscription data' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Store subscription in user_profiles table
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        push_endpoint: subscription.endpoint,
        push_p256dh_key: subscription.keys?.p256dh,
        push_auth_key: subscription.keys?.auth,
        push_notifications_enabled: true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to store subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Push notifications enabled successfully' 
    });

  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
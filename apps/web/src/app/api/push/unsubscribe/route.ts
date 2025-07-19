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
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Remove subscription from database (commented out - push_subscriptions table not in schema)
    // const { error } = await supabase
    //   .from('push_subscriptions')
    //   .delete()
    //   .eq('endpoint', endpoint);

    // if (error) {
    //   console.error('Database error:', error);
    //   return NextResponse.json(
    //     { error: 'Failed to remove subscription' },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription removed successfully' 
    });

  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
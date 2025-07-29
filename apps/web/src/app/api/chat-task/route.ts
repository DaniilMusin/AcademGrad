import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { task_id, question, history = [] } = await request.json();

    if (!task_id || !question) {
      return NextResponse.json(
        { error: 'task_id and question are required' },
        { status: 400 }
      );
    }

    // Get authorization header for the Edge Function
    const authHeader = request.headers.get('authorization');

    // Call the Supabase Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...(authHeader && { 'x-user-auth': authHeader })
      },
      body: JSON.stringify({
        task_id,
        question,
        history
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', errorText);
      
      return NextResponse.json(
        { error: 'Ошибка при обращении к ассистенту' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in chat-task API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
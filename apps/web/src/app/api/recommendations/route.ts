import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Получение рекомендаций
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: recommendations, error } = await supabase
      .from('user_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('priority_score', { ascending: false });

    if (error) {
      console.error('Error fetching recommendations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recommendations: recommendations || [] });

  } catch (error) {
    console.error('Error in recommendations GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Генерация новых рекомендаций
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { force_regenerate = false } = await request.json();

    // Вызываем Edge Function для генерации рекомендаций
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: user.id,
        force_regenerate
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate recommendations' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in recommendations POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Обновление статуса рекомендации
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { recommendation_id, status, action } = await request.json();

    if (!recommendation_id || !status) {
      return NextResponse.json(
        { error: 'recommendation_id and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'accepted' && action === 'viewed') {
      updateData.viewed_at = new Date().toISOString();
    } else if (status === 'accepted' && action === 'acted') {
      updateData.acted_upon_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_recommendations')
      .update(updateData)
      .eq('recommendation_id', recommendation_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recommendation:', error);
      return NextResponse.json(
        { error: 'Failed to update recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recommendation: data });

  } catch (error) {
    console.error('Error in recommendations PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
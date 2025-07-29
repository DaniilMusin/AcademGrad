import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Кэширование заголовков
    const headers = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Content-Type': 'application/json',
    };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers }
      );
    }

    // Получаем детальную статистику пользователя
    const { data: stats, error } = await supabase
      .rpc('get_user_learning_stats', { p_user_id: user.id });

    if (error) {
      console.error('Error fetching user stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // Получаем последние попытки
    const { data: recentAttempts } = await supabase
      .from('task_attempts')
      .select(`
        attempt_id,
        task_number,
        topic_name,
        difficulty_level,
        is_correct,
        time_spent_seconds,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Получаем активные рекомендации
    const { data: recommendations } = await supabase
      .from('user_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('priority_score', { ascending: false });

    // Получаем профиль пользователя
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      stats,
      recent_attempts: recentAttempts || [],
      recommendations: recommendations || [],
      profile: profile || {}
    }, { headers });

  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Обновление профиля пользователя
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

    const body = await request.json();
    const {
      first_name,
      last_name,
      current_grade,
      target_exam,
      target_score,
      primary_subjects,
      daily_goal_tasks,
      daily_goal_time_minutes,
      preferred_difficulty,
      learning_style
    } = body;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        first_name,
        last_name,
        current_grade,
        target_exam,
        target_score,
        primary_subjects,
        daily_goal_tasks,
        daily_goal_time_minutes,
        preferred_difficulty,
        learning_style,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });

  } catch (error) {
    console.error('Error in profile update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
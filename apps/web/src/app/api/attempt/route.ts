import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AttemptData {
  task_id: string;
  task_number: number;
  topic_name?: string;
  subtopic_name?: string;
  difficulty_level?: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  hints_used?: number;
  solution_viewed?: boolean;
  attempts_count?: number;
  mistake_type?: string;
  confidence_level?: number;
  session_id?: string;
  device_type?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to save your progress.' },
        { status: 401 }
      );
    }

    const attemptData: AttemptData = await req.json();

    // Валидация обязательных полей
    if (!attemptData.task_id || !attemptData.task_number || 
        attemptData.user_answer === undefined || attemptData.correct_answer === undefined ||
        attemptData.is_correct === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: task_id, task_number, user_answer, correct_answer, is_correct' },
        { status: 400 }
      );
    }

    // Сохраняем в новую таблицу task_attempts
    const { data: newAttempt, error: attemptError } = await supabase
      .from('task_attempts')
      .insert({
        user_id: user.id,
        task_id: attemptData.task_id,
        task_number: attemptData.task_number,
        topic_name: attemptData.topic_name,
        subtopic_name: attemptData.subtopic_name,
        difficulty_level: attemptData.difficulty_level || 3,
        user_answer: attemptData.user_answer,
        correct_answer: attemptData.correct_answer,
        is_correct: attemptData.is_correct,
        time_spent_seconds: attemptData.time_spent_seconds || 0,
        hints_used: attemptData.hints_used || 0,
        solution_viewed: attemptData.solution_viewed || false,
        attempts_count: attemptData.attempts_count || 1,
        mistake_type: attemptData.mistake_type,
        confidence_level: attemptData.confidence_level,
        session_id: attemptData.session_id,
        device_type: attemptData.device_type || 'web'
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error saving attempt to task_attempts:', attemptError);
      
      // Фоллбэк: сохраняем в старую таблицу attempts
      const { data: fallbackAttempt, error: fallbackError } = await supabase
        .from('attempts')
        .insert({
          user_id: user.id,
          task_id: parseInt(attemptData.task_id),
          answer_submitted: attemptData.user_answer,
          is_correct: attemptData.is_correct,
          time_spent_s: attemptData.time_spent_seconds || 0
        })
        .select()
        .single();

      if (fallbackError) {
        console.error('Error saving attempt to fallback table:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to save attempt', details: fallbackError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        status: 'success', 
        attempt_id: fallbackAttempt.id,
        saved_to: 'attempts',
        message: 'Saved to fallback table'
      });
    }

    // Если нужно создать профиль пользователя
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.warn('Could not update user profile:', profileError);
    }

    return NextResponse.json({ 
      status: 'success', 
      attempt_id: newAttempt.attempt_id,
      saved_to: 'task_attempts',
      experience_gained: attemptData.is_correct ? 10 : 3
    });

  } catch (error) {
    console.error('Error in attempt API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import GoogleCalendarService from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Проверяем на ошибки авторизации
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-3?error=access_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-3?error=no_code`
    );
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login?message=Please login first`
      );
    }

    const googleCalendar = new GoogleCalendarService();
    
    // Обмениваем код на токены
    const tokens = await googleCalendar.exchangeCodeForTokens(code);

    // Сохраняем токены в базу данных
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        google_calendar_connected: true,
      });

    // Получаем свободные слоты из календаря
    try {
      const freeSlots = await googleCalendar.findFreeSlots(tokens.access_token);
      
      // Создаем предложенные события
      const suggestedEvents = freeSlots.slice(0, 5).map((slot, index) => ({
        user_id: user.id,
        title: 'Занятие по подготовке к ЕГЭ (предложено)',
        start_time: slot.start.toISOString(),
        end_time: slot.end.toISOString(),
        event_type: 'study_suggested',
        is_draft: true,
        priority: index + 1
      }));

      if (suggestedEvents.length > 0) {
        await supabase.from('user_events').insert(suggestedEvents);
      }

      // Создаем уведомление
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Google Calendar подключен!',
          message: `Найдено ${freeSlots.length} свободных слотов для занятий. Проверьте предложенное расписание.`,
          type: 'success'
        });

    } catch (calendarError) {
      console.error('Error processing calendar:', calendarError);
      // Продолжаем даже если не удалось обработать календарь
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-3?success=calendar_connected`
    );

  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-3?error=connection_failed`
    );
  }
}
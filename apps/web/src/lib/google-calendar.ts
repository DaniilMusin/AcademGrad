interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  status: string;
}

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[];
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    this.redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`;
  }

  // Инициируем OAuth авторизацию
  initiateAuth(): string {
    const scope = 'https://www.googleapis.com/auth/calendar.readonly';
    const responseType = 'code';
    const state = Math.random().toString(36).substring(7);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${responseType}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return authUrl;
  }

  // Обмениваем код на токен
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  // Получаем события календаря
  async getCalendarEvents(accessToken: string, timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      orderBy: 'startTime',
      singleEvents: 'true',
      maxResults: '50',
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data: GoogleCalendarResponse = await response.json();
    return data.items || [];
  }

  // Находим свободные слоты в календаре
  async findFreeSlots(
    accessToken: string,
    preferredDuration = 60, // минуты
    workingHours = { start: 9, end: 21 }, // часы
    daysAhead = 14
  ): Promise<Array<{ start: Date; end: Date }>> {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    const events = await this.getCalendarEvents(accessToken, timeMin, timeMax);
    
    // Сортируем события по времени начала
    const sortedEvents = events
      .filter(event => event.status !== 'cancelled')
      .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());

    const freeSlots: Array<{ start: Date; end: Date }> = [];

    // Проверяем каждый день в указанном диапазоне
    for (let day = 0; day < daysAhead; day++) {
      const currentDay = new Date(now);
      currentDay.setDate(now.getDate() + day);
      currentDay.setHours(workingHours.start, 0, 0, 0);

      const dayEnd = new Date(currentDay);
      dayEnd.setHours(workingHours.end, 0, 0, 0);

      // Пропускаем выходные (суббота и воскресенье)
      if (currentDay.getDay() === 0 || currentDay.getDay() === 6) {
        continue;
      }

      // Получаем события этого дня
      const dayEvents = sortedEvents.filter(event => {
        const eventStart = new Date(event.start.dateTime);
        return eventStart.toDateString() === currentDay.toDateString();
      });

      let currentTime = new Date(currentDay);

      // Если это сегодня и текущее время позже начала рабочего дня
      if (day === 0 && now > currentTime) {
        currentTime = new Date(now);
        currentTime.setMinutes(Math.ceil(currentTime.getMinutes() / 30) * 30); // Округляем до ближайших 30 минут
      }

      for (const event of dayEvents) {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        // Проверяем, есть ли свободное время до этого события
        if (currentTime < eventStart) {
          const availableTime = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60); // в минутах
          
          if (availableTime >= preferredDuration) {
            freeSlots.push({
              start: new Date(currentTime),
              end: new Date(currentTime.getTime() + preferredDuration * 60 * 1000)
            });
          }
        }

        // Переходим к времени окончания события
        currentTime = eventEnd > currentTime ? eventEnd : currentTime;
      }

      // Проверяем оставшееся время до конца рабочего дня
      if (currentTime < dayEnd) {
        const availableTime = (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
        
        if (availableTime >= preferredDuration) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(currentTime.getTime() + preferredDuration * 60 * 1000)
          });
        }
      }
    }

    return freeSlots.slice(0, 10); // Возвращаем первые 10 слотов
  }

  // Обновляем токен доступа
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    return response.json();
  }
}

export default GoogleCalendarService;